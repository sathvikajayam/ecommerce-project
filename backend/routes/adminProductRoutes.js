import express from "express";
import fs from "fs";
import Product from "../models/Product.js";
import { buildCategoryHierarchy } from "../utils/categoryHierarchy.js";
import upload from "../config/multer.js";
import supabase from "../config/supabaseClient.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission, requireAnyPermission } from "../middleware/permissionMiddleware.js";
import { getNextFormattedId } from "../utils/idGenerator.js";
import { serializeProductVariants } from "../utils/productVariantResolver.js";

const router = express.Router();
const PRODUCT_IMAGE_BUCKET = process.env.SUPABASE_PRODUCT_BUCKET || "Ecommerce";
const PRODUCT_IMAGE_FOLDER = process.env.SUPABASE_PRODUCT_FOLDER || "product-image";

const parseVariants = (variants) => {
  if (!variants) return [];
  if (Array.isArray(variants)) return variants;
  if (typeof variants === "string") {
    try {
      const parsed = JSON.parse(variants);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const uploadFile = async (file) => {
  if (!file) return null;

  let fileUrl = `http://localhost:5000/uploads/${file.filename}`;

  try {
    const bucket = PRODUCT_IMAGE_BUCKET;
    const safeOriginalName = String(file.originalname || "file")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `${PRODUCT_IMAGE_FOLDER}/${Date.now()}-${safeOriginalName}`;

    if (!fs.existsSync(file.path)) return fileUrl;

    if (supabase) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        
        console.log(`Uploading file to Supabase: bucket=${bucket}, path=${filePath}, size=${fileBuffer.length} bytes`);

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("❌ Supabase upload error:", uploadError);
          return fileUrl; // Fallback to local
        }

        console.log("✅ File uploaded to Supabase successfully:", filePath);
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        fileUrl = data?.publicUrl;
        
        // Only delete if successfully uploaded to Supabase
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkErr) {
          console.error("Error deleting temp file after Supabase upload:", unlinkErr.message);
        }

        return fileUrl;
      } catch (err) {
        console.error("❌ Supabase upload error:", err.message);
        return fileUrl;
      }
    }

    // If no Supabase, keep the local file in public/uploads and return local URL
    return fileUrl;
  } catch (err) {
    console.error("❌ Error in uploadFile:", err.message);
    return fileUrl;
  }
};

// GET all products - Allow if user has ANY permission for products
router.get("/", protect, adminOnly, requireAnyPermission("products", ["view", "create", "edit", "delete"]), async (req, res) => {
  try {
    const products = await Product.find({ isAdminProduct: true });
    res.json(products.map(serializeProductVariants));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single product
router.get("/:id", protect, adminOnly, requireAnyPermission("products", ["view", "create", "edit", "delete"]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(serializeProductVariants(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE product
router.post("/", protect, adminOnly, requirePermission("products", "create"), upload.any(), async (req, res) => {
  try {
    const { title, description, category, brand } = req.body;
    const variants = parseVariants(req.body.variants);

    // Validation
    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: "At least one variant is required" });
    }

    const filesByField = (req.files || []).reduce((acc, file) => {
      acc[file.fieldname] = file;
      return acc;
    }, {});

    const processedVariants = await Promise.all(
      variants.map(async (variant, index) => {
        const variantImages = Array.isArray(variant.images) ? [...variant.images] : [];
        const variantVideos = Array.isArray(variant.videos) ? [...variant.videos] : [];

        // Handle file uploads
        const files = req.files || [];
        for (const file of files) {
          if (file.fieldname.startsWith(`variant_${index}_image_`)) {
            const url = await uploadFile(file);
            if (url && !variantImages.includes(url)) variantImages.push(url);
          } else if (file.fieldname.startsWith(`variant_${index}_video_`)) {
            const url = await uploadFile(file);
            if (url && !variantVideos.includes(url)) variantVideos.push(url);
          }
        }

        return {
          variantType: variant.variantType,
          variantValue: variant.variantValue,
          price: Number(variant.price) || 0,
          discount: Number(variant.discount) || 0,
          flatDiscount: Number(variant.flatDiscount) || 0,
          discountValidityDays: Number(variant.discountValidityDays) || 0,
          discountUserLimit: Number(variant.discountUserLimit) || 0,
          priceAfterDiscount: Number(variant.priceAfterDiscount) || Number(variant.price) || 0,
          images: variantImages,
          videos: variantVideos
        };
      })
    );

    // Use first image of first variant as main product image
    const mainImage = processedVariants[0]?.images?.[0] || null;
    
    // Extract price and discount from first variant for top-level fields
    const firstVariant = processedVariants[0] || {};
    const topLevelPrice = Number(firstVariant.price) || 0;
    const topLevelPriceAfterDiscount = Number(firstVariant.priceAfterDiscount) || topLevelPrice;
    const topLevelDiscount = Number(firstVariant.discount) || 0;
    const topLevelFlatDiscount = Number(firstVariant.flatDiscount) || 0;

    const productId = await getNextFormattedId({
      name: "product",
      prefix: "PRD",
      pad: 4,
      separator: "-"
    });

    const product = await Product.create({
      productId,
      title,
      description,
      category,
      categoryHierarchy: await buildCategoryHierarchy(category),
      brand: brand || "",
      price: topLevelPrice,
      priceAfterDiscount: topLevelPriceAfterDiscount,
      discount: topLevelDiscount,
      flatDiscount: topLevelFlatDiscount,
      image: mainImage,
      variants: processedVariants,
      rating: 0,
      isAdminProduct: true
    });

    console.log(`✅ Admin Product created: ${product._id}`);
    console.log(`📸 Product main image: ${mainImage}`);
    console.log(`🔄 Variant count: ${product.variants.length}`);
    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE product
router.put("/:id", protect, adminOnly, requirePermission("products", "edit"), upload.any(), async (req, res) => {
  try {
    const { title, description, category, brand } = req.body;
    const variants = parseVariants(req.body.variants);
    const updateData = {};

    // Update basic fields
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (category) {
      updateData.categoryHierarchy = await buildCategoryHierarchy(category);
    }
    if (brand !== undefined) updateData.brand = brand;

    // Process and update variants if provided
    if (variants && variants.length > 0) {
      const processedVariants = await Promise.all(
        variants.map(async (variant, index) => {
          // Keep existing images and videos
          const variantImages = Array.isArray(variant.images) ? [...variant.images] : [];
          const variantVideos = Array.isArray(variant.videos) ? [...variant.videos] : [];

          // Handle new file uploads
          const files = req.files || [];
          for (const file of files) {
            if (file.fieldname.startsWith(`variant_${index}_image_`)) {
              const url = await uploadFile(file);
              if (url && !variantImages.includes(url)) variantImages.push(url);
            } else if (file.fieldname.startsWith(`variant_${index}_video_`)) {
              const url = await uploadFile(file);
              if (url && !variantVideos.includes(url)) variantVideos.push(url);
            }
          }

          return {
            variantType: variant.variantType,
            variantValue: variant.variantValue,
            price: Number(variant.price) || 0,
            discount: Number(variant.discount) || 0,
            flatDiscount: Number(variant.flatDiscount) || 0,
            discountValidityDays: Number(variant.discountValidityDays) || 0,
            discountUserLimit: Number(variant.discountUserLimit) || 0,
            priceAfterDiscount: Number(variant.priceAfterDiscount) || Number(variant.price) || 0,
            images: variantImages,
            videos: variantVideos
          };
        })
      );
      updateData.variants = processedVariants;
      
      // Update top-level image from first variant's first image
      if (processedVariants.length > 0 && processedVariants[0].images?.length > 0) {
        updateData.image = processedVariants[0].images[0];
      }
      
      // Update top-level price fields from first variant
      if (processedVariants.length > 0) {
        const firstVariant = processedVariants[0];
        updateData.price = Number(firstVariant.price) || 0;
        updateData.priceAfterDiscount = Number(firstVariant.priceAfterDiscount) || Number(firstVariant.price) || 0;
        updateData.discount = Number(firstVariant.discount) || 0;
        updateData.flatDiscount = Number(firstVariant.flatDiscount) || 0;
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    console.log(`✅ Admin Product updated: ${product._id}`);
    console.log(`📸 Product main image: ${product.image}`);
    console.log(`🔄 Variant count: ${product.variants.length}`);
    res.json({ message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE product
router.delete("/:id", protect, adminOnly, requirePermission("products", "delete"), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
