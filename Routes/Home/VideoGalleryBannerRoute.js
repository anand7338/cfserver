import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import streamifier from "streamifier";
import cloudinary from "../../Utils/cloudinary.js";
import Home from "../../Models/Home.js"; // We will update the Home document

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// 📌 Get all video gallery banners
router.get("/all", async (req, res) => {
  try {
    const homeData = await Home.findOne({});
    if (!homeData) return res.status(404).json({ error: "No home data found" });

    res.json(homeData.videoGalleryBanner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Upload video banner (only 1 video per category)
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { category, title, description } = req.body;

    if (!req.file || !title || !category) {
      return res
        .status(400)
        .json({ error: "Video, title, and category are required" });
    }

    const homeData = await Home.findOne({});
    if (!homeData) {
      return res.status(404).json({ error: "Home data not found" });
    }

    const existingVideos = homeData.videoGalleryBanner.filter(
      (video) => video.category === category
    );

    if (existingVideos.length >= 1) {
      return res
        .status(400)
        .json({ error: "Only 1 video is allowed per category" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: `banner/${category}` },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        try {
          const newVideo = {
            videoUrl: result.secure_url,
            title: title.trim(),
            description: description ? description.trim() : "",
            category: category.trim(),
            publicId: result.public_id,
            _id: new mongoose.Types.ObjectId().toString(),
          };

          homeData.videoGalleryBanner.push(newVideo);
          await homeData.save();

          res.json(newVideo);
        } catch (dbErr) {
          res.status(500).json({ error: dbErr.message });
        }
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Delete video banner by _id
router.delete("/:id", async (req, res) => {
  try {
    const homeData = await Home.findOne({});
    if (!homeData)
      return res.status(404).json({ error: "Home data not found" });

    const videoToDelete = homeData.videoGalleryBanner.find(
      (video) => video._id === req.params.id
    );

    if (!videoToDelete) {
      return res.status(404).json({ error: "Video banner not found" });
    }

    if (videoToDelete.publicId) {
      await cloudinary.uploader.destroy(videoToDelete.publicId, {
        resource_type: "video",
      });
    }

    homeData.videoGalleryBanner = homeData.videoGalleryBanner.filter(
      (video) => video._id !== req.params.id
    );

    await homeData.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
