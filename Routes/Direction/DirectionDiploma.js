import express from "express"
import multer from "multer"
import Direction from "../../Models/Direction.js"

const router = express.Router()

// Multer memory storage
const storage = multer.memoryStorage()
const upload = multer({storage})

// Helper to get or create diploma object
async function getDiploma() {
  let direction = await Direction.findOne()
  if (!direction) {
    direction = await Direction.create({
      direction: {
        diploma: [{ semester1: [], semester2: [] }],
      },
    })
  }
  if (!direction.direction.diploma[0]) {
    direction.direction.diploma[0] = {
      semester1: [],
      semester2: [],
    }
    await direction.save()
  }
  return { direction, diploma: direction.direction.diploma[0] }
}

// GET Diploma Data
router.get("/", async (req, res) => {
  try {
    const { direction } = await getDiploma()
    res.json(direction)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server Error" })
  }
})

// POST subtitle updates (add/edit semester1 or semester2)
router.post("/text", async (req, res) => {
  try {
    const { semester1 = [], semester2 = [] } = req.body
    const { direction, diploma } = await getDiploma()

    diploma.semester1 = Array.isArray(semester1) ? semester1.map((t) => ({ title: t })) : [{ title: semester1 }]
    diploma.semester2 = Array.isArray(semester2) ? semester2.map((t) => ({ title: t })) : [{ title: semester2 }]

    await direction.save()
    res.json({ message: "Subtitles updated", data: diploma })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server Error" })
  }
})

// POST PDF (only one PDF)
router.post("/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Store PDF data directly in MongoDB
    const { direction, diploma } = await getDiploma()
    diploma.pdfData = req.file.buffer
    diploma.pdfName = req.file.originalname
    diploma.pdfSize = req.file.size
    diploma.uploadDate = new Date()

    await direction.save()

    res.status(200).json({
      message: "PDF uploaded successfully",
      pdfName: diploma.pdfName,
      pdfSize: diploma.pdfSize,
      uploadDate: diploma.uploadDate,
    })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ message: "Failed to upload PDF" })
  }
})

router.get("/pdf/view", async (req, res) => {
  try {
    const { direction, diploma } = await getDiploma()

    if (!diploma.pdfData) {
      return res.status(404).json({ message: "No PDF found" })
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": diploma.pdfSize,
      "Content-Disposition": `inline; filename="${diploma.pdfName}"`,
    })

    res.send(diploma.pdfData)
  } catch (err) {
    console.error("PDF view error:", err)
    res.status(500).json({ message: "Failed to load PDF" })
  }
})

// DELETE PDF
router.delete("/pdf", async (req, res) => {
  try {
    const { direction, diploma } = await getDiploma()

    if (!diploma.pdfData) return res.status(400).json({ message: "No PDF to delete" })

    diploma.pdfData = undefined
    diploma.pdfName = undefined
    diploma.pdfSize = undefined
    diploma.uploadDate = undefined

    await direction.save()
    res.json({ message: "PDF deleted", data: diploma })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server Error" })
  }
})

// DELETE a subtitle
router.delete("/subtitle", async (req, res) => {
  try {
    const { semester, index } = req.body // semester = 'semester1' or 'semester2'

    if (!semester || typeof index !== "number") return res.status(400).json({ message: "Semester and index required" })

    const { direction, diploma } = await getDiploma()

    if (!diploma[semester] || index < 0 || index >= diploma[semester].length)
      return res.status(400).json({ message: "Invalid index" })

    diploma[semester].splice(index, 1)
    await direction.save()

    res.json({ message: "Subtitle deleted", data: diploma })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server Error" })
  }
})

export default router
