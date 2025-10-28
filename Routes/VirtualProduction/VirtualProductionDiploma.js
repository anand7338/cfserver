// routes/diplomaRoutes.js
import express from "express";
import multer from "multer";
import cloudinary from "../../Utils/cloudinary.js";
import streamifier from "streamifier";
import VirtualProduction from "../../Models/VirtualProduction.js";

const router = express.Router();

// Multer memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({storage})

// HELPER: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

// GET all diploma courses
router.get("/", async (req, res) => {
  try {
    const doc = await VirtualProduction.findOne();
    res.json(doc?.virtualProduction?.diploma || []);
  } catch (e) {
    console.error("GET /virtualproduction/diploma failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD diploma course
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { course, time, title, description, link } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image required" });

    const uploadResult = await uploadToCloudinary(req.file.buffer, "diploma");

    const newCourse = {
      course,
      time,
      title,
      description,
      link,
      imageUrl: uploadResult.secure_url, // Cloudinary URL
      publicId: uploadResult.public_id, // Cloudinary ID
    };

    let doc = await VirtualProduction.findOne();
    if (!doc) {
      doc = new VirtualProduction({ virtualProduction: { diploma: [newCourse] } });
    } else {
      // Initialize objects safely
      doc.virtualProduction = doc.virtualProduction || {};
      doc.virtualProduction.diploma = doc.virtualProduction.diploma || [];
      doc.virtualProduction.diploma.push(newCourse);
    }

    await doc.save();
    res.status(201).json(newCourse);
  } catch (e) {
    console.error("POST /virtualproduction/diploma failed:", e);
    res.status(500).json({ message: e.message || "Upload failed" });
  }
});

// UPDATE diploma course
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { course, time, title, description, link } = req.body;

    const doc = await VirtualProduction.findOne();
    if (!doc) return res.status(404).json({ message: "No data found" });

    doc.virtualProduction = doc.virtualProduction || {};
    doc.virtualProduction.diploma = doc.virtualProduction.diploma || [];

    const idx = doc.virtualProduction.diploma.findIndex((d) => String(d._id) === id);
    if (idx === -1) return res.status(404).json({ message: "Course not found" });

    const diploma = doc.virtualProduction.diploma[idx];

    // If new image uploaded, delete old from Cloudinary
    if (req.file) {
      if (diploma.publicId) await cloudinary.uploader.destroy(diploma.publicId);

      const uploadResult = await uploadToCloudinary(req.file.buffer, "diploma");
      diploma.imageUrl = uploadResult.secure_url;
      diploma.publicId = uploadResult.public_id;
    }

    diploma.course = course ?? diploma.course;
    diploma.time = time ?? diploma.time;
    diploma.title = title ?? diploma.title;
    diploma.description = description ?? diploma.description;
    diploma.link = link ?? diploma.link;

    await doc.save();
    res.json(diploma);
  } catch (e) {
    console.error("PUT /virtualproduction/diploma/:id failed:", e);
    res.status(500).json({ message: e.message || "Update failed" });
  }
});

// DELETE diploma course
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await VirtualProduction.findOne();
    if (!doc) return res.status(404).json({ message: "No data found" });

    doc.virtualProduction = doc.virtualProduction || {};
    doc.virtualProduction.diploma = doc.virtualProduction.diploma || [];

    const diploma = doc.virtualProduction.diploma.find((d) => String(d._id) === id);
    if (!diploma) return res.status(404).json({ message: "Course not found" });

    // Delete image from Cloudinary
    if (diploma.publicId) await cloudinary.uploader.destroy(diploma.publicId);

    doc.virtualProduction.diploma = doc.virtualProduction.diploma.filter((d) => String(d._id) !== id);
    await doc.save();

    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /virtualproduction/diploma/:id failed:", e);
    res.status(500).json({ message: e.message || "Delete failed" });
  }
});

export default router;
