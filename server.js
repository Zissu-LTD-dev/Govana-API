require("dotenv").config();
const express = require("express");
const cors = require("cors");
const minisoftRoutes = require("./routes/minisoft");

const app = express();
app.use(cors());
app.use(express.json());

// Log environment variables for debugging
// console.log("MINISOFT_API_URL:", process.env.MINISOFT_API_URL);
// console.log("MINISOFT_USERNAME:", process.env.MINISOFT_USERNAME);
// console.log(
//   "MINISOFT_PASSWORD:",
//   process.env.MINISOFT_PASSWORD ? "Set" : "Not set"
// );

app.use("/minisoft", minisoftRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
