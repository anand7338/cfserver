import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "guestLecture",
        "highlights",
        "newLaunches",
        "studentReview",
        "studentWorks",
      ],
      required: true,
    },
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    publicId: { type: String }, // from Cloudinary
  },
  { timestamps: true }
);

const VideoGallery = mongoose.model("VideoGallery", videoSchema);
export default VideoGallery;
