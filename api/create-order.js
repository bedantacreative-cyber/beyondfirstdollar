// /api/create-order.js
// Vercel serverless function. Creates a Razorpay order server-side.
// KEY_SECRET is only ever read here, from environment variables — never sent to the browser.

const Razorpay = require("razorpay");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency, receipt } = req.body || {};

    // Default to the founding cohort price (Rs 2,999 -> paise) if none is sent.
    const finalAmount = Number(amount) || 299900;
    const finalCurrency = currency || "INR";

    if (!finalAmount || finalAmount < 100) {
      return res.status(400).json({ error: "Amount must be at least 100 paise" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(401).json({ error: "Razorpay credentials are not configured" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: finalCurrency,
      receipt: receipt || `bfd_${Date.now()}`,
    });

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("create-order error:", err);
    if (err.statusCode === 401) {
      return res.status(401).json({ error: "Authentication with Razorpay failed" });
    }
    return res.status(500).json({ error: "Failed to create order" });
  }
};
