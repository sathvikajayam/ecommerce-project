import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Footer } from "../components";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import * as publicBrandService from "../service/publicBrandService";
import "./styles/AllBrands.css";

// ✅ Auto-generate logo for ANY brand
const getBrandLogo = (brand) => {
  if (!brand) return null;

  const cleanBrand = brand.trim().toLowerCase();
  return `https://logo.clearbit.com/${cleanBrand}.com`;
};

const AllBrands = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandsFromAPI = async () => {
      try {
        setLoading(true);
        // Fetch brands from the public API endpoint
        const brandsData = await publicBrandService.getAllBrands();
        setBrands(brandsData);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandsFromAPI();
  }, []);

  const handleBrandClick = (brand) => {
    // Navigate to dedicated brand products page
    navigate(`/brand/${brand._id}`);
  };

  const Loading = () => (
    <div className="brands-grid">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={300} />
      ))}
    </div>
  );

  return (
    <>
      <Navbar />
      <section className="all-brands-page">
        <h1 className="page-title">All Brands</h1>
        <hr className="divider" />

        {loading ? (
          <Loading />
        ) : brands.length > 0 ? (
          <div className="brands-grid">
            {brands.map((brand) => (
              <div
                key={brand._id}
                className="brand-item"
                onClick={() => handleBrandClick(brand)}
              >
                <div className="brand-image-wrapper">
                  <img
                    src={
                      brand.logo ||
                      getBrandLogo(brand.name) ||
                      "https://via.placeholder.com/250?text=Brand"
                    }
                    alt={brand.name}
                    className="brand-image-large"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/250?text=" +
                        encodeURIComponent(brand.name);
                    }}
                  />
                  <div className="overlay">
                    <button className="view-btn">View Products</button>
                  </div>
                </div>

                <div className="brand-info">
                  <h3 className="brand-name">{brand.name}</h3>
                  <p className="brand-count">
                    {brand.productCount || 0} Products
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-brands">No brands found</p>
        )}
      </section>
      <Footer />
    </>
  );
};

export default AllBrands;
