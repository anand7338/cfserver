import express from "express";

const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "cfadmin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cfadmin123";

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: "fake-jwt-token" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

export default router;
