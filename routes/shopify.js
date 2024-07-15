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

router.post("/webhooks/order/create", (req, res) => {
  console.log("Received webhook");

  const hmac = req.get("X-Shopify-Hmac-Sha256");
  console.log("Received HMAC:", hmac);

  const body = req.body;
  console.log("Body type:", typeof body);
  console.log("Is body a buffer?", Buffer.isBuffer(body));
  console.log("Body length:", body.length);

  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error("SHOPIFY_WEBHOOK_SECRET is not set");
    return res.status(500).send("Webhook secret is not configured");
  }

  console.log("SHOPIFY_WEBHOOK_SECRET length:", SHOPIFY_WEBHOOK_SECRET.length);

  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest("base64");

  console.log("Calculated HMAC:", hash);

  if (hash === hmac) {
    console.log("Webhook verified successfully");

    try {
      const orderData = JSON.parse(body.toString());
      console.log("New order received:", orderData.id);

      // Process the order
      processOrder(orderData);

      res.sendStatus(200);
    } catch (error) {
      console.error("Error parsing order data:", error);
      res.status(400).send("Error parsing order data");
    }
  } else {
    console.error("Webhook verification failed");
    res.status(403).send("Webhook verification failed");
  }
});

function processOrder(order) {
  console.log(`Processing order ${order.id}:`);
  console.log(`- Order number: ${order.order_number}`);
  console.log(`- Total price: ${order.total_price} ${order.currency}`);
  console.log(`- Line items:`);
  order.line_items.forEach((item, index) => {
    console.log(
      `  ${index + 1}. ${item.name} (${item.quantity} x ${item.price})`
    );
  });

  // Here you would implement the logic to update Minisoft POS
  // For example:
  // updateMinisoftInventory(order.line_items);
}

// Route to display the last received order
let lastOrder = null;
router.get("/last-order", (req, res) => {
  res.json(lastOrder || { message: "No orders received yet" });
});

module.exports = router;
