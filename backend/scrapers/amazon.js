const axios = require("axios");
const cheerio = require("cheerio");

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random User-Agent for requests
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Check product relevance
function isRelevantProduct(title, query) {
  const titleLower = title.toLowerCase();
  const queryLower = query.toLowerCase();

  const queryWords = queryLower.replace(/[0-9+\-_]/g, ' ').split(' ').filter(w => w.length > 2);
  const titleWords = titleLower.split(' ');

  let matchCount = 0;
  queryWords.forEach(word => {
    if (titleWords.some(tw => tw.includes(word) || word.includes(tw))) {
      matchCount++;
    }
  });

  const relevanceScore = matchCount / queryWords.length;

  const queryBrands = ['iphone', 'samsung', 'oneplus', 'xiaomi', 'oppo', 'vivo', 'realme', 'nokia'];
  const queryBrand = queryBrands.find(b => queryLower.includes(b));

  if (queryBrand) {
    const titleHasDifferentBrand = queryBrands.some(b => b !== queryBrand && titleLower.includes(b));
    if (titleHasDifferentBrand) return false;
  }

  const unwantedTerms = ['sponsored', 'advertisement', 'case for', 'cover for', 'screen guard', 'tempered glass'];
  if (unwantedTerms.some(term => titleLower.includes(term))) return false;

  return relevanceScore >= 0.8;
}

// Extract product info
function extractProductInfo($, $container) {
  let title = '';
  const titleSelectors = [
    'h2 a span', 'h2 span', '.s-size-mini span', '.s-color-base',
    'a .a-text-normal', '.a-link-normal .a-text-normal', 'h3 span'
  ];
  for (const sel of titleSelectors) {
    title = $container.find(sel).text().trim();
    if (title && title.length > 5) break;
  }

  let price = null;
  const priceSelectors = [
    '.a-price-whole', '.a-offscreen', '.a-price .a-offscreen',
    '.a-price-range .a-offscreen', '.s-price-instructions-style .a-offscreen'
  ];
  for (const sel of priceSelectors) {
    const priceText = $container.find(sel).first().text().trim();
    if (priceText) {
      const match = priceText.match(/[\d,]+/);
      if (match) {
        const priceNum = parseInt(match[0].replace(/,/g, ''));
        if (priceNum > 100 && priceNum < 1000000) {
          price = priceNum;
          break;
        }
      }
    }
  }

  let link = '';
  const linkSelectors = [
    'h2 a', '.s-link-style a', '.a-link-normal', 'a[href*="/dp/"]', 'a[href*="/gp/"]'
  ];
  for (const sel of linkSelectors) {
    const href = $container.find(sel).first().attr('href');
    if (href) {
      link = href.startsWith('http') ? href : 'https://www.amazon.in' + href;
      if (link.includes('/dp/') || link.includes('/gp/')) break;
    }
  }

  let image = $container.find('img').first().attr('src') || 
              $container.find('img').first().attr('data-src') || '';

  return { title, price, link, image };
}

// Main scraper
async function scrapeAmazon(query) {
  try {
    await sleep(1000 + Math.random() * 2000);

    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&ref=sr_pg_1`;
    const headers = {
      "User-Agent": getRandomUserAgent(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Referer": "https://www.amazon.in/"
    };

    const response = await axios.get(searchUrl, { headers, timeout: 30000 });
    if (response.status !== 200) return [];

    const $ = cheerio.load(response.data);
    const results = [];
    const processedProducts = new Set();

    // Strategy 1
    $('.s-result-item').each((_, el) => {
      if (results.length >= 25) return false;
      const $container = $(el);
      if ($container.find('[data-component-type="sp-sponsored-result"]').length > 0 ||
          $container.find('.s-sponsored-label-text').length > 0) return;
      
      const product = extractProductInfo($, $container);
      if (product.title && product.price && product.link && isRelevantProduct(product.title, query)) {
        const key = `${product.title.substring(0, 50)}_${product.price}`;
        if (!processedProducts.has(key)) {
          processedProducts.add(key);
          results.push({ ...product, platform: "Amazon", method: "s-result-item" });
        }
      }
    });

    // Strategy 2
    if (results.length < 5) {
      const alternativeSelectors = [
        '[data-component-type="s-search-result"]', '.s-result-list .s-result-item',
        '.s-main-slot .s-result-item', '[data-asin]'
      ];
      for (const sel of alternativeSelectors) {
        $(sel).each((_, el) => {
          if (results.length >= 20) return false;
          const $container = $(el);
          const asin = $container.attr('data-asin');
          if ($container.find('.s-sponsored-label-text').length > 0) return;
          
          const product = extractProductInfo($, $container);
          if (product.title && product.price && product.link && isRelevantProduct(product.title, query)) {
            const key = asin || `${product.title.substring(0, 50)}_${product.price}`;
            if (!processedProducts.has(key)) {
              processedProducts.add(key);
              results.push({ ...product, platform: "Amazon", method: sel });
            }
          }
        });
        if (results.length > 0) break;
      }
    }

    // Strategy 3
    if (results.length < 3) {
      $('div').each((_, el) => {
        if (results.length >= 15) return false;
        const $div = $(el);
        const text = $div.text();
        if (!text.includes('₹') && !$div.find('.a-price').length) return;
        if ($div.find('a[href*="/dp/"], a[href*="/gp/"]').length === 0) return;
        if (text.length < 50 || text.length > 1500) return;

        const product = extractProductInfo($, $div);
        if (product.title && product.price && product.link &&
            product.title.length > 8 && product.price > 500 && product.price < 1000000 &&
            isRelevantProduct(product.title, query)) {
          const key = `generic_${product.title.substring(0, 50)}_${product.price}`;
          if (!processedProducts.has(key)) {
            processedProducts.add(key);
            results.push({ ...product, platform: "Amazon", method: "generic" });
          }
        }
      });
    }

    // Filter + sort
    const filteredResults = results.filter(p => 
      isRelevantProduct(p.title, query) && p.price >= 100 && p.price <= 1000000
    );
    filteredResults.sort((a, b) => a.price - b.price);

    return filteredResults.slice(0, 20);
  } catch {
    return [];
  }
}

// Retry logic
async function searchAmazonWithRetry(query, maxAttempts = 2) {
  const queries = [ query, query.replace(/\+/g, ' '), query.toLowerCase(), query.replace(/\s+/g, '+')];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await scrapeAmazon(queries[attempt % queries.length]);
    if (results.length > 0) return results;
    await sleep(3000);
  }
  return [];
}

module.exports ={scrapeAmazon};

