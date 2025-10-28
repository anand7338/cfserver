import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import mongoose from "mongoose";
import cloudinary from "../../Utils/cloudinary.js";
import Direction from "../../Models/Direction.js";

const router = express.Router();

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: get or create the single Direction doc
const getDirectionDoc = async () => {
  let direction = await Direction.findOne();
  if (!direction) {
    direction = await Direction.create({});
  }
  return direction;
};

// GET all banners
router.get("/", async (req, res) => {
  try {
    const direction = await getDirectionDoc();
    res.json(direction.direction.banner || []);
  } catch (err) {
    console.error("GET /directionbanner error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload new banner
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const direction = await getDirectionDoc();

    const stream = cloudinary.uploader.upload_stream(
      { folder: "direction/banner" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: error.message });
        }
        if (!result) {
          console.error("No result returned from Cloudinary!");
          return res.status(500).json({ error: "No upload result from Cloudinary" });
        }

        const bannerData = {
          _id: new mongoose.Types.ObjectId(), // manual _id
          imageUrl: result.secure_url,
          publicId: result.public_id,
        };

        direction.direction.banner.push(bannerData);

        try {
          await direction.save();
          return res.json(bannerData);
        } catch (saveErr) {
          console.error("Error saving Direction:", saveErr);
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

// DELETE banner
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const direction = await getDirectionDoc();

    const banner = direction.direction.banner.find(
      (b) => b._id.toString() === id || b.publicId === id
    );

    if (!banner) return res.status(404).json({ error: "Banner not found" });

    // 1️⃣ Delete from Cloudinary
    await cloudinary.uploader.destroy(banner.publicId);

    // 2️⃣ Remove from MongoDB array
    direction.direction.banner = direction.direction.banner.filter(
      (b) => b._id.toString() !== id && b.publicId !== id
    );

    await direction.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
