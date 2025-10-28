import mongoose from "mongoose"

const vfxSchema = new mongoose.Schema(
  {
    vfx: {
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
        type: {
          images: {
            type: [
              {
                imageUrl: { type: String, required: true },
                publicId: { type: String },
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
        default: { images: [], diplomaPdf: {} },
      },
    },
  },
  { timestamps: true },
)

const Vfx = mongoose.model("Vfx", vfxSchema)
export default Vfx
