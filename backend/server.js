import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import publicBrandRoutes from "./routes/publicBrandRoutes.js";
import publicCategoryRoutes from "./routes/publicCategoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import homepageRoutes from "./routes/homepageRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminCouponRoutes from "./routes/adminCouponRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

import connectDB from "./config/db.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect to Database
connectDB();

const app = express();

// Middleware - CORS configured for local and deployed frontend
app.use(cors({
  origin: [
    "http://localhost:3000",   // ✅ local frontend
    "https://ecommerce-project-chi-umber.vercel.app" // ✅ deployed frontend
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Serve static uploaded images
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/brands", brandRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/brands", publicBrandRoutes);
app.use("/api/categories", publicCategoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/coupons", couponRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Loaded ✅" : "Missing ❌");
