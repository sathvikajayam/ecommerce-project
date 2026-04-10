import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as publicCategoryService from "../service/publicCategoryService";
import "./HeroGrid.css";

const HeroGrid = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await publicCategoryService.getAllCategories();
        // Limit to 4 or 8 for the grid
        setCategories(data.slice(0, 8));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <div className="hero-grid-container">
      <div className="hero-grid">
        {categories.map((category) => (
          <div 
            key={category._id} 
            className="hero-grid-card"
            onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
          >
            <h3>{category.name}</h3>
            <div className="card-image-wrapper">
              <img 
                src={category.image || "https://via.placeholder.com/300?text=Category"} 
                alt={category.name} 
              />
            </div>
            <span className="card-link">See more</span>
          </div>
        ))}
        
        {/* Placeholder for specific Amazon-style deals if needed */}
        <div className="hero-grid-card sign-in-card">
          <h3>Sign in for the best experience</h3>
          <button className="amazon-btn" onClick={() => navigate("/login")}>Sign in securely</button>
        </div>
      </div>
    </div>
  );
};

export default HeroGrid;
