import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addCart as apiAddCart } from "../pages/action";
import toast from "react-hot-toast";
import * as publicBrandService from "../service/publicBrandService";
import "../styles/Products.css";

// Shared cache to avoid redundant API calls across multiple ProductCards
let brandsCache = null;
let brandsPromise = null;

const getBrandsCached = () => {
  if (brandsCache) return Promise.resolve(brandsCache);
  if (brandsPromise) return brandsPromise;
  
  brandsPromise = publicBrandService.getAllBrands()
    .then(brands => {
      brandsCache = brands;
      return brands;
    })
    .catch(err => {
      console.error("Failed to pre-fetch brands:", err);
      brandsPromise = null;
      return [];
    });
  
  return brandsPromise;
};

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [brandId, setBrandId] = React.useState(null);

  React.useEffect(() => {
    if (product.brand) {
      getBrandsCached().then(brands => {
        const matched = brands.find(
          b => b.name.toLowerCase().trim() === product.brand.toLowerCase().trim()
        );
        if (matched) setBrandId(matched._id);
      });
    }
  }, [product.brand]);

  const addProduct = (product) => {
    const userId = (() => {
      const direct = localStorage.getItem("userId");
      if (direct && direct !== "null" && direct !== "undefined") return direct;
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const id = storedUser?._id || storedUser?.id;
        return id ? String(id) : null;
      } catch {
        return null;
      }
    })();

    if (!userId) {
      toast.error("Login is required to add items to cart");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    const productId = product?._id || product?.id;
    if (userId && productId) {
      dispatch(apiAddCart(String(productId), String(userId), 1));
      toast.success("Added to cart");
    }
  };

  // Get price from top-level or fallback to first variant
  const firstVariant = product.variants?.[0];
  const topLevelPrice = Number(product.price) || null;
  const variantPrice = firstVariant ? Number(firstVariant.price) : null;
  const effectivePrice = topLevelPrice !== null ? topLevelPrice : variantPrice || 0;
  
  const topLevelDiscount = Number(product.discount) || null;
  const variantDiscount = firstVariant ? Number(firstVariant.discount) : null;
  const effectiveDiscount = topLevelDiscount !== null ? topLevelDiscount : variantDiscount || 0;
  
  const topLevelFlatDiscount = Number(product.flatDiscount) || null;
  const variantFlatDiscount = firstVariant ? Number(firstVariant.flatDiscount) : null;
  const effectiveFlatDiscount = topLevelFlatDiscount !== null ? topLevelFlatDiscount : variantFlatDiscount || 0;
  
  const topLevelPriceAfterDiscount = product.priceAfterDiscount;
  const variantPriceAfterDiscount = firstVariant?.priceAfterDiscount;

  // Price model
  const percentageDiscount = effectiveDiscount;
  const flatDiscount = effectiveFlatDiscount;
  const hasDiscount = percentageDiscount > 0 || flatDiscount > 0;
  const originalPrice = effectivePrice;
  const calculatedDiscountedPrice = Math.max(
    originalPrice - (originalPrice * percentageDiscount) / 100 - flatDiscount,
    0
  );
  const finalPrice = hasDiscount
    ? Number(topLevelPriceAfterDiscount ?? variantPriceAfterDiscount ?? calculatedDiscountedPrice) || calculatedDiscountedPrice
    : originalPrice;
  const computedPercentOff = originalPrice > 0
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;
  const percentOff = percentageDiscount > 0
    ? Math.round(percentageDiscount)
    : Math.max(computedPercentOff, 0);
  const savings = Math.max(originalPrice - finalPrice, 0);

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  // Render star rating
  const renderStars = (rating) => {
    const filledStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = [];
    for (let i = 0; i < filledStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key={filledStars} className="star half">★</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="star empty">★</span>);
    }
    return stars;
  };

  return (
    <div className="product-card-wrapper">
      <div className="product-card">
        {/* Clickable Image */}
        <Link to={`/product/${product._id}`} className="product-link">
          <img
            src={product.image || product.variants?.[0]?.images?.[0] || product.variants?.[0]?.image}
            alt={product.title}
            className="product-image"
          />
        </Link>

        {/* Brand */}
        {product.brand && (
          <p 
            className="product-brand" 
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              if (brandId) {
                navigate(`/brand/${brandId}`);
              } else {
                navigate(`/search?brand=${encodeURIComponent(product.brand)}`);
              }
            }}
          >
            {product.brand}
          </p>
        )}

        {/* Title */}
        <Link to={`/product/${product._id}`} className="product-link">
          <h5 className="product-card-title">{product.title?.substring(0, 40) || ''}{product.title?.length > 40 ? '...' : ''}</h5>
        </Link>

        <p className="product-desc">
          {product.description?.substring(0, 60) || ''}...
        </p>

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="product-rating">
            <div className="stars">
              {renderStars(product.rating)}
            </div>
            <span className="rating-value">({product.rating})</span>
          </div>
        )}

        {/* Price Section */}
        <div className="product-price">
          {hasDiscount ? (
            <>
              <div className="amazon-price-row">
                {flatDiscount <= 0 && percentageDiscount > 0 && <span className="amazon-offer-text">{percentOff}% off</span>}
                <span className="final-price">₹{formatINR(finalPrice)}</span>
              </div>
              <div className="amazon-mrp-row">
                M.R.P.: <span className="original-price">₹{formatINR(originalPrice)}</span>
              </div>
              {savings > 0 && (
                <div className="amazon-save-row">You Save: ₹{formatINR(savings)}</div>
              )}
              {flatDiscount > 0 && (
                <div className="amazon-flat-discount">Flat ₹{formatINR(flatDiscount)} off</div>
              )}
            </>
          ) : (
            <span className="final-price">₹{formatINR(originalPrice)}</span>
          )}
        </div>

        <div className="product-actions">
          <button
            className="btn-dark"
            onClick={() => {
              addProduct(product);
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
