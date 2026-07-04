// /api/verify-payment.js
// Vercel serverless function. Verifies the Razorpay payment signature server-side
// so a payment can only ever be trusted if it was cryptographically confirmed by Razorpay.

const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(401).json({ success: false, error: "Razorpay credentials are not configured" });
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  if (!isValid) {
    return res.status(400).json({ success: false, error: "Payment verification failed" });
  }

  // Signature is valid: the payment is genuine and belongs to this order.
  // No database in this project yet, so there is nothing further to persist here.
  // If you add one later, mark the order as paid in that step.
  return res.status(200).json({ success: true });
};
