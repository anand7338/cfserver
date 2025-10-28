import express from "express"
import multer from "multer"
import Di from "../../Models/Di.js"

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

    let doc = await Di.findOne()
    if (!doc) doc = new Di({ di: {} })
    if (!doc.di) doc.di = {}

    // Store PDF as binary data in MongoDB
    doc.di.diplomaPdf = {
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
    const doc = await Di.findOne()
    if (!doc || !doc.di?.diplomaPdf?.pdfData) {
      return res.status(404).json({ message: "PDF not found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.di.diplomaPdf.pdfName}"`,
      "Content-Length": doc.di.diplomaPdf.pdfSize,
    })

    res.send(doc.di.diplomaPdf.pdfData)
  } catch (err) {
    console.error("PDF view error:", err)
    res.status(500).json({ message: "Error serving PDF" })
  }
})

router.delete("/pdf", async (req, res) => {
  try {
    const doc = await Di.findOne()
    if (!doc || !doc.di?.diplomaPdf) {
      return res.status(404).json({ message: "No PDF found to delete" })
    }

    doc.di.diplomaPdf = undefined
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
    const doc = await Di.findOne()
    res.json({
      items: doc?.di?.diploma || [],
      diplomaPdf: doc?.di?.diplomaPdf || null,
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

    let doc = await Di.findOne()
    if (!doc) {
      doc = new Di({ di: { diploma: [newDiploma] } })
    } else {
      doc.di.diploma.push(newDiploma)
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

    const doc = await Di.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const idx = doc.di.diploma.findIndex((d) => String(d._id) === id)
    if (idx === -1) return res.status(404).json({ message: "Diploma not found." })

    const diploma = doc.di.diploma[idx]
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
    const doc = await Di.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const exists = doc.di.diploma.find((d) => String(d._id) === id)
    if (!exists) return res.status(404).json({ message: "Diploma not found." })

    doc.di.diploma = doc.di.diploma.filter((d) => String(d._id) !== id)
    await doc.save()

    res.json({ message: "Deleted" })
  } catch (err) {
    console.error("DELETE error:", err)
    res.status(500).json({ message: "Delete failed" })
  }
})

export default router
