const Shopify = require("shopify-api-node");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SHOP,
  SCOPES,
  SHOPIFY_WEBHOOK_SECRET,
  ACCESS_TOKEN,
  MINISOFT_API_URL,
} = process.env;

const shopify = new Shopify({
  shopName: SHOPIFY_SHOP.replace("https://", "").replace(".myshopify.com", ""),
  accessToken: ACCESS_TOKEN,
});

const filePath = path.join(__dirname, "newOrderExmpl.json");

function verifyWebhook(hmac, body) {
  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest("base64");
  return hash === hmac;
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
  // Implement logic to update Minisoft POS here
}

function loadOrderFromFile() {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    console.warn("newOrderExmpl.json file does not exist at path:", filePath);
    return {};
  } catch (error) {
    console.error("Error loading order from file:", error);
    return {};
  }
}

function saveOrderToFile(order) {
  fs.writeFileSync(filePath, JSON.stringify(order, null, 2), "utf8");
}

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

function createRecipePayload(order) {
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
}

module.exports = {
  shopify,
  verifyWebhook,
  processOrder,
  loadOrderFromFile,
  saveOrderToFile,
  formatOrder,
  createRecipePayload,
};
