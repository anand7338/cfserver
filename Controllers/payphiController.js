import crypto from "crypto";
import axios from "axios";

// Initiate payment
export const initiatePayment = async (req, res) => {
  try {
    const { amount, course } = req.body;
    console.log("Initiating payment for:", course, "Amount:", amount);

    const merchantId = process.env.PAYPHI_MERCHANT_ID;
    const secretKey = process.env.PAYPHI_SECRET_KEY;
    const baseURL = process.env.PAYPHI_BASE_URL;
    const merchantTxnNo = Date.now().toString();
    const now = new Date();
    const txnDate =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const returnURL = "https://cf-server-tr24.onrender.com/api/payphi/callback";
    const addlParam1 = course || "General";
    const addlParam2 = "Test2";
    const allowedAmounts = [5000, 45000, 30000];
    if (!allowedAmounts.includes(Number(amount))) {
      return res.status(400).json({ message: "Invalid payment amount." });
    }

    const body = {
      merchantId,
      merchantTxnNo,
      amount: Number(amount).toFixed(2),
      currencyCode: "356",
      payType: "0",
      customerEmailID: "test@example.com",
      transactionType: "SALE",
      txnDate,
      returnURL,
      customerMobileNo: "919876543210",
      addlParam1,
      addlParam2,
    };

    const msg =
      addlParam1 +
      addlParam2 +
      body.amount +
      body.currencyCode +
      body.customerEmailID +
      body.customerMobileNo +
      body.merchantId +
      body.merchantTxnNo +
      body.payType +
      body.returnURL +
      body.transactionType +
      body.txnDate;

    body.secureHash = crypto
      .createHmac("sha256", secretKey)
      .update(msg)
      .digest("hex");

    const response = await axios.post(`${baseURL}/initiateSale`, body);

    res.json(response.data);
  } catch (err) {
    console.error("PayPhi initiate error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Payment initiation failed",
      error: err.response?.data || err.message,
    });
  }
};

export const paymentCallback = async (req, res) => {
  console.log("=== PAYPHI CALLBACK RECEIVED ===");
  console.log("Headers:", req.headers);

  let data = {};

  try {
    if (
      req.is("application/json") ||
      req.is("application/x-www-form-urlencoded")
    ) {
      data = req.body;
    } else {
      req.setEncoding("utf8");
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try {
        data = JSON.parse(raw);
      } catch {
        raw.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key) data[key] = decodeURIComponent(value || "");
        });
      }
    }

    console.log("Parsed callback data:", data);

    const responseCode =
      data.responseCode ||
      data.ResponseCode ||
      data.code ||
      data.status ||
      req.query.responseCode;

    let paymentStatus = "failed";
    if (["R1000", "0000", "0", "SUCCESS"].includes(responseCode)) {
      paymentStatus = "success";
    }

    console.log("✅ Payment resolved as:", paymentStatus, responseCode);

    // Redirect to frontend with course & amount
    return res.redirect(
      `https://cf-user.vercel.app/apply?payment=${paymentStatus}&course=${
        data.addlParam1 || ""
      }&amount=${data.amount || ""}`
    );
  } catch (err) {
    console.error("❌ Callback error:", err.message);
    return res.status(500).json({
      message: "Callback internal error",
      error: err.message,
    });
  }
};
