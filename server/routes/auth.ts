import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { authenticate, upload, optimizeImages } from "../middleware/index.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash: hashedPassword },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ success: true });
});

router.get("/me", authenticate, (req: any, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, avatarUrl: req.user.avatarUrl } });
});

router.patch("/profile", authenticate, upload.single("avatar"), optimizeImages, async (req: any, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to change password" });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid current password" });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
