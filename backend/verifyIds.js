import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Brand from "./models/brandModel.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Check products
    const productsWithoutId = await Product.countDocuments({
      $or: [
        { productId: { $exists: false } },
        { productId: null },
        { productId: "" },
      ],
    });
    const totalProducts = await Product.countDocuments();

    // Check categories
    const categoriesWithoutId = await Category.countDocuments({
      $or: [
        { categoryId: { $exists: false } },
        { categoryId: null },
        { categoryId: "" },
      ],
    });
    const totalCategories = await Category.countDocuments();

    // Check brands
    const brandsWithoutId = await Brand.countDocuments({
      $or: [
        { brandId: { $exists: false } },
        { brandId: null },
        { brandId: "" },
      ],
    });
    const totalBrands = await Brand.countDocuments();

    console.log("\n✅ ID VERIFICATION RESULTS:");
    console.log(`\nProducts: ${totalProducts - productsWithoutId}/${totalProducts} have IDs`);
    if (productsWithoutId > 0) {
      console.log(`  ⚠️ Missing IDs: ${productsWithoutId}`);
    }

    console.log(`\nCategories: ${totalCategories - categoriesWithoutId}/${totalCategories} have IDs`);
    if (categoriesWithoutId > 0) {
      console.log(`  ⚠️ Missing IDs: ${categoriesWithoutId}`);
    }

    console.log(`\nBrands: ${totalBrands - brandsWithoutId}/${totalBrands} have IDs`);
    if (brandsWithoutId > 0) {
      console.log(`  ⚠️ Missing IDs: ${brandsWithoutId}`);
    }

    // Show sample IDs
    console.log("\n📋 SAMPLE IDS:");
    const sampleProduct = await Product.findOne({ productId: { $exists: true } }, { productId: 1, title: 1 });
    if (sampleProduct) {
      console.log(`Product: ${sampleProduct.productId} - ${sampleProduct.title}`);
    }

    const sampleCategory = await Category.findOne({ categoryId: { $exists: true } }, { categoryId: 1, name: 1 });
    if (sampleCategory) {
      console.log(`Category: ${sampleCategory.categoryId} - ${sampleCategory.name}`);
    }

    const sampleBrand = await Brand.findOne({ brandId: { $exists: true } }, { brandId: 1, name: 1 });
    if (sampleBrand) {
      console.log(`Brand: ${sampleBrand.brandId} - ${sampleBrand.name}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
};

run();
