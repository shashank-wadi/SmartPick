const express = require('express');
const cors = require('cors');
const app = express();


app.use(express.json());
app.use(cors());

const searchRoute = require('./searchRoute/searchRoute');

// Use the product search route at /api/search
app.use('/api/search', searchRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔌 Server running on port ${PORT}`);
});
