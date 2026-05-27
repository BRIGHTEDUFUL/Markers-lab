/**
 * Row type definitions and mapping functions for InsForge database rows.
 * Shared across all domain modules.
 */
import { insforge } from "../insforge-client";
import type {
  User,
  Project,
  File as ProjectFile,
  Testimonial,
  AdminNote,
  SubmissionNotification,
  Category,
  BudgetRange,
  Timeline,
  PricingTier,
} from "../../types";
import { getUserDisplayName, isEmailLike } from "../user-display";

export const BUCKET = "makers-lab";
export const OFFICIAL_INBOX_EMAIL =
  (import.meta.env.VITE_OFFICIAL_INBOX_EMAIL as string | undefined)?.trim() ||
  "creators.makerslab@gmail.com";

// ── Row Types ──────────────────────────────────────────────────────────────

export type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  tags: string | null;
  budget: string | null;
  timeline: string | null;
  package_tier: string | null;
  status: string;
  repo_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectFileRow = {
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

export type TestimonialRow = {
  id: string;
  rating: number;
  text: string;
  is_approved: boolean;
  user_id: string;
  project_id: string;
  created_at: string;
};

export type AdminNoteRow = {
  id: string;
  note: string;
  project_id: string;
  admin_id: string;
  created_at: string;
};

export type SubmissionNotificationRow = {
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

// ── Mapping Functions ──────────────────────────────────────────────────────

export function mapProjectRow(r: ProjectRow, extras?: Partial<Project>): Project {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category as Category,
    tags: r.tags ? (JSON.parse(r.tags) as string[]) : [],
    budget: (r.budget || "") as BudgetRange,
    timeline: (r.timeline || "") as Timeline,
    packageTier: (r.package_tier || undefined) as PricingTier | undefined,
    status: r.status as Project["status"],
    repoUrl: r.repo_url || undefined,
    featured: r.featured,
    userId: r.user_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...extras,
  };
}

export function mapProjectFileRow(r: ProjectFileRow): ProjectFile {
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

export function mapTestimonialRow(
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

export function mapAdminNoteRow(r: AdminNoteRow, admin?: User): AdminNote {
  return {
    id: r.id,
    note: r.note,
    projectId: r.project_id,
    adminId: r.admin_id,
    createdAt: r.created_at,
    admin,
  };
}

export function mapSubmissionNotificationRow(
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

// ── Profile Helpers ────────────────────────────────────────────────────────

export function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: getUserDisplayName({ name: p.display_name, email: p.email }),
    email: p.email || "",
    role: p.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: p.avatar_url || undefined,
    createdAt: p.created_at,
  };
}

export async function profilesByIds(ids: string[]): Promise<Map<string, ProfileRow>> {
  if (!ids.length) return new Map();
  const { data, error } = await insforge.database.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  const m = new Map<string, ProfileRow>();
  for (const p of (data || []) as ProfileRow[]) m.set(p.id, p);
  return m;
}

// ── Project Relation Attachment ────────────────────────────────────────────

export async function attachProjectRelations(rows: ProjectRow[]): Promise<Project[]> {
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

// ── Storage Helper ─────────────────────────────────────────────────────────

export async function removeStorageKeys(rows: { storage_key: string; bucket?: string | null }[]) {
  for (const f of rows) {
    const bucket = f.bucket || BUCKET;
    const { error } = await insforge.storage.from(bucket).remove(f.storage_key);
    if (error) console.warn("Storage remove:", f.storage_key, error.message);
  }
}
