const express = require("express");
const cors = require("cors");

const searchRoutes = require("./searchRoute/searchRoute"); // ✅ import your route

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use your real route instead of dummy
app.use("/api/search", searchRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀 Use /api/search");
});

// ✅ Export for Vercel
module.exports = app;

// ✅ Local run only
if (process.env.NODE_ENV !== "production") {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}
