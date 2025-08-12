// searchRoute/searchRoute.js
const express = require('express');
const router = express.Router();
const { searchProducts } = require('../controllers/searchController');

// GET /api/search?q=your-query
router.get('/', searchProducts);

module.exports = router;