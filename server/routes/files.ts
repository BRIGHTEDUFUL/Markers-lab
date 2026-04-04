import express from "express";
import prisma from "../db.js";
import { authenticate, upload, optimizeImages } from "../middleware/index.js";

const router = express.Router();

router.post("/upload", authenticate, upload.single("file"), optimizeImages, async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        path: req.file.path,
        type: "PROJECT",
      },
    });

    res.json(file);
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: "File not found" });
  res.download(file.path, file.originalName);
});

export default router;
