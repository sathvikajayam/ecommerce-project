// src/pages/Cart.jsx
import React, { useEffect, useState } from "react";
import { Navbar, Footer } from "../components";
import { useSelector, useDispatch } from "react-redux";
import { addCart as apiAddCart, delCart as apiDelCart, fetchCart, clearCart as apiClearCart } from "../pages/action";
import { addCart as localAddCart, delCart as localDelCart, clearCart as localClearCart } from "../redux/action";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Cart.css";
import { listAvailableCoupons, validateCoupon } from "../service/publicCouponService";
import toast from "react-hot-toast";

const resolveProductPrice = (product) => {
  const firstVariant = product?.variants?.[0];

  const topLevelPrice = Number(product?.price);
  const variantPrice = Number(firstVariant?.price);
  const originalPrice =
    Number.isFinite(topLevelPrice) && topLevelPrice > 0
      ? topLevelPrice
      : Number.isFinite(variantPrice) && variantPrice > 0
        ? variantPrice
        : 0;

  const topLevelDiscount = Number(product?.discount);
  const variantDiscount = Number(firstVariant?.discount);
  const percentageDiscount = Number.isFinite(topLevelDiscount)
    ? topLevelDiscount
    : Number.isFinite(variantDiscount)
      ? variantDiscount
      : 0;

  const topLevelFlatDiscount = Number(product?.flatDiscount);
  const variantFlatDiscount = Number(firstVariant?.flatDiscount);
  const flatDiscount = Number.isFinite(topLevelFlatDiscount)
    ? topLevelFlatDiscount
    : Number.isFinite(variantFlatDiscount)
      ? variantFlatDiscount
      : 0;

  const topLevelPriceAfterDiscount = Number(product?.priceAfterDiscount);
  const variantPriceAfterDiscount = Number(firstVariant?.priceAfterDiscount);

  const hasDiscount = percentageDiscount > 0 || flatDiscount > 0;
  if (!hasDiscount) return { originalPrice, finalPrice: originalPrice };

  const calculatedDiscountedPrice = Math.max(
    originalPrice - (originalPrice * percentageDiscount) / 100 - flatDiscount,
    0
  );

  const finalPrice = Number.isFinite(topLevelPriceAfterDiscount)
    ? topLevelPriceAfterDiscount
    : Number.isFinite(variantPriceAfterDiscount)
      ? variantPriceAfterDiscount
      : calculatedDiscountedPrice;

  return { originalPrice, finalPrice };
};

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponStatus, setCouponStatus] = useState({ loading: false, error: "", message: "" });
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState("");
  const [showApplicableOnly, setShowApplicableOnly] = useState(true);

  // Get cart from Redux
  const cart = useSelector((state) => state.handleCart); 

  // Get userId from auth state or localStorage
  // (app stores the full user object under "user"; keep this resilient)
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

  // Fetch cart from backend on component mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId));
    }
  }, [dispatch, userId]);

  // Restore applied coupon (if any) so totals stay discounted after refresh.
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("appliedCoupean") || "null");
      if (stored && stored.code) {
        setAppliedCoupon({
          code: String(stored.code),
          discountAmount: Number(stored.discountAmount || 0),
        });
        setCouponCode(String(stored.code));
      }
    } catch {}
  }, []);

  // Re-validate applied coupon whenever cart changes so discount updates with qty/items.
  useEffect(() => {
    const code = appliedCoupon?.code ? String(appliedCoupon.code) : "";
    if (!code) return undefined;

    let ignore = false;
    const run = async () => {
      try {
        const items = (cart.items || [])
          .map((item) => {
            const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
            return { productId: product?._id || item.productId, qty: item.qty };
          })
          .filter((item) => item.productId && item.qty);

        if (!items.length) return;

        const data = await validateCoupon({ code, userId, items });
        if (ignore) return;

        const nextApplied = { code: data.code, discountAmount: Number(data.discountAmount || 0) };
        setAppliedCoupon(nextApplied);
        try {
          localStorage.setItem("appliedCoupean", JSON.stringify(nextApplied));
        } catch {}
      } catch (error) {
        if (ignore) return;
        setAppliedCoupon(null);
        setCouponStatus((prev) => ({
          ...prev,
          error: String(error?.response?.data?.message || "Coupon is no longer applicable"),
          message: "",
          loading: false,
        }));
        try {
          localStorage.removeItem("appliedCoupean");
        } catch {}
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [cart.items, appliedCoupon?.code, userId]);

  const handleClearCart = () => {
    if (userId) {
      dispatch(apiClearCart(userId));
    } else {
      dispatch(localClearCart());
    }
    setAppliedCoupon(null);
    setCouponStatus({ loading: false, error: "", message: "" });
    try {
      localStorage.removeItem("appliedCoupean");
    } catch {}
  };

  const handleApplyCoupean = async (codeOverride) => {
    const code = String(codeOverride ?? couponCode ?? "").trim();
    if (!code) {
      setCouponStatus({ loading: false, error: "Enter coupon code", message: "" });
      return;
    }

    try {
      setCouponStatus({ loading: true, error: "", message: "" });
      const items = (cart.items || [])
        .map((item) => {
          const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
          return { productId: product?._id || item.productId, qty: item.qty };
        })
        .filter((item) => item.productId && item.qty);

      const data = await validateCoupon({ code, userId, items });
      const nextApplied = { code: data.code, discountAmount: Number(data.discountAmount || 0) };
      setAppliedCoupon(nextApplied);
      setCouponStatus({ loading: false, error: "", message: `Coupon applied: ${data.code}` });
      try {
        setCouponCode(data.code);
        localStorage.setItem("appliedCoupean", JSON.stringify(nextApplied));
      } catch {}
    } catch (error) {
      setAppliedCoupon(null);
      const message = error?.response?.data?.message || "Invalid coupon";
      setCouponStatus({ loading: false, error: String(message), message: "" });
      try {
        localStorage.removeItem("appliedCoupean");
      } catch {}
    }
  };

  const loadAvailableCoupons = async () => {
    setCouponsLoading(true);
    setCouponsError("");
    try {
      const data = await listAvailableCoupons();
      setAvailableCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load coupons. Please try again.";
      setCouponsError(String(message));
      setAvailableCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const openCoupons = async () => {
    setIsCouponsOpen(true);
    await loadAvailableCoupons();
  };

  const handleProceedToCheckout = (e) => {
    if (userId) return;
    e?.preventDefault?.();
    toast.error("Please login to proceed to checkout");
    navigate("/login", { state: { from: "/checkout" } });
  };

  // Empty cart UI
  const renderEmptyCart = () => (
    <div className="empty-cart">
      <h2>Your Cart is Empty</h2>
      <Link to="/" className="btn-outline">
        ← Continue Shopping
      </Link>
    </div>
  );

  // Show cart UI
  const renderCart = () => {
    const shipping = 30;
    const rupee = "\u20B9";

    const normalizeId = (value) => {
      if (!value) return "";
      if (typeof value === "object") return String(value._id || value.id || "");
      return String(value);
    };

    const cartMetaItems = (cart.items || [])
      .map((item) => {
        const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
        return {
          qty: Number(item.qty) || 0,
          brandId: String(normalizeId(product?.brand)).trim().toLowerCase(),
          categoryId: String(normalizeId(product?.category)).trim().toLowerCase(),
        };
      })
      .filter((item) => item.qty > 0);

    const getApplicability = (coupon) => {
      const brands = Array.isArray(coupon?.applicableBrands) ? coupon.applicableBrands : [];
      const categories = Array.isArray(coupon?.applicableCategories) ? coupon.applicableCategories : [];
      const brandSet = new Set(brands.map((b) => String(b).trim().toLowerCase()).filter(Boolean));
      const categorySet = new Set(categories.map((c) => String(c).trim().toLowerCase()).filter(Boolean));
      const hasBrandFilter = brandSet.size > 0;
      const hasCategoryFilter = categorySet.size > 0;

      if (!cartMetaItems.length) return { applicable: false, matchCount: 0 };
      if (!hasBrandFilter && !hasCategoryFilter) return { applicable: true, matchCount: cartMetaItems.length };

      const matching = cartMetaItems.filter((item) => {
        const brandOk = !hasBrandFilter || (item.brandId && brandSet.has(String(item.brandId)));
        const categoryOk = !hasCategoryFilter || (item.categoryId && categorySet.has(String(item.categoryId)));
        return brandOk && categoryOk;
      });

      return { applicable: matching.length > 0, matchCount: matching.length };
    };

    // Calculate subtotal and total items (handle productId as object or fallback)
    const subtotal = cart.items?.reduce((sum, item) => {
      const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
      const unitPrice = resolveProductPrice(product).finalPrice;
      return sum + unitPrice * (item.qty || 0);
    }, 0) || 0;

    const totalItems = cart.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
    const discountAmount = appliedCoupon?.discountAmount ? Number(appliedCoupon.discountAmount) : 0;
    const subtotalAfterDiscount = Math.max(subtotal - discountAmount, 0);
    const subtotalPlusShipping = subtotalAfterDiscount + shipping;
    const totalPayable = Math.max(subtotalPlusShipping, 0);
    const couponLabel = appliedCoupon?.code ? String(appliedCoupon.code).toUpperCase() : "";

    return (
      <>
      <div className="cart-container">
        {/* LEFT SIDE: Cart Items */}
        <div className="cart-items-wrapper">
          <div className="cart-items">
            <h3>Your Items ({totalItems})</h3>

            {cart.items?.map((item) => {
              const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
              const productId = product?._id || product?.id || item.productId;
              const unitPrice = resolveProductPrice(product).finalPrice;

              return (
                <div className="cart-item" key={productId}>
                  <img src={product?.image || ""} alt={product?.name || "product"} />

                  <div className="item-info">
                    <h4>{product?.name || product?.title || "Product"}</h4>
                    <p>₹{unitPrice.toFixed(2)}</p>
                  </div>

                  <div className="item-qty">
                    <button
                      onClick={() =>
                        userId
                          ? dispatch(apiDelCart(productId, userId))
                          : dispatch(localDelCart(product || { id: productId }))
                      }
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() =>
                        userId
                          ? dispatch(apiAddCart(productId, userId))
                          : dispatch(localAddCart(product || { id: productId }))
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total">
                    ₹{(unitPrice * item.qty).toFixed(2)}
                  </div>
                  
                  <button 
                    className="remove-link"
                    onClick={() => userId ? dispatch(apiDelCart(productId, userId)) : dispatch(localDelCart(product || { id: productId }))}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="coupon-section">
            <h4>Have a Coupon?</h4>
            <div className="coupon-input-group">
              <input 
                type="text" 
                placeholder="Enter coupon code" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button className="apply-coupon-btn" type="button" onClick={handleApplyCoupean} disabled={couponStatus.loading}>
                {couponStatus.loading ? "Applying..." : "Apply Coupon"}
              </button>
              <button className="view-coupons-btn" type="button" onClick={openCoupons} disabled={couponsLoading}>
                {couponsLoading ? "Loading..." : "View Coupons"}
              </button>
            </div>
            {couponStatus.error ? <div className="coupon-msg coupon-msg--error">{couponStatus.error}</div> : null}
            {couponStatus.message ? <div className="coupon-msg coupon-msg--ok">{couponStatus.message}</div> : null}
          </div>
        </div>

        {/* RIGHT SIDE: Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal (before discount)</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="summary-row">
              <span>
                Coupon{couponLabel ? ` (${couponLabel})` : ""} discount
              </span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="summary-row summary-row--after-discount">
              <span>Subtotal after discount</span>
              <span>₹{subtotalAfterDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>

          <div className="summary-row total summary-row--total-payable">
            <strong>Amount payable</strong>
            <strong>₹{totalPayable.toFixed(2)}</strong>
          </div>

          {discountAmount > 0 && (
            <div className="coupon-applied-banner">
              <div>Coupon <strong>{couponLabel}</strong> saved you</div>
              <div className="coupon-savings">₹{discountAmount.toFixed(2)}</div>
            </div>
          )}

          <Link to="/checkout" className="checkout-btn" onClick={handleProceedToCheckout}>
            Proceed to Checkout
          </Link>
          
          <button className="clear-cart-btn" onClick={handleClearCart}>
            Clear Cart
          </button>
        </div>
      </div>

      {isCouponsOpen ? (
        <div
          className="coupon-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Available Coupons"
          onClick={() => setIsCouponsOpen(false)}
        >
          <div className="coupon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h3>Available Coupons</h3>
              <button type="button" className="coupon-modal-close" onClick={() => setIsCouponsOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="coupon-modal-toolbar">
              <label className="coupon-modal-toggle">
                <input
                  type="checkbox"
                  checked={showApplicableOnly}
                  onChange={(e) => setShowApplicableOnly(Boolean(e.target.checked))}
                />
                Show applicable only
              </label>
              <button type="button" className="coupon-modal-refresh" onClick={loadAvailableCoupons} disabled={couponsLoading}>
                Refresh
              </button>
            </div>

            {couponsLoading ? (
              <div className="coupon-modal-state">Loading coupons…</div>
            ) : couponsError ? (
              <div className="coupon-modal-state coupon-modal-state--error">{couponsError}</div>
            ) : (
              (() => {
                const enriched = (availableCoupons || []).map((c) => ({ coupon: c, ...getApplicability(c) }));
                const visible = (showApplicableOnly ? enriched.filter((c) => c.applicable) : enriched).sort(
                  (a, b) => Number(b.applicable) - Number(a.applicable)
                );

                if (!visible.length) {
                  return (
                    <div className="coupon-modal-state">
                      {showApplicableOnly
                        ? "No coupons are applicable to the products in your cart right now."
                        : "No coupons available right now."}
                    </div>
                  );
                }

                return (
                  <div className="coupon-list">
                    {visible.map(({ coupon, applicable, matchCount }) => {
                      const discountText =
                        coupon?.discountType === "percentage"
                          ? `${Number(coupon?.value || 0)}% off`
                          : `${rupee}${Number(coupon?.value || 0)} off`;

                      return (
                        <div
                          key={String(coupon?._id || coupon?.code)}
                          className={`coupon-card${applicable ? " coupon-card--ok" : " coupon-card--no"}`}
                        >
                          <div className="coupon-card-main">
                            <div className="coupon-card-code">{String(coupon?.code || "")}</div>
                            <div className="coupon-card-desc">{discountText}</div>
                            <div className={`coupon-card-meta${applicable ? "" : " coupon-card-meta--muted"}`}>
                              {applicable ? `Applicable to ${matchCount} item(s) in your cart` : "Not applicable to items in your cart"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="coupon-card-apply"
                            disabled={!applicable || couponStatus.loading}
                            onClick={async () => {
                              setCouponCode(String(coupon?.code || ""));
                              setIsCouponsOpen(false);
                              await handleApplyCoupean(String(coupon?.code || ""));
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      ) : null}
      </>
    );
  };

  return (
    <>
      <Navbar />
      <div className="cart-page">
        <div className="cart-content">
          <h1>Cart</h1>
          {cart.items && cart.items.length > 0 ? renderCart() : renderEmptyCart()}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;

