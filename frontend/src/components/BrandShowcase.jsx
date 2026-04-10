import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as publicBrandService from "../service/publicBrandService";
import "./BrandShowcase.css";

/**
 * BrandShowcase Component
 * Displays a grid of featured brands
 */
const BrandShowcase = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const layoutData = await publicBrandService.getHomepageBrands();
        // Extract brands from slots and filter out slots without a brand
        const featuredBrands = layoutData
          .filter(item => item.brand)
          .map(item => item.brand);
        
        setBrands(featuredBrands);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
        setError("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandClick = (brand) => {
    // Navigate to search page with brand selected
    navigate(`/search?brand=${encodeURIComponent(brand.name)}`);
  };

  const handleExploreMore = () => {
    navigate("/brands");
  };

  if (loading || error) {
    return null;
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="brand-showcase">
      <div className="showcase-container">
        <div className="showcase-header">
          <h2 className="showcase-title">Shop by Brand</h2>
          <button className="explore-more-btn" onClick={handleExploreMore}>
            Explore More
          </button>
        </div>

        <div className="brand-showcase-line">
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="showcase-brand-item"
              onClick={() => handleBrandClick(brand)}
              title={brand.name}
            >
              <div className="showcase-brand-wrapper">
                <img
                  src={brand.logo || `https://logo.clearbit.com/${brand.name.trim().toLowerCase()}.com`}
                  alt={brand.name}
                  className="showcase-brand-logo"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/100?text=${encodeURIComponent(brand.name)}`;
                  }}
                />
              </div>
              <p className="showcase-brand-name">{brand.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;
