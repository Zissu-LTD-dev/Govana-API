const express = require("express");
const Shopify = require("shopify-api-node");
const router = express.Router();
const crypto = require("crypto");

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SHOP,
  SCOPES,
  SHOPIFY_WEBHOOK_SECRET,
  ACCESS_TOKEN,
} = process.env;

// Initialize Shopify with shop name and access token
const shopify = new Shopify({
  shopName: SHOPIFY_SHOP.replace("https://", "").replace(".myshopify.com", ""),
  accessToken: "ACCESS_TOKEN",
});

// Existing route
router.get("/products", async (req, res) => {
  try {
    const session = await Shopify.Utils.loadCurrentSession(req, res);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
    const products = await client.get({
      path: "products",
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New route for handling Shopify webhooks

router.post(
  "/webhooks/order/create",
  express.raw({ type: "application/json" }),
  (req, res) => {
    console.log("Received webhook");
    try {
      const hmac = req.get("X-Shopify-Hmac-Sha256");
      const body = req.body;
      console.log("Request body type:", typeof body);
      console.log("Request body:", body.toString());

      if (!SHOPIFY_WEBHOOK_SECRET) {
        console.error("SHOPIFY_WEBHOOK_SECRET is not set");
        return res.status(500).send("Webhook secret is not configured");
      }

      const hash = crypto
        .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
        .update(body)
        .digest("base64");

      console.log("Computed hash:", hash);
      console.log("Received hmac:", hmac);

      if (hash === hmac) {
        console.log("Webhook verified successfully");
        const order = JSON.parse(body.toString());
        console.log("New order received:", order);

        // Store the last order
        lastOrder = order;

        res.sendStatus(200);
      } else {
        console.error("Webhook verification failed");
        res.status(403).send("Webhook verification failed");
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

// Route to display the last received order
let lastOrder = null;
router.get("/last-order", (req, res) => {
  res.json(lastOrder || { message: "No orders received yet" });
});

module.exports = router;
