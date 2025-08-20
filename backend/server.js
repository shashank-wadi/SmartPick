const express = require("express");
const cors = require("cors");
const searchRoutes = require("../searchRoute/searchRoute"); // import your route

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use real search route
app.use("/api/search", searchRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀 Use /api/search");
});

// ✅ Export Express app for Vercel
module.exports = app;

// ✅ Only run app.listen locally
if (process.env.NODE_ENV !== "production") {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}
