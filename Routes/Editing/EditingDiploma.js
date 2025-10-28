import express from "express"
import multer from "multer"
import Editing from "../../Models/Editing.js"

const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({storage})

// ✅ Ensure one Editing doc exists
const ensureDoc = async () => {
  let doc = await Editing.findOne()
  if (!doc) {
    doc = await Editing.create({
      editing: {
        banner: [],
        filmography: [],
        highlights: [],
        mentor: [],
        diploma: [],
      },
    })
  }
  return doc
}

// 👉 GET /editingdiploma
router.get("/", async (req, res) => {
  try {
    const doc = await ensureDoc()
    res.json(doc.editing) // return only editing section
  } catch (err) {
    console.error("Fetch error:", err)
    res.status(500).json({ message: "Error fetching diploma data" })
  }
})

// 👉 POST /editingdiploma/save
router.post("/save", upload.any(), async (req, res) => {
  try {
    const doc = await ensureDoc()
    let diploma = doc.editing.diploma || []

    // ✅ Update diploma JSON
    if (req.body.diploma) {
      try {
        diploma = JSON.parse(req.body.diploma)
      } catch (e) {
        console.warn("Invalid diploma JSON, keeping existing")
      }
    }

    for (const file of req.files) {
      if (file.fieldname === "diploma_pdf") {
        doc.editing.diplomaPdf = {
          pdfData: file.buffer,
          pdfName: file.originalname,
          pdfSize: file.size,
          uploadDate: new Date(),
        }
      }
    }

    doc.editing.diploma = diploma
    await doc.save()

    res.json({ message: "Saved successfully", data: doc.editing })
  } catch (err) {
    console.error("Save error:", err)
    res.status(500).json({ message: "Error saving diploma data" })
  }
})

router.get("/pdf/view", async (req, res) => {
  try {
    const doc = await ensureDoc()

    if (!doc.editing.diplomaPdf?.pdfData) {
      return res.status(404).json({ message: "No PDF found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": doc.editing.diplomaPdf.pdfSize,
      "Content-Disposition": `inline; filename="${doc.editing.diplomaPdf.pdfName}"`,
    })

    res.send(doc.editing.diplomaPdf.pdfData)
  } catch (err) {
    console.error("PDF view error:", err)
    res.status(500).json({ message: "Failed to load PDF" })
  }
})

// 👉 DELETE /editingdiploma/pdf
router.delete("/pdf", async (req, res) => {
  try {
    const doc = await ensureDoc()

    if (doc.editing.diplomaPdf?.pdfData) {
      doc.editing.diplomaPdf = {
        pdfData: undefined,
        pdfName: undefined,
        pdfSize: undefined,
        uploadDate: undefined,
      }
      await doc.save()
    }

    res.json({ message: "Diploma PDF deleted", data: doc.editing })
  } catch (err) {
    console.error("Delete error:", err)
    res.status(500).json({ message: "Error deleting diploma PDF" })
  }
})

export default router
