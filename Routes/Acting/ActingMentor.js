import express from "express";
import multer from "multer";
import cloudinary from "../../Utils/cloudinary.js";
import streamifier from "streamifier";
import Mentor from "../../Models/Acting.js";

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Upload mentor (image + description)
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { description } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ error: "Mentor description is required" });
    }
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "acting/mentors", resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    const newMentor = {
      imageUrl: result.secure_url,
      description: description.trim(),
      publicId: result.public_id,
    };

    let doc = await Mentor.findOne();

if (doc) {
  doc.acting.mentor.push(newMentor); // ✅ correct
  await doc.save();
} else {
  doc = await Mentor.create({
    acting: { mentor: [newMentor] }, // ✅ fixed casing
  });
}

    res.json(newMentor);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Get all mentors
router.get("/", async (req, res) => {
  try {
    const doc = await Mentor.findOne();
    res.json(doc || {});
  } catch (err) {
    console.error(err);
    res.json({});
  }
});

// Delete mentor by publicId
router.delete("/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;
      console.log("Delete request received for publicId:", publicId);
    const doc = await Mentor.findOne();
      console.log("Mentor doc:", doc);

    if (!doc) return res.status(404).json({ error: "No mentors found" });

    const mentorToDelete = doc.acting.mentor.find(m => m.publicId === publicId);
      console.log("Mentor to delete:", mentorToDelete);

    if (!mentorToDelete) return res.status(404).json({ error: "Mentor not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from MongoDB
    doc.acting.mentor = doc.acting.mentor.filter(m => m.publicId !== publicId);
    await doc.save();

    res.json({ success: true, message: "Mentor deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
