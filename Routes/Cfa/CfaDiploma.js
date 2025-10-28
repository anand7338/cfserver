import express from "express"
import multer from "multer"
import Cfa from "../../Models/Cfa.js"

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
    console.log("[v0] PDF upload started")
    console.log("[v0] File received:", !!req.file)
    console.log(
      "[v0] File details:",
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "No file",
    )

    if (!req.file) return res.status(400).json({ message: "PDF required" })

    console.log("[v0] Checking for existing document...")
    let doc = await Cfa.findOne()
    console.log("[v0] Existing document found:", !!doc)

    if (!doc) doc = new Cfa({ cfa: {} })
    if (!doc.cfa) doc.cfa = {}

    // Remove old file from MongoDB if exists
    if (doc.cfa.diplomaPdf) {
      console.log("[v0] Deleting old PDF from MongoDB")
      doc.cfa.diplomaPdf = undefined
    }

    console.log("[v0] Saving new PDF to MongoDB...")
    doc.cfa.diplomaPdf = {
      pdfData: req.file.buffer,
      pdfName: req.file.originalname,
      pdfSize: req.file.size,
      uploadDate: new Date(),
    }

    console.log("[v0] Database save successful")
    await doc.save()

    res.status(201).json({ message: "PDF uploaded successfully" })
  } catch (err) {
    console.error("[v0] PDF upload error:", err)
    console.error("[v0] Error stack:", err.stack)
    res.status(500).json({ message: "PDF upload failed", error: err.message })
  }
})

// DELETE global PDF
router.delete("/pdf", async (req, res) => {
  try {
    console.log("DELETE /pdf endpoint hit")

    const doc = await Cfa.findOne()
    console.log("Found document:", !!doc)

    if (!doc || !doc.cfa?.diplomaPdf) {
      console.log("No PDF found to delete")
      return res.status(404).json({ message: "No PDF found to delete" })
    }

    console.log("PDF to delete:", doc.cfa.diplomaPdf)

    // Remove PDF field from MongoDB
    doc.cfa.diplomaPdf = undefined
    await doc.save()

    console.log("PDF deleted successfully")
    res.json({ message: "PDF deleted successfully" })
  } catch (error) {
    console.error("Delete PDF error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

router.get("/pdf/view", async (req, res) => {
  try {
    const doc = await Cfa.findOne()
    if (!doc || !doc.cfa?.diplomaPdf?.pdfData) {
      return res.status(404).json({ message: "PDF not found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.cfa.diplomaPdf.pdfName}"`,
      "Content-Length": doc.cfa.diplomaPdf.pdfSize,
    })
    res.send(doc.cfa.diplomaPdf.pdfData)
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
    const doc = await Cfa.findOne()
    res.json({
      items: doc?.cfa?.diploma || [],
      diplomaPdf: doc?.cfa?.diplomaPdf
        ? {
            pdfName: doc.cfa.diplomaPdf.pdfName,
            pdfSize: doc.cfa.diplomaPdf.pdfSize,
            uploadDate: doc.cfa.diplomaPdf.uploadDate,
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

    let doc = await Cfa.findOne()
    if (!doc) {
      doc = new Cfa({ cfa: { diploma: [newDiploma] } })
    } else {
      doc.cfa.diploma.push(newDiploma)
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

    const doc = await Cfa.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const idx = doc.cfa.diploma.findIndex((d) => String(d._id) === id)
    if (idx === -1) return res.status(404).json({ message: "Diploma not found." })

    const diploma = doc.cfa.diploma[idx]
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
    const doc = await Cfa.findOne()
    if (!doc) return res.status(404).json({ message: "No data found" })

    const exists = doc.cfa.diploma.find((d) => String(d._id) === id)
    if (!exists) return res.status(404).json({ message: "Diploma not found." })

    doc.cfa.diploma = doc.cfa.diploma.filter((d) => String(d._id) !== id)
    await doc.save()

    res.json({ message: "Deleted" })
  } catch (err) {
    console.error("DELETE error:", err)
    res.status(500).json({ message: "Delete failed" })
  }
})

export default router
