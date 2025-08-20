// backend/api/index.js
const express = require("express");
const cors = require("cors");
const searchRoute = require("../searchRoute/searchRoute");

const app = express();

// ✅ Enable CORS for frontend URLs
app.use(cors({
  origin: [
    "http://localhost:5173",    
    "https://smart-pick-frontend.vercel.app"
  ]
}));

app.use(express.json());

// ✅ API routes
app.use("/api/search", searchRoute);

// ✅ Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ SmartPick backend is running on Vercel!");
});

// ✅ Export as Vercel serverless function
module.exports = app;
