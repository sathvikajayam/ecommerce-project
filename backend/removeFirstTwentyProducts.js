import mongoose from "mongoose";
import Product from "./models/Product.js";
import dotenv from "dotenv";

dotenv.config();

const removeFirstTwentyProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB");

    // Get the first 20 products (oldest by creation date)
    const productsToDelete = await Product.find()
      .sort({ createdAt: 1 })
      .limit(20)
      .select("_id title productId createdAt");

    if (productsToDelete.length === 0) {
      console.log("⚠️  No products found to delete");
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`\n📋 Found ${productsToDelete.length} products to delete:`);
    productsToDelete.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.productId})`);
    });

    // Extract IDs for deletion
    const idsToDelete = productsToDelete.map((p) => p._id);

    // Delete the products
    const result = await Product.deleteMany({
      _id: { $in: idsToDelete }
    });

    console.log(`\n✅ Deletion Complete!`);
    console.log(`🗑️  Deleted: ${result.deletedCount} products`);

    // Show remaining count
    const remainingCount = await Product.countDocuments();
    console.log(`📦 Remaining products: ${remainingCount}`);

    await mongoose.connection.close();
    console.log(`\n✅ Database connection closed`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

removeFirstTwentyProducts();
