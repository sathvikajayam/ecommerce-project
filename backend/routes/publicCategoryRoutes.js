import express from "express";
import {
  getAllCategories,
  getCategoryById,
  getCategoryProductsById,
  searchCategories,
} from "../controllers/categoryController.js";

const router = express.Router();

// ✅ GET ALL CATEGORIES (Public - for user-facing pages)
router.get("/", getAllCategories);

// ✅ SEARCH CATEGORIES (Public)
router.get("/search", searchCategories);

// ✅ GET PRODUCTS BY CATEGORY (Public)
router.get("/:id/products", getCategoryProductsById);

// ✅ GET SINGLE CATEGORY (Public)
router.get("/:id", getCategoryById);

export default router;
