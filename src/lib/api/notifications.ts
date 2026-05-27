/**
 * Submission notification management.
 * Email dispatch, acknowledgement, and retry logic.
 */
import { insforge } from "../insforge-client";
import type { SubmissionNotification, PricingTier } from "../../types";
import {
  OFFICIAL_INBOX_EMAIL,
  type ProjectRow,
  type SubmissionNotificationRow,
  mapSubmissionNotificationRow,
  profileToUser,
  profilesByIds,
  attachProjectRelations,
} from "./mappers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FunctionsClient = { invoke: (name: string, opts: { body: unknown }) => Promise<{ data: any; error: any }> };

async function invokeSubmissionEmailFunction(payload: Record<string, unknown>) {
  const fns = ["send-project-submission-email", "project-submission-notify"];
  let lastError: unknown = null;

  for (const fnName of fns) {
    try {
      const { data: d, error: e } = await (insforge.functions as unknown as FunctionsClient).invoke(fnName, { body: payload });
      if (!e) {
        const body = (d || {}) as {
          ok?: boolean;
          blocked?: boolean;
          code?: string;
          error?: string;
          details?: string;
        };

        if (body.ok === false) {
          const reason = [body.error, body.details].filter(Boolean).join(" :: ");
          return {
            success: false as const,
            blocked: Boolean(body.blocked || body.code === "RESEND_RECIPIENT_RESTRICTED"),
            error: reason || "Submission email blocked by provider policy",
          };
        }

        return { success: true as const, blocked: false as const };
      }
      lastError = e;
    } catch (err) {
      lastError = err;
    }
  }

  return {
    success: false as const,
    blocked: false as const,
    error:
      lastError instanceof Error
        ? lastError.message
        : typeof lastError === "object" && lastError !== null && "message" in lastError
        ? String((lastError as { message: unknown }).message)
        : "No submission email edge function available",
  };
}

export async function createSubmissionNotification(
  project: ProjectRow,
  userId: string,
  payload: {
    title: string;
    description: string;
    category: string;
    tags: string;
    budget: string;
    timeline: string;
    packageTier?: PricingTier;
    repoUrl?: string;
  },
  localFiles: globalThis.File[]
) {
  const { data: userProfile } = await insforge.database
    .from("profiles")
    .select("display_name,email")
    .eq("id", userId)
    .maybeSingle();

  const snapshotPayload = {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    tags: payload.tags ? (JSON.parse(payload.tags) as string[]) : [],
    budget: payload.budget,
    timeline: payload.timeline,
    packageTier: payload.packageTier || null,
    repoUrl: payload.repoUrl || null,
    filesCount: localFiles.length,
    attachments: localFiles.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
    })),
    submitterName: (userProfile as { display_name?: string | null } | null)?.display_name || "Unknown user",
    submitterEmail: (userProfile as { email?: string | null } | null)?.email || "",
  };

  const { data: inserted, error: insErr } = await insforge.database
    .from("submission_notifications")
    .insert([
      {
        project_id: project.id,
        user_id: userId,
        official_email: OFFICIAL_INBOX_EMAIL,
        payload: snapshotPayload,
        delivery_status: "QUEUED",
      },
    ])
    .select()
    .single();

  if (insErr) {
    console.warn("[notifications] submission notification insert failed:", insErr.message);
    return;
  }

  const notification = inserted as SubmissionNotificationRow;
  const dispatchPayload = {
    notificationId: notification.id,
    to: OFFICIAL_INBOX_EMAIL,
    projectId: project.id,
    projectTitle: project.title,
    projectStatus: project.status,
    submitter: {
      id: userId,
      name: snapshotPayload.submitterName,
      email: snapshotPayload.submitterEmail,
    },
    submittedAt: project.created_at,
    details: snapshotPayload,
  };

  const sendResult = await invokeSubmissionEmailFunction(dispatchPayload);
  const updateRow: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (sendResult.success) {
    updateRow.delivery_status = "SENT";
    updateRow.dispatched_at = new Date().toISOString();
    updateRow.delivery_error = null;
  } else if (sendResult.blocked) {
    updateRow.delivery_status = "QUEUED";
    updateRow.delivery_error = sendResult.error;
  } else {
    updateRow.delivery_status = "FAILED";
    updateRow.delivery_error = sendResult.error;
  }

  const { error: upErr } = await insforge.database
    .from("submission_notifications")
    .update(updateRow)
    .eq("id", notification.id);
  if (upErr) {
    console.warn("[notifications] submission notification update failed:", upErr.message);
  }
}

export async function fetchAdminSubmissionNotifications(limit: number = 50): Promise<SubmissionNotification[]> {
  const { data, error } = await insforge.database
    .from("submission_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = (data || []) as SubmissionNotificationRow[];
  if (!rows.length) return [];

  const projectIds = [...new Set(rows.map((r) => r.project_id))];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: rawProjects, error: projectsError }, profileMap] = await Promise.all([
    insforge.database.from("projects").select("*").in("id", projectIds),
    profilesByIds(userIds),
  ]);
  if (projectsError) throw projectsError;

  const richProjects = await attachProjectRelations((rawProjects || []) as ProjectRow[]);
  const projectMap = new Map(richProjects.map((p) => [p.id, p]));

  return rows.map((row) =>
    mapSubmissionNotificationRow(row, {
      project: projectMap.get(row.project_id),
      user: profileMap.get(row.user_id) ? profileToUser(profileMap.get(row.user_id)!) : undefined,
    })
  );
}

export async function adminAcknowledgeSubmissionNotification(
  notificationId: string,
  acknowledged: boolean,
  adminId?: string
) {
  const row: Record<string, unknown> = {
    acknowledged,
    acknowledged_at: acknowledged ? new Date().toISOString() : null,
    acknowledged_by: acknowledged ? adminId || null : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await insforge.database
    .from("submission_notifications")
    .update(row)
    .eq("id", notificationId);
  if (error) throw error;
}

export async function adminRetrySubmissionNotificationEmail(notificationId: string) {
  const { data: row, error } = await insforge.database
    .from("submission_notifications")
    .select("*")
    .eq("id", notificationId)
    .single();
  if (error) throw error;

  const n = row as SubmissionNotificationRow;
  const payload = {
    notificationId: n.id,
    to: n.official_email,
    projectId: n.project_id,
    submitter: { id: n.user_id },
    details: n.payload || {},
    retriedAt: new Date().toISOString(),
  };
  const sendResult = await invokeSubmissionEmailFunction(payload);
  const updateRow: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (sendResult.success) {
    updateRow.delivery_status = "SENT";
    updateRow.dispatched_at = new Date().toISOString();
    updateRow.delivery_error = null;
  } else if (sendResult.blocked) {
    updateRow.delivery_status = "QUEUED";
    updateRow.delivery_error = sendResult.error;
  } else {
    updateRow.delivery_status = "FAILED";
    updateRow.delivery_error = sendResult.error;
  }

  const { error: upErr } = await insforge.database
    .from("submission_notifications")
    .update(updateRow)
    .eq("id", notificationId);
  if (upErr) throw upErr;
}
