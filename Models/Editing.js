import mongoose from "mongoose"

const editingSchema = new mongoose.Schema(
  {
    editing: {
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
            month: { type: String, required: true },
            sections: {
              type: [
                {
                  name: { type: String, required: true },
                  items: {
                    type: [
                      {
                        title: { type: String, required: true },
                      },
                    ],
                    default: [],
                  },
                },
              ],
              default: [],
            },
          },
        ],
        default: [],
      },
      diplomaPdf: {
        pdfData: { type: Buffer }, // PDF binary data
        pdfName: { type: String }, // Original filename
        pdfSize: { type: Number }, // File size in bytes
        uploadDate: { type: Date, default: Date.now }, // Upload timestamp
      },
    },
  },
  { timestamps: true },
)

const Editing = mongoose.model("Editing", editingSchema)
export default Editing
