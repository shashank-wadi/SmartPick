const express = require("express");
const cors = require("cors");

const searchRoutes = require("./searchRoute/searchRoute");

const app = express();
const allowedOrigins = [
  "http://localhost:5173", 
  "https://smartpick-two.vercel.app", 
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());


app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.send("Backend is working");
});

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}
