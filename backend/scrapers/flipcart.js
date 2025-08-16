const axios = require("axios");
const cheerio = require("cheerio");

// Simple sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get random user agent
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Enhanced product extraction function
function extractProductInfo($, $container) {
  let title = '';
  const titleSelectors = [
    'a[title]', '._4rR01T', '.s1Q9rz', '._2WkVRV', '.KzDlHZ',
    '._2B_pmu', '.IRpwTa', '._1fQZEK', 'h3', 'h4', 'h2',
    'a[href*="/p/"]', 'a[href*="/dp/"]'
  ];

  for (const selector of titleSelectors) {
    const element = $container.find(selector).first();
    title = element.attr('title') || element.text().trim();
    if (title && title.length > 5) break;
  }

  if (!title) {
    const allLinks = $container.find('a');
    allLinks.each((i, link) => {
      const linkText = $(link).text().trim();
      const linkTitle = $(link).attr('title');
      if (linkTitle && linkTitle.length > 10) {
        title = linkTitle;
        return false;
      } else if (linkText && linkText.length > 10 && linkText.length < 200) {
        title = linkText;
        return false;
      }
    });
  }

  let price = null;
  const priceSelectors = [
    '._30jeq3', '._1_WHN1', '._3tbHP2', '._25b18c',
    '._30jeq3._1_WHN1', '._3I9_wc._27UcVY', '._1_WHN1._30jeq3'
  ];

  for (const selector of priceSelectors) {
    const priceText = $container.find(selector).text().trim();
    if (priceText.includes('₹')) {
      const match = priceText.match(/₹([\d,]+)/);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }
  }

  if (!price) {
    const priceMatches = $container.text().match(/₹([\d,]+)/g);
    if (priceMatches) {
      for (const match of priceMatches) {
        const p = parseInt(match.replace(/₹|,/g, ''));
        if (p > 500 && p < 1000000) {
          price = p;
          break;
        }
      }
    }
  }

  let link = '';
  const linkSelectors = [
    'a[href*="/p/"]', 'a[href*="/dp/"]', 'a._1fQZEK', 'a.s1Q9rz', 'a._2rpwqI'
  ];

  for (const selector of linkSelectors) {
    link = $container.find(selector).first().attr('href');
    if (link) break;
  }

  if (!link) link = $container.find('a').first().attr('href');
  if (link && !link.startsWith('http')) link = 'https://www.flipkart.com' + link;

  let image = $container.find('img').first().attr('src') || 
             $container.find('img').first().attr('data-src') || '';

  return { title, price, link, image };
}

// Main scraper function
async function scrapeFlipkart(query) {
  try {
    await sleep(1000 + Math.random() * 2000);
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    const headers = {
      "User-Agent": getRandomUserAgent(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": "https://www.flipkart.com/"
    };

    const response = await axios.get(searchUrl, { headers, timeout: 30000, maxRedirects: 5 });
    if (response.status !== 200) return [];

    const $ = cheerio.load(response.data);
    const results = [];
    const processedContainers = new Set();

    // Strategy 1: data-id containers
    $('[data-id]').each((_, el) => {
      if (results.length >= 25) return false;
      const $container = $(el);
      const dataId = $container.attr('data-id');
      if (processedContainers.has(dataId)) return;
      processedContainers.add(dataId);

      const product = extractProductInfo($, $container);
      if (product.title && product.price && product.link &&
          product.title.length > 5 && product.price > 100 && product.price < 1000000) {
        results.push({ ...product, platform: "Flipkart", method: "data-id" });
      }
    });

    // Strategy 2: common container classes
    if (results.length < 5) {
      const containerClasses = ['._1AtVbE', '._13oc-S', '._2kHMtA', '._1YokD2', '.col-7-12', '._3O0U0u', '._1UoZlX', '._25b18c'];
      for (const containerClass of containerClasses) {
        $(containerClass).each((_, el) => {
          if (results.length >= 25) return false;
          const $container = $(el);
          const product = extractProductInfo($, $container);
          if (product.title && product.price && product.link &&
              product.title.length > 5 && product.price > 100 && product.price < 1000000) {
            results.push({ ...product, platform: "Flipkart", method: containerClass });
          }
        });
        if (results.length > 0) break;
      }
    }

    // Strategy 3: brute force
    if (results.length < 3) {
      $('div').each((_, el) => {
        if (results.length >= 20) return false;
        const $div = $(el);
        const text = $div.text();
        if (!text.includes('₹') || text.length < 50 || text.length > 2000) return;
        if ($div.find('a[href*="/p/"], a[href*="/dp/"]').length === 0) return;

        const product = extractProductInfo($, $div);
        if (product.title && product.price && product.link &&
            product.title.length > 8 && product.price > 500 && product.price < 1000000 &&
            !product.title.toLowerCase().includes('see all') &&
            !product.title.toLowerCase().includes('more options')) {
          results.push({ ...product, platform: "Flipkart", method: "brute-force" });
        }
      });
    }

    // Deduplicate and sort
    const uniqueResults = [];
    const seenProducts = new Set();
    results.forEach(item => {
      const titleWords = item.title.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(w => w.length > 2).slice(0, 4).sort().join('_');
      const priceRange = Math.floor(item.price / 5000) * 5000;
      const uniqueKey = `${titleWords}_${priceRange}`;
      if (!seenProducts.has(uniqueKey)) {
        seenProducts.add(uniqueKey);
        uniqueResults.push(item);
      }
    });

    uniqueResults.sort((a, b) => a.price - b.price);
    return uniqueResults.slice(0, 20);

  } catch (err) {
    return [];
  }
}

// Retry search
async function searchFlipkartWithRetry(query, maxAttempts = 2) {
  const queries = [query, query.replace(/\+/g, ' '), query.toLowerCase(), query.replace(/\s+/g, '+')];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await scrapeFlipkart(queries[attempt % queries.length]);
    if (results.length > 0) return results;
    await sleep(3000);
  }
  return [];
}

module.exports= {scrapeFlipkart};
