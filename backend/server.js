const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http'); // Import serverless-http
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import your searchRoute (assuming it's in ./searchRoute/searchRoute.js)
const searchRoute = require('./searchRoute/searchRoute');

// ✅ Health check route for "/"
app.get('/', (req, res) => {
  res.send('✅ SmartPick Backend is running');
});

// Use the product search route at /api/search
app.use('/api/search', searchRoute);

// Wrap the app with serverless-http
module.exports.handler = serverless(app); // Export the serverless handler for Vercel
