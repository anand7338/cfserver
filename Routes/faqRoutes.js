import express from "express";
import Faq from "../Models/Faq.js";

const router = express.Router();

// Get all FAQs
router.get("/", async (req, res) => {
  const faqs = await Faq.find();
  res.json(faqs);
});

// Add new FAQ
router.post("/", async (req, res) => {
  const { question, answer, keywords } = req.body;
  const faq = new Faq({ question, answer, keywords });
  await faq.save();
  res.json(faq);
});

// Update FAQ
router.put("/:id", async (req, res) => {
  const { question, answer, keywords } = req.body;
  const faq = await Faq.findByIdAndUpdate(
    req.params.id,
    { question, answer, keywords },
    { new: true }
  );
  res.json(faq);
});

// Delete FAQ
router.delete("/:id", async (req, res) => {
  await Faq.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
});

export default router;
