import fs from "fs";
import Hero from "../models/Hero.js";
import HomepageBrand from "../models/HomepageBrand.js";
import HomepageCategory from "../models/HomepageCategory.js";
import TopPicksProduct from "../models/TopPicksProduct.js";
import HomepageSection from "../models/HomepageSection.js";
import Brand from "../models/brandModel.js";
import supabase from "../config/supabaseClient.js";

const HERO_IMAGE_BUCKET = process.env.SUPABASE_HERO_BUCKET || "Ecommerce";
const HERO_IMAGE_FOLDER = process.env.SUPABASE_HERO_FOLDER || "homepage-hero";

const uploadFile = async (file) => {
  if (!file) return null;

  let fileUrl = `http://localhost:5000/uploads/${file.filename}`;

  try {
    const bucket = HERO_IMAGE_BUCKET;
    const safeOriginalName = String(file.originalname || "file")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `${HERO_IMAGE_FOLDER}/${Date.now()}-${safeOriginalName}`;

    if (!fs.existsSync(file.path)) return fileUrl;

    if (supabase) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("❌ Supabase upload error:", uploadError);
          return fileUrl; 
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        fileUrl = data?.publicUrl;
        
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkErr) {
          console.error("Error deleting temp file:", unlinkErr.message);
        }

        return fileUrl;
      } catch (err) {
        console.error("❌ Supabase upload error:", err.message);
        return fileUrl;
      }
    }
    return fileUrl;
  } catch (err) {
    console.error("❌ Error in uploadFile:", err.message);
    return fileUrl;
  }
};

// @desc    Get all hero images
// @route   GET /api/homepage/hero
// @access  Public
export const getHeroImages = async (req, res) => {
  try {
    const heroes = await Hero.find().sort({ displayOrder: 1 });
    res.json(heroes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a hero image
// @route   POST /api/homepage/hero
// @access  Private/Admin
export const addHeroImage = async (req, res) => {
  try {
    const { title, subtitle, link, position, displayOrder } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const imageUrl = await uploadFile(req.file);

    const hero = await Hero.create({
      title,
      subtitle,
      link,
      imageUrl,
      position: Number(position) || 0,
      displayOrder: Number(displayOrder) || 0,
      status: "Live"
    });

    res.status(201).json(hero);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a hero image
// @route   PUT /api/homepage/hero/:id
// @access  Private/Admin
export const updateHeroImage = async (req, res) => {
  try {
    const { title, subtitle, link, position, displayOrder, status } = req.body;
    const hero = await Hero.findById(req.params.id);

    if (!hero) {
      return res.status(404).json({ message: "Hero image not found" });
    }

    if (req.file) {
      hero.imageUrl = await uploadFile(req.file);
    }

    hero.title = title || hero.title;
    hero.subtitle = subtitle || hero.subtitle;
    hero.link = link || hero.link;
    hero.position = position !== undefined ? Number(position) : hero.position;
    hero.displayOrder = displayOrder !== undefined ? Number(displayOrder) : hero.displayOrder;
    hero.status = status || hero.status;

    const updatedHero = await hero.save();
    res.json(updatedHero);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a hero image
// @route   DELETE /api/homepage/hero/:id
// @access  Private/Admin
export const deleteHeroImage = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);

    if (!hero) {
      return res.status(404).json({ message: "Hero image not found" });
    }

    await hero.deleteOne();
    res.json({ message: "Hero image removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get homepage brands
// @route   GET /api/homepage/brands
// @access  Public
export const getHomepageBrands = async (req, res) => {
  try {
    const brands = await HomepageBrand.find().sort({ slot: 1 }).populate('brand');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update homepage brands layout
// @route   POST /api/homepage/brands
// @access  Private/Admin
export const updateHomepageBrands = async (req, res) => {
  try {
    const { layout } = req.body; // Array of { slot: 1, brandId: "..." }
    
    if (!layout || !Array.isArray(layout)) {
      return res.status(400).json({ message: "Invalid layout data" });
    }

    const results = [];
    for (const item of layout) {
      const updated = await HomepageBrand.findOneAndUpdate(
        { slot: Number(item.slot) },
        { brand: item.brandId || null },
        { upsert: true, new: true }
      ).populate('brand');
      results.push(updated);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get homepage categories
// @route   GET /api/homepage/categories
// @access  Public
export const getHomepageCategories = async (req, res) => {
  try {
    const categories = await HomepageCategory.find().sort({ slot: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update homepage categories layout
// @route   POST /api/homepage/categories
// @access  Private/Admin
export const updateHomepageCategories = async (req, res) => {
  try {
    const { layout } = req.body; // Array of { slot: 1, categoryName: "..." }
    
    if (!layout || !Array.isArray(layout)) {
      return res.status(400).json({ message: "Invalid layout data" });
    }

    const results = [];
    for (const item of layout) {
      const updated = await HomepageCategory.findOneAndUpdate(
        { slot: Number(item.slot) },
        { categoryName: item.categoryName || null },
        { upsert: true, new: true }
      );
      results.push(updated);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top picks products
// @route   GET /api/homepage/top-picks
// @access  Public
export const getTopPicksProducts = async (req, res) => {
  try {
    const topPicks = await TopPicksProduct.find()
      .sort({ position: 1 })
      .populate('product');
    res.json(topPicks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update top picks layout
// @route   POST /api/homepage/top-picks
// @access  Private/Admin
export const updateTopPicksProducts = async (req, res) => {
  try {
    const { layout } = req.body; // Array of { position: 1, productId: "..." }
    
    if (!layout || !Array.isArray(layout)) {
      return res.status(400).json({ message: "Invalid layout data" });
    }

    const results = [];
    for (const item of layout) {
      const updated = await TopPicksProduct.findOneAndUpdate(
        { position: Number(item.position) },
        { product: item.productId || null },
        { upsert: true, new: true }
      ).populate('product');
      results.push(updated);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sanitizeSectionItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean);
};

// @desc    Get homepage sections
// @route   GET /api/homepage/sections
// @access  Public
export const getHomepageSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find()
      .sort({ displayOrder: 1 })
      .populate("products")
      .populate("category")
      .populate("brand")
      .populate("categories")
      .populate("brands");
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create homepage section
// @route   POST /api/homepage/sections
// @access  Private/Admin
export const createHomepageSection = async (req, res) => {
  try {
    const { title, displayOrder = 0, products } = req.body;
    const categoryId = req.body.categoryId;
    const brandId = req.body.brandId;
    const requestedType = req.body.type;
    const sectionType = ["products", "categories", "brands"].includes(requestedType)
      ? requestedType
      : "products";
    const sanitizedProducts = sectionType === "products" ? sanitizeSectionItems(req.body.products) : [];
    const sanitizedCategories = sectionType === "categories" ? sanitizeSectionItems(req.body.categories) : [];
    const sanitizedBrands = sectionType === "brands" ? sanitizeSectionItems(req.body.brands) : [];

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Section title is required" });
    }
    if (sectionType === "products" && sanitizedProducts.length === 0) {
      return res.status(400).json({ message: "Select at least one product for this section" });
    }
    if (sectionType === "categories" && sanitizedCategories.length === 0) {
      return res.status(400).json({ message: "Select at least one category for this section" });
    }
    if (sectionType === "brands" && sanitizedBrands.length === 0) {
      return res.status(400).json({ message: "Select at least one brand for this section" });
    }
    const section = await HomepageSection.create({
      title: title.trim(),
      displayOrder: Number(displayOrder) || 0,
      type: sectionType,
      products: sanitizedProducts,
      category: sectionType === "products" ? categoryId || null : null,
      brand: sectionType === "products" ? brandId || null : null,
      categories: sectionType === "categories" ? sanitizedCategories : [],
      brands: sectionType === "brands" ? sanitizedBrands : [],
    });
    await section.populate("products category brand categories brands");
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update homepage section
// @route   PUT /api/homepage/sections/:id
// @access  Private/Admin
export const updateHomepageSection = async (req, res) => {
  try {
    const { title, products, categories, brands, displayOrder, status } = req.body;
    const categoryId = req.body.categoryId;
    const brandId = req.body.brandId;
    const requestedType = req.body.type;
    const section = await HomepageSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    if (title) {
      section.title = title.trim();
    }
    if (typeof displayOrder !== "undefined") {
      section.displayOrder = Number(displayOrder) || 0;
    }
    if (status) {
      section.status = status;
    }
    const resolvedType = ["products", "categories", "brands"].includes(requestedType)
      ? requestedType
      : section.type || "products";
    section.type = resolvedType;

    if (resolvedType === "products") {
      if (Array.isArray(products)) {
        section.products = sanitizeSectionItems(products);
      }
      if (typeof categoryId !== "undefined") {
        section.category = categoryId || null;
      }
      if (typeof brandId !== "undefined") {
        section.brand = brandId || null;
      }
      section.categories = [];
      section.brands = [];
    } else if (resolvedType === "categories") {
      if (Array.isArray(categories)) {
        section.categories = sanitizeSectionItems(categories);
      }
      section.products = [];
      section.brands = [];
      section.category = null;
      section.brand = null;
    } else {
      if (Array.isArray(brands)) {
        section.brands = sanitizeSectionItems(brands);
      }
      section.products = [];
      section.categories = [];
      section.category = null;
      section.brand = null;
    }

    const updated = await section.save();
    await updated.populate("products category brand categories brands");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete homepage section
// @route   DELETE /api/homepage/sections/:id
// @access  Private/Admin
export const deleteHomepageSection = async (req, res) => {
  try {
    const deleted = await HomepageSection.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.json({ message: "Section removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
