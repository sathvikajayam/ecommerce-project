import express from "express";
import {
  getAllBrands,
  getBrandById,
  searchBrands,
  getBrandProducts,
} from "../controllers/brandController.js";

const router = express.Router();

// ✅ GET ALL BRANDS (Public - for user-facing pages)
router.get("/", getAllBrands);

// ✅ SEARCH BRANDS (Public)
router.get("/search", searchBrands);

// ✅ GET PRODUCTS BY BRAND (Public)
router.get("/:brandId/products", getBrandProducts);

// ✅ GET SINGLE BRAND (Public)
router.get("/:id", getBrandById);

export default router;
