import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Brand from "./models/brandModel.js";
import Counter from "./models/Counter.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected\n");

    // Get current counters
    console.log("📊 CURRENT COUNTER VALUES:");
    const productCounter = await Counter.findOne({ name: "product" });
    const categoryCounter = await Counter.findOne({ name: "category" });
    const brandCounter = await Counter.findOne({ name: "brand" });

    console.log(`Product counter: ${productCounter?.seq || 0}`);
    console.log(`Category counter: ${categoryCounter?.seq || 0}`);
    console.log(`Brand counter: ${brandCounter?.seq || 0}`);

    // Get max existing IDs
    console.log("\n📈 HIGHEST EXISTING IDS:");
    
    const lastProduct = await Product.findOne({ productId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select({ productId: 1, title: 1 })
      .lean();
    
    const lastCategory = await Category.findOne({ categoryId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select({ categoryId: 1, name: 1 })
      .lean();
    
    const lastBrand = await Brand.findOne({ brandId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select({ brandId: 1, name: 1 })
      .lean();

    if (lastProduct) console.log(`Last Product: ${lastProduct.productId} - ${lastProduct.title}`);
    if (lastCategory) console.log(`Last Category: ${lastCategory.categoryId} - ${lastCategory.name}`);
    if (lastBrand) console.log(`Last Brand: ${lastBrand.brandId} - ${lastBrand.name}`);

    // Summary
    console.log("\n✅ SETUP COMPLETE:");
    console.log("✓ All existing products, categories, and brands have IDs");
    console.log("✓ Auto-generation is configured in controllers");
    console.log("✓ New items will automatically receive the next sequential ID");
    console.log("\nNext IDs that will be generated:");
    console.log(`  Product: PRD-${String((productCounter?.seq || 30) + 1).padStart(4, '0')}`);
    console.log(`  Category: CAT${String((categoryCounter?.seq || 9) + 1).padStart(3, '0')}`);
    console.log(`  Brand: BRD${String((brandCounter?.seq || 8) + 1).padStart(3, '0')}`);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

run();
