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

// Debug function to save HTML for inspection
function debugHTML($, query) {
  console.log("\n=== DEBUG INFO ===");
  console.log(`Total divs found: ${$('div').length}`);
  console.log(`Divs with data-id: ${$('[data-id]').length}`);
  console.log(`Links found: ${$('a').length}`);
  console.log(`Price elements (₹): ${$('*:contains("₹")').length}`);
  
  // Look for common container patterns
  const containerSelectors = [
    '[data-id]',
    '._1AtVbE', 
    '._13oc-S',
    '.col-7-12',
    '._2kHMtA',
    '._1YokD2',
    '._3O0U0u'
  ];
  
  containerSelectors.forEach(sel => {
    const count = $(sel).length;
    if (count > 0) {
      console.log(`${sel}: ${count} elements`);
    }
  });
  
  console.log("==================\n");
}

// Enhanced product extraction function
function extractProductInfo($, $container, index) {
  // Get all text content for debugging
  const containerText = $container.text();
  
  // Try multiple title extraction methods
  let title = '';
  const titleSelectors = [
    'a[title]', // Links with title attribute
    '._4rR01T', // Common title class
    '.s1Q9rz',  // Another title class
    '._2WkVRV', // Product name class
    '.KzDlHZ',  // Title variant
    '._2B_pmu', // Product title
    '.IRpwTa',  // Link text
    '._1fQZEK', // Product link
    'h3', 'h4', 'h2', // Header tags
    'a[href*="/p/"]', // Product page links
    'a[href*="/dp/"]'  // Alternative product links
  ];
  
  for (const selector of titleSelectors) {
    const element = $container.find(selector).first();
    title = element.attr('title') || element.text().trim();
    if (title && title.length > 5) {
      console.log(`Title found with ${selector}: ${title.substring(0, 50)}...`);
      break;
    }
  }
  
  // If no title found, try parent/child elements
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
  
  // Extract price with multiple methods
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
        console.log(`Price found with ${selector}: ₹${price}`);
        break;
      }
    }
  }
  
  // If no price found with selectors, search in container text
  if (!price) {
    const priceMatches = containerText.match(/₹([\d,]+)/g);
    if (priceMatches) {
      for (const match of priceMatches) {
        const p = parseInt(match.replace(/₹|,/g, ''));
        if (p > 500 && p < 1000000) {
          price = p;
          console.log(`Price found in text: ₹${price}`);
          break;
        }
      }
    }
  }
  
  // Extract link
  let link = '';
  const linkSelectors = [
    'a[href*="/p/"]',
    'a[href*="/dp/"]', 
    'a._1fQZEK',
    'a.s1Q9rz',
    'a._2rpwqI'
  ];
  
  for (const selector of linkSelectors) {
    link = $container.find(selector).first().attr('href');
    if (link) {
      console.log(`Link found with ${selector}: ${link.substring(0, 50)}...`);
      break;
    }
  }
  
  if (!link) {
    link = $container.find('a').first().attr('href');
  }
  
  if (link && !link.startsWith('http')) {
    link = 'https://www.flipkart.com' + link;
  }
  
  // Extract image
  let image = $container.find('img').first().attr('src') || 
             $container.find('img').first().attr('data-src') || '';
  
  return { title, price, link, image };
}

// Main scraper function
async function scrapeFlipkart(query) {
  try {
    console.log(`Starting Flipkart scrape for: ${query}`);
    
    await sleep(1000 + Math.random() * 2000);
    
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    console.log(`Fetching: ${searchUrl}`);
    
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

    const response = await axios.get(searchUrl, { 
      headers,
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    console.log(`Response status: ${response.status}`);

    if (response.status === 429) {
      console.log("Rate limited (429). Waiting...");
      await sleep(30000);
      throw new Error("Rate limited");
    }

    if (response.status !== 200) {
      console.log(`Flipkart returned status: ${response.status}`);
      return [];
    }
    
    const $ = cheerio.load(response.data);
    
    // Debug the HTML structure
    debugHTML($, query);
    
    const results = [];
    const processedContainers = new Set();

    console.log("Starting product extraction...");

    // Strategy 1: Look for data-id containers (most common)
    console.log("\n=== Strategy 1: data-id containers ===");
    $('[data-id]').each((index, element) => {
      if (results.length >= 25) return false;
      
      const $container = $(element);
      const dataId = $container.attr('data-id');
      
      if (processedContainers.has(dataId)) return;
      processedContainers.add(dataId);
      
      console.log(`\nProcessing container ${index + 1} with data-id: ${dataId}`);
      
      const product = extractProductInfo($, $container, index);
      
      if (product.title && product.price && product.link && 
          product.title.length > 5 && product.price > 100 && product.price < 1000000) {
        
        results.push({
          title: product.title.substring(0, 150).trim(),
          price: product.price,
          link: product.link,
          image: product.image,
          platform: "Flipkart",
          method: "data-id"
        });
        
        console.log(`✓ Added: ${product.title.substring(0, 60)}... - ₹${product.price}`);
      } else {
        console.log(`✗ Skipped: title=${!!product.title}, price=${!!product.price}, link=${!!product.link}`);
      }
    });

    // Strategy 2: Look for common container classes
    if (results.length < 5) {
      console.log("\n=== Strategy 2: Container classes ===");
      const containerClasses = [
        '._1AtVbE', '._13oc-S', '._2kHMtA', '._1YokD2', 
        '.col-7-12', '._3O0U0u', '._1UoZlX', '._25b18c'
      ];
      
      for (const containerClass of containerClasses) {
        console.log(`\nTrying container class: ${containerClass}`);
        
        $(containerClass).each((index, element) => {
          if (results.length >= 25) return false;
          
          const $container = $(element);
          const containerHtml = $container.html();
          const containerId = containerHtml ? containerHtml.substring(0, 100) : `idx_${index}`;
          
          if (processedContainers.has(containerId)) return;
          processedContainers.add(containerId);
          
          const product = extractProductInfo($, $container, index);
          
          if (product.title && product.price && product.link && 
              product.title.length > 5 && product.price > 100 && product.price < 1000000) {
            
            results.push({
              title: product.title.substring(0, 150).trim(),
              price: product.price,
              link: product.link,
              image: product.image,
              platform: "Flipkart",
              method: containerClass
            });
            
            console.log(`✓ Added: ${product.title.substring(0, 60)}... - ₹${product.price}`);
          }
        });
        
        if (results.length > 0) {
          console.log(`Found ${results.length} products with ${containerClass}`);
          break;
        }
      }
    }

    // Strategy 3: Brute force - look for any div containing product info
    if (results.length < 3) {
      console.log("\n=== Strategy 3: Brute force search ===");
      
      $('div').each((index, element) => {
        if (results.length >= 20) return false;
        
        const $div = $(element);
        const text = $div.text();
        
        // Must contain price
        if (!text.includes('₹')) return;
        
        // Must have reasonable amount of text (likely a product)
        if (text.length < 50 || text.length > 2000) return;
        
        // Must contain a product link
        const hasProductLink = $div.find('a[href*="/p/"], a[href*="/dp/"]').length > 0;
        if (!hasProductLink) return;
        
        const divHtml = $div.html();
        const divId = divHtml ? divHtml.substring(0, 100) : `brute_${index}`;
        
        if (processedContainers.has(divId)) return;
        processedContainers.add(divId);
        
        const product = extractProductInfo($, $div, index);
        
        if (product.title && product.price && product.link && 
            product.title.length > 8 && product.price > 500 && product.price < 1000000 &&
            !product.title.toLowerCase().includes('see all') &&
            !product.title.toLowerCase().includes('more options')) {
          
          results.push({
            title: product.title.substring(0, 150).trim(),
            price: product.price,
            link: product.link,
            image: product.image,
            platform: "Flipkart",
            method: "brute-force"
          });
          
          console.log(`✓ Brute force found: ${product.title.substring(0, 60)}... - ₹${product.price}`);
        }
      });
    }

    // Remove duplicates more intelligently
    console.log(`\nDeduplicating ${results.length} results...`);
    const uniqueResults = [];
    const seenProducts = new Set();
    
    results.forEach(item => {
      // Create a unique key based on title words and price
      const titleWords = item.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 2)
        .slice(0, 4)
        .sort()
        .join('_');
      
      const priceRange = Math.floor(item.price / 5000) * 5000;
      const uniqueKey = `${titleWords}_${priceRange}`;
      
      if (!seenProducts.has(uniqueKey)) {
        seenProducts.add(uniqueKey);
        uniqueResults.push(item);
      } else {
        console.log(`Duplicate removed: ${item.title.substring(0, 40)}...`);
      }
    });

    // Sort by price
    uniqueResults.sort((a, b) => a.price - b.price);

    console.log(`\nFinal unique results: ${uniqueResults.length}`);
    return uniqueResults.slice(0, 20);

  } catch (err) {
    console.error("Flipkart scraping failed:", err.message);
    return [];
  }
}

// Search with multiple query attempts
async function searchFlipkartWithRetry(query, maxAttempts = 2) {
  const queries = [
    query,
    query.replace(/\+/g, ' '),
    query.toLowerCase(),
    query.replace(/\s+/g, '+')
  ];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentQuery = queries[attempt % queries.length];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`ATTEMPT ${attempt + 1}: "${currentQuery}"`);
    console.log(`${'='.repeat(50)}`);
    
    try {
      const results = await scrapeFlipkart(currentQuery);
      
      if (results.length > 0) {
        console.log(`\n🎉 SUCCESS! Found ${results.length} products`);
        return results;
      }
      
      if (attempt < maxAttempts - 1) {
        console.log("No results, trying next query variation...");
        await sleep(3000);
      }
      
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxAttempts - 1) {
        await sleep(5000);
      }
    }
  }
  
  console.log("All attempts failed");
  return [];
}

// Export functions
module.exports = scrapeFlipkart;
module.exports.scrapeFlipkart = scrapeFlipkart;
module.exports.searchFlipkartWithRetry = searchFlipkartWithRetry;
module.exports.default = scrapeFlipkart;

// Test function
if (require.main === module) {
  const query = process.argv[2] || "iphone15+";
  console.log(`\n🔍 Testing scraper with query: "${query}"`);
  
  searchFlipkartWithRetry(query)
    .then(results => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📱 FINAL RESULTS: ${results.length} products found`);
      console.log(`${'='.repeat(80)}`);
      
      if (results.length === 0) {
        console.log("❌ No products found. This might be due to:");
        console.log("1. Flipkart's HTML structure has changed");
        console.log("2. Rate limiting or blocking");
        console.log("3. The search query returned no results");
        console.log("4. Network issues");
      } else {
        results.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.title}`);
          console.log(`   💰 Price: ₹${product.price.toLocaleString()}`);
          console.log(`   🔗 Link: ${product.link}`);
          console.log(`   📊 Method: ${product.method}`);
          if (product.image) {
            console.log(`   🖼️  Image: ${product.image.substring(0, 60)}...`);
          }
        });
      }
    })
    .catch(console.error);
}