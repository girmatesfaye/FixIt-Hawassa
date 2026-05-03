import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB for better quality
  fileFilter: (_req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg|webp/;
    const isImage = filetypes.test(file.mimetype) || filetypes.test(file.originalname.toLowerCase());
    
    if (isImage) {
      return cb(null, true);
    }
    cb(new Error("Error: Only image files are allowed!"));
  },
});

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }

    // Check if Cloudinary is configured, otherwise fallback or error
    if (!env.cloudinary.cloudName || env.cloudinary.cloudName === "your_cloud_name") {
      console.warn("[upload] Cloudinary not configured, cannot upload to cloud.");
      return res.status(500).json({ 
        error: "Cloud storage not configured. Please add Cloudinary credentials to .env" 
      });
    }

    // Upload to Cloudinary using a buffer stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "fixit-hawassa",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      uploadStream.end(req.file!.buffer);
    });

    const result = (await uploadPromise) as any;
    
    return res.status(201).json({ 
      url: result.secure_url,
      public_id: result.public_id 
    });
  } catch (error) {
    console.error("[upload] Error uploading to Cloudinary", error);
    return res.status(500).json({ error: "Failed to upload image to cloud storage" });
  }
};
