require("dotenv").config();
const express = require("express");
const cors = require("cors");
const minisoftRoutes = require("./routes/minisoft");
const shopifyRoutes = require("./routes/shopify");

const app = express();
app.use(cors());

app.use(
  "/shopify/webhooks/order/create",
  express.raw({ type: "application/json" })
);

app.use(express.json());

app.use("/minisoft", minisoftRoutes);
app.use("/shopify", shopifyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
