import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import mongoose from "mongoose";
import cloudinary from "../../Utils/cloudinary.js";
import Vfx from "../../Models/Vfx.js";

const router = express.Router();

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: get or create the single vfx doc
const getVfxDoc = async () => {
  let vfx = await Vfx.findOne();
  if (!vfx) {
    vfx = await Vfx.create({});
  }
  return vfx;
};

// GET all banners
router.get("/", async (req, res) => {
  try {
    const vfx = await getVfxDoc();
    res.json(vfx.vfx.banner || []);
  } catch (err) {
    console.error("GET /vfxbanner error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload new banner
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const vfx = await getVfxDoc();

    const stream = cloudinary.uploader.upload_stream(
      { folder: "vfx/banner" },
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

        vfx.vfx.banner.push(bannerData);

        try {
          await vfx.save();
          return res.json(bannerData);
        } catch (saveErr) {
          console.error("Error saving Vfx:", saveErr);
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
    const vfx = await getVfxDoc();

    const banner = vfx.vfx.banner.find(
      (b) => b._id.toString() === id || b.publicId === id
    );

    if (!banner) return res.status(404).json({ error: "Banner not found" });

    // 1️⃣ Delete from Cloudinary
    await cloudinary.uploader.destroy(banner.publicId);

    // 2️⃣ Remove from MongoDB array
    vfx.vfx.banner = vfx.vfx.banner.filter(
      (b) => b._id.toString() !== id && b.publicId !== id
    );

    await vfx.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
