import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import mongoose from "mongoose";
import cloudinary from "../../Utils/cloudinary.js";
import StageUnreal from "../../Models/StageUnreal.js";

const router = express.Router();

// ✅ Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
});

// ✅ Helper: get or create StageUnreal doc
const getStageUnrealDoc = async () => {
  let doc = await StageUnreal.findOne();
  if (!doc) {
    doc = await StageUnreal.create({});
  }
  return doc;
};

// 📌 GET all banners
router.get("/", async (req, res) => {
  try {
    const doc = await getStageUnrealDoc();
    res.json(doc.stageunreal.banner || []);
  } catch (err) {
    console.error("GET /stageunrealbanner error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 POST upload new banner (video)
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video uploaded" });

    const doc = await getStageUnrealDoc();

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // important for video uploads
        folder: "stageunreal/banner",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: error.message });
        }
        if (!result) {
          return res.status(500).json({ error: "No upload result from Cloudinary" });
        }

        const bannerData = {
          _id: new mongoose.Types.ObjectId(),
          videoUrl: result.secure_url,
          publicId: result.public_id,
        };

        doc.stageunreal.banner.push(bannerData);

        try {
          await doc.save();
          return res.json(bannerData);
        } catch (saveErr) {
          console.error("Error saving StageUnreal:", saveErr);
          return res.status(500).json({ error: "Failed to save in MongoDB" });
        }
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 DELETE banner by ID or publicId
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getStageUnrealDoc();

    const banner = doc.stageunreal.banner.find(
      (b) => b._id.toString() === id || b.publicId === id
    );

    if (!banner) return res.status(404).json({ error: "Banner not found" });

    // 1️⃣ Delete from Cloudinary
    await cloudinary.uploader.destroy(banner.publicId, { resource_type: "video" });

    // 2️⃣ Remove from MongoDB array
    doc.stageunreal.banner = doc.stageunreal.banner.filter(
      (b) => b._id.toString() !== id && b.publicId !== id
    );

    await doc.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
