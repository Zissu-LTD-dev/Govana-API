const express = require("express");
const Shopify = require("shopify-api-node");
const router = express.Router();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

let shopifyOrder = {};

console.log("Current working directory:", process.cwd());
const filePath = path.join(__dirname, "newOrderExmpl.json");

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SHOP,
  SCOPES,
  SHOPIFY_WEBHOOK_SECRET,
  ACCESS_TOKEN,
  MINISOFT_API_URL,
} = process.env;

// Initialize Shopify with shop name and access token
const shopify = new Shopify({
  shopName: SHOPIFY_SHOP.replace("https://", "").replace(".myshopify.com", ""),
  accessToken: "ACCESS_TOKEN",
});

// New route for getting all products
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
      console.log(`New order received: ${orderData.id}`);

      // Process the order
      processOrder(orderData);

      // Send order to Minisoft
      sendOrderToMinisoft(orderData);

      res.sendStatus(200);
    } catch (error) {
      console.error(`Error processing order data: ${error.message}`);
      res.status(400).send("Error processing order data");
    }
  } else {
    console.error("Webhook verification failed");
    res.status(403).send("Webhook verification failed");
  }
});

async function sendOrderToMinisoft(orderData) {
  try {
    console.log(`Sending order ${orderData.id} to Minisoft`);
    const response = await axios.post(
      "http://localhost:3000/minisoft/create-document",
      orderData
    );
    console.log(`Order ${orderData.id} sent to Minisoft successfully`);
  } catch (error) {
    console.error(
      `Failed to send order ${orderData.id} to Minisoft: ${error.message}`
    );
  }
}
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

// Load the Shopify order data from the JSON file
const loadOrderFromFile = () => {
  try {
    if (fs.existsSync(filePath)) {
      shopifyOrder = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      console.warn("newOrderExmpl.json file does not exist at path:", filePath);
      shopifyOrder = {};
    }
  } catch (error) {
    console.error("Error loading order from file:", error);
  }
};

const saveOrderToFile = (order) => {
  fs.writeFileSync(
    "newOrderExmpl.json",
    JSON.stringify(order, null, 2),
    "utf8"
  );
};

// Endpoint to receive Shopify order
router.post("/new-order", (req, res) => {
  shopifyOrder = req.body;
  saveOrderToFile(shopifyOrder);
  res.status(200).send("Order received");
});

function formatOrder(shopifyOrder) {
  return {
    orderId: shopifyOrder.id,
    createdAt: shopifyOrder.created_at,
    customer: {
      email: shopifyOrder.email || "N/A",
      phone: shopifyOrder.phone || "N/A",
      currency: shopifyOrder.currency,
      totalPrice: shopifyOrder.total_price,
    },
    items: shopifyOrder.line_items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  };
}

// Endpoint to get the last order details
router.get("/last-order", (req, res) => {
  loadOrderFromFile();

  if (Object.keys(shopifyOrder).length === 0) {
    return res.status(404).send("No order found");
  }

  const formattedOrder = formatOrder(shopifyOrder);
  res.render("orderDetails", { order: formattedOrder });
});

// Endpoint to send the order to Minisoft API
router.post("/send-order", async (req, res) => {
  loadOrderFromFile();

  const createRecipePayload = (order) => {
    return {
      Company: "Minisoft",
      GroupName: "Test API",
      DocumentName: "Test",
      DocumentDate: order["created_at"],
      Currency: order["currency"],
      TotalAmount: order["total_price"],
      Details: order["line_items"].map((item) => ({
        ItemCode: item["product_id"],
        ItemDescription: item["name"],
        Quantity: item["quantity"],
        UnitPrice: item["price"],
      })),
    };
  };

  const payload = createRecipePayload(shopifyOrder);

  const apiUrl = `${MINISOFT_API_URL}/DocumentRest/CreateDocument`;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error sending order to API:", error);
    res.status(500).send("Error sending order to API");
  }
});

module.exports = router;
