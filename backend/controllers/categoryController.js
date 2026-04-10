import Category from "../models/Category.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Brand from "../models/brandModel.js";
import fs from "fs";
import supabase from "../config/supabaseClient.js";
import { getNextFormattedId } from "../utils/idGenerator.js";

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const normalizeCategoryName = (value = "") =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase();

const getCategoryFamilySet = (selectedCategoryName, allCategories) => {
  const familySet = new Set();
  const queue = [normalizeCategoryName(selectedCategoryName)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || familySet.has(current)) continue;

    familySet.add(current);

    allCategories.forEach((category) => {
      if (normalizeCategoryName(category.parentCategory) === current) {
        queue.push(normalizeCategoryName(category.name));
      }
    });
  }

  return familySet;
};

const getProductsMatchingCategoryFamily = (selectedCategoryName, allCategories, allProducts) => {
  const familySet = getCategoryFamilySet(selectedCategoryName, allCategories);

  return allProducts.filter((product) => {
    if (Array.isArray(product.categoryHierarchy) && product.categoryHierarchy.length > 0) {
      return product.categoryHierarchy.some((name) => familySet.has(normalizeCategoryName(name)));
    }

    return familySet.has(normalizeCategoryName(product.category));
  });
};

// ✅ GET ALL CATEGORIES WITH PRODUCT AND BRAND COUNT
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    const products = await Product.find({}, { category: 1, categoryHierarchy: 1, brand: 1 }).lean();

    // Get product and brand count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const relatedProducts = getProductsMatchingCategoryFamily(
          category.name,
          categories,
          products
        );
        const productCount = relatedProducts.length;
        const brandCount = new Set(
          relatedProducts
            .map((product) => product.brand)
            .filter((brand) => typeof brand === "string" && brand.trim() !== "")
        ).size;

        return {
          ...category.toObject(),
          productCount,
          brandCount,
        };
      })
    );

    res.status(200).json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET SINGLE CATEGORY
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const allCategories = await Category.find({}, { name: 1, parentCategory: 1 }).lean();
    const allProducts = await Product.find({}, { category: 1, categoryHierarchy: 1, brand: 1 }).lean();
    const relatedProducts = getProductsMatchingCategoryFamily(
      category.name,
      allCategories,
      allProducts
    );
    const productCount = relatedProducts.length;
    const brandCount = new Set(
      relatedProducts
        .map((product) => product.brand)
        .filter((brand) => typeof brand === "string" && brand.trim() !== "")
    ).size;

    res.status(200).json({
      ...category.toObject(),
      productCount,
      brandCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET PRODUCTS BY CATEGORY ID (includes all nested sub-categories)
export const getCategoryProductsById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);

    const allCategories = await Category.find({}, { name: 1, parentCategory: 1 }).lean();
    const allProducts = await Product.find().lean();
    const relatedProducts = getProductsMatchingCategoryFamily(
      category.name,
      allCategories,
      allProducts
    );

    const total = relatedProducts.length;
    const products = shouldPaginate
      ? relatedProducts.slice((page - 1) * limit, (page - 1) * limit + limit)
      : relatedProducts;

    res.status(200).json({
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products,
      total,
      count: total,
      ...(shouldPaginate
        ? {
            page,
            pages: Math.ceil(total / limit),
          }
        : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name, description, status, image, isSubCategory, parentCategory } = req.body;
    const generatedSlug = slugify(name);

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // If it's a sub-category, validate main category name
    if ((isSubCategory === true || isSubCategory === "true") && !parentCategory) {
      return res.status(400).json({ message: "Main Category Name is required for sub-categories" });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ $or: [{ name }, { slug: generatedSlug }] });
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    // Determine image source: uploaded file or provided URL
    let imageUrl = image;
    if (req.file) {
      try {
        const bucket = "Ecommerce";
        const filePath = `category-image/${Date.now()}-${req.file.originalname}`;

        if (supabase) {
          try {
            // Read file as buffer (more reliable than stream)
            const fileBuffer = fs.readFileSync(req.file.path);
            
            console.log(`Uploading category image: bucket=${bucket}, path=${filePath}, size=${fileBuffer.length} bytes`);

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
              });

            if (uploadError) {
              console.error("❌ Supabase upload error:", uploadError);
              imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            } else {
              console.log("✅ Category image uploaded successfully:", filePath);
              const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
              imageUrl = publicData?.publicUrl || publicData?.publicURL || imageUrl;
              console.log("📸 Category image public URL:", imageUrl);
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

    const categoryId = await getNextFormattedId({
      name: "category",
      prefix: "CAT",
      pad: 4,
      separator: "-"
    });

    const category = new Category({
      categoryId,
      name,
      slug: generatedSlug,
      description: description || "",
      image: imageUrl || null,
      status: status || "active",
      isSubCategory: isSubCategory === true || isSubCategory === "true" ? true : false,
      parentCategory: isSubCategory === true || isSubCategory === "true" ? parentCategory : null,
    });

    const savedCategory = await category.save();
    const allCategories = await Category.find({}, { name: 1, parentCategory: 1 }).lean();
    const allProducts = await Product.find({}, { category: 1, categoryHierarchy: 1, brand: 1 }).lean();
    const productCount = getProductsMatchingCategoryFamily(name, allCategories, allProducts).length;
    const brandCount = 0;

    res.status(201).json({
      message: "Category created successfully",
      category: {
        ...savedCategory.toObject(),
        productCount,
        brandCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { name, description, status, image, isSubCategory, parentCategory } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (description) updateData.description = description;
    if (status) updateData.status = status;

    // Handle sub-category fields
    // parentCategory is now treated as a free-text 'Main Category Name'
    if (isSubCategory !== undefined) {
      updateData.isSubCategory = isSubCategory === true || isSubCategory === "true" ? true : false;
    }

    if (parentCategory !== undefined) {
      // Store the user-typed Main Category Name, or null if not a sub-category
      updateData.parentCategory = isSubCategory === true || isSubCategory === "true" ? (parentCategory || null) : null;
    }

    // Handle image update
    if (req.file) {
      let keepLocal = false;
      try {
        const bucket = "Ecommerce";
        const filePath = `category-image/${Date.now()}-${req.file.originalname}`;
        if (fs.existsSync(req.file.path)) {
          const fileStream = fs.createReadStream(req.file.path);
          fileStream.on('error', (err) => {
            console.error('File stream error (category update):', err);
          });

          if (supabase) {
            try {
              const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(filePath, fileStream, {
                contentType: req.file.mimetype,
                upsert: false,
              });

              if (uploadError) {
                console.error("Supabase upload error:", uploadError);
                updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
                keepLocal = true;
              } else {
                const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
                updateData.image = publicData?.publicUrl || publicData?.publicURL || updateData.image;
                keepLocal = false;
              }
            } catch (uErr) {
              console.error("Supabase upload threw:", uErr);
              updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
              keepLocal = true;
            }
          } else {
            console.warn('Supabase not configured; using local URL');
            updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
            keepLocal = true;
          }
        } else {
          console.warn("Upload file not found, using local URL:", req.file.path);
          updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
          keepLocal = true;
        }
      } finally {
        if (!keepLocal) fs.unlink(req.file.path, () => {});
      }
    } else if (image) {
      updateData.image = image;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const allCategories = await Category.find({}, { name: 1, parentCategory: 1 }).lean();
    const allProducts = await Product.find({}, { category: 1, categoryHierarchy: 1, brand: 1 }).lean();
    const relatedProducts = getProductsMatchingCategoryFamily(
      category.name,
      allCategories,
      allProducts
    );
    const productCount = relatedProducts.length;
    const brandCount = new Set(
      relatedProducts
        .map((product) => product.brand)
        .filter((brand) => typeof brand === "string" && brand.trim() !== "")
    ).size;

    res.status(200).json({
      message: "Category updated successfully",
      category: {
        ...category.toObject(),
        productCount,
        brandCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ TOGGLE CATEGORY STATUS
export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Toggle status
    category.status = category.status === "active" ? "inactive" : "active";
    await category.save();

    const allCategories = await Category.find({}, { name: 1, parentCategory: 1 }).lean();
    const allProducts = await Product.find({}, { category: 1, categoryHierarchy: 1, brand: 1 }).lean();
    const relatedProducts = getProductsMatchingCategoryFamily(
      category.name,
      allCategories,
      allProducts
    );
    const productCount = relatedProducts.length;
    const brandCount = new Set(
      relatedProducts
        .map((product) => product.brand)
        .filter((brand) => typeof brand === "string" && brand.trim() !== "")
    ).size;

    res.status(200).json({
      message: `Category marked as ${category.status}`,
      category: {
        ...category.toObject(),
        productCount,
        brandCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ SEARCH CATEGORIES
export const searchCategories = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Search keyword is required" });
    }

    const searchOr = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { categoryId: { $regex: keyword, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      searchOr.push({ _id: keyword });
    }

    const categories = await Category.find({ $or: searchOr });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
