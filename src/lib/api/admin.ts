/**
 * Admin dashboard queries, user management, and analytics.
 */
import { insforge } from "../insforge-client";
import type { User, Project, Testimonial, Analytics } from "../../types";
import {
  BUCKET,
  type ProjectRow,
  type TestimonialRow,
  mapProjectRow,
  mapTestimonialRow,
  profileToUser,
  profilesByIds,
  attachProjectRelations,
  removeStorageKeys,
} from "./mappers";

// ── Projects ───────────────────────────────────────────────────────────────

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

export async function adminReassignProject(projectId: string, newUserId: string) {
  const { error } = await insforge.database.from("projects").update({ user_id: newUserId }).eq("id", projectId);
  if (error) throw error;
}

// ── Testimonials ────────────────────────────────────────────────────────────

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

// ── Users ───────────────────────────────────────────────────────────────────

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

export async function fetchAdminUsers(): Promise<User[]> {
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const profiles = (data || []) as import("./mappers").ProfileRow[];
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

// ── Security & Audit ───────────────────────────────────────────────────────

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
  return (data || []) as import("../../types").LoginAttempt[];
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
  return (data || []) as import("../../types").AuditLog[];
}

// ── Analytics ──────────────────────────────────────────────────────────────

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
