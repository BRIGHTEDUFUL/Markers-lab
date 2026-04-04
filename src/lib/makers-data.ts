import { insforge } from "./insforge-client";
import type {
  User,
  Project,
  File as ProjectFile,
  Testimonial,
  AdminNote,
  Analytics,
  Category,
  BudgetRange,
  Timeline,
} from "../types";

const BUCKET = "makers-lab";

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

function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: p.display_name,
    email: p.email || "",
    role: p.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: p.avatar_url || undefined,
    createdAt: p.created_at,
  };
}

export async function fetchSessionUser(): Promise<User | null> {
  const { data: session, error } = await insforge.auth.getCurrentUser();
  if (error || !session?.user) return null;
  const u = session.user;
  await ensureProfile(
    u.id,
    (u as { name?: string }).name || u.email || "Member",
    u.email || ""
  );
  const { data: prof } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", u.id)
    .maybeSingle();
  const pr = prof as ProfileRow | null;
  return {
    id: u.id,
    email: u.email || pr?.email || "",
    name: pr?.display_name || (u as { name?: string }).name || u.email || "Member",
    role: pr?.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: pr?.avatar_url || undefined,
    createdAt: pr?.created_at,
  };
}

async function ensureProfile(userId: string, displayName: string, email: string) {
  const { data: existing } = await insforge.database
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existing) {
    await insforge.database.from("profiles").update({ email }).eq("id", userId);
    return;
  }
  await insforge.database.from("profiles").insert([
    {
      id: userId,
      display_name: displayName || email || "Member",
      role: "USER",
      email,
    },
  ]);
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
  const { data, error } = await insforge.database
    .from("projects")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachProjectRelations((data || []) as ProjectRow[]);
}

export async function fetchApprovedTestimonials(): Promise<Testimonial[]> {
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

  const list = await fetchMyProjects(userId);
  const done = list.find((p) => p.id === project.id);
  return done || mapProjectRow(project);
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

export async function adminDeleteProject(id: string) {
  const { error } = await insforge.database.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function adminBulkUpdateProjects(ids: string[], patch: { status?: string; featured?: boolean }) {
  for (const id of ids) {
    const row: Record<string, unknown> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.featured !== undefined) row.featured = patch.featured;
    if (Object.keys(row).length) {
      const { error } = await insforge.database.from("projects").update(row).eq("id", id);
      if (error) throw error;
    }
  }
}

export async function adminBulkDeleteProjects(ids: string[]) {
  for (const id of ids) {
    const { error } = await insforge.database.from("projects").delete().eq("id", id);
    if (error) throw error;
  }
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
  const { error: e1 } = await insforge.database.from("projects").delete().eq("user_id", userId);
  if (e1) throw e1;
  const { error } = await insforge.database.from("profiles").delete().eq("id", userId);
  if (error) throw error;
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
