import express from "express";
import {
  initiatePayment,
  paymentCallback,
} from "../Controllers/payphiController.js";

const router = express.Router();

router.post("/initiate", initiatePayment); // POST /api/payphi/initiate
router.post("/callback", paymentCallback); // PayPhi callback URL
router.get("/callback", paymentCallback); // 👈 handles both

export default router;
