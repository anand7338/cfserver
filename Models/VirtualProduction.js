import mongoose from "mongoose";

const virtualProductionSchema = new mongoose.Schema(
  {
    virtualProduction: {
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
            description: { type: String}, // text field
            publicId: { type: String },
          },
        ],
        default: [],
      },
      diploma: {
        type: [
          {
            course: { type: String, required: true },
            time: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String},
            link: {
              type: String,
              enum: [
                "/virtual_production/cfa",
                "/virtual_production/stage_unreal",
              ],
              required: true,
            },
            imageUrl: { type: String, required: true },
            publicId: { type: String },
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
);

const VirtualProduction = mongoose.model(
  "VirtualProduction",
  virtualProductionSchema
);
export default VirtualProduction;
