import express from "express"
import multer from "multer"
import streamifier from "streamifier"
import mongoose from "mongoose"
import cloudinary from "../../Utils/cloudinary.js"
import Vfx from "../../Models/Vfx.js"

const router = express.Router()

// Memory storage
const storage = multer.memoryStorage()
const upload = multer({storage})

// Ensure doc exists with safe defaults
const getVfxDoc = async () => {
  let vfx = await Vfx.findOne()
  if (!vfx) {
    vfx = await Vfx.create({
      vfx: { diploma: { images: [], pdf: {} } },
    })
  }

  // ✅ Always ensure nested fields exist
  if (!vfx.vfx) vfx.vfx = {}
  if (!vfx.vfx.diploma) vfx.vfx.diploma = { images: [], pdf: {} }
  if (!Array.isArray(vfx.vfx.diploma.images)) vfx.vfx.diploma.images = []
  if (!vfx.vfx.diploma.pdf) vfx.vfx.diploma.pdf = {}

  return vfx
}

/* ---------------- GET DIPLOMA ---------------- */
router.get("/", async (req, res) => {
  try {
    const vfx = await getVfxDoc()
    res.json(vfx.vfx.diploma)
  } catch (err) {
    console.error("GET /vfxdiploma error:", err)
    res.status(500).json({ error: err.message })
  }
})

/* ---------------- IMAGE UPLOAD ---------------- */
router.post("/images", upload.single("image"), async (req, res) => {
  try {
    console.log("👉 /vfxdiploma/images called")

    if (!req.file) {
      console.log("❌ No file uploaded")
      return res.status(400).json({ error: "No image uploaded" })
    }

    console.log("✅ File received:", req.file.originalname)

    const vfx = await getVfxDoc()
    console.log("✅ Got Vfx doc")

    const stream = cloudinary.uploader.upload_stream({ folder: "vfx/diploma" }, async (error, result) => {
      if (error) {
        console.error("❌ Cloudinary upload error:", error)
        return res.status(500).json({ error: error.message })
      }

      console.log("✅ Cloudinary result:", result.secure_url)

      const imageData = {
        _id: new mongoose.Types.ObjectId(),
        imageUrl: result.secure_url,
        publicId: result.public_id,
      }

      vfx.vfx.diploma.images.push(imageData)
      await vfx.save()

      console.log("✅ Saved to Mongo")
      res.json(imageData)
    })

    streamifier.createReadStream(req.file.buffer).pipe(stream)
  } catch (err) {
    console.error("❌ Image upload error:", err)
    res.status(500).json({ error: err.message })
  }
})

/* ---------------- IMAGE DELETE ---------------- */
router.delete("/images/:id", async (req, res) => {
  try {
    const { id } = req.params
    const vfx = await getVfxDoc()

    const img = vfx.vfx.diploma.images.find((i) => i._id.toString() === id || i.publicId === id)
    if (!img) return res.status(404).json({ error: "Image not found" })

    await cloudinary.uploader.destroy(img.publicId)

    vfx.vfx.diploma.images = vfx.vfx.diploma.images.filter((i) => i._id.toString() !== id && i.publicId !== id)
    await vfx.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ---------------- PDF UPLOAD ---------------- */
router.post("/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" })

    const vfx = await getVfxDoc()

    vfx.vfx.diploma.diplomaPdf = {
      pdfData: req.file.buffer,
      pdfName: req.file.originalname,
      pdfSize: req.file.size,
      uploadDate: new Date(),
    }
    await vfx.save()

    res.json({ success: true, pdfName: req.file.originalname })
  } catch (err) {
    console.error("PDF upload error:", err)
    res.status(500).json({ error: err.message })
  }
})

/* ---------------- PDF VIEW ---------------- */
router.get("/pdf/view", async (req, res) => {
  try {
    const vfx = await getVfxDoc()
    if (!vfx.vfx.diploma.diplomaPdf?.pdfData) {
      return res.status(404).json({ error: "PDF not found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${vfx.vfx.diploma.diplomaPdf.pdfName}"`,
    })
    res.send(vfx.vfx.diploma.diplomaPdf.pdfData)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ---------------- PDF DELETE ---------------- */
router.delete("/pdf", async (req, res) => {
  try {
    const vfx = await getVfxDoc()
    if (!vfx.vfx.diploma.diplomaPdf?.pdfName) return res.status(404).json({ error: "PDF not found" })

    vfx.vfx.diploma.diplomaPdf = {}
    await vfx.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
