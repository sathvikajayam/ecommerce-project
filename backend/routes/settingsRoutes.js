import express from "express";
import upload from "../config/multer.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { getNavbarSettings, updateNavbarLogo } from "../controllers/siteSettingsController.js";

const router = express.Router();

router.get("/navbar", getNavbarSettings);

router.put(
  "/navbar/logo",
  protect,
  adminOnly,
  requirePermission("navbar", "edit"),
  upload.single("image"),
  updateNavbarLogo
);

export default router;
