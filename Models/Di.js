import mongoose from "mongoose"

const diSchema = new mongoose.Schema(
  {
    di: {
      banner: {
        type: [
          {
            imageUrl: { type: String, required: true },
            publicId: { type: String },
          },
        ],
        default: [],
      },
      filmography: {
        type: [
          {
            imageUrl: { type: String, required: true },
            publicId: { type: String },
          },
        ],
        default: [],
      },
      mentor: {
        type: [
          {
            imageUrl: { type: String, required: true },
            description: { type: String }, // text field
            publicId: { type: String },
          },
        ],
        default: [],
      },
      highlights: {
        type: [
          {
            imageUrl: { type: String, required: true },
            titleLine: { type: String, required: true }, // text
            publicId: { type: String },
          },
        ],
        default: [],
      },
      diploma: {
        type: [
          {
            title: { type: String, required: true }, // main heading
            children: { type: [String], default: [] }, // bullet points / subtitles
          },
        ],
        default: [],
      },
      diplomaPdf: {
        pdfData: { type: Buffer },
        pdfName: { type: String },
        pdfSize: { type: Number },
        uploadDate: { type: Date, default: Date.now },
      },
    },
  },
  { timestamps: true },
)

const Di = mongoose.model("Di", diSchema)
export default Di
