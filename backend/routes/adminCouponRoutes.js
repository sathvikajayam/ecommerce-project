import express from "express";
import Coupon from "../models/Coupon.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission, requireAnyPermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const parseLimit = (value) => {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  return Math.floor(parsed);
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const sanitizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    // allow comma-separated
    return value
      .split(",")
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  }
  return [];
};

// GET all coupons
router.get(
  "/",
  protect,
  adminOnly,
  requireAnyPermission("coupons", ["view", "create", "edit", "delete"]),
  async (req, res) => {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET single coupon
router.get(
  "/:id",
  protect,
  adminOnly,
  requireAnyPermission("coupons", ["view", "create", "edit", "delete"]),
  async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) return res.status(404).json({ message: "Coupon not found" });
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// CREATE coupon
router.post("/", protect, adminOnly, requirePermission("coupons", "create"), async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);
    const discountType = String(req.body.discountType || "").toLowerCase();
    const value = Number(req.body.value);

    if (!code) return res.status(400).json({ message: "Code is required" });
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      return res.status(400).json({ message: "Invalid code format" });
    }
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({ message: "Invalid discountType" });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: "Value must be a positive number" });
    }
    if (discountType === "percentage" && value > 100) {
      return res.status(400).json({ message: "Percentage value must be <= 100" });
    }

    const exists = await Coupon.findOne({ code });
    if (exists) return res.status(409).json({ message: "Coupon code already exists" });

    const coupon = await Coupon.create({
      code,
      discountType,
      value,
      startDate: parseDate(req.body.startDate),
      expiryDate: parseDate(req.body.expiryDate),
      totalUsageLimit: parseLimit(req.body.totalUsageLimit),
      perUserLimit: parseLimit(req.body.perUserLimit),
      applicableBrands: sanitizeStringArray(req.body.applicableBrands),
      applicableCategories: sanitizeStringArray(req.body.applicableCategories),
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      createdBy: req.user?._id || null,
    });

    res.status(201).json({ message: "Coupon created", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE coupon
router.put("/:id", protect, adminOnly, requirePermission("coupons", "edit"), async (req, res) => {
  try {
    const update = {};
    if (req.body.code !== undefined) {
      const code = normalizeCode(req.body.code);
      if (!code) return res.status(400).json({ message: "Code is required" });
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return res.status(400).json({ message: "Invalid code format" });
      update.code = code;
    }

    if (req.body.discountType !== undefined) {
      const discountType = String(req.body.discountType || "").toLowerCase();
      if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({ message: "Invalid discountType" });
      }
      update.discountType = discountType;
    }

    if (req.body.value !== undefined) {
      const value = Number(req.body.value);
      if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ message: "Value must be a positive number" });
      update.value = value;
    }

    if (req.body.startDate !== undefined) update.startDate = parseDate(req.body.startDate);
    if (req.body.expiryDate !== undefined) update.expiryDate = parseDate(req.body.expiryDate);
    if (req.body.totalUsageLimit !== undefined) update.totalUsageLimit = parseLimit(req.body.totalUsageLimit);
    if (req.body.perUserLimit !== undefined) update.perUserLimit = parseLimit(req.body.perUserLimit);
    if (req.body.applicableBrands !== undefined) update.applicableBrands = sanitizeStringArray(req.body.applicableBrands);
    if (req.body.applicableCategories !== undefined) update.applicableCategories = sanitizeStringArray(req.body.applicableCategories);
    if (req.body.isActive !== undefined) update.isActive = Boolean(req.body.isActive);

    if (update.discountType === "percentage" || (update.value !== undefined && update.discountType === undefined)) {
      // enforce max 100 when type is percentage (if we can infer)
      const existing = await Coupon.findById(req.params.id).select("discountType value");
      if (!existing) return res.status(404).json({ message: "Coupon not found" });
      const effectiveType = update.discountType || existing.discountType;
      const effectiveValue = update.value !== undefined ? update.value : existing.value;
      if (effectiveType === "percentage" && effectiveValue > 100) {
        return res.status(400).json({ message: "Percentage value must be <= 100" });
      }
    }

    if (update.code) {
      const conflict = await Coupon.findOne({ code: update.code, _id: { $ne: req.params.id } });
      if (conflict) return res.status(409).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon updated", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOGGLE active status
router.patch("/:id/toggle-status", protect, adminOnly, requirePermission("coupons", "edit"), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ message: "Coupon status updated", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE coupon
router.delete("/:id", protect, adminOnly, requirePermission("coupons", "delete"), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

