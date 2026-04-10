import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";

dotenv.config();

const addCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB Connected");

    const categories = [
      { name: "Electronics", slug: "electronics", description: "Electronic devices and gadgets", status: "active" },
      { name: "Jewelery", slug: "jewelery", description: "Jewelry and accessories", status: "active" },
      { name: "Mens Clothing", slug: "mens-clothing", description: "Clothing for men", status: "active" },
      { name: "Womens Clothing", slug: "womens-clothing", description: "Clothing for women", status: "active" },
    ];

    for (const cat of categories) {
      const existingCategory = await Category.findOne({ name: cat.name });
      if (!existingCategory) {
        const newCategory = await Category.create(cat);
        console.log(`✓ Created category: ${newCategory.name}`);
      } else {
        console.log(`⊘ Category already exists: ${cat.name}`);
      }
    }

    console.log("✓ Categories added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
};

addCategories();
