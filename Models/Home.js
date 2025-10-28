import mongoose from "mongoose";

const homeSchema = new mongoose.Schema(
  {
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
    videoGalleryBanner: {
      type: [
        {
          videoUrl: { type: String, required: true },
          title: { type: String, required: true },
          description: { type: String, required: false },
          category: { type: String, required: true }, // New field
          publicId: { type: String },
          _id: { type: String },
        },
      ],
      default: [],
    },
    exclusive: {
      type: [
        {
          imageUrl: { type: String, required: true },
          titleLine: { type: String, required: true },
          publicId: { type: String },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Home = mongoose.model("Home", homeSchema);
export default Home;
