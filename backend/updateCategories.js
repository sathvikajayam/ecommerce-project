import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";

dotenv.config();

const updateCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB Connected\n");

    // Delete old categories
    await Category.deleteMany();
    console.log("✓ Cleared existing categories\n");

    // Create new categories matching product data exactly
    const categories = [
      { name: "electronics", slug: "electronics", description: "Electronic devices and gadgets", status: "active" },
      { name: "jewelery", slug: "jewelery", description: "Jewelry and accessories", status: "active" },
      { name: "men's clothing", slug: "mens-clothing", description: "Clothing for men", status: "active" },
      { name: "women's clothing", slug: "womens-clothing", description: "Clothing for women", status: "active" },
    ];

    for (const cat of categories) {
      const newCategory = await Category.create(cat);
      console.log(`✓ Created category: ${newCategory.name}`);
    }

    console.log("\n✓ All categories updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
};

updateCategories();
