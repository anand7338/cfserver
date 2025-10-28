import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import mongoose from "mongoose";
import cloudinary from "../../Utils/cloudinary.js"; // your Cloudinary config
import Direction from "../../Models/Direction.js";

const router = express.Router();

// ✅ Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: get or create the single Direction doc
const getDirectionDoc = async () => {
  let doc = await Direction.findOne();
  if (!doc) doc = await Direction.create({});
  return doc;
};

// GET all highlights
router.get("/", async (req, res) => {
  try {
    const direction = await getDirectionDoc();
    res.json(direction.direction.highlights || []);
  } catch (err) {
    console.error("GET /directionhighlights error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload new highlight
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file || !req.body.titleLine)
    return res.status(400).json({ error: "Image and title required" });

  try {
    const direction = await getDirectionDoc();

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "direction/highlights" },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        const newItem = {
          _id: new mongoose.Types.ObjectId(),
          imageUrl: result.secure_url,
          titleLine: req.body.titleLine,
          publicId: result.public_id,
        };

        direction.direction.highlights.push(newItem);
        await direction.save();

        res.json(newItem);
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error("POST /directionhighlights error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE highlight
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const direction = await getDirectionDoc();

    const highlight = direction.direction.highlights.find(
      (h) => h._id.toString() === id || h.publicId === id
    );

    if (!highlight) return res.status(404).json({ error: "Highlight not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(highlight.publicId);

    // Remove from MongoDB
    direction.direction.highlights = direction.direction.highlights.filter(
      (h) => h._id.toString() !== id && h.publicId !== id
    );

    await direction.save();
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /directionhighlights error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
