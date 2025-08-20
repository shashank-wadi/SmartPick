// backend/server.js
const express = require("express");
const cors = require("cors");

// Import routes
const searchRoute = require("./api/searchRoute"); 

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",          // local frontend
    "https://smart-pick-frontend.vercel.app"  // deployed frontend
  ]
}));
app.use(express.json());

// Routes
app.use("/api/search", searchRoute);

// Root route (for testing deployment)
app.get("/", (req, res) => {
  res.send("✅ SmartPick backend is running!");
});

// Export for Vercel
module.exports = app;
