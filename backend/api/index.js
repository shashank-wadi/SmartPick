const express = require("express");
const cors = require("cors");
const searchRoute = require("../searchRoute/searchRoute");

const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://smart-pick-frontend.vercel.app"
  ]
}));

app.use(express.json());

// ✅ API routes
app.use("/api/search", searchRoute);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("✅ SmartPick backend is running on Vercel!");
});

// ❌ Wrong for Vercel: module.exports = app;
// ✅ Correct: Export handler function
module.exports = (req, res) => {
  app(req, res);
};
