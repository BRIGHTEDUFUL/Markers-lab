/**
 * Project CRUD, file management, gallery, and testimonials.
 */
import { insforge } from "../insforge-client";
import { queryCache } from "../query-cache";
import type { Project, Testimonial, PricingTier } from "../../types";
import {
  BUCKET,
  type ProjectRow,
  mapProjectRow,
  mapProjectFileRow,
  mapTestimonialRow,
  profileToUser,
  profilesByIds,
  attachProjectRelations,
} from "./mappers";
import { createSubmissionNotification } from "./notifications";

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
    const rows = (data || []) as import("./mappers").TestimonialRow[];
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
    packageTier?: PricingTier;
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
        package_tier: payload.packageTier || null,
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
