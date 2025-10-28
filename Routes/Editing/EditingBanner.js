import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import mongoose from "mongoose";
import cloudinary from "../../Utils/cloudinary.js";
import Editing from "../../Models/Editing.js";

const router = express.Router();

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: get or create the single editing doc
const getEditingDoc = async () => {
  let editing = await Editing.findOne();
  if (!editing) {
    editing = await Editing.create({});
  }
  return editing;
};

// GET all banners
router.get("/", async (req, res) => {
  try {
    const editing = await getEditingDoc();
    res.json(editing.editing.banner || []);
  } catch (err) {
    console.error("GET /editingbanner error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload new banner
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const editing = await getEditingDoc();

    const stream = cloudinary.uploader.upload_stream(
      { folder: "editing/banner" },
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

        editing.editing.banner.push(bannerData);

        try {
          await editing.save();
          return res.json(bannerData);
        } catch (saveErr) {
          console.error("Error saving editing:", saveErr);
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
    const editing = await getEditingDoc();

    const banner = editing.editing.banner.find(
      (b) => b._id.toString() === id || b.publicId === id
    );

    if (!banner) return res.status(404).json({ error: "Banner not found" });

    // 1️⃣ Delete from Cloudinary
    await cloudinary.uploader.destroy(banner.publicId);

    // 2️⃣ Remove from MongoDB array
    editing.editing.banner = editing.editing.banner.filter(
      (b) => b._id.toString() !== id && b.publicId !== id
    );

    await editing.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
