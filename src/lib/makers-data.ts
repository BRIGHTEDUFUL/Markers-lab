import { insforge } from "./insforge-client";
import { queryCache } from "./query-cache";
import type {
  User,
  Project,
  File as ProjectFile,
  Testimonial,
  AdminNote,
  Analytics,
  SubmissionNotification,
  Category,
  BudgetRange,
  Timeline,
} from "../types";
import { getUserDisplayName, isEmailLike } from "./user-display";

const BUCKET = "makers-lab";
const OFFICIAL_INBOX_EMAIL =
  (import.meta.env.VITE_OFFICIAL_INBOX_EMAIL as string | undefined)?.trim() ||
  "creators.makerslab@gmail.com";

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  tags: string | null;
  budget: string | null;
  timeline: string | null;
  status: string;
  repo_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

type ProjectFileRow = {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  storage_key: string;
  storage_url: string | null;
  bucket: string;
  project_id: string | null;
  created_at: string;
};

type TestimonialRow = {
  id: string;
  rating: number;
  text: string;
  is_approved: boolean;
  user_id: string;
  project_id: string;
  created_at: string;
};

type AdminNoteRow = {
  id: string;
  note: string;
  project_id: string;
  admin_id: string;
  created_at: string;
};

type SubmissionNotificationRow = {
  id: string;
  project_id: string;
  user_id: string;
  official_email: string;
  delivery_status: "QUEUED" | "SENT" | "FAILED";
  delivery_error: string | null;
  dispatched_at: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapProjectRow(r: ProjectRow, extras?: Partial<Project>): Project {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category as Category,
    tags: r.tags ? (JSON.parse(r.tags) as string[]) : [],
    budget: (r.budget || "") as BudgetRange,
    timeline: (r.timeline || "") as Timeline,
    status: r.status as Project["status"],
    repoUrl: r.repo_url || undefined,
    featured: r.featured,
    userId: r.user_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...extras,
  };
}

function mapProjectFileRow(r: ProjectFileRow): ProjectFile {
  return {
    id: r.id,
    filename: r.filename,
    originalName: r.original_name,
    mimeType: r.mime_type,
    path: r.storage_url || r.storage_key,
    type: "PROJECT",
    projectId: r.project_id || undefined,
    createdAt: r.created_at,
  };
}

function mapTestimonialRow(
  r: TestimonialRow,
  user?: User,
  project?: Project
): Testimonial {
  return {
    id: r.id,
    rating: r.rating,
    text: r.text,
    isApproved: r.is_approved,
    userId: r.user_id,
    projectId: r.project_id,
    createdAt: r.created_at,
    user,
    project,
  };
}

function mapAdminNoteRow(r: AdminNoteRow, admin?: User): AdminNote {
  return {
    id: r.id,
    note: r.note,
    projectId: r.project_id,
    adminId: r.admin_id,
    createdAt: r.created_at,
    admin,
  };
}

function mapSubmissionNotificationRow(
  r: SubmissionNotificationRow,
  extras?: Partial<SubmissionNotification>
): SubmissionNotification {
  return {
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    officialEmail: r.official_email,
    deliveryStatus: r.delivery_status,
    deliveryError: r.delivery_error || undefined,
    dispatchedAt: r.dispatched_at || undefined,
    acknowledged: r.acknowledged,
    acknowledgedAt: r.acknowledged_at || undefined,
    acknowledgedBy: r.acknowledged_by || undefined,
    payload: r.payload || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...extras,
  };
}

async function invokeSubmissionEmailFunction(payload: Record<string, unknown>) {
  const fns = ["send-project-submission-email", "project-submission-notify"];
  let lastError: unknown = null;

  for (const fnName of fns) {
    try {
      const { data, error } = await (insforge.functions as any).invoke(fnName, { body: payload });
      if (!error) {
        const body = (data || {}) as {
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
      lastError = error;
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

async function createSubmissionNotification(
  project: ProjectRow,
  userId: string,
  payload: {
    title: string;
    description: string;
    category: string;
    tags: string;
    budget: string;
    timeline: string;
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
    console.warn("[makers-data] submission notification insert failed:", insErr.message);
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
    console.warn("[makers-data] submission notification update failed:", upErr.message);
  }
}

function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: getUserDisplayName({ name: p.display_name, email: p.email }),
    email: p.email || "",
    role: p.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: p.avatar_url || undefined,
    createdAt: p.created_at,
  };
}

/** Map InsForge auth user payload to app User when profile row is missing or still syncing. */
export function userFromAuthUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  if (typeof id !== "string") return null;
  const email = typeof o.email === "string" ? o.email : "";
  let name = getUserDisplayName({ name: "", email });
  if (typeof o.name === "string" && o.name.trim()) name = o.name;
  else if (o.user_metadata && typeof o.user_metadata === "object") {
    const m = o.user_metadata as Record<string, unknown>;
    if (typeof m.name === "string" && m.name.trim()) name = m.name;
    else if (typeof m.full_name === "string" && m.full_name.trim()) name = m.full_name;
  }
  return {
    id,
    email,
    name,
    role: "USER",
  };
}

export async function fetchSessionUser(): Promise<User | null> {
  const { data: session, error } = await insforge.auth.getCurrentUser();
  if (error || !session?.user) return null;
  const u = session.user;
  try {
    await ensureProfile(
      u.id,
      (u as { name?: string }).name || u.email || "Member",
      u.email || ""
    );
  } catch (e) {
    console.warn("[makers-data] ensureProfile failed (login may still work):", e);
  }
  const { data: prof, error: profErr } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", u.id)
    .maybeSingle();
  if (profErr) console.warn("[makers-data] profiles select:", profErr.message);
  const pr = prof as ProfileRow | null;
  const base = userFromAuthUser(u);
  if (!base) return null;
  const resolvedName = getUserDisplayName({ name: pr?.display_name || base.name, email: base.email || pr?.email || "" });
  return {
    ...base,
    email: base.email || pr?.email || "",
    name: resolvedName,
    role: pr?.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: pr?.avatar_url || undefined,
    createdAt: pr?.created_at,
  };
}

/**
 * Validate identity + password for login.
 * Supports either email or username (profiles.display_name).
 */
export async function validateEmailPasswordLogin(identity: string, password: string) {
  const trimmedIdentity = identity.trim();
  if (!trimmedIdentity) {
    return { success: false, error: "Email or username is required" };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Invalid password" };
  }

  try {
    let resolvedEmail = trimmedIdentity;

    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentity);
    if (!looksLikeEmail) {
      const { data: profile, error: profileError } = await insforge.database
        .from("profiles")
        .select("email")
        .ilike("display_name", trimmedIdentity)
        .not("email", "is", null)
        .limit(1)
        .maybeSingle();

      if (profileError || !profile?.email) {
        return { success: false, error: "Invalid email/username or password" };
      }

      resolvedEmail = profile.email;
    }

    const { data, error } = await insforge.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error || !data?.user) {
      return { success: false, error: error?.message || "Invalid credentials" };
    }

    return {
      success: true,
      userId: data.user.id,
      email: resolvedEmail,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Authentication failed" };
  }
}

async function ensureProfile(userId: string, displayName: string, email: string) {
  const { data: existing, error: selErr } = await insforge.database
    .from("profiles")
    .select("id,display_name,email")
    .eq("id", userId)
    .maybeSingle();
  if (selErr) {
    console.warn("[makers-data] profiles lookup:", selErr.message);
    return;
  }
  if (existing) {
    const current = existing as { id: string; display_name?: string | null; email?: string | null };
    const row: Record<string, string> = {};

    if (email && current.email !== email) row.email = email;

    const resolved = getUserDisplayName({
      name: current.display_name || displayName,
      email: email || current.email || "",
    });
    if (!current.display_name || isEmailLike(current.display_name) || current.display_name !== resolved) {
      row.display_name = resolved;
    }

    if (!Object.keys(row).length) return;

    const { error: upErr } = await insforge.database.from("profiles").update(row).eq("id", userId);
    if (upErr) console.warn("[makers-data] profiles update email:", upErr.message);
    return;
  }

  const resolvedDisplayName = getUserDisplayName({ name: displayName, email });
  const { error: insErr } = await insforge.database.from("profiles").insert([
    {
      id: userId,
      display_name: resolvedDisplayName,
      role: "USER",
      email,
    },
  ]);
  if (insErr) console.warn("[makers-data] profiles insert:", insErr.message);
}

async function profilesByIds(ids: string[]): Promise<Map<string, ProfileRow>> {
  if (!ids.length) return new Map();
  const { data, error } = await insforge.database.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  const m = new Map<string, ProfileRow>();
  for (const p of (data || []) as ProfileRow[]) m.set(p.id, p);
  return m;
}

async function attachProjectRelations(rows: ProjectRow[]): Promise<Project[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: files }, { data: notes }, { data: tests }] = await Promise.all([
    insforge.database.from("project_files").select("*").in("project_id", ids),
    insforge.database.from("admin_notes").select("*").in("project_id", ids),
    insforge.database.from("testimonials").select("*").in("project_id", ids),
  ]);
  const filesByP = new Map<string, ProjectFileRow[]>();
  for (const f of (files || []) as ProjectFileRow[]) {
    if (!f.project_id) continue;
    const arr = filesByP.get(f.project_id) || [];
    arr.push(f);
    filesByP.set(f.project_id, arr);
  }
  const notesByP = new Map<string, AdminNoteRow[]>();
  for (const n of (notes || []) as AdminNoteRow[]) {
    const arr = notesByP.get(n.project_id) || [];
    arr.push(n);
    notesByP.set(n.project_id, arr);
  }
  const testByP = new Map<string, TestimonialRow>();
  for (const t of (tests || []) as TestimonialRow[]) testByP.set(t.project_id, t);

  const adminIds = new Set<string>();
  for (const n of (notes || []) as AdminNoteRow[]) adminIds.add(n.admin_id);
  const adminMap = await profilesByIds([...adminIds]);

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const userMap = await profilesByIds(userIds);

  return rows.map((r) => {
    const noteRows = notesByP.get(r.id) || [];
    const adminNotes = noteRows.map((n) =>
      mapAdminNoteRow(n, adminMap.get(n.admin_id) ? profileToUser(adminMap.get(n.admin_id)!) : undefined)
    );
    const t = testByP.get(r.id);
    const owner = userMap.get(r.user_id);
    const tu = t?.user_id ? userMap.get(t.user_id) : undefined;
    return mapProjectRow(r, {
      files: (filesByP.get(r.id) || []).map(mapProjectFileRow),
      adminNotes,
      testimonial: t
        ? mapTestimonialRow(t, tu ? profileToUser(tu) : undefined, undefined)
        : undefined,
      user: owner ? profileToUser(owner) : undefined,
    });
  });
}

export async function fetchMyProjects(userId: string): Promise<Project[]> {
  const { data, error } = await insforge.database
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachProjectRelations((data || []) as ProjectRow[]);
}

export async function deleteMyProject(id: string, userId: string) {
  const { data: row } = await insforge.database.from("projects").select("user_id,status").eq("id", id).single();
  const p = row as { user_id: string; status: string } | null;
  if (!p || p.user_id !== userId || p.status !== "PENDING") {
    throw new Error("Only pending projects you own can be deleted");
  }
  const { error } = await insforge.database.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchFeaturedGallery(): Promise<Project[]> {
  return queryCache.fetch("featured-gallery", async () => {
    const { data, error } = await insforge.database
      .from("projects")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return attachProjectRelations((data || []) as ProjectRow[]);
  }, 2 * 60_000); // 2-minute TTL
}

export async function fetchApprovedTestimonials(): Promise<Testimonial[]> {
  return queryCache.fetch("approved-testimonials", async () => {
    const { data, error } = await insforge.database
      .from("testimonials")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []) as TestimonialRow[];
    if (!rows.length) return [];
    const uids = [...new Set(rows.map((t) => t.user_id))];
    const pids = [...new Set(rows.map((t) => t.project_id))];
    const [uMap, { data: prows }] = await Promise.all([
      profilesByIds(uids),
      insforge.database.from("projects").select("*").in("id", pids),
    ]);
    const projects = await attachProjectRelations((prows || []) as ProjectRow[]);
    const pmap = new Map(projects.map((p) => [p.id, p]));
    return rows.map((r) => {
      const u = uMap.get(r.user_id);
      return mapTestimonialRow(r, u ? profileToUser(u) : undefined, pmap.get(r.project_id));
    });
  }, 2 * 60_000); // 2-minute TTL
}

export async function createProjectWithFiles(
  userId: string,
  payload: {
    title: string;
    description: string;
    category: string;
    tags: string;
    budget: string;
    timeline: string;
    repoUrl?: string;
  },
  localFiles: globalThis.File[]
): Promise<Project> {
  const { data: inserted, error: insErr } = await insforge.database
    .from("projects")
    .insert([
      {
        user_id: userId,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        tags: payload.tags,
        budget: payload.budget,
        timeline: payload.timeline,
        repo_url: payload.repoUrl || null,
        status: "PENDING",
        featured: false,
      },
    ])
    .select()
    .single();
  if (insErr) throw insErr;
  const project = inserted as ProjectRow;

  for (const file of localFiles) {
    const key = `${project.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: up, error: upErr } = await insforge.storage.from(BUCKET).upload(key, file);
    if (upErr) throw upErr;
    const { error: dbErr } = await insforge.database.from("project_files").insert([
      {
        filename: key.split("/").pop() || key,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        storage_key: up!.key,
        storage_url: up!.url,
        bucket: BUCKET,
        project_id: project.id,
      },
    ]);
    if (dbErr) throw dbErr;
  }

  await createSubmissionNotification(project, userId, payload, localFiles);

  const list = await fetchMyProjects(userId);
  const done = list.find((p) => p.id === project.id);
  return done || mapProjectRow(project);
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

export async function fetchAdminProjects(): Promise<Project[]> {
  const { data, error } = await insforge.database
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachProjectRelations((data || []) as ProjectRow[]);
}

export async function adminUpdateProject(id: string, patch: Record<string, unknown>, adminId?: string) {
  const { status, featured, adminNote, tags, ...rest } = patch as {
    status?: string;
    featured?: boolean;
    adminNote?: string;
    tags?: string;
    title?: string;
    description?: string;
    category?: string;
    budget?: string;
    timeline?: string;
    repoUrl?: string;
  };
  const row: Record<string, unknown> = {};
  if (status !== undefined) row.status = status;
  if (featured !== undefined) row.featured = featured;
  if (tags !== undefined) row.tags = tags;
  if (rest.title !== undefined) row.title = rest.title;
  if (rest.description !== undefined) row.description = rest.description;
  if (rest.category !== undefined) row.category = rest.category;
  if (rest.budget !== undefined) row.budget = rest.budget;
  if (rest.timeline !== undefined) row.timeline = rest.timeline;
  if (rest.repoUrl !== undefined) row.repo_url = rest.repoUrl;

  if (Object.keys(row).length) {
    const { error } = await insforge.database.from("projects").update(row).eq("id", id);
    if (error) throw error;
  }
  if (adminNote && adminId) {
    const { error: nErr } = await insforge.database.from("admin_notes").insert([
      { project_id: id, admin_id: adminId, note: String(adminNote) },
    ]);
    if (nErr) throw nErr;
  }
}

async function removeStorageKeys(rows: { storage_key: string; bucket?: string | null }[]) {
  for (const f of rows) {
    const bucket = f.bucket || BUCKET;
    const { error } = await insforge.storage.from(bucket).remove(f.storage_key);
    if (error) console.warn("Storage remove:", f.storage_key, error.message);
  }
}

export async function adminDeleteProject(id: string) {
  const { data: files } = await insforge.database
    .from("project_files")
    .select("storage_key,bucket")
    .eq("project_id", id);
  await removeStorageKeys((files || []) as { storage_key: string; bucket?: string | null }[]);
  const { error } = await insforge.database.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function adminBulkUpdateProjects(ids: string[], patch: { status?: string; featured?: boolean }) {
  if (!ids.length) return;
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.featured !== undefined) row.featured = patch.featured;
  if (!Object.keys(row).length) return;
  const { error } = await insforge.database.from("projects").update(row).in("id", ids);
  if (error) throw error;
}

export async function adminBulkDeleteProjects(ids: string[]) {
  if (!ids.length) return;
  const { data: files, error: fErr } = await insforge.database
    .from("project_files")
    .select("storage_key,bucket")
    .in("project_id", ids);
  if (fErr) throw fErr;
  await removeStorageKeys((files || []) as { storage_key: string; bucket?: string | null }[]);
  const { error } = await insforge.database.from("projects").delete().in("id", ids);
  if (error) throw error;
}

export async function adminDeleteProjectFile(fileId: string) {
  const { data: row, error: fe } = await insforge.database
    .from("project_files")
    .select("storage_key,bucket")
    .eq("id", fileId)
    .single();
  if (fe) throw fe;
  const f = row as { storage_key: string; bucket?: string | null };
  await removeStorageKeys([f]);
  const { error } = await insforge.database.from("project_files").delete().eq("id", fileId);
  if (error) throw error;
}

export async function adminDeleteAdminNote(noteId: string) {
  const { error } = await insforge.database.from("admin_notes").delete().eq("id", noteId);
  if (error) throw error;
}

export async function adminUpdateUserProfile(
  userId: string,
  patch: { display_name?: string; email?: string | null; role?: "USER" | "ADMIN" }
) {
  const row: Record<string, unknown> = {};
  if (patch.display_name !== undefined) row.display_name = patch.display_name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.role !== undefined) row.role = patch.role;
  if (Object.keys(row).length === 0) return;
  const { error } = await insforge.database.from("profiles").update(row).eq("id", userId);
  if (error) throw error;
}

export async function adminReassignProject(projectId: string, newUserId: string) {
  const { error } = await insforge.database.from("projects").update({ user_id: newUserId }).eq("id", projectId);
  if (error) throw error;
}

export async function adminCreateTestimonial(input: {
  project_id: string;
  user_id: string;
  rating: number;
  text: string;
  is_approved?: boolean;
}) {
  const { error } = await insforge.database.from("testimonials").insert([
    {
      project_id: input.project_id,
      user_id: input.user_id,
      rating: input.rating,
      text: input.text,
      is_approved: input.is_approved ?? false,
    },
  ]);
  if (error) throw error;
}

export async function fetchAdminTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await insforge.database
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data || []) as TestimonialRow[];
  if (!rows.length) return [];
  const uids = [...new Set(rows.map((t) => t.user_id))];
  const pids = [...new Set(rows.map((t) => t.project_id))];
  const [uMap, { data: prows }] = await Promise.all([
    profilesByIds(uids),
    insforge.database.from("projects").select("*").in("id", pids),
  ]);
  const projects = await attachProjectRelations((prows || []) as ProjectRow[]);
  const pmap = new Map(projects.map((p) => [p.id, p]));
  return rows.map((r) =>
    mapTestimonialRow(r, uMap.get(r.user_id) ? profileToUser(uMap.get(r.user_id)!) : undefined, pmap.get(r.project_id))
  );
}

export async function adminSetTestimonialApproved(id: string, isApproved: boolean) {
  const { error } = await insforge.database.from("testimonials").update({ is_approved: isApproved }).eq("id", id);
  if (error) throw error;
}

export async function adminDeleteTestimonial(id: string) {
  const { error } = await insforge.database.from("testimonials").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAdminUsers(): Promise<User[]> {
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const profiles = (data || []) as ProfileRow[];
  const { data: projects } = await insforge.database.from("projects").select("user_id");
  const counts = new Map<string, number>();
  for (const r of (projects || []) as { user_id: string }[]) {
    counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1);
  }
  return profiles.map((p) => ({
    ...profileToUser(p),
    _count: { projects: counts.get(p.id) || 0 },
  }));
}

export async function adminSetUserRole(userId: string, role: "USER" | "ADMIN") {
  const { error } = await insforge.database.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

export async function adminDeleteUserProfile(userId: string) {
  const { data: plist } = await insforge.database.from("projects").select("id").eq("user_id", userId);
  const ids = ((plist || []) as { id: string }[]).map((p) => p.id);
  if (ids.length) await adminBulkDeleteProjects(ids);
  const { error } = await insforge.database.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

// ============================================================
// CRITICAL: PASSWORD RESET & SECURITY FUNCTIONS (Phase 1)
// ============================================================

/**
 * Track a password reset request (initiated by resetPasswordForEmail)
 * Call this after Insforge sends the reset email
 */
export async function trackPasswordResetRequest(
  userId: string,
  email: string,
  options?: { ipAddress?: string; userAgent?: string }
) {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const { error } = await insforge.database.from("password_resets").insert([
    {
      user_id: userId,
      email,
      token_hash: `reset_${userId}_${Date.now()}`, // Placeholder - in production, use actual token from Insforge
      used: false,
      expires_at: expiresAt.toISOString(),
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
    },
  ]);
  if (error) {
    console.warn("[makers-data] password reset tracking failed:", error.message);
    // Don't throw - this is audit-only and shouldn't block user
  }
}

/**
 * Mark a password reset as completed
 * Call this after user successfully resets their password
 */
export async function completePasswordReset(userId: string) {
  const { error } = await insforge.database
    .from("password_resets")
    .update({ used: true, completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1);
  
  if (error) {
    console.warn("[makers-data] password reset completion failed:", error.message);
  }
}

/**
 * Get recent password reset attempts for a user (rate limiting check)
 */
export async function getRecentPasswordResets(userId: string, minutes: number = 60) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data, error } = await insforge.database
    .from("password_resets")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.warn("[makers-data] password reset history fetch failed:", error.message);
    return [];
  }
  
  return (data || []) as { id: string }[];
}

/**
 * Track a login attempt (success or failure)
 */
export async function trackLoginAttempt(
  email: string,
  success: boolean,
  options?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    failedReason?: string;
    deviceFingerprint?: string;
  }
) {
  const { error } = await insforge.database.from("login_attempts").insert([
    {
      email,
      user_id: options?.userId,
      success,
      failed_reason: options?.failedReason,
      ip_address: options?.ipAddress || "unknown",
      user_agent: options?.userAgent,
      device_fingerprint: options?.deviceFingerprint,
    },
  ]);
  
  if (error) {
    console.warn("[makers-data] login attempt tracking failed:", error.message);
  }
}

/**
 * Check for brute force attacks: count failed login attempts from an IP
 */
export async function checkBruteForceAttempts(ipAddress: string, minutes: number = 15) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data, error } = await insforge.database
    .from("login_attempts")
    .select("id")
    .eq("ip_address", ipAddress)
    .eq("success", false)
    .gte("created_at", cutoff);
  
  if (error) {
    console.warn("[makers-data] brute force check failed:", error.message);
    return 0;
  }
  
  return (data || []).length;
}

/**
 * Log an audit event (admin updates, critical actions)
 */
export async function logAuditEvent(
  action: string,
  tableName: string,
  recordId: string | null = null,
  options?: {
    userId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status?: string;
    errorMessage?: string;
  }
) {
  const { error } = await insforge.database.from("audit_logs").insert([
    {
      user_id: options?.userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: options?.oldValues || null,
      new_values: options?.newValues || null,
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
      status: options?.status || "success",
      error_message: options?.errorMessage || null,
    },
  ]);
  
  if (error) {
    console.warn("[makers-data] audit logging failed:", error.message);
  }
}

/**
 * Get user settings (theme, preferences, 2FA status)
 */
export async function fetchUserSettings(userId: string) {
  const { data, error } = await insforge.database
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) throw error;
  
  // Return default settings if not found
  if (!data) {
    return {
      userId,
      theme: "dark",
      emailNotifications: true,
      marketingEmails: true,
      privacyLevel: "private",
      bio: null,
    };
  }
  
  return {
    userId: (data as any).user_id,
    theme: (data as any).theme || "dark",
    emailNotifications: (data as any).email_notifications ?? true,
    marketingEmails: (data as any).marketing_emails ?? true,
    privacyLevel: (data as any).privacy_level || "private",
    bio: (data as any).bio,
  };
}

/**
 * Update user settings
 */
export async function updateUserSettings(userId: string, patch: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  
  if (patch.theme !== undefined) updates.theme = patch.theme;
  if (patch.emailNotifications !== undefined) updates.email_notifications = patch.emailNotifications;
  if (patch.marketingEmails !== undefined) updates.marketing_emails = patch.marketingEmails;
  if (patch.privacyLevel !== undefined) updates.privacy_level = patch.privacyLevel;
  if (patch.bio !== undefined) updates.bio = patch.bio;
  
  if (!Object.keys(updates).length) return; // Nothing to update
  
  updates.updated_at = new Date().toISOString();
  
  const { data, error } = await insforge.database
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  
  // If no existing settings, create them
  if (!data && !error) {
    const { error: insErr } = await insforge.database
      .from("user_settings")
      .insert([{ user_id: userId, ...updates }]);
    if (insErr) throw insErr;
  } else if (error) {
    throw error;
  }
}

/**
 * Mark email as verified in profiles table
 */
export async function markEmailAsVerified(userId: string) {
  const { error } = await insforge.database
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", userId);
  
  if (error) throw error;
}

/**
 * Get admin: recent login attempts (security monitoring)
 */
export async function adminGetRecentLoginAttempts(limit: number = 100) {
  const { data, error } = await insforge.database
    .from("login_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return (data || []) as any[];
}

/**
 * Get admin: audit logs for review
 */
export async function adminGetAuditLogs(options?: { limit?: number; action?: string; userId?: string }) {
  let q = insforge.database.from("audit_logs").select("*");
  
  if (options?.action) q = q.eq("action", options.action);
  if (options?.userId) q = q.eq("user_id", options.userId);
  
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(options?.limit || 500);
  
  if (error) throw error;
  return (data || []) as any[];
}

export async function fetchAdminAnalytics(): Promise<Analytics> {
  const { data: projects, error: e1 } = await insforge.database.from("projects").select("status,category");
  if (e1) throw e1;
  const { data: profiles, error: e2 } = await insforge.database.from("profiles").select("id");
  if (e2) throw e2;
  const plist = (projects || []) as { status: string; category: string }[];
  const statusMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const p of plist) {
    statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1);
    catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
  }
  return {
    totalProjects: plist.length,
    totalUsers: (profiles || []).length,
    statusCounts: [...statusMap.entries()].map(([status, _count]) => ({ status, _count })),
    categoryCounts: [...catMap.entries()].map(([category, _count]) => ({ category, _count })),
  };
}

export async function updateMyProfile(name: string, avatarFile: globalThis.File | null) {
  let avatar_url: string | undefined;
  if (avatarFile) {
    const key = `avatars/${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: up, error: upErr } = await insforge.storage.from(BUCKET).upload(key, avatarFile);
    if (upErr) throw upErr;
    avatar_url = up!.url;
  }
  const { data: session } = await insforge.auth.getCurrentUser();
  if (!session?.user) throw new Error("Not signed in");
  const id = session.user.id;
  const row: Record<string, unknown> = { display_name: name };
  if (avatar_url) row.avatar_url = avatar_url;
  const { error } = await insforge.database.from("profiles").update(row).eq("id", id);
  if (error) throw error;
  await insforge.auth.setProfile({ name, ...(avatar_url ? { avatar_url } : {}) });
}
