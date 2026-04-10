import React from "react";
import { useNavigate } from "react-router-dom";
import { getBrandLogo } from "../utils/brandLogos";
import "./BrandLogoSection.css";

/**
 * BrandLogoSection Component
 * Displays brand logos in a horizontal scrollable or grid layout
 * Can be used in homepage or any page to showcase brands
 */
const BrandLogoSection = ({ brands = [], title = "Shop by Brand", layout = "grid" }) => {
  const navigate = useNavigate();

  if (!brands || brands.length === 0) {
    return null;
  }

  const handleBrandClick = (brand) => {
    navigate(`/search?brand=${encodeURIComponent(brand)}`);
  };

  const renderBrandItem = (brand) => (
    <div
      key={brand}
      className="brand-logo-item"
      onClick={() => handleBrandClick(brand)}
      title={brand}
    >
      <div className="brand-logo-wrapper">
        <img
          src={getBrandLogo(brand)}
          alt={brand}
          className="brand-logo"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/120?text=${encodeURIComponent(brand)}`;
          }}
        />
      </div>
      <p className="brand-logo-name">{brand}</p>
    </div>
  );

  return (
    <section className={`brand-logo-section ${layout}`}>
      {title && <h2 className="brand-section-title">{title}</h2>}
      <div className={`brand-logo-container ${layout}`}>
        {brands.map((brand) => renderBrandItem(brand))}
      </div>
    </section>
  );
};

export default BrandLogoSection;
