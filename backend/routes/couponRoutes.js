import express from "express";
import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = express.Router();

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const isExpired = (coupon, now = new Date()) => {
  if (!coupon?.expiryDate) return false;
  const expiry = new Date(coupon.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < now.getTime();
};

const isNotStarted = (coupon, now = new Date()) => {
  if (!coupon?.startDate) return false;
  const start = new Date(coupon.startDate);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() > now.getTime();
};

const getCartItemsFromRequest = async ({ userId, items }) => {
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((item) => ({
        productId: item?.productId || item?.id,
        qty: Number(item?.qty) || 0,
      }))
      .filter((item) => item.productId && item.qty > 0);
  }

  if (userId) {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return [];
    return (cart.items || [])
      .map((item) => ({
        productId: item?.productId?._id || item?.productId,
        qty: Number(item?.qty) || 0,
        product: item?.productId && typeof item.productId === "object" ? item.productId : null,
      }))
      .filter((item) => item.productId && item.qty > 0);
  }

  return [];
};

const buildEligibility = async (coupon, cartItems) => {
  const productIds = cartItems.map((i) => String(i.productId));
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "_id title price priceAfterDiscount variants brand category"
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const hasBrandFilter = Array.isArray(coupon.applicableBrands) && coupon.applicableBrands.length > 0;
  const hasCategoryFilter = Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0;
  const normalizeToken = (value) => String(value || "").trim().toLowerCase();
  const brandSet = hasBrandFilter
    ? new Set(coupon.applicableBrands.map(normalizeToken).filter(Boolean))
    : null;
  const categorySet = hasCategoryFilter
    ? new Set(coupon.applicableCategories.map(normalizeToken).filter(Boolean))
    : null;

  let subtotal = 0;
  let eligibleSubtotal = 0;

  const resolveUnitPrice = (product) => {
    if (!product) return 0;
    const top = Number(product.priceAfterDiscount ?? product.price);
    if (Number.isFinite(top) && top > 0) return top;

    const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
    const variant = Number(firstVariant?.priceAfterDiscount ?? firstVariant?.price);
    if (Number.isFinite(variant) && variant > 0) return variant;

    return 0;
  };

  for (const item of cartItems) {
    const product = item.product || byId.get(String(item.productId));
    if (!product) continue;
    const price = resolveUnitPrice(product);
    const qty = Number(item.qty) || 0;
    const line = price * qty;
    subtotal += line;

    const brandOk = !hasBrandFilter || brandSet.has(normalizeToken(product.brand));
    const categoryOk = !hasCategoryFilter || categorySet.has(normalizeToken(product.category));
    if (brandOk && categoryOk) eligibleSubtotal += line;
  }

  return { subtotal, eligibleSubtotal };
};

const computeDiscount = (coupon, eligibleSubtotal) => {
  const value = Number(coupon.value) || 0;
  if (eligibleSubtotal <= 0 || value <= 0) return 0;
  if (coupon.discountType === "percentage") {
    return Math.min(eligibleSubtotal, (eligibleSubtotal * value) / 100);
  }
  return Math.min(eligibleSubtotal, value);
};

const validateCoupon = async ({ code, userId, items, redeem = false }) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return { ok: false, status: 400, message: "Code is required" };

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) return { ok: false, status: 404, message: "Coupon not found" };
  if (!coupon.isActive) return { ok: false, status: 400, message: "Coupon is not active" };

  const now = new Date();
  if (isNotStarted(coupon, now)) return { ok: false, status: 400, message: "Coupon not started yet" };
  if (isExpired(coupon, now)) return { ok: false, status: 400, message: "Coupon expired" };

  if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
    return { ok: false, status: 400, message: "Coupon usage limit reached" };
  }

  if (coupon.perUserLimit && userId) {
    const used = Number(coupon.usageByUser?.get(String(userId)) || 0);
    if (used >= coupon.perUserLimit) {
      return { ok: false, status: 400, message: "Coupon per-user limit reached" };
    }
  }

  const cartItems = await getCartItemsFromRequest({ userId, items });
  if (!cartItems.length) {
    return { ok: false, status: 400, message: "No items to apply coupon" };
  }

  const { subtotal, eligibleSubtotal } = await buildEligibility(coupon, cartItems);
  const discountAmount = computeDiscount(coupon, eligibleSubtotal);

  if (discountAmount <= 0) {
    return { ok: false, status: 400, message: "Coupon not applicable to these items" };
  }

  if (redeem) {
    coupon.usageCount = Number(coupon.usageCount || 0) + 1;
    if (userId) {
      const key = String(userId);
      const used = Number(coupon.usageByUser?.get(key) || 0);
      coupon.usageByUser?.set(key, used + 1);
    }
    await coupon.save();
  }

  return {
    ok: true,
    status: 200,
    coupon,
    subtotal,
    eligibleSubtotal,
    discountAmount,
    totalAfterDiscount: Math.max(subtotal - discountAmount, 0),
  };
};

// List available coupons (for "View Coupons" UI)
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
    const available = coupons.filter((c) => !isNotStarted(c, now) && !isExpired(c, now));
    res.json(available);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate coupon without consuming usage
router.post("/validate", async (req, res) => {
  try {
    const result = await validateCoupon({
      code: req.body.code,
      userId: req.body.userId,
      items: req.body.items,
      redeem: false,
    });
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    res.json({
      valid: true,
      code: result.coupon.code,
      discountType: result.coupon.discountType,
      value: result.coupon.value,
      subtotal: result.subtotal,
      eligibleSubtotal: result.eligibleSubtotal,
      discountAmount: result.discountAmount,
      totalAfterDiscount: result.totalAfterDiscount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Redeem (consume) coupon usage (recommended at order placement)
router.post("/redeem", async (req, res) => {
  try {
    const result = await validateCoupon({
      code: req.body.code,
      userId: req.body.userId,
      items: req.body.items,
      redeem: true,
    });
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    res.json({
      redeemed: true,
      code: result.coupon.code,
      discountAmount: result.discountAmount,
      totalAfterDiscount: result.totalAfterDiscount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
