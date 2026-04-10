import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  searchCategories,
} from "../controllers/categoryController.js";
import upload from "../config/multer.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission, requireAnyPermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, requireAnyPermission("categories", ["view", "create", "edit", "delete"]), getAllCategories);
router.get("/search", protect, adminOnly, requireAnyPermission("categories", ["view", "create", "edit", "delete"]), searchCategories);
router.get("/:id", protect, adminOnly, requireAnyPermission("categories", ["view", "create", "edit", "delete"]), getCategoryById);
router.post("/", protect, adminOnly, requirePermission("categories", "create"), upload.single("image"), createCategory);
router.put("/:id", protect, adminOnly, requirePermission("categories", "edit"), upload.single("image"), updateCategory);
router.patch("/:id/toggle-status", protect, adminOnly, requirePermission("categories", "edit"), toggleCategoryStatus);
router.delete("/:id", protect, adminOnly, requirePermission("categories", "delete"), deleteCategory);

export default router;
