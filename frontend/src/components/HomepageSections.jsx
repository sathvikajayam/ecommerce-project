import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import ProductCard from "./ProductCard";
import "../styles/Products.css";

const SECTIONS_BATCH_SIZE = 2;

const hasVisibleItems = (section) => {
  if (section.type === "products") {
    return Array.isArray(section.products) && section.products.length > 0;
  }
  if (section.type === "categories") {
    return Array.isArray(section.categories) && section.categories.length > 0;
  }
  if (section.type === "brands") {
    return Array.isArray(section.brands) && section.brands.length > 0;
  }
  return false;
};

const HomepageSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(SECTIONS_BATCH_SIZE);
  const navigate = useNavigate();
  const carouselRefs = useRef({});

  const scrollCarousel = (sectionId, direction) => {
    const track = carouselRefs.current[sectionId];
    if (!track) return;

    const scrollAmount = track.clientWidth || 800;
    const delta = direction === "left" ? -scrollAmount : scrollAmount;
    track.scrollBy({ left: delta, behavior: "smooth" });
  };

  const setTrackRef = (sectionId) => (node) => {
    if (sectionId && node) {
      carouselRefs.current[sectionId] = node;
    }
  };

  const renderProductGrid = (products, sectionId) => (
    <div className="homepage-section-carousel homepage-section-carousel--products">
      <button
        type="button"
        className="homepage-section-carousel-arrow homepage-section-carousel-arrow--left"
        onClick={() => scrollCarousel(sectionId, "left")}
        aria-label="Scroll left"
      >
        <span aria-hidden="true">&#8249;</span>
      </button>
      <div
        className="homepage-section-carousel-track"
        ref={setTrackRef(sectionId)}
      >
        {products.map((product) => (
          <div
            key={product._id || product.id || product.title || `${sectionId}-product-${Math.random()}`}
            className="homepage-section-carousel-item"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="homepage-section-carousel-arrow homepage-section-carousel-arrow--right"
        onClick={() => scrollCarousel(sectionId, "right")}
        aria-label="Scroll right"
      >
        <span aria-hidden="true">&#8250;</span>
      </button>
    </div>
  );

  const renderCategoryCarousel = (categories, sectionId) => (
    <div className="homepage-section-carousel homepage-section-carousel--categories">
      <button
        type="button"
        className="homepage-section-carousel-arrow homepage-section-carousel-arrow--left"
        onClick={() => scrollCarousel(sectionId, "left")}
        aria-label="Scroll left"
      >
        <span aria-hidden="true">&#8249;</span>
      </button>
      <div
        className="homepage-section-carousel-track templates-track--categories"
        ref={setTrackRef(sectionId)}
      >
        {categories.map((category, index) => {
          const name = String(category?.name || category || "Category");
          const keyValue =
            category?._id || `${name}-${index}`.replace(/\s+/g, "-");

          return (
            <div
              key={keyValue}
              className="homepage-section-carousel-item homepage-section-carousel-item--category"
            >
              <div
                className="homepage-section-category-card"
                onClick={() => {
                  if (!category?._id) return;
                  navigate(`/category/${category._id}`);
                }}
              >
                <div className="homepage-section-category-wrapper">
                  <img
                    src={
                      category?.image ||
                      "https://via.placeholder.com/280x200?text=Category"
                    }
                    alt={name}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/280x200?text=Category";
                    }}
                  />
                  <div className="homepage-section-category-overlay">
                    <button className="homepage-section-view-btn">View Products</button>
                  </div>
                </div>
                <p className="homepage-section-category-name">{name}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="homepage-section-carousel-arrow homepage-section-carousel-arrow--right"
        onClick={() => scrollCarousel(sectionId, "right")}
        aria-label="Scroll right"
      >
        <span aria-hidden="true">&#8250;</span>
      </button>
    </div>
  );

  const renderSectionBody = (section) => {
    if (section.type === "products") {
      const sectionId = section._id || section.title || "products";
      return renderProductGrid(section.products, sectionId);
    }

    if (section.type === "categories") {
      const sectionId = `${section._id || section.title || "categories"}-carousel`;
      return renderCategoryCarousel(section.categories, sectionId);
    }

    if (section.type === "brands") {
      const sectionId = `${section._id || section.title || "brands"}-carousel`;
      return (
        <div className="homepage-section-carousel homepage-section-carousel--brands">
          <button
            type="button"
            className="homepage-section-carousel-arrow homepage-section-carousel-arrow--left"
            onClick={() => scrollCarousel(sectionId, "left")}
            aria-label="Scroll left"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          <div
            className="homepage-section-carousel-track"
            ref={setTrackRef(sectionId)}
          >
            {section.brands.map((brand) => (
              <div
                key={brand._id || brand.name || `brand-${Math.random()}`}
                className="homepage-section-carousel-item homepage-section-carousel-item--brand"
              >
                <div 
                  className="homepage-section-brand-card"
                  onClick={() => {
                    if (!brand?._id) return;
                    navigate(`/brand/${brand._id}`);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} loading="lazy" />
                  ) : (
                    <div className="homepage-section-brand-fallback">{brand.name?.[0]}</div>
                  )}
                  <span>{brand.name}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="homepage-section-carousel-arrow homepage-section-carousel-arrow--right"
            onClick={() => scrollCarousel(sectionId, "right")}
            aria-label="Scroll right"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>
      );
    }

    return null;
  };

  const fetchMoreSections = () => {
    setVisibleCount((prev) =>
      Math.min(prev + SECTIONS_BATCH_SIZE, sections.length)
    );
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/sections`);
        if (Array.isArray(data)) {
          const liveSections = data
            .filter((section) => section.status !== "Hidden")
            .map((section) => ({
              ...section,
              products: Array.isArray(section.products) ? section.products.filter(Boolean) : [],
              categories: Array.isArray(section.categories) ? section.categories.filter(Boolean) : [],
              brands: Array.isArray(section.brands) ? section.brands.filter(Boolean) : [],
            }))
            .filter(hasVisibleItems);
          setSections(liveSections);
          setVisibleCount(Math.min(SECTIONS_BATCH_SIZE, liveSections.length));
        }
      } catch (error) {
        console.error("Failed to fetch homepage sections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  if (loading || sections.length === 0) {
    return null;
  }

  return (
    <InfiniteScroll
      dataLength={Math.min(visibleCount, sections.length)}
      next={fetchMoreSections}
      hasMore={visibleCount < sections.length}
      loader={null}
    >
      {sections.slice(0, visibleCount).map((section, index) => (
        <section
          key={section._id || `${section.title || "section"}-${index}`}
          className="category-showcase"
        >
          <div className="showcase-container">
            <div className="showcase-header">
              <h2 className="showcase-title">{section.title}</h2>
            </div>
            {renderSectionBody(section)}
          </div>
        </section>
      ))}
    </InfiniteScroll>
  );
};

export default HomepageSections;
