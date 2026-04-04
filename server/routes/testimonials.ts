import express from "express";
import prisma from "../db.js";
import { authenticate } from "../middleware/index.js";

const router = express.Router();

router.post("/", authenticate, async (req: any, res) => {
  const { projectId, rating, text } = req.body;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== req.user.id || project.status !== "COMPLETED") {
    return res.status(400).json({ error: "Invalid project for testimonial" });
  }

  const testimonial = await prisma.testimonial.create({
    data: { projectId, rating, text, userId: req.user.id },
  });
  res.json(testimonial);
});

export default router;
