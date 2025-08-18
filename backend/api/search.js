const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: [
    "http://localhost:5173",    
    "https://smart-pick-frontend.vercel.app" 
  ]
}));

app.use(express.json());

// ✅ Routes
const searchRoute = require("./searchRoute/searchRoute");
app.use("/api/search", searchRoute);

// ✅ Root route (optional, for testing)
app.get("/", (req, res) => {
  res.send("✅ SmartPick backend is running!");
});

// ✅ Run locally only
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

// ✅ Export for Vercel serverless
module.exports = app;
