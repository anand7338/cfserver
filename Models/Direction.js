import mongoose from "mongoose"

const directionSchema = new mongoose.Schema(
  {
    direction: {
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
            semester1: {
              type: [
                { title: { type: String, required: true } }, // subtitles for semester 1
              ],
              default: [],
            },
            semester2: {
              type: [
                { title: { type: String, required: true } }, // subtitles for semester 2
              ],
              default: [],
            },
            pdfData: { type: Buffer }, // PDF binary data
            pdfName: { type: String }, // Original filename
            pdfSize: { type: Number }, // File size in bytes
            uploadDate: { type: Date, default: Date.now }, // Upload timestamp
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true },
)

const Direction = mongoose.model("Direction", directionSchema)
export default Direction
