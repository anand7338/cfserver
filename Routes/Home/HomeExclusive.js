import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../../Utils/cloudinary.js";
import Home from "../../Models/Home.js";

const router = express.Router();

// ✅ Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ✅ Ensure a single Home doc exists
const getHomeDoc = async () => {
  let home = await Home.findOne();
  if (!home) home = await Home.create({});
  return home;
};

// 📌 Get all exclusive items
router.get("/", async (req, res) => {
  try {
    const home = await getHomeDoc();
    res.json(home.exclusive || []);
  } catch (err) {
    console.error("GET /exclusive error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Upload exclusive item (image + titleLine)
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.body.titleLine) {
      return res.status(400).json({ message: "Image and titleLine required" });
    }

    const home = await getHomeDoc();

    const stream = cloudinary.uploader.upload_stream({ folder: "home/exclusive" }, async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: error.message });
        }

        const newItem = {
          imageUrl: result.secure_url,
          publicId: result.public_id,
          titleLine: req.body.titleLine,
        };

        home.exclusive.push(newItem);
        try {
          await home.save();
          console.log("Exclusive saved:", newItem);
          res.json(newItem);
        } catch (saveErr) {
          console.error("Error saving exclusive:", saveErr);
          res.status(500).json({ error: "Failed to save in MongoDB" });
        }
      }
    );

streamifier.createReadStream(req.file.buffer).pipe(stream);

  } catch (err) {
    console.error("Upload exclusive error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Delete exclusive item
router.delete("/:id", async (req, res) => {
  try {
    const home = await getHomeDoc();
    const item = home.exclusive.find(
      (e) => e._id.toString() === req.params.id || e.publicId === req.params.id
    );

    if (!item) return res.status(404).json({ message: "Item not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(item.publicId);

    // Remove from MongoDB
    home.exclusive = home.exclusive.filter(
      (e) => e._id.toString() !== req.params.id && e.publicId !== req.params.id
    );
    await home.save();

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete exclusive error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
