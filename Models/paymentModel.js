// models/paymentModel.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  client: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    fatherName: { type: String },
    fatherPhone: { type: String },
    age: { type: String },
    gender: { type: String },
    dob: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    courses: [{ type: String }],
  },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  status: { type: String, required: true }, // success / failed
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PaymentModel", paymentSchema);
