const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');  // Import serverless-http for Vercel

const app = express();

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Your search route
const searchRoute = require('../searchRoute/searchRoute');
app.use('/api/search', searchRoute);

// Check if we're on Vercel or running locally
if (process.env.VERCEL === 'true') {
  // Vercel environment: export the app wrapped in serverless-http
  module.exports.handler = serverless(app);
} else {
  // Local environment: start a regular Express server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🔌 Server running on port ${PORT}`);
  });
}
