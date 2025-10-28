import express from "express"
import multer from "multer"
import Acting from "../../Models/Acting.js"

const router = express.Router()

// ---------------- Multer (in-memory) ----------------
const storage = multer.memoryStorage()
const upload = multer({storage})

// ===================================================
// 📌 Global PDF Upload/Delete
// ===================================================

// UPLOAD / REPLACE global PDF
router.post("/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" })

    let doc = await Acting.findOne()
    if (!doc) doc = new Acting({ acting: {} })
    if (!doc.acting) doc.acting = {}

    doc.acting.diplomaPdf = {
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

// DELETE global PDF
router.delete("/pdf", async (req, res) => {
  try {
    const doc = await Acting.findOne()
    if (!doc || !doc.acting?.diplomaPdf) {
      return res.status(404).json({ message: "No PDF found to delete" })
    }

    doc.acting.diplomaPdf = undefined
    await doc.save()
    res.json({ message: "PDF deleted successfully" })
  } catch (error) {
    console.error("Delete PDF error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

router.get("/pdf/view", async (req, res) => {
  try {
    const doc = await Acting.findOne()
    if (!doc || !doc.acting?.diplomaPdf?.pdfData) {
      return res.status(404).json({ message: "PDF not found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.acting.diplomaPdf.pdfName}"`,
      "Content-Length": doc.acting.diplomaPdf.pdfSize,
    })
    res.send(doc.acting.diplomaPdf.pdfData)
  } catch (error) {
    console.error("PDF view error:", error)
    res.status(500).json({ message: "Error serving PDF" })
  }
})

// ===================================================
// 📌 Diploma Text CRUD
// ===================================================

// GET all diplomas + PDF info
router.get("/", async (req, res) => {
  try {
    const doc = await Acting.findOne()
    res.json({
      items: doc?.acting?.diploma || [],
      diplomaPdf: doc?.acting?.diplomaPdf
        ? {
            pdfName: doc.acting.diplomaPdf.pdfName,
            pdfSize: doc.acting.diplomaPdf.pdfSize,
            uploadDate: doc.acting.diplomaPdf.uploadDate,
          }
        : null,
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

    let doc = await Acting.findOne()
    if (!doc) {
      doc = new Acting({ acting: { diploma: [newDiploma] } })
    } else {
      doc.acting.diploma.push(newDiploma)
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

    const doc = await Acting.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const idx = doc.acting.diploma.findIndex((d) => String(d._id) === id)
    if (idx === -1) return res.status(404).json({ message: "Diploma not found." })

    const diploma = doc.acting.diploma[idx]
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
    const doc = await Acting.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const exists = doc.acting.diploma.find((d) => String(d._id) === id)
    if (!exists) return res.status(404).json({ message: "Diploma not found." })

    doc.acting.diploma = doc.acting.diploma.filter((d) => String(d._id) !== id)
    await doc.save()

    res.json({ message: "Deleted" })
  } catch (err) {
    console.error("DELETE error:", err)
    res.status(500).json({ message: "Delete failed" })
  }
})

export default router
