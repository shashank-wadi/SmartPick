const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Example route
app.get("/api/search", (req, res) => {
  const { q } = req.query;
  res.json({ message: `You searched for ${q}` });
});
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
