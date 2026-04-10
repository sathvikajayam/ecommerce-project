import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import "../styles/Products.css"; 
import "./CategoryShowcase.css";

const TopPicks = () => {
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopPicks = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("http://localhost:5000/api/homepage/top-picks");
        
        // Extract the populated active product details
        const products = data
          .map(item => item.product)
          .filter(Boolean); 

        setTopPicks(products);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch top picks:", err);
        setError("Failed to load top picks");
      } finally {
        setLoading(false);
      }
    };

    fetchTopPicks();
  }, []);

  if (loading || error || topPicks.length === 0) {
    return null;
  }

  return (
    <section className="category-showcase">
      <div className="showcase-container">
        <div className="showcase-header">
          <h2 className="showcase-title">Top Picks For You</h2>
        </div>
        <div className="top-picks-grid">
          {topPicks.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopPicks;
