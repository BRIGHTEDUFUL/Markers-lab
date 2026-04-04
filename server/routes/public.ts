import express from "express";
import prisma from "../db.js";

const router = express.Router();

router.get("/gallery", async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { featured: true },
    include: { user: true, files: true },
  });

  const parsedProjects = projects.map(p => ({
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : []
  }));

  res.json(parsedProjects);
});

router.get("/testimonials", async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isApproved: true },
    include: { user: true, project: true },
  });
  res.json(testimonials);
});

export default router;
