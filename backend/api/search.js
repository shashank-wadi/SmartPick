const express = require("express");
const cors = require("cors");
const searchRoute = require("../searchRoute/searchRoute");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://smart-pick-frontend.vercel.app"
  ]
}));

app.use(express.json());
app.use("/api/search", searchRoute);

// Export for Vercel serverless
module.exports = app;
