import express from "express";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import { sendOrderPlacedEmail, sendOrderDeliveredEmail } from "../utils/emailService.js";

const router = express.Router();

// Generate a random order ID (style: #03BA2FF1)
const generateOrderId = () => {
    const chars = "0123456789ABCDEF";
    let id = "#";
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * 16)];
    }
    return id;
};

const normalizeCode = (code) => String(code || "").trim().toUpperCase();
const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const computeDiscount = (coupon, eligibleSubtotal) => {
  const value = Number(coupon.value) || 0;
  if (eligibleSubtotal <= 0 || value <= 0) return 0;
  if (coupon.discountType === "percentage") {
    return Math.min(eligibleSubtotal, (eligibleSubtotal * value) / 100);
  }
  return Math.min(eligibleSubtotal, value);
};

const redeemCouponIfAny = async ({ couponCode, userId, items }) => {
  const code = normalizeCode(couponCode);
  if (!code) return { couponCode: null, discountAmount: 0 };

  const coupon = await Coupon.findOne({ code });
  if (!coupon) return { couponCode: null, discountAmount: 0, error: "Coupon not found" };
  if (!coupon.isActive) return { couponCode: null, discountAmount: 0, error: "Coupon is not active" };

  const now = new Date();
  if (isNotStarted(coupon, now)) return { couponCode: null, discountAmount: 0, error: "Coupon not started yet" };
  if (isExpired(coupon, now)) return { couponCode: null, discountAmount: 0, error: "Coupon expired" };

  if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
    return { couponCode: null, discountAmount: 0, error: "Coupon usage limit reached" };
  }

  if (coupon.perUserLimit && userId) {
    const used = Number(coupon.usageByUser?.get(String(userId)) || 0);
    if (used >= coupon.perUserLimit) {
      return { couponCode: null, discountAmount: 0, error: "Coupon per-user limit reached" };
    }
  }

  const cartItems = Array.isArray(items) ? items : [];
  const normalizedItems = cartItems
    .map((item) => ({
      productId: item?.productId,
      qty: Number(item?.qty) || 0,
    }))
    .filter((item) => item.productId && item.qty > 0);

  if (!normalizedItems.length) return { couponCode: null, discountAmount: 0, error: "No items to apply coupon" };

  const productIds = normalizedItems.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "_id price priceAfterDiscount variants brand category"
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
  const resolveUnitPrice = (product) => {
    if (!product) return 0;
    const top = Number(product.priceAfterDiscount ?? product.price);
    if (Number.isFinite(top) && top > 0) return top;

    const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
    const variant = Number(firstVariant?.priceAfterDiscount ?? firstVariant?.price);
    if (Number.isFinite(variant) && variant > 0) return variant;

    return 0;
  };

  let eligibleSubtotal = 0;
  for (const item of normalizedItems) {
    const product = byId.get(String(item.productId));
    if (!product) continue;
    const price = resolveUnitPrice(product);
    const line = price * (Number(item.qty) || 0);

    const brandOk = !hasBrandFilter || brandSet.has(normalizeToken(product.brand));
    const categoryOk = !hasCategoryFilter || categorySet.has(normalizeToken(product.category));
    if (brandOk && categoryOk) eligibleSubtotal += line;
  }

  const discountAmount = computeDiscount(coupon, eligibleSubtotal);
  if (discountAmount <= 0) return { couponCode: null, discountAmount: 0, error: "Coupon not applicable to these items" };

  coupon.usageCount = Number(coupon.usageCount || 0) + 1;
  if (userId) {
    const key = String(userId);
    const used = Number(coupon.usageByUser?.get(key) || 0);
    coupon.usageByUser?.set(key, used + 1);
  }
  await coupon.save();

  return { couponCode: coupon.code, discountAmount };
};

// Create an order
router.post("/", async (req, res) => {
  try {
    const { customer, items, shippingAddress, subtotal, total, couponCode, userId, paymentMethod } = req.body;

    let discountAmount = 0;
    let redeemedCouponCode = null;
    if (couponCode) {
      const redeemed = await redeemCouponIfAny({ couponCode, userId, items });
      if (redeemed?.error) {
        return res.status(400).json({ success: false, message: redeemed.error });
      }
      discountAmount = Number(redeemed.discountAmount || 0);
      redeemedCouponCode = redeemed.couponCode || null;
    }
    
    const normalizedPaymentMethod = (() => {
      const method = String(paymentMethod || "").trim();
      const allowed = new Set(["Cash on Delivery"]);
      return allowed.has(method) ? method : "N/A";
    })();

    const isCod = normalizedPaymentMethod === "Cash on Delivery";

    const orderData = {
      orderId: generateOrderId(),
      userId: userId || null,
      customer,
      items,
      shippingAddress,
      subtotal: Number(subtotal) || 0,
      couponCode: redeemedCouponCode,
      discountAmount,
      total: Number(total) || 0,
      date: new Date(),
      orderStatus: "Pending", // Matches schema field name
      paymentStatus: "Pending",
      paymentMethod: normalizedPaymentMethod,
    };

    const order = new Order(orderData);
    await order.save();

    if (userId) {
      const orderedProductIds = new Set(
        (Array.isArray(items) ? items : [])
          .map((item) => String(item?.productId || "").trim())
          .filter(Boolean)
      );

      if (orderedProductIds.size > 0) {
        const cart = await Cart.findOne({ userId });
        if (cart) {
          cart.items = (cart.items || []).filter(
            (item) => !orderedProductIds.has(String(item?.productId || "").trim())
          );

          if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
          } else {
            await cart.save();
          }
        }
      }
    }
    
    // Send order confirmation email
    if (customer?.email) {
      try {
        await sendOrderPlacedEmail({
          to: customer.email,
          customerName: customer.name,
          orderId: orderData.orderId,
          items: items,
          total: orderData.total,
          shippingAddress: shippingAddress,
        });
      } catch (emailError) {
        console.error("Order Email Error:", emailError);
        // We don't want to fail the request if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: orderData.orderId,
      couponCode: redeemedCouponCode,
      discountAmount,
      total: orderData.total,
      paymentStatus: orderData.paymentStatus,
    });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Get all orders (Admin only - adding basic check here or later with middleware)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Get a single order by orderId (e.g. #03BA2FF1)
router.get("/by-order-id/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }
    const order = await Order.findOne({ orderId: decodeURIComponent(orderId) });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Get order history for a specific logged-in user
router.get("/history", async (req, res) => {
  try {
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: "userId or email is required",
      });
    }

    const filters = [];

    if (userId) {
      filters.push({ userId });
    }

    if (email) {
      filters.push({
        "customer.email": {
          $regex: `^${escapeRegex(String(email).trim())}$`,
          $options: "i",
        },
      });
    }

    const orders = await Order.find({ $or: filters }).sort({ createdAt: -1, date: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Order History Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Update order status and payment status (Admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    // Validate order ID format
    if (!id || id.length < 24) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Validate status values
    const validOrderStatuses = ["Pending", "Processing", "Shipped", "Delivered"];
    const validPaymentStatuses = ["Pending", "Paid"];

    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    // Build update object
    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Update order
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Send delivery email if status is updated to "Delivered"
    if (orderStatus === "Delivered" && order.customer?.email) {
      try {
        await sendOrderDeliveredEmail({
          to: order.customer.email,
          customerName: order.customer.name,
          orderId: order.orderId,
        });
      } catch (emailError) {
        console.error("Delivery Email Error:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Order Update Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
