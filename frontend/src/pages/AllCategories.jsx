import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import * as publicCategoryService from "../service/publicCategoryService";
import "./styles/AllCategories.css";



const AllCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesFromAPI = async () => {
      try {
        setLoading(true);
        // Fetch categories from the public API endpoint
        const categoriesData = await publicCategoryService.getAllCategories();
        setCategories(categoriesData);

        // Fetch image and product count for each category
        const details = {};
        categoriesData.forEach((category) => {
          details[category.name] = {
            image: category.image || "https://via.placeholder.com/250?text=Category",
            count: category.productCount || 0,
            brands: category.brandCount || 0
          };
        });
        setCategoryData(details);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesFromAPI();
  }, []);

  const handleCategoryClick = (category) => {
    // Navigate to dedicated category products page
    navigate(`/category/${category._id}`);
  };

  const Loading = () => (
    <div className="categories-grid">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={300} />
      ))}
    </div>
  );

  return (
    <>
      <Navbar />
      <section className="all-categories-page">
        <h1 className="page-title">All Categories</h1>
        <hr className="divider" />

        {loading ? (
          <Loading />
        ) : categories.length > 0 ? (
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                key={category._id}
                className="category-item"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="category-image-wrapper">
                  <img
                    src={categoryData[category.name]?.image || "https://via.placeholder.com/250?text=Category"}
                    alt={category.name}
                    className="category-image-large"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/250?text=" + encodeURIComponent(category.name);
                    }}
                  />
                  <div className="overlay">
                    <button className="view-btn">View Products</button>
                  </div>
                </div>
                <div className="category-info">
                  <h3 className="category-name">
                    {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                  </h3>
                  <p className="category-count">
                    {categoryData[category.name]?.count || 0} Products
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-categories">No categories found</p>
        )}
      </section>
    </>
  );
};

export default AllCategories;
