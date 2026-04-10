import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "../redux/productActions";
import { addCart as apiAddCart } from "./action";
import ProductCard from "../components/ProductCard";
import { Navbar } from "../components";
import * as publicCategoryService from "../service/publicCategoryService";
import toast from "react-hot-toast";
import "../styles/Product.css";
import ImageZoom from "react-image-magnifier-zoom";

const API_BASE = "http://localhost:5000/api";

const normalizeVariantType = (value = "") => String(value).trim().toLowerCase();

const isColorVariantType = (value = "") => {
  const normalized = normalizeVariantType(value);
  return normalized.includes("color") || normalized.includes("colour");
};

const optionHasMedia = (option) =>
  Boolean(option?.image || (Array.isArray(option?.images) && option.images.length > 0) || (Array.isArray(option?.videos) && option.videos.length > 0));

const optionHasPricing = (option) =>
  [
    option?.price,
    option?.priceAfterDiscount,
    option?.discount,
    option?.flatDiscount,
    option?.discountValidityDays,
    option?.discountUserLimit,
  ].some((value) => Number(value) > 0);

const buildVariantGroups = (product) => {
  if (Array.isArray(product?.variantGroups) && product.variantGroups.length > 0) {
    return product.variantGroups;
  }

  const groups = new Map();

  (product?.variants || []).forEach((variant) => {
    if (!variant?.variantType || !variant?.variantValue) return;

    if (!groups.has(variant.variantType)) {
      groups.set(variant.variantType, []);
    }

    const existingOptions = groups.get(variant.variantType);
    const existingIndex = existingOptions.findIndex(
      (option) => option.variantValue === variant.variantValue
    );

    if (existingIndex === -1) {
      existingOptions.push(variant);
      return;
    }

    if (optionHasMedia(variant) && !optionHasMedia(existingOptions[existingIndex])) {
      existingOptions[existingIndex] = variant;
    }
  });

  return Array.from(groups.entries()).map(([type, options]) => ({
    type,
    isColorType: isColorVariantType(type),
    options,
  }));
};

const getDefaultSelections = (product, variantGroups) => {
  if (product?.defaultVariantSelections && Object.keys(product.defaultVariantSelections).length > 0) {
    return product.defaultVariantSelections;
  }

  return variantGroups.reduce((acc, group) => {
    if (group.options?.[0]?.variantValue) {
      acc[group.type] = group.options[0].variantValue;
    }
    return acc;
  }, {});
};

const resolveActiveVariant = (product, variantGroups, selectedVariants, lastSelectedType) => {
  if (!product || variantGroups.length === 0) return null;

  const selectedOptions = variantGroups
    .map((group) =>
      group.options.find((option) => selectedVariants[group.type] === option.variantValue) || null
    )
    .filter(Boolean);

  if (selectedOptions.length === 0) return null;

  const lastSelectedOption = selectedOptions.find(
    (option) => option.variantType === lastSelectedType
  );
  const colorOption = selectedOptions.find(
    (option) => isColorVariantType(option.variantType) && optionHasMedia(option)
  );
  const sizeOption = selectedOptions.find(
    (option) => normalizeVariantType(option.variantType).includes("size") && optionHasPricing(option)
  );
  const mediaOption =
    colorOption ||
    selectedOptions.find(optionHasMedia) ||
    variantGroups.flatMap((group) => group.options).find(optionHasMedia) ||
    null;
  const pricingOption =
    (lastSelectedOption && optionHasPricing(lastSelectedOption) ? lastSelectedOption : null) ||
    sizeOption ||
    selectedOptions.find(optionHasPricing) ||
    mediaOption ||
    selectedOptions[0];

  return {
    ...pricingOption,
    images: mediaOption?.images || pricingOption?.images || [],
    videos: mediaOption?.videos || pricingOption?.videos || [],
    image: mediaOption?.image || pricingOption?.image || product.image,
    selectedVariants,
    selectedOptions,
    variantType: pricingOption?.variantType || lastSelectedType || "",
    variantValue: pricingOption?.variantValue || selectedVariants[lastSelectedType] || "",
  };
};

const Product = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const reviewSectionRef = useRef(null);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [activeVariant, setActiveVariant] = useState(null);
  const [lastSelectedType, setLastSelectedType] = useState("");
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Resize logic for ImageZoom
  const mainMediaRef = useRef(null);
  const [mediaSize, setMediaSize] = useState({ width: 400, height: 400 });

  useEffect(() => {
    const updateSize = () => {
      if (mainMediaRef.current) {
        setMediaSize({
          width: mainMediaRef.current.clientWidth - 40,
          height: mainMediaRef.current.clientHeight - 40
        });
      }
    };
    
    // Slight delay to ensure layout is done
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [product, activeVariant]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    userName: "",
    rating: 0,
    review: "",
  });
  const [hoverRating, setHoverRating] = useState(0);

  const rawProducts = useSelector((state) => state.product?.products ?? []);
  const products = useMemo(() => Array.isArray(rawProducts) ? rawProducts : (rawProducts.products || []), [rawProducts]);
  const variantGroups = useMemo(() => buildVariantGroups(product), [product]);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    setQty(1);
    setSelectedVariants({});
    setActiveVariant(null);
    setLastSelectedType("");
  }, [id]);

  // ✅ Fetch specific product directly from API to get fresh data
  useEffect(() => {
    if (id) {
      const fetchSingleProduct = async () => {
        try {
          const response = await fetch(`${API_BASE}/products/${id}`);
          const data = await response.json();
          setProduct(data);
          
          // Set default variants if available
          const groups = buildVariantGroups(data);
          if (data && groups.length > 0) {
            const defaults = getDefaultSelections(data, groups);
            const firstType = groups[0]?.type || "";
            setSelectedVariants(defaults);
            setLastSelectedType(firstType);
          }

        } catch (err) {
          console.error("Failed to fetch product details:", err);
          // Fallback to Redux store if API fails
          if (products.length > 0) {
            const foundProduct = products.find((p) => p._id === id);
            setProduct(foundProduct);
          }
        }
      };
      fetchSingleProduct();
    }
  }, [id, products]);

  useEffect(() => {
    if (id && products.length > 0 && !product) {
      const foundProduct = products.find((p) => p._id === id);
      setProduct(foundProduct);
      
      // Set default variants if available
      const groups = buildVariantGroups(foundProduct);
      if (foundProduct && groups.length > 0) {
        const defaults = getDefaultSelections(foundProduct, groups);
        const firstType = groups[0]?.type || "";
        setSelectedVariants(defaults);
        setLastSelectedType(firstType);
      }
    }
  }, [id, products, product]);

  // Update active variant whenever selection or product changes
  useEffect(() => {
    const resolvedVariant = resolveActiveVariant(product, variantGroups, selectedVariants, lastSelectedType);
    setActiveVariant(resolvedVariant);
  }, [selectedVariants, product, lastSelectedType, variantGroups]);

  // Resolve category id for "Explore More" links using public categories
  useEffect(() => {
    let mounted = true;
    const resolveCategoryId = async () => {
      if (!product?.category) return;
      try {
        const categories = await publicCategoryService.getAllCategories();
        const matched = categories.find(
          (c) => c.name.toLowerCase().trim() === product.category.toLowerCase().trim()
        );
        if (mounted) setCategoryId(matched?._id || "");
      } catch (err) {
        console.error("Failed to resolve category id:", err);
      }
    };

    resolveCategoryId();
    return () => {
      mounted = false;
    };
  }, [product]);

  // ✅ Update gallery media whenever active variant or product changes
  // Close Picture-in-Picture if active when media index changes
  useEffect(() => {
    if (document.pictureInPictureElement) {
       document.exitPictureInPicture().catch(() => {});
    }
  }, [activeMediaIndex]);

  useEffect(() => {
    let media = [];
    if (activeVariant) {
      if (activeVariant.images && activeVariant.images.length > 0) {
        media = [...activeVariant.images.map(url => ({ type: "image", url }))];
      } else if (activeVariant.image) {
        media = [{ type: "image", url: activeVariant.image }];
      }

      if (activeVariant.videos && activeVariant.videos.length > 0) {
        media = [...media, ...activeVariant.videos.map(url => ({ type: "video", url }))];
      }
    }

    if (media.length === 0 && product) {
      media = [{ type: "image", url: product.image }];
    }

    setGalleryMedia(media);
    setActiveMediaIndex(0);
    
    // Safety exit PiP on variant change too
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
  }, [activeVariant, product]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id, fetchReviews]);

  const handleAddToCart = () => {
    if (product) {
      const itemToCart = activeVariant 
        ? { 
            ...product, 
            price: activeVariant.price, 
            priceAfterDiscount: activeVariant.priceAfterDiscount,
            discount: activeVariant.discount,
            flatDiscount: activeVariant.flatDiscount,
            image: activeVariant.images?.[0] || activeVariant.image || product.image,
            selectedVariant: {
              type: activeVariant.variantType,
              value: activeVariant.variantValue,
              selections: activeVariant.selectedVariants || selectedVariants,
            }
          } 
        : product;

      const productId = itemToCart?._id || itemToCart?.id || product?._id || product?.id;
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

      if (userId && productId) {
        dispatch(apiAddCart(String(productId), String(userId), qty));
        toast.success(`Added ${qty} to cart!`);
      }
    }
  };

  const handleVariantSelect = (type, value) => {
    setLastSelectedType(type);
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clampQty = (value) => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(Math.max(Math.floor(value), 1), 99);
  };

  const handleQtyChange = (value) => {
    setQty(clampQty(Number(value)));
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStarClick = (star) => {
    setForm({ ...form, rating: star });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error("Please select a rating.");
    if (!form.review.trim()) return toast.error("Please write a review.");

    setSubmitting(true);
    
    let submitName = "Anonymous";
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        submitName = parsedUser.name || "Anonymous";
      }
    } catch (err) {
      console.error("Failed to read user from localStorage", err);
    }

    try {
      const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: submitName,
          rating: form.rating,
          review: form.review,
        }),
      });

      if (res.ok) {
        toast.success("Review submitted successfully! 🎉");
        setForm({ userName: "", rating: 0, review: "" });
        setHoverRating(0);
        fetchReviews(); // Refresh reviews
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to submit review.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, size = "normal") => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`star-icon ${size === "large" ? "star-large" : ""} ${i < Math.floor(rating)
          ? "star-filled"
          : i < rating
            ? "star-half"
            : "star-empty"
          }`}
      >
        ★
      </span>
    ));
  };

  // ✅ SINGLE PRODUCT DETAIL VIEW
  if (id && product) {
    const currentPriceSource = activeVariant || product;
    const percentageDiscount = Number(currentPriceSource.discount) || 0;
    const flatDiscount = Number(currentPriceSource.flatDiscount) || 0;
    const hasDiscount = percentageDiscount > 0 || flatDiscount > 0;
    const originalPrice = Number(currentPriceSource.price) || 0;
    const calculatedDiscountedPrice = Math.max(
      originalPrice - (originalPrice * percentageDiscount) / 100 - flatDiscount,
      0
    );
    const finalPrice = hasDiscount
      ? Number(currentPriceSource.priceAfterDiscount ?? calculatedDiscountedPrice) || calculatedDiscountedPrice
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
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
      <>
        <Navbar />
        <div className="product-detail-page">
          {/* ─── Product Detail Container ─── */}
          <div className="product-detail-container">
            {/* Product Gallery */}
            <div className="product-detail-gallery">
              <div className="gallery-thumbnails">
                {galleryMedia.map((item, idx) => (
                  <div
                    key={idx}
                    className={`thumbnail-item ${idx === activeMediaIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveMediaIndex(idx)}
                  >
                    {item.type === "image" ? (
                      <img src={item.url} alt={`Thumbnail ${idx}`} />
                    ) : (
                      <div className="video-thumbnail-overlay">
                        <video 
                          src={item.url} 
                          muted 
                          onMouseEnter={(e) => {
                            const playPromise = e.target.play();
                            if (playPromise !== undefined) {
                              playPromise.then(() => {
                                // Playback started
                              }).catch(error => {
                                // Playback was interrupted, ignore it
                              });
                            }
                          }} 
                          onMouseLeave={(e) => { 
                            e.target.pause(); 
                            e.target.currentTime = 0; 
                          }}
                        />
                        <div className="play-icon-overlay">
                          <i className="fa fa-play"></i>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="main-media-view" ref={mainMediaRef}>
                {galleryMedia[activeMediaIndex]?.type === "image" ? (
                  <ImageZoom 
                    src={galleryMedia[activeMediaIndex].url}
                    width={mediaSize.width || 400}
                    height={mediaSize.height || 400}
                    zoomLevel={2}
                  />
                ) : (
                  <video
                    src={galleryMedia[activeMediaIndex]?.url}
                    controls
                    autoPlay
                    muted
                    disablePictureInPicture
                    controlsList="nodownload"
                    className="main-media-video"
                    onLeavePictureInPicture={(e) => {
                      if (document.pictureInPictureElement) {
                        document.exitPictureInPicture().catch(()=> {});
                      }
                    }}
                    ref={(el) => {
                       if (el) {
                         // Force disable pip via property in addition to attribute
                         el.disablePictureInPicture = true;
                       }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="product-detail-info">
              {product.brand && (
                <p 
                  className="product-brand-detail" 
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/search?brand=${encodeURIComponent(product.brand)}`)}
                >
                  {product.brand}
                </p>
              )}

              <h1 className="product-title-detail">{product.title}</h1>

              {/* Rating Row */}
              {product.rating && product.rating > 0 && (
                <div className="rating-section">
                  <div className="stars-display">
                    {renderStars(product.rating)}
                  </div>
                  <span className="rating-text">{product.rating} out of 5</span>
                </div>
              )}

              {/* Price Section */}
              <div className="price-section">
                {hasDiscount ? (
                  <>
                    <div className="deal-row">
                      {flatDiscount <= 0 && percentageDiscount > 0 && <span className="deal-percent">{percentOff}% off</span>}
                      <span className="final-price">₹{formatINR(finalPrice)}</span>
                    </div>
                    <div className="mrp-row">
                      M.R.P.: <span className="original-price">₹{formatINR(originalPrice)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="discount-text">
                        You Save: ₹{formatINR(savings)} {flatDiscount <= 0 && percentageDiscount > 0 ? `(${percentOff}%)` : ""}
                      </div>
                    )}
                    {flatDiscount > 0 && (
                      <div className="flat-discount-row">
                        <span className="flat-discount-label">Flat ₹{formatINR(flatDiscount)} off</span>
                      </div>
                    )}
                    {currentPriceSource.discountValidityDays > 0 && (
                      <div className="discount-validity">
                        <i className="fa fa-clock-o"></i> Offer valid for <strong>{currentPriceSource.discountValidityDays}</strong> days
                      </div>
                    )}
                    {currentPriceSource.discountUserLimit > 0 && (
                      <div className="discount-limit">
                        <i className="fa fa-users"></i> For First <strong>{currentPriceSource.discountUserLimit}</strong> customers
                      </div>
                    )}
                  </>
                ) : (
                  <span className="final-price">₹{formatINR(originalPrice)}</span>
                )}
              </div>

              {/* Variants Section */}
              {variantGroups.length > 0 && (
                <div className="variants-container-detail">
                  {variantGroups.map((group) => (
                    <div key={group.type} className="variant-group">
                      <p className="variant-type-label">
                        {group.type}: <strong>{selectedVariants[group.type]}</strong>
                      </p>
                      <div className="variant-options">
                        {group.options.map((option) => {
                          const isSelected = selectedVariants[group.type] === option.variantValue;
                          const isColor = group.isColorType;
                          
                          return (
                            <button
                              key={option.variantValue}
                              className={`variant-option-btn ${isSelected ? "active" : ""} ${isColor ? "color-swatch-btn" : ""}`}
                              onClick={() => handleVariantSelect(group.type, option.variantValue)}
                              title={option.variantValue}
                            >
                              {isColor && (option.images?.[0] || option.image) ? (
                                 <img src={option.images?.[0] || option.image} alt={option.variantValue} className="swatch-img" />
                              ) : isColor ? (
                                <span 
                                  className="swatch-color" 
                                  style={{ backgroundColor: option.variantValue.toLowerCase() }}
                                ></span>
                              ) : (
                                <span className="variant-value-text">{option.variantValue}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category & Description */}
              <div className="product-meta">
                <p>
                  <strong>Category:</strong>{" "}
                  <span 
                    style={{ cursor: "pointer", color: "#007185" }} 
                    onClick={() => navigate(`/search?category=${encodeURIComponent(product.category)}`)}
                  >
                    {product.category}
                  </span>
                </p>
                {product.description && (
                  <p>
                    <strong>Description:</strong> {product.description}
                  </p>
                )}
              </div>

              <div className="quantity-section">
                <span className="quantity-label">Quantity</span>
                <div className="quantity-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleQtyChange(qty - 1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={qty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="qty-input"
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleQtyChange(qty + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <button className="btn-add-to-cart" onClick={handleAddToCart}>
                <i className="fa fa-shopping-cart"></i> Add to Cart
              </button>

              <p className="stock-status">✓ In Stock</p>
            </div>
          </div>

          {/* ─── Reviews Section ─── */}
          <div className="reviews-wrapper" id="reviews-section" ref={reviewSectionRef}>
            <div className="reviews-inner">
              <div className="reviews-header">
                <h2 className="reviews-title">Customer Reviews</h2>
                {avgRating && (
                  <div className="avg-rating-badge">
                    <span className="avg-rating-number">{avgRating}</span>
                    <div className="avg-stars">{renderStars(parseFloat(avgRating))}</div>
                    <span className="avg-rating-count">
                      ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>

              <div className="reviews-layout">
                <div className="review-form-card">
                  <h3 className="review-form-title">
                    <i className="fa fa-pencil"></i> Write a Review
                  </h3>
                  <form onSubmit={handleSubmitReview} className="review-form">
                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div className="star-picker">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star-pick ${star <= (hoverRating || form.rating)
                              ? "star-pick-active"
                              : ""
                              }`}
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            title={`${star} star${star > 1 ? "s" : ""}`}
                          >
                            ★
                        </span>
                        ))}
                        {form.rating > 0 && (
                          <span className="rating-label-text">
                            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][form.rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="review" className="form-label">
                        Your Review
                      </label>
                      <textarea
                        id="review"
                        name="review"
                        className="form-textarea"
                        placeholder="Share your experience with this product..."
                        rows={4}
                        value={form.review}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-review"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner"></span> Submitting...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane"></i> Submit Review
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="reviews-list">
                  {reviewsLoading ? (
                    <div className="reviews-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="no-reviews">
                      <div className="no-reviews-icon">💬</div>
                      <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                  ) : (
                    reviews.map((r) => (
                      <div key={r._id} className="review-card">
                        <div className="review-card-header">
                          <div className="reviewer-avatar">
                            {r.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="reviewer-info">
                            <p className="reviewer-name">{r.userName}</p>
                            <p className="reviewer-date">
                              {new Date(r.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="review-stars">
                            {renderStars(r.rating)}
                          </div>
                        </div>
                        <p className="review-text">{r.review}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Similar Products Section ─── */}
          <div className="similar-products-section">
            <div className="similar-products-header">
              <h2 className="similar-products-title">Similar Products</h2>
            </div>
            {products.filter(
              (p) => p.category === product.category && p._id !== product._id
            ).length > 0 ? (
              <>
                <div className="similar-scroll">
                  {products
                    .filter(
                      (p) => p.category === product.category && p._id !== product._id
                    )
                    .slice(0, 6)
                    .map((p) => (
                      <div key={p._id} className="similar-product-card">
                        <ProductCard product={p} />
                      </div>
                    ))}
                </div>
                <div className="explore-more-wrapper">
                  <Link to={categoryId ? `/category/${categoryId}` : "/categories"} className="btn-explore-more">
                    <i className="fa fa-th-large"></i> Explore More in {product.category}
                    <span className="explore-arrow">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="no-similar-box">
                <p className="no-similar">No similar products found</p>
                <Link to="/product" className="btn-explore-more">
                  <i className="fa fa-th-large"></i> Browse All Products
                  <span className="explore-arrow">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ✅ PRODUCTS LISTING VIEW (fallback)
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="row">
          {products &&
            products.map((product) => (
              <div key={product._id} className="col-md-3 mb-4">
                <ProductCard product={product} />
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Product;
