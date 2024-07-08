const express = require("express");
const axios = require("axios");
const https = require("https");
const router = express.Router();

// Create axios instance for Minisoft API
const minisoftApi = axios.create({
  baseURL: process.env.MINISOFT_API_URL,
  auth: {
    username: process.env.MINISOFT_USERNAME,
    password: process.env.MINISOFT_PASSWORD,
  },
  headers: {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

// Test route for ItemsIndex
router.get("/test-accounts", async (req, res) => {
  try {
    const fullUrl = "/ItemsIndex";
    console.log("Requesting URL:", `${minisoftApi.defaults.baseURL}${fullUrl}`);

    const response = await minisoftApi.get(fullUrl);

    // Set response headers for proper JSON display in browser
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");

    // Send the JSON response
    res.send(
      JSON.stringify(
        {
          status: response.status,
          headers: response.headers,
          data: response.data,
        },
        null,
        2
      )
    );
  } catch (error) {
    handleError(error, res);
  }
});

router.get("/inventory", async (req, res) => {
  try {
    const params = {
      includeOrderOpen: false,
      onlyItemManageInventory: true,
      warehouse: 0,
    };

    const fullUrl = `/Inventory`;
    console.log("Requesting URL:", `${minisoftApi.defaults.baseURL}${fullUrl}`);
    console.log("Request params:", params);

    const response = await minisoftApi.get(fullUrl, { params });

    // Set response headers for proper JSON display in browser
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");

    // Send the JSON response
    res.send(
      JSON.stringify(
        {
          status: response.status,
          headers: response.headers,
          data: response.data,
        },
        null,
        2
      )
    );
  } catch (error) {
    handleError(error, res);
  }
});

// Error handling function
function handleError(error, res) {
  console.error("Error:", error.message);
  if (error.response) {
    console.error("Response status:", error.response.status);
    console.error("Response headers:", error.response.headers);
    console.error("Response data:", error.response.data);
  } else if (error.request) {
    console.error("No response received");
  } else {
    console.error("Error details:", error);
  }

  // Set response headers for proper JSON display in browser
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache");

  // Send the error response
  res.status(error.response ? error.response.status : 500).send(
    JSON.stringify(
      {
        error: error.message,
        details: error.response ? error.response.data : null,
        requestUrl: error.config ? error.config.url : null,
      },
      null,
      2
    )
  );
}

module.exports = router;
