import express from "express";
import Product from "../models/Product.js";
import { buildCategoryHierarchy } from "../utils/categoryHierarchy.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import upload from "../config/multer.js";
import fs from "fs";
import supabase from "../config/supabaseClient.js";
import { getNextFormattedId } from "../utils/idGenerator.js";
import { serializeProductVariants } from "../utils/productVariantResolver.js";
const router = express.Router();

const PRODUCT_IMAGE_BUCKET = process.env.SUPABASE_PRODUCT_BUCKET || "Ecommerce";
const PRODUCT_IMAGE_FOLDER = process.env.SUPABASE_PRODUCT_FOLDER || "product-image";


// 🔍 SEARCH PRODUCTS (with pagination & filters)
router.get("/search", async (req, res) => {
  try {
    const { keyword, category, brand, sortBy, page = 1, limit = 8 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {}; // Include all products

    // 1. Keyword Search
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
        { productId: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
      ];
    }

    // 2. Category Filter
    if (category && category !== "all") {
      const cleanCategory = String(category).trim();
      // Escape special characters for regex
      const escapedCategory = cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.category = { $regex: new RegExp(`^\\s*${escapedCategory}\\s*$`, "i") };
    }

    // 3. Brand Filter
    if (brand && brand !== "all") {
      const cleanBrand = String(brand).trim();
      // Escape special characters for regex
      const escapedBrand = cleanBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.brand = { $regex: new RegExp(`^\\s*${escapedBrand}\\s*$`, "i") };
    }

    // 4. Sorting
    let sortOptions = {};
    if (sortBy === "price-low") {
      sortOptions.price = 1;
    } else if (sortBy === "price-high") {
      sortOptions.price = -1;
    } else if (sortBy === "name") {
      sortOptions.title = 1;
    } else {
      sortOptions.createdAt = -1; // Default to newest
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      products: products.map(serializeProductVariants),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ GET ALL PRODUCTS (with pagination)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments({});
    const products = await Product.find({}).skip(skip).limit(limit);
    
    res.json({
      products: products.map(serializeProductVariants),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET PRODUCT BY ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(serializeProductVariants(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ ADD NEW PRODUCT (supports image upload)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, price, description, image, category, brand, discount, rating, sizes } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: "Title, price, and category are required" });
    }

    // Determine image source: uploaded file or provided URL
    let imageUrl = image;
    if (req.file) {
      try {
        const bucket = PRODUCT_IMAGE_BUCKET;
        const filePath = `${PRODUCT_IMAGE_FOLDER}/${Date.now()}-${req.file.originalname}`;

        if (supabase) {
          try {
            // Read file as buffer (more reliable than stream)
            const fileBuffer = fs.readFileSync(req.file.path);
            
            console.log(`Uploading to Supabase: bucket=${bucket}, path=${filePath}, size=${fileBuffer.length} bytes`);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
              });

            if (uploadError) {
              console.error("❌ Supabase upload error:", uploadError);
              imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            } else {
              console.log("✅ File uploaded to Supabase successfully:", filePath);
              const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
              imageUrl = data?.publicUrl;
              if (!imageUrl) {
                console.error("❌ Failed to get public URL. Data:", data);
                imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
              } else {
                console.log("📸 Public URL:", imageUrl);
              }
            }
          } catch (uErr) {
            console.error("❌ Supabase upload error:", uErr.message);
            imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
          }
        } else {
          console.warn('⚠️ Supabase not configured; using local URL');
          imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }
      } finally {
        // Clean up temp file
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (err) {
          console.error("Error deleting temp file:", err.message);
        }
      }
    }

    // Calculate price after discount
    const numericPrice = Number(price) || 0;
    const numericDiscount = Number(discount) || 0;
    const numericFlat = Number(req.body.flatDiscount) || 0;

    let priceAfterDiscount;
    if (numericFlat > 0) {
      priceAfterDiscount = Math.max(numericPrice - numericFlat, 0).toFixed(2);
    } else if (numericDiscount > 0) {
      priceAfterDiscount = (numericPrice * (100 - numericDiscount) / 100).toFixed(2);
    } else {
      priceAfterDiscount = numericPrice.toFixed(2);
    }

    const productId = await getNextFormattedId({
      name: "product",
      prefix: "PRD",
      pad: 4,
      separator: "-"
    });

    const newProduct = new Product({
      productId,
      title,
      price,
      description,
      image: imageUrl || null,
      category,
      categoryHierarchy: await buildCategoryHierarchy(category),
      brand: brand || "",
      discount: discount || 0,
      flatDiscount: req.body.flatDiscount || 0,
      rating: rating || 0,
      priceAfterDiscount,
      sizes: sizes ? JSON.parse(sizes) : [],
    });

    const savedProduct = await newProduct.save();
    console.log(`✅ Product created: ${savedProduct._id}`);
    console.log(`📸 Product image: ${savedProduct.image}`);
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ UPDATE PRODUCT (supports image upload)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { discount, price, image } = req.body;
    const updateData = { ...req.body };

    if (req.body.category) {
      updateData.categoryHierarchy = await buildCategoryHierarchy(req.body.category);
    }

    // Handle image update
    if (req.file) {
      try {
        const bucket = PRODUCT_IMAGE_BUCKET;
        const filePath = `${PRODUCT_IMAGE_FOLDER}/${Date.now()}-${req.file.originalname}`;

        if (supabase) {
          try {
            // Read file as buffer (more reliable than stream)
            const fileBuffer = fs.readFileSync(req.file.path);
            
            console.log(`Uploading product image: bucket=${bucket}, path=${filePath}, size=${fileBuffer.length} bytes`);

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
              });

            if (uploadError) {
              console.error("❌ Supabase upload error:", uploadError);
              updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
            } else {
              console.log("✅ Product image uploaded successfully:", filePath);
              const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
              updateData.image = data?.publicUrl;
              if (!updateData.image) {
                console.error("❌ Failed to get public URL. Data:", data);
                updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
              } else {
                console.log("📸 Public URL:", updateData.image);
              }
            }
          } catch (uErr) {
            console.error("❌ Supabase upload error:", uErr.message);
            updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
          }
        } else {
          console.warn('⚠️ Supabase not configured; using local URL');
          updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
        }
      } finally {
        // Clean up temp file
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (err) {
          console.error("Error deleting temp file:", err.message);
        }
      }
    } else if (image) {
      updateData.image = image;
    }

    // Calculate price after discount if discount or price is provided
    if (discount !== undefined || price !== undefined || req.body.flatDiscount !== undefined) {
      const finalPrice = price !== undefined ? Number(price) : Number(req.body.price) || 0;
      const finalDiscount = discount !== undefined ? Number(discount) : Number(req.body.discount) || 0;
      const finalFlat = req.body.flatDiscount !== undefined ? Number(req.body.flatDiscount) : Number(req.body.flatDiscount) || 0;

      if (finalFlat > 0) {
        updateData.priceAfterDiscount = Math.max(finalPrice - finalFlat, 0).toFixed(2);
        updateData.flatDiscount = finalFlat;
      } else if (finalDiscount > 0) {
        updateData.priceAfterDiscount = (finalPrice * (100 - finalDiscount) / 100).toFixed(2);
        updateData.discount = finalDiscount;
      } else {
        updateData.priceAfterDiscount = finalPrice.toFixed(2);
        updateData.discount = finalDiscount || 0;
        updateData.flatDiscount = finalFlat || 0;
      }
    }

    // Handle sizes if provided
    if (req.body.sizes) {
      updateData.sizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });
    
    console.log(`✅ Product updated: ${product._id}`);
    console.log(`📸 Product image: ${product.image}`);
    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
