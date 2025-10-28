// routes/cinematographyFilmography.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../../Utils/cloudinary.js"; // your cloudinary config
import Cinematography from "../../Models/Cinematography.js";

const router = express.Router();

// ✅ Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Ensure a single Cinematography document exists
const getOrCreateCinematography = async () => {
  let doc = await Cinematography.findOne();
  if (!doc) doc = await Cinematography.create({});
  return doc;
};

// 📌 Get all filmography items
router.get("/", async (req, res) => {
  try {
    const doc = await getOrCreateCinematography();
    res.json(doc.cinematography.filmography || [] );
  } catch (err) {
    res.status(500).json({ message: "Error fetching filmography" });
  }
});

// 📌 Upload filmography image
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("📂 File received:", req.file); // DEBUG

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "cinematography/filmography" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();

    const doc = await getOrCreateCinematography();
    const newItem = {
      imageUrl: result.secure_url,
      publicId: result.public_id,
    };

    doc.cinematography.filmography.push(newItem);
    await doc.save();

    res.status(201).json({ message: "Uploaded successfully", item: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading filmography" });
  }
});

// 📌 Delete filmography image
router.delete("/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Delete from MongoDB
    const doc = await getOrCreateCinematography();
    doc.cinematography.filmography = doc.cinematography.filmography.filter((item) => item.publicId !== publicId);
    await doc.save();

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting filmography" });
  }
});

export default router;
