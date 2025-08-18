const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",    
    "https://smart-pick-frontend.vercel.app" 
  ]
}));

app.use(express.json()); 
const searchRoute = require("./searchRoute/searchRoute");
app.use("/api/search", searchRoute);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

module.exports = app;
