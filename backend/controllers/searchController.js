const { scrapeAmazon } = require('../scrapers/amazon');
const { scrapeFlipkart } = require('../scrapers/flipcart');

const searchProducts = async (req, res) => {
  try {
    const { query, q } = req.query;
    const searchQuery = query || q;
    if (!searchQuery) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const allResults = [];
    const scrapePromises = [];
    const scrapeResults = {
      amazon: { count: 0, success: false },
      flipkart: { count: 0, success: false }
    };
    
    scrapePromises.push(
      scrapeAmazon(searchQuery)
        .then(results => {
          scrapeResults.amazon = { count: results.length, success: true };
          allResults.push(...results);
        })
        .catch(error => {
          scrapeResults.amazon = { count: 0, success: false, error: error.message };
        })
    );

    scrapePromises.push(
      scrapeFlipkart(searchQuery)
        .then(results => {
          scrapeResults.flipkart = { count: results.length, success: true };
          allResults.push(...results);
        })
        .catch(error => {
          scrapeResults.flipkart = { count: 0, success: false, error: error.message };
        })
    );

    await Promise.allSettled(scrapePromises);

    const uniqueResults = removeDuplicates(allResults);

    const sortedResults = uniqueResults.sort((a, b) => (a.price || 0) - (b.price || 0));

    res.json({
      success: true,
      query: searchQuery,
      totalResults: sortedResults.length,
      results: sortedResults.slice(0, 50),
      platforms: {
        amazon: scrapeResults.amazon.count,
        flipkart: scrapeResults.flipkart.count
      },
      scrapeStatus: scrapeResults
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

function removeDuplicates(products) {
  const seen = new Set();

  return products.filter(product => {
    const normalizedTitle = product.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50);

    const key = `${normalizedTitle}-${Math.round(product.price || 0)}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

module.exports = { searchProducts };
