import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

const checkCategoryCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB Connected\n");

    // Get all unique categories from products
    const categories = await Product.distinct("category");
    
    console.log("📊 Product Categories and Counts:");
    console.log("=".repeat(60));
    
    for (const category of categories) {
      const productCount = await Product.countDocuments({ category });
      const brands = await Product.find({ category }).distinct("brand");
      const brandCount = brands.length;
      
      console.log(`\n📁 Category: "${category}"`);
      console.log(`   Products: ${productCount}`);
      console.log(`   Brands: ${brandCount}`);
      if (brands.length > 0) {
        console.log(`   Brands: ${brands.join(", ")}`);
      }
    }
    
    console.log("\n" + "=".repeat(60));
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
};

checkCategoryCounts();
