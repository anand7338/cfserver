import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../../Utils/cloudinary.js";
import VideoGallery from "../../Models/VideoGallery.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// 📌 Get all videos by category
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const videos = await VideoGallery.find({ category }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Upload video
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { category, title } = req.body;
    if (!req.file || !title || !category) {
      return res.status(400).json({ error: "Video, title and category required" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: `gallery/${category}` },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        try {
          console.log("Saving video:", category, title, result.secure_url);

          const newVideo = await VideoGallery.create({
            category,
            title: title.trim(),
            videoUrl: result.secure_url,
            publicId: result.public_id,
          });

          res.json(newVideo);
        } catch (dbErr) {
          console.error("DB error", dbErr);
          res.status(500).json({ error: dbErr.message });
        }
      }
    );

    // 👇 you need this line
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Delete video
router.delete("/:id", async (req, res) => {
  try {
    const video = await VideoGallery.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // delete from Cloudinary
    if (video.publicId) {
      await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });
    }

    await video.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
