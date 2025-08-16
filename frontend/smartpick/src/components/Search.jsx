import React, { useState } from "react";
import "./Search.css";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";


  const searchProducts = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Failed to fetch products. Please check your backend.");
    }

    setLoading(false);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            Smart<span className="logo-accent">Pick</span>
          </div>
          <nav className="nav">
            <a href="/" className="nav-link">
              Home
            </a>
            <a href="#how-it-works" className="nav-link">
              How It Works
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-gradient"></div>
        <div className="container">
          <div className="disclaimer-card">
            <div className="disclaimer-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            <div className="disclaimer-content">
              <h4>Academic Project Disclaimer</h4>
              <p>
                This is a non-commercial educational project. All product data
                is sourced from publicly available content. We don't collect
                user data or claim ownership of product information.
              </p>
            </div>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              Compare prices across platforms and
              <span className="gradient-text"> save money</span> on every
              purchase!
            </h1>
            <p className="hero-subtitle">
              Find the best deals on your favorite products from top e-commerce
              platforms in one place.
            </p>

            {/* Search Bar */}
            <div className="search-container">
              <div className="search-bar">
                <div className="search-icon">
                  <i className="fas fa-search"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search for any product..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchProducts();
                  }}
                  className="search-input"
                />
                <button onClick={searchProducts} className="search-button">
                  <span>Search</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              <p className="search-disclaimer">
                <i className="fas fa-shield-alt"></i>
                Prices from official sources. Clicking "View" redirects to
                Amazon, Flipkart, etc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {loading && (
        <section className="loading-section">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <h3>Finding the best deals for you...</h3>
              <p>Comparing prices across multiple platforms</p>
            </div>
          </div>
        </section>
      )}

      {!loading && results.length > 0 && (
        <section className="results-section">
          <div className="container">
            <div className="results-header">
              <h2>Found {results.length} products</h2>
              <p>Best deals from trusted platforms</p>
            </div>
            <div className="results-grid">
              {results.map((item, index) => (
                <div className="product-card" key={index}>
                  <div className="product-image">
                    <img
                      src={item.image}
                      alt={item.title}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/200x200/f0f0f0/666666?text=No+Image";
                      }}
                    />
                    <div className="platform-badge">
                      <i
                        className={`fab fa-${item.platform.toLowerCase()}`}
                      ></i>
                      {item.platform}
                    </div>
                  </div>
                  <div className="product-info">
                    <h4 className="product-title">{item.title}</h4>
                    <div className="product-price">
                      <span className="currency">₹</span>
                      <span className="amount">{item.price}</span>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="product-link"
                    >
                      <span>View on {item.platform}</span>
                      <i className="fas fa-external-link-alt"></i>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose SmartPick?</h2>
            <p>
              We help you make smarter purchasing decisions by comparing prices
              across multiple platforms.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-search-dollar"></i>
              </div>
              <h3>Price Comparison</h3>
              <p>
                Compare prices across multiple e-commerce platforms to find the
                best deals instantly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>Real-time Updates</h3>
              <p>
                Get the latest prices with our real-time price tracking and
                instant updates.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Shop Confidently</h3>
              <p>
                Navigate directly to trusted platforms like Amazon and Flipkart
                for official details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                Smart<span className="logo-accent">Pick</span>
              </div>
              <p>
                Compare prices across platforms and save money on every
                purchase.
              </p>
              <div className="social-links">
                <a href="" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="" className="social-link">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="" className="social-link">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="" className="social-link">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Quick Links</h4>
                <ul>
                  <li>
                    <a href="#">Home</a>
                  </li>
                  <li>
                    <a href="#how-it-works">How It Works</a>
                  </li>
                  <li>
                    <a href="mailto:techsandbox.dev@gmail.com">Contact Us</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; 2024 SmartPick. All rights reserved. Educational project
              only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Search;
