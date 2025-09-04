const axios = require("axios");
const cheerio = require("cheerio");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// random user 
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

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
    $container.find('a').each((i, link) => {
      const linkText = $(link).text().trim();
      const linkTitle = $(link).attr('title');
      if (linkTitle && linkTitle.length > 10) { title = linkTitle; return false; }
      if (linkText && linkText.length > 10 && linkText.length < 200) { title = linkText; return false; }
    });
  }
  let price = null;

  const priceSelectors = [
    '._30jeq3._1_WHN1', 
    '._30jeq3', 
    '._1_WHN1', 
    '._25b18c ._30jeq3', 
    '._25b18c span', 
    '.Nx9bqj._30jeq3', 
    '._4b5DiR',
    '._1vC4OE._30jeq3',
    '[data-testid="price-current"]', 
  ];

  for (const selector of priceSelectors) {
    const priceElement = $container.find(selector).first();
    if (priceElement.length) {
      const priceText = priceElement.text().trim();
      const priceMatch = priceText.match(/^₹([\d,]+)$/);
      if (priceMatch) {
        const extractedPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        if (extractedPrice >= 50 && extractedPrice <= 500000) {
          price = extractedPrice;
          break;
        }
      }
    }
  }
  if (!price) {
    const cleanPriceElements = $container.find('span, div').filter(function() {
      const text = $(this).text().trim();
      return /^₹[\d,]+$/.test(text);
    });

    const validPrices = [];
    cleanPriceElements.each((i, el) => {
      const text = $(el).text().trim();
      const cleanPrice = parseInt(text.replace(/₹|,/g, ''), 10);
      
      if (cleanPrice >= 50 && cleanPrice <= 500000 && 
          !isLikelyFalsePositive(cleanPrice)) {
        validPrices.push(cleanPrice);
      }
    });

    if (validPrices.length > 0) {
      validPrices.sort((a, b) => a - b);
      price = findMostReasonablePrice(validPrices, title);
    }
  }
  if (!price) {
    const specialPriceElement = $container.find('*:contains("Special price")').next();
    if (specialPriceElement.length) {
      const priceText = specialPriceElement.text().trim();
      const priceMatch = priceText.match(/₹([\d,]+)/);
      if (priceMatch) {
        const extractedPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        if (extractedPrice >= 50 && extractedPrice <= 500000) {
          price = extractedPrice;
        }
      }
    }
    if (!price) {
      const discountElements = $container.find('*:contains("% off"), *:contains("off")');
      discountElements.each((i, el) => {
        if (price) return false;
        const $parent = $(el).parent();
        const priceElement = $parent.find('span, div').filter(function() {
          return /^₹[\d,]+$/.test($(this).text().trim());
        }).first();
        
        if (priceElement.length) {
          const extractedPrice = parseInt(priceElement.text().replace(/₹|,/g, ''), 10);
          if (extractedPrice >= 50 && extractedPrice <= 500000) {
            price = extractedPrice;
            return false;
          }
        }
      });
    }
  }
  if (!price) {
    const containerText = $container.text();
    const allPriceMatches = containerText.match(/₹([\d,]+)/g);
    
    if (allPriceMatches) {
      const validPrices = allPriceMatches
        .map(match => parseInt(match.replace(/₹|,/g, ''), 10))
        .filter(p => {
          return p >= 50 && p <= 500000 && !isLikelyFalsePositive(p);
        });

      if (validPrices.length > 0) {
        const sorted = validPrices.sort((a, b) => a - b);
        const minReasonable = sorted[0];
        const filtered = sorted.filter(p => p <= minReasonable * 10);
        
        if (filtered.length > 0) {
          price = findMostReasonablePrice(filtered, title);
        }
      }
    }
  }
  function isLikelyFalsePositive(price) {
    const falsePositives = [
      190076, 
      ...Array.from({length: 100}, (_, i) => i + 1), 
      999, 1000, 1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 9999,
      10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95
    ];
    if (falsePositives.includes(price)) return true;
    if (price > 100000 && price.toString().length >= 6) return true;
    if (price % 10000 === 0 && price > 50000) return true;
    
    return false;
  }
  function findMostReasonablePrice(prices, title) {
    if (prices.length === 1) return prices[0];
    
    const sorted = prices.sort((a, b) => a - b);
    const titleLower = title.toLowerCase();
    
  
    if (titleLower.includes('iphone') || titleLower.includes('macbook') || 
        titleLower.includes('laptop') || titleLower.includes('tv')) {
      return sorted.find(p => p >= 5000) || sorted[0];
    }
    
     if (titleLower.includes('keyboard') || titleLower.includes('mouse') || 
        titleLower.includes('cable') || titleLower.includes('case') ||
        titleLower.includes('charger') || titleLower.includes('adapter')) {
      return sorted.find(p => p <= 5000) || sorted[0];
    }
    
    return sorted[0];
  }

   if (price && (price < 10 || price > 1000000 || isLikelyFalsePositive(price))) {
    price = null;
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
    console.error("Scraping error:", err.message);
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

module.exports = { scrapeFlipkart, searchFlipkartWithRetry };