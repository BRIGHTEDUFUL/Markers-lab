import express from "express";
import prisma from "../db.js";
import { authenticate, isAdmin } from "../middleware/index.js";
import { io } from "../socket.js";

const router = express.Router();

// Admin Project Routes
router.get("/projects", authenticate, isAdmin, async (req, res) => {
  const projects = await prisma.project.findMany({
    include: { user: true, files: true, adminNotes: true, testimonial: true },
    orderBy: { createdAt: "desc" },
  });

  const parsedProjects = projects.map(p => ({
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : []
  }));

  res.json(parsedProjects);
});

router.delete("/projects/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  await prisma.project.delete({ where: { id } });
  res.json({ success: true });
});

router.patch("/projects/:id", authenticate, isAdmin, async (req: any, res) => {
  const { id } = req.params;
  const { status, featured, adminNote, tags, ...rest } = req.body;

  // Robust tag handling: ensure it's a string for Prisma
  const tagsString = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : undefined);

  // Filter out relation fields and other non-model fields from rest to avoid Prisma errors
  const allowedFields = ["title", "description", "category", "budget", "timeline", "repoUrl"];
  const filteredData: any = {};
  allowedFields.forEach(field => {
    if (rest[field] !== undefined) {
      filteredData[field] = rest[field];
    }
  });

  const project = await prisma.project.update({
    where: { id },
    include: { user: true, files: true, adminNotes: true, testimonial: true },
    data: {
      status: status as string,
      featured,
      tags: tagsString,
      ...filteredData,
      adminNotes: adminNote ? {
        create: {
          note: adminNote,
          adminId: req.user.id,
        }
      } : undefined,
    },
  });

  const parsedProject = {
    ...project,
    tags: project.tags ? JSON.parse(project.tags) : []
  };

  io.to(`user-${project.userId}`).emit("projectStatusChanged", { projectId: id, status });
  res.json(parsedProject);
});

// Bulk Project Actions
router.patch("/projects/bulk", authenticate, isAdmin, async (req: any, res) => {
  const { ids, status, featured } = req.body;
  
  const updateData: any = {};
  if (status) updateData.status = status;
  if (typeof featured === 'boolean') updateData.featured = featured;

  await prisma.project.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  });

  // Notify users (simplified for bulk)
  if (status) {
    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      select: { userId: true, id: true }
    });
    projects.forEach(p => {
      io.to(`user-${p.userId}`).emit("projectStatusChanged", { projectId: p.id, status });
    });
  }

  res.json({ success: true });
});

router.delete("/projects/bulk", authenticate, isAdmin, async (req, res) => {
  const { ids } = req.body;
  await prisma.project.deleteMany({
    where: { id: { in: ids } },
  });
  res.json({ success: true });
});

// Admin Testimonial Routes
router.get("/testimonials", authenticate, isAdmin, async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    include: { user: true, project: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(testimonials);
});

router.patch("/testimonials/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;
  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { isApproved },
  });
  res.json(testimonial);
});

router.delete("/testimonials/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  await prisma.testimonial.delete({ where: { id } });
  res.json({ success: true });
});

// Admin User Routes
router.get("/users", authenticate, isAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.patch("/users/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });
  res.json(user);
});

router.delete("/users/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  if (id === (req as any).user.id) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

// Analytics
router.get("/analytics", authenticate, isAdmin, async (req, res) => {
  const totalProjects = await prisma.project.count();
  const totalUsers = await prisma.user.count();
  const statusCounts = await prisma.project.groupBy({
    by: ["status"],
    _count: true,
  });
  const categoryCounts = await prisma.project.groupBy({
    by: ["category"],
    _count: true,
  });

  res.json({ totalProjects, totalUsers, statusCounts, categoryCounts });
});

export default router;
