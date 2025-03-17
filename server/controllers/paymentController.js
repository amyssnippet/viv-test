const stripe = require("stripe")("sk_test_51MWvggSDMzhLVRDNz5GBklXXBWd6d5CeCwxoyXocBgt6Kidvba1X3liDOiyIL7l4NBT7SWrVIKFbbdhsxIcDeSLA00rQUskid2");

const createSession = async (req, res) => {
  console.log("createSession");
    const { priceId } = req.body; // The price ID for Stripe
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: "http://localhost:5173/success",
        cancel_url: "http://localhost:5173/cancel",
      });
  
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

module.exports = { createSession }