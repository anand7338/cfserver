import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../../Utils/cloudinary.js";
import Home from "../../Models/Home.js";

const router = express.Router();

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const getHomeDoc = async () => {
  let home = await Home.findOne();
  if (!home) {
    home = await Home.create({});
  }
  return home;
};

// List filmographys
router.get("/", async (req, res) => {
  try {
    const home = await getHomeDoc();
    res.json(home.filmography || []);
  } catch (err) {
    console.error("[v0] GET /homefilmography error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Upload filmography
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const home = await getHomeDoc();

    const stream = cloudinary.uploader.upload_stream(
      { folder: "home/filmography" },
      async (error, result) => {
        if (error) {
          console.error("[v0] Cloudinary upload error:", error);
          return res.status(500).json({ error: error.message });
        }
        if (!result) {
          console.error("[v0] No result returned from Cloudinary!");
          return res
            .status(500)
            .json({ error: "No upload result from Cloudinary" });
        }

        const filmographyData = {
          imageUrl: result.secure_url,
          publicId: result.public_id,
        };

        console.log("[v0] Adding filmography:", filmographyData);

        home.filmography.push(filmographyData);

        try {
          await home.save();
          console.log(
            "[v0] Home document after save:",
            JSON.stringify(home, null, 2)
          );
          console.log("Saved Home after filmography upload:", home);
          return res.json(filmographyData);
        } catch (saveErr) {
          console.error("[v0] Error saving Home:", saveErr);
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

// Delete filmography
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const home = await getHomeDoc();

    // Find the filmography by _id or publicId
    const filmography = home.filmography.find(
      (b) => b._id.toString() === id || b.publicId === id
    );
    if (!filmography) {
      return res.status(404).json({ error: "filmography not found" });
    }

    // 1. Delete from Cloudinary
    await cloudinary.uploader.destroy(filmography.publicId);

    // 2. Remove from MongoDB array
    home.filmography = home.filmography.filter(
      (b) => b._id.toString() !== id && b.publicId !== id
    );
    await home.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
