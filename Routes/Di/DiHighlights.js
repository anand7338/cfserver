import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import mongoose from "mongoose";
import cloudinary from "../../Utils/cloudinary.js"; // your Cloudinary config
import Model from "../../Models/Di.js";

const router = express.Router();

// ✅ Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: get or create the single Model doc
const getModelDoc = async () => {
  let doc = await Model.findOne();
  if (!doc) doc = await Model.create({});
  return doc;
};

// GET all highlights
router.get("/", async (req, res) => {
  try {
    const di = await getModelDoc();
    res.json(di.di.highlights || []);
  } catch (err) {
    console.error("GET /dihighlights error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload new highlight
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file || !req.body.titleLine)
    return res.status(400).json({ error: "Image and title required" });

  try {
    const di = await getModelDoc();

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "di/highlights" },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        const newItem = {
          _id: new mongoose.Types.ObjectId(),
          imageUrl: result.secure_url,
          titleLine: req.body.titleLine,
          publicId: result.public_id,
        };

        di.di.highlights.push(newItem);
        await di.save();

        res.json(newItem);
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error("POST /dihighlights error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE highlight
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const di = await getModelDoc();

    const highlight = di.di.highlights.find(
      (h) => h._id.toString() === id || h.publicId === id
    );

    if (!highlight) return res.status(404).json({ error: "Highlight not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(highlight.publicId);

    // Remove from MongoDB
    di.di.highlights = di.di.highlights.filter(
      (h) => h._id.toString() !== id && h.publicId !== id
    );

    await di.save();
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /dihighlights error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
