const { searchProducts } = require("../controllers/searchController");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    return searchProducts(req, res);
  }

  res.status(405).json({ error: "Method not allowed" });
};
