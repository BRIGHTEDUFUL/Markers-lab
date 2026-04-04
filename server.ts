import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { initSocket } from "./server/socket.ts";
import { seed } from "./server/seed.ts";
import authRoutes from "./server/routes/auth.ts";
import projectRoutes from "./server/routes/projects.ts";
import adminRoutes from "./server/routes/admin.ts";
import publicRoutes from "./server/routes/public.ts";
import fileRoutes from "./server/routes/files.ts";
import testimonialRoutes from "./server/routes/testimonials.ts";

// Environment variable validation
const requiredEnvVars = ["GEMINI_API_KEY", "JWT_SECRET", "DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`CRITICAL ERROR: Missing required environment variables: ${missingEnvVars.join(", ")}`);
  console.error("Please configure these in the AI Studio Settings -> Secrets menu.");
  // Don't exit in dev, but log heavily
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);
initSocket(httpServer);

const PORT = 3000;

// Middleware
app.use(morgan("dev")); // HTTP request logging
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Vite dev
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { 
    xForwardedForHeader: false,
    forwardedHeader: false 
  },
});
app.use("/api/", limiter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/testimonials", testimonialRoutes);

// Static files
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      path: req.url
    }
  });
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

seed().then(() => startServer()).catch(err => {
  console.error("Failed to seed database:", err);
  startServer();
});
