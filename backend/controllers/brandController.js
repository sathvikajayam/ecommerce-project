import fs from "fs";
import mongoose from "mongoose";
import Brand from "../models/brandModel.js";
import Product from "../models/Product.js";
import supabase from "../config/supabaseClient.js";
import { getNextFormattedId } from "../utils/idGenerator.js";

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// ✅ GET ALL BRANDS WITH PRODUCT COUNT
export const getAllBrands = async (req, res) => {
  try {
    console.log("🔍 Fetching all brands...");
    const brands = await Brand.find().sort({ createdAt: -1 });
    console.log(`📦 Found ${brands.length} brands`);
    
    // Get product count and category count for each brand
    const brandsWithStats = await Promise.all(
      brands.map(async (brand) => {
        try {
          // Escape special characters for regex
          const escapedBrandName = brand.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const brandRegex = new RegExp(`^\\s*${escapedBrandName}\\s*$`, "i");

          const productCount = await Product.countDocuments({ brand: brandRegex });
          
          // Count unique categories across all products of this brand
          const distinctCategories = await Product.distinct("category", { brand: brandRegex });
          const categoryCount = distinctCategories.length;

          return {
            ...brand.toObject(),
            productCount,
            categoryCount,
          };
        } catch (err) {
          console.error(`❌ Error processing brand ${brand.name}:`, err.message);
          return {
            ...brand.toObject(),
            productCount: 0,
            categoryCount: 0,
          };
        }
      })
    );
    
    console.log(`✅ Returning ${brandsWithStats.length} brands with stats`);
    res.status(200).json(brandsWithStats);
  } catch (error) {
    console.error("❌ Error in getAllBrands:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET SINGLE BRAND
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CREATE BRAND
export const createBrand = async (req, res) => {
  try {
    const { name, logo, description, website, status } = req.body;
    const generatedSlug = slugify(name);

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ $or: [{ name }, { slug: generatedSlug }] });
    if (existingBrand) {
      return res.status(400).json({ message: "Brand with this name already exists" });
    }

    // Determine logo source: uploaded file or provided URL
    let logoUrl = logo;
    if (req.file) {
      try {
        const bucket = process.env.SUPABASE_BRAND_BUCKET || "Ecommerce";
        const folder = process.env.SUPABASE_BRAND_FOLDER || "brand-logo";
        const filePath = `${folder}/${Date.now()}-${req.file.originalname}`;

        if (supabase) {
          try {
            // Read file as buffer (more reliable than stream)
            const fileBuffer = fs.readFileSync(req.file.path);
            
            console.log(`Uploading brand logo: bucket=${bucket}, path=${filePath}, size=${fileBuffer.length} bytes`);

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
              });

            if (uploadError) {
              console.error("❌ Supabase upload error:", uploadError);
              logoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            } else {
              console.log("✅ Brand logo uploaded successfully:", filePath);
              const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
              logoUrl = publicData?.publicUrl || publicData?.publicURL || logoUrl;
              console.log("📸 Brand logo public URL:", logoUrl);
            }
          } catch (uErr) {
            console.error("❌ Supabase upload error:", uErr.message);
            logoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
          }
        } else {
          console.warn('⚠️ Supabase not configured; using local URL');
          logoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
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

    const brandId = await getNextFormattedId({
      name: "brand",
      prefix: "BRD",
      pad: 4,
      separator: "-"
    });

    const brand = new Brand({
      brandId,
      name,
      slug: generatedSlug,
      logo: logoUrl || null,
      description: description || "",
      website: website || "",
      status: status || "active",
    });

    const savedBrand = await brand.save();
    // Escape special characters for regex
    const escapedBrandNameForCount = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const brandRegexForCount = new RegExp(`^\\s*${escapedBrandNameForCount}\\s*$`, "i");

    const productCount = await Product.countDocuments({ brand: brandRegexForCount });
    const distinctCategories = await Product.distinct("category", { brand: brandRegexForCount });
    const categoryCount = distinctCategories.length;
    
    res.status(201).json({ 
      message: "Brand created successfully", 
      brand: {
        ...savedBrand.toObject(),
        productCount,
        categoryCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE BRAND
export const updateBrand = async (req, res) => {
  try {
    const { name, logo, description, website, status } = req.body;
    
    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (description) updateData.description = description;
    if (website) updateData.website = website;
    if (status) updateData.status = status;

    // Handle logo update
    if (req.file) {
      try {
        const bucket = process.env.SUPABASE_BRAND_BUCKET || "Ecommerce";
        const folder = process.env.SUPABASE_BRAND_FOLDER || "brand-logo";
        const filePath = `${folder}/${Date.now()}-${req.file.originalname}`;

        if (supabase) {
          try {
            // Read file as buffer (more reliable than stream)
            const fileBuffer = fs.readFileSync(req.file.path);
            
            console.log(`Uploading brand logo: bucket=${bucket}, path=${filePath}, size=${fileBuffer.length} bytes`);

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
              });

            if (uploadError) {
              console.error("❌ Supabase upload error:", uploadError);
              updateData.logo = `http://localhost:5000/uploads/${req.file.filename}`;
            } else {
              console.log("✅ Brand logo uploaded successfully:", filePath);
              const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
              updateData.logo = publicData?.publicUrl || publicData?.publicURL || updateData.logo;
              console.log("📸 Brand logo public URL:", updateData.logo);
            }
          } catch (uErr) {
            console.error("❌ Supabase upload error:", uErr.message);
            updateData.logo = `http://localhost:5000/uploads/${req.file.filename}`;
          }
        } else {
          console.warn('⚠️ Supabase not configured; using local URL');
          updateData.logo = `http://localhost:5000/uploads/${req.file.filename}`;
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
    } else if (logo !== undefined) {
      updateData.logo = logo;
    }

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const productCount = await Product.countDocuments({ brand: brand.name });
    const distinctCategories = await Product.distinct("category", { brand: brand.name });
    const categoryCount = distinctCategories.length;

    res.status(200).json({ 
      message: "Brand updated successfully", 
      brand: {
        ...brand.toObject(),
        productCount,
        categoryCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE BRAND
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json({ message: "Brand deleted successfully", brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ TOGGLE BRAND STATUS
export const toggleBrandStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Toggle status
    brand.status = brand.status === "active" ? "inactive" : "active";
    await brand.save();

    const productCount = await Product.countDocuments({ brand: brand.name });
    const distinctCategories = await Product.distinct("category", { brand: brand.name });
    const categoryCount = distinctCategories.length;

    res.status(200).json({ 
      message: `Brand marked as ${brand.status}`, 
      brand: {
        ...brand.toObject(),
        productCount,
        categoryCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ SEARCH BRANDS
export const searchBrands = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Search keyword is required" });
    }

    const searchOr = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { brandId: { $regex: keyword, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      searchOr.push({ _id: keyword });
    }

    const brands = await Brand.find({ $or: searchOr });

    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET PRODUCTS BY BRAND (Public)
export const getBrandProducts = async (req, res) => {
  try {
    const { brandId } = req.params;
    
    // Validate brandId is a valid MongoDB ObjectId
    if (!brandId || brandId.length !== 24 && !brandId.match(/^[0-9a-f]{24}$/i)) {
      return res.status(400).json({ message: "Invalid brand ID format" });
    }

    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);

    // Find the brand first
    let brand;
    try {
      brand = await Brand.findById(brandId);
    } catch (mongoError) {
      // Handle invalid MongoDB ObjectId
      return res.status(400).json({ message: "Invalid brand ID format" });
    }

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Escape special characters for regex
    const escapedBrand = brand.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const brandRegex = new RegExp(`^\\s*${escapedBrand}\\s*$`, "i");

    if (!shouldPaginate) {
      // Backward compatible: return ALL products (existing behavior)
      const products = await Product.find({ brand: brandRegex });

      return res.status(200).json({
        brand,
        products,
        count: products.length,
      });
    }

    // Paginated results (preferred for infinite scrolling)
    const query = { brand: brandRegex };
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      brand,
      products,
      total,
      count: total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error in getBrandProducts:", error.message);
    res.status(500).json({ message: error.message });
  }
};
