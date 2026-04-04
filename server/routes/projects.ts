import express from "express";
import prisma from "../db.js";
import { authenticate, upload, optimizeImages } from "../middleware/index.js";
import { io } from "../socket.js";

const router = express.Router();

router.get("/", authenticate, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      include: { files: true, adminNotes: true, testimonial: true },
      orderBy: { createdAt: "desc" },
    });

    const parsedProjects = projects.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : []
    }));

    res.json(parsedProjects);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.post("/", authenticate, upload.array("files"), optimizeImages, async (req: any, res) => {
  const { title, description, category, tags, budget, timeline, repoUrl, fileIds } = req.body;
  const files = req.files as any[] || [];
  const parsedFileIds = fileIds ? JSON.parse(fileIds) : [];
  
  // Robust tag handling: ensure it's a string for Prisma
  const tagsString = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : null);

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        category: category as string,
        tags: tagsString,
        budget,
        timeline,
        repoUrl,
        userId: req.user.id,
        files: {
          create: files.map(f => ({
            filename: f.filename,
            originalName: f.originalname,
            mimeType: f.mimetype,
            path: f.path,
            type: "PROJECT",
          })),
          connect: parsedFileIds.map((id: string) => ({ id })),
        },
      },
    });

    const parsedProject = {
      ...project,
      tags: project.tags ? JSON.parse(project.tags) : []
    };

    io.to("admin-projects").emit("newProject", parsedProject);
    res.json(parsedProject);
  } catch (err) {
    console.error("Project creation error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { title, description, category, tags, budget, timeline, repoUrl } = req.body;

  // Robust tag handling: ensure it's a string for Prisma
  const tagsString = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : undefined);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== req.user.id) return res.status(404).json({ error: "Project not found" });
  if (project.status !== "PENDING") return res.status(400).json({ error: "Only pending projects can be edited" });

  const updated = await prisma.project.update({
    where: { id },
    data: { 
      title, 
      description, 
      category, 
      tags: tagsString, 
      budget, 
      timeline, 
      repoUrl 
    },
  });

  const parsedProject = {
    ...updated,
    tags: updated.tags ? JSON.parse(updated.tags) : []
  };

  res.json(parsedProject);
});

router.delete("/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== req.user.id) return res.status(404).json({ error: "Project not found" });
  if (project.status !== "PENDING") return res.status(400).json({ error: "Only pending projects can be deleted" });

  await prisma.project.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
