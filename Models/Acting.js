import mongoose from "mongoose";

const actingSchema = new mongoose.Schema(
  {
    acting: {
      banner: {
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
            description: { type: String },
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
  { timestamps: true }
);

const Acting = mongoose.model("Acting", actingSchema);
export default Acting;
