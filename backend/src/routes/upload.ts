import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB layout
  fileFilter: (_req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Error: Images Only!"));
    }
  },
});

const uploadRouter = Router();

uploadRouter.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json({ url: fileUrl });
  } catch (error) {
    console.error("[upload] Error uploading image", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
});

export default uploadRouter;
