import React from "react";
import { Navbar, Footer } from "../components";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import { clearCart as apiClearCart } from "./action";
import { clearCart as localClearCart } from "../redux/action";
import "../styles/Checkout.css";

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

const Checkout = () => {
  const cart = useSelector((state) => state.handleCart || { items: [] });
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
  const appliedCoupean = (() => {
    try {
      return JSON.parse(localStorage.getItem("appliedCoupean") || "null");
    } catch {
      return null;
    }
  })();
  const discountAmount = appliedCoupean?.discountAmount ? Number(appliedCoupean.discountAmount) : 0;

  const EmptyCart = () => (
    <div className="empty-cart">
      <h2>No item in Cart</h2>
      <Link to="/" className="btn-outline">
        ← Continue Shopping
      </Link>
    </div>
  );

  const handlePayment = async (values, formikHelpers) => {
    const { setSubmitting } = formikHelpers || {};
    let subtotal = 0;
    const items = cart.items.map(item => {
      const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
      const price = product ? resolveProductPrice(product).finalPrice : Number(item.price) || 0;
      subtotal += price * (item.qty || 0);
      return {
        productId: product?._id || item.productId,
        title: product?.title || item.title || "Product",
        qty: item.qty,
        price: price,
        image: product?.image || item.image
      };
    });

    const shipping = 30;

    const orderPayload = {
      customer: {
        name: values.fullName,
        email: values.email || "N/A",
        phone: values.phone
      },
      items,
      shippingAddress: {
        line1: values.addressLine1,
        line2: values.addressLine2,
        city: values.city,
        state: values.state,
        pincode: values.pincode
      },
      subtotal,
      shipping,
      total: subtotal + shipping, // Send total including shipping; backend applies coupon if present
      paymentMethod: values.paymentMethod,
      couponCode: appliedCoupean?.code || null,
      userId: userId || null
    };

    try {
      console.log("axios.defaults.baseURL:", axios.defaults.baseURL);
      console.log("Making request to:", axios.defaults.baseURL + "/api/orders");
      const { data } = await axios.post("/api/orders", orderPayload);
      if (data.success) {
        toast.success(`Payment successful! Order ID: ${data.orderId}`);
        if (userId) {
          await dispatch(apiClearCart(userId));
        } else {
          dispatch(localClearCart());
        }
        try {
          localStorage.removeItem("appliedCoupean");
        } catch {}
        navigate(`/order-success/${encodeURIComponent(String(data.orderId || ""))}?paymentMethod=${encodeURIComponent(orderPayload.paymentMethod)}`);
      } else {
        toast.error(data?.message || "Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting?.(false);
    }
  };

  const ShowCheckout = () => {
    let subtotal = 0;
    const items = cart.items || [];

    items.forEach((item) => {
      const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
      const price = product ? resolveProductPrice(product).finalPrice : Number(item.price) || 0;
      const qty = item.qty || 0;
      subtotal += price * qty;
    });

    const validationSchema = Yup.object({
      fullName: Yup.string().trim().required("Full name is required"),
      phone: Yup.string()
        .trim()
        .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
        .required("Phone is required"),
      email: Yup.string()
        .trim()
        .transform((value) => (value === "" ? undefined : value))
        .email("Enter a valid email")
        .notRequired(),
      addressLine1: Yup.string().trim().required("Address Line 1 is required"),
      addressLine2: Yup.string().trim().notRequired(),
      city: Yup.string().trim().required("City is required"),
      state: Yup.string().trim().notRequired(),
      pincode: Yup.string()
        .trim()
        .matches(/^[0-9]{6}$/, "PIN code must be 6 digits")
        .required("PIN code is required"),
      paymentMethod: Yup.string().trim().required("Payment method is required"),
    });

    const formik = useFormik({
      initialValues: {
        fullName: "",
        phone: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        paymentMethod: "Cash on Delivery",
      },
      validationSchema,
      onSubmit: handlePayment,
      validateOnBlur: true,
      validateOnChange: false,
    });

    const fieldError = (name) => ((formik.touched[name] || formik.submitCount > 0) ? formik.errors[name] : "");
    const invalidClass = (name) => (fieldError(name) ? "field-invalid" : "");

    return (
      <div className="checkout-container">
        <div className="checkout-main">
          {/* Delivery Address Section */}
          <div className="section-card">
            <h2 className="section-title">Delivery Address</h2>
            <div className="address-alert">
              No saved addresses found. Please enter your delivery address below.
            </div>
            
            <form className="address-form" onSubmit={formik.handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group half">
                  <input 
                    type="text" 
                    name="fullName"
                    placeholder="Full name *" 
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={invalidClass("fullName")}
                    aria-invalid={Boolean(fieldError("fullName"))}
                  />
                  {fieldError("fullName") ? <div className="field-error">{String(fieldError("fullName"))}</div> : null}
                </div>
                <div className="form-group half">
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder="Phone *" 
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={invalidClass("phone")}
                    aria-invalid={Boolean(fieldError("phone"))}
                  />
                  {fieldError("phone") ? <div className="field-error">{String(fieldError("phone"))}</div> : null}
                </div>
              </div>

              <div className="form-group full">
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email" 
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={invalidClass("email")}
                  aria-invalid={Boolean(fieldError("email"))}
                />
                {fieldError("email") ? <div className="field-error">{String(fieldError("email"))}</div> : null}
              </div>

              <div className="form-group full">
                <textarea 
                  name="addressLine1"
                  placeholder="Address Line 1 *" 
                  rows="3"
                  value={formik.values.addressLine1}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={invalidClass("addressLine1")}
                  aria-invalid={Boolean(fieldError("addressLine1"))}
                ></textarea>
                {fieldError("addressLine1") ? (
                  <div className="field-error">{String(fieldError("addressLine1"))}</div>
                ) : null}
              </div>

              <div className="form-group full">
                <input 
                  type="text" 
                  name="addressLine2"
                  placeholder="Address Line 2 (Optional)" 
                  value={formik.values.addressLine2}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <input 
                    type="text" 
                    name="city"
                    placeholder="City *" 
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={invalidClass("city")}
                    aria-invalid={Boolean(fieldError("city"))}
                  />
                  {fieldError("city") ? <div className="field-error">{String(fieldError("city"))}</div> : null}
                </div>
                <div className="form-group half">
                  <input 
                    type="text" 
                    name="state"
                    placeholder="State" 
                    value={formik.values.state}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <input 
                    type="text" 
                    name="pincode"
                    placeholder="PIN code *" 
                    value={formik.values.pincode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={invalidClass("pincode")}
                    aria-invalid={Boolean(fieldError("pincode"))}
                  />
                  {fieldError("pincode") ? <div className="field-error">{String(fieldError("pincode"))}</div> : null}
                </div>
                <div className="form-group half"></div>
              </div>

              <div className="form-group full">
                <label className="field-label" htmlFor="paymentMethod">
                  Payment Method *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formik.values.paymentMethod}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={invalidClass("paymentMethod")}
                  aria-invalid={Boolean(fieldError("paymentMethod"))}
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
                {fieldError("paymentMethod") ? (
                  <div className="field-error">{String(fieldError("paymentMethod"))}</div>
                ) : null}
                {formik.values.paymentMethod === "Cash on Delivery" && (
                  <div className="payment-notice">
                    <i className="fa fa-info-circle" /> Only cash is accepted
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Order Details Section */}
          <div className="section-card">
            <h2 className="section-title">Order Details</h2>
            <div className="order-items-list">
              {items.map((item, index) => {
                const product = item.productId && typeof item.productId === "object" ? item.productId : item.product || null;
                const name = (product && product.title) || item.title || "Product";
                const price = product ? resolveProductPrice(product).finalPrice : Number(item.price) || 0;
                const image = (product && product.image) || item.image || "";
                return (
                  <div key={index} className="order-item">
                    <div className="order-item-left">
                      <img src={image} alt={name} className="order-item-image" />
                      <div className="order-item-info">
                        <span className="order-item-name">{name}</span>
                        <span className="order-item-qty">Qty: {item.qty}</span>
                      </div>
                    </div>
                    <div className="order-item-price">
                      ₹{(price * item.qty).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Order Summary */}
        <div className="checkout-sidebar">
          <div className="summary-card">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal (before discount)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 ? (
                <div className="summary-row">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="summary-row">
                <span>Shipping</span>
                <span>₹30.00</span>
              </div>
              <div className="summary-row total">
                <strong>Amount Payable</strong>
                <strong>₹{Math.max(subtotal - discountAmount + 30, 0).toFixed(2)}</strong>
              </div>
            </div>
            <div className="summary-actions">
              <button className="btn-payment" type="button" onClick={formik.submitForm} disabled={formik.isSubmitting}>
                {formik.isSubmitting ? "Processing..." : "Continue to Payment"}
              </button>
              <Link to="/cart" className="btn-back-cart">Back to Cart</Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="checkout-page-root">
      <Navbar />
      <div className="checkout-page-content">
        {cart.items && cart.items.length ? <ShowCheckout /> : <EmptyCart />}
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
