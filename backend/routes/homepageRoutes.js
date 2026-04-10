import express from "express";
import {
  getHeroImages,
  addHeroImage,
  updateHeroImage,
  deleteHeroImage,
  getHomepageBrands,
  updateHomepageBrands,
  getHomepageCategories,
  updateHomepageCategories,
  getTopPicksProducts,
  updateTopPicksProducts,
  getHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
} from "../controllers/homepageController.js";
import upload from "../config/multer.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// Public routes
router.get("/hero", getHeroImages);
router.get("/brands", getHomepageBrands);
router.get("/top-picks", getTopPicksProducts);

// Admin routes
router.post(
  "/hero",
  protect,
  adminOnly,
  requirePermission("homepage", "create"),
  upload.single("image"),
  addHeroImage
);

router.put(
  "/hero/:id",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  upload.single("image"),
  updateHeroImage
);

router.delete(
  "/hero/:id",
  protect,
  adminOnly,
  requirePermission("homepage", "delete"),
  deleteHeroImage
);

// Homepage Brands Routes
router.post(
  "/brands",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  updateHomepageBrands
);

// Homepage Categories Routes
router.get("/categories", getHomepageCategories);
router.post(
  "/categories",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  updateHomepageCategories
);

// Homepage Top Picks Routes
router.post(
  "/top-picks",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  updateTopPicksProducts
);

router.get("/sections", getHomepageSections);
router.post(
  "/sections",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  createHomepageSection
);
router.put(
  "/sections/:id",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  updateHomepageSection
);
router.delete(
  "/sections/:id",
  protect,
  adminOnly,
  requirePermission("homepage", "edit"),
  deleteHomepageSection
);

export default router;

