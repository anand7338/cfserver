// routes/payment.js
import express from "express";
import Payment from "../Models/paymentModel.js";

const router = express.Router();

// Get all payments
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error fetching payments", error: err.message });
  }
});

// Save payment with client info
router.post("/", async (req, res) => {
  try {
    const { client, amount, transactionId, status } = req.body;

    const newPayment = new Payment({
      client,
      amount,
      transactionId,
      status,
    });

    await newPayment.save();

    res
      .status(200)
      .json({ message: "Payment and client info saved successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error saving payment", error: err.message });
  }
});

// Update payment
router.put("/:id", async (req, res) => {
  try {
    const { client } = req.body;
    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { client },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error updating payment", error: err.message });
  }
});

// Delete payment
router.delete("/:id", async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error deleting payment", error: err.message });
  }
});

export default router;
