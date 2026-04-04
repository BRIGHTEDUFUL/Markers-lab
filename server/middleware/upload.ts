import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });

export const optimizeImages = async (req: any, res: any, next: any) => {
  if (!req.file && (!req.files || req.files.length === 0)) return next();

  try {
    const sharp = (await import("sharp")).default;
    const files = req.file ? [req.file] : (req.files as any[]);
    
    for (const file of files) {
      if (file.mimetype.startsWith("image/")) {
        const originalPath = file.path;
        const webpFilename = file.filename.replace(path.extname(file.filename), ".webp");
        const webpPath = path.join(path.dirname(originalPath), webpFilename);

        await sharp(originalPath)
          .resize(1200, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(webpPath);

        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        file.path = webpPath;
        file.filename = webpFilename;
        file.mimetype = "image/webp";
      }
    }
    next();
  } catch (err) {
    console.error("Image optimization error:", err);
    next();
  }
};
