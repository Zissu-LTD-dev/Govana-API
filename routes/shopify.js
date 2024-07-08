const express = require("express");
const Shopify = require("@shopify/shopify-api").Shopify;
const router = express.Router();

const { API_KEY, API_SECRET_KEY, SHOP, SCOPES } = process.env;

Shopify.Context.initialize({
  API_KEY,
  API_SECRET_KEY,
  SCOPES: [SCOPES],
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  IS_EMBEDDED_APP: false,
  API_VERSION: "2023-04", // use appropriate version
});

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

// Add more routes for other Shopify operations as needed

module.exports = router;
