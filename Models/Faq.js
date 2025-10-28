import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  keywords: { type: [String], default: [] }, // array of keywords/aliases
});

export default mongoose.model("Faq", faqSchema);
