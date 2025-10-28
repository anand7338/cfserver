import express from "express"
import multer from "multer"
import Photography from "../../Models/Photography.js"

const router = express.Router()

// ---------------- Multer (in-memory) ----------------
const storage = multer.memoryStorage()
const upload = multer({ storage })

// ===================================================
// 📌 Global PDF Upload/Delete
// ===================================================

// UPLOAD / REPLACE global PDF
router.post("/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" })

    let doc = await Photography.findOne()
    if (!doc) doc = new Photography({ photography: {} })
    if (!doc.photography) doc.photography = {}

    // Store PDF as binary data in MongoDB
    doc.photography.diplomaPdf = {
      pdfData: req.file.buffer,
      pdfName: req.file.originalname,
      pdfSize: req.file.size,
      uploadDate: new Date(),
    }

    await doc.save()
    res.status(201).json({ message: "PDF uploaded successfully" })
  } catch (err) {
    console.error("PDF upload error:", err)
    res.status(500).json({ message: "PDF upload failed", error: err.message })
  }
})

// PDF view endpoint to serve PDF from MongoDB
router.get("/pdf/view", async (req, res) => {
  try {
    const doc = await Photography.findOne()
    if (!doc || !doc.photography?.diplomaPdf?.pdfData) {
      return res.status(404).json({ message: "PDF not found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.photography.diplomaPdf.pdfName}"`,
      "Content-Length": doc.photography.diplomaPdf.pdfSize,
    })

    res.send(doc.photography.diplomaPdf.pdfData)
  } catch (err) {
    console.error("PDF view error:", err)
    res.status(500).json({ message: "Error serving PDF" })
  }
})

router.delete("/pdf", async (req, res) => {
  try {
    const doc = await Photography.findOne()
    if (!doc || !doc.photography?.diplomaPdf) {
      return res.status(404).json({ message: "No PDF found to delete" })
    }

    doc.photography.diplomaPdf = undefined
    await doc.save()

    res.json({ message: "PDF deleted successfully" })
  } catch (error) {
    console.error("Delete PDF error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// ===================================================
// 📌 Diploma Text CRUD
// ===================================================

// GET all diplomas + global PDF
router.get("/", async (req, res) => {
  try {
    const doc = await Photography.findOne()
    res.json({
      items: doc?.photography?.diploma || [],
      diplomaPdf: doc?.photography?.diplomaPdf || null,
    })
  } catch (err) {
    console.error("GET error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// ADD diploma
router.post("/", async (req, res) => {
  try {
    const { title, children } = req.body

    if (!title) return res.status(400).json({ message: "Title required" })
    if (!children || !Array.isArray(children) || children.length === 0)
      return res.status(400).json({ message: "Children required" })

    const newDiploma = { title, children }

    let doc = await Photography.findOne()
    if (!doc) {
      doc = new Photography({ photography: { diploma: [newDiploma] } })
    } else {
      doc.photography.diploma.push(newDiploma)
    }

    await doc.save()
    res.status(201).json(newDiploma)
  } catch (err) {
    console.error("POST error:", err)
    res.status(500).json({ message: "Save failed" })
  }
})

// UPDATE diploma
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { title, children } = req.body

    const doc = await Photography.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const idx = doc.photography.diploma.findIndex((d) => String(d._id) === id)
    if (idx === -1) return res.status(404).json({ message: "Diploma not found." })

    const diploma = doc.photography.diploma[idx]
    if (title) diploma.title = title
    if (children && Array.isArray(children)) diploma.children = children

    await doc.save()
    res.json(diploma)
  } catch (err) {
    console.error("PUT error:", err)
    res.status(500).json({ message: "Update failed" })
  }
})

// DELETE diploma
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const doc = await Photography.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const exists = doc.photography.diploma.find((d) => String(d._id) === id)
    if (!exists) return res.status(404).json({ message: "Diploma not found." })

    doc.photography.diploma = doc.photography.diploma.filter((d) => String(d._id) !== id)
    await doc.save()

    res.json({ message: "Deleted" })
  } catch (err) {
    console.error("DELETE error:", err)
    res.status(500).json({ message: "Delete failed" })
  }
})

export default router
