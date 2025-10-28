import mongoose from "mongoose"

const cfaSchema = new mongoose.Schema(
  {
    cfa: {
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

const Cfa = mongoose.model("Cfa", cfaSchema)
export default Cfa
