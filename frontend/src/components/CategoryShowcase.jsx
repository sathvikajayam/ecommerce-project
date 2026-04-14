import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as publicCategoryService from "../service/publicCategoryService";
import "./CategoryShowcase.css";

/**
 * CategoryShowcase Component
 * Displays a single line of categories with an "Explore More" button
 * Reuses the same category display logic from AllCategories but in a compact format
 */
const CategoryShowcase = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const [allCategoriesData, layoutData] = await Promise.all([
          publicCategoryService.getAllCategories(),
          publicCategoryService.getHomepageCategories()
        ]);

        // Map layout slots to full category objects
        const featuredCategories = layoutData
          .filter(slot => slot.categoryName)
          .map(slot => allCategoriesData.find(cat => cat.name === slot.categoryName))
          .filter(Boolean); // Remove any that couldn't be matched

        setCategories(featuredCategories);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    // Navigate to search page with category selected
    navigate(`/search?category=${encodeURIComponent(category.name)}`);
  };
  const handleExploreMore = () => {
    navigate("/categories");
  };

  if (loading || error) {
    return null;
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="category-showcase">
      <div className="showcase-container">
        <div className="showcase-header">
          <h2 className="showcase-title">Shop by Category</h2>
          <button className="explore-more-btn" onClick={handleExploreMore}>
            Explore More
          </button>
        </div>

        <div className="category-showcase-line">
          {categories.map((category) => (
            <div
              key={category._id}
              className="showcase-category-item"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="showcase-category-wrapper">
                <img
                  src={category.image || "https://via.placeholder.com/150?text=Category"}
                  alt={category.name}
                  className="showcase-category-image"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150?text=" + encodeURIComponent(category.name);
                  }}
                />
                <div className="showcase-category-overlay">
                  <button className="view-btn">View Products</button>
                </div>
              </div>
              <p className="showcase-category-name">
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
