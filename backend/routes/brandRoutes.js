import express from "express";
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus,
  searchBrands,
} from "../controllers/brandController.js";
import upload from "../config/multer.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission, requireAnyPermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, requireAnyPermission("brands", ["view", "create", "edit", "delete"]), getAllBrands);
router.get("/search", protect, adminOnly, requireAnyPermission("brands", ["view", "create", "edit", "delete"]), searchBrands);
router.get("/:id", protect, adminOnly, requireAnyPermission("brands", ["view", "create", "edit", "delete"]), getBrandById);
router.post("/", protect, adminOnly, requirePermission("brands", "create"), upload.single("logo"), createBrand);
router.put("/:id", protect, adminOnly, requirePermission("brands", "edit"), upload.single("logo"), updateBrand);
router.patch("/:id/toggle-status", protect, adminOnly, requirePermission("brands", "edit"), toggleBrandStatus);
router.delete("/:id", protect, adminOnly, requirePermission("brands", "delete"), deleteBrand);

export default router;
