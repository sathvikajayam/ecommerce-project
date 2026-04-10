import mongoose from "mongoose";
import Product from "./models/Product.js";
import dotenv from "dotenv";

dotenv.config();

const markExistingProductsAsAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB");

    // Count existing products
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Total products in database: ${totalProducts}`);

    // Count products already marked as admin
    const adminProducts = await Product.countDocuments({ isAdminProduct: true });
    console.log(`✅ Products already marked as admin: ${adminProducts}`);

    // Count products NOT marked as admin
    const nonAdminProducts = await Product.countDocuments({
      $or: [
        { isAdminProduct: false },
        { isAdminProduct: { $exists: false } }
      ]
    });
    console.log(`⚠️  Products NOT marked as admin: ${nonAdminProducts}`);

    if (nonAdminProducts > 0) {
      // Update all products to mark them as admin products
      const result = await Product.updateMany(
        {
          $or: [
            { isAdminProduct: false },
            { isAdminProduct: { $exists: false } }
          ]
        },
        { $set: { isAdminProduct: true } }
      );

      console.log(`\n✅ Migration Complete!`);
      console.log(`📝 Updated: ${result.modifiedCount} products`);
      console.log(`📞 Matched: ${result.matchedCount} products`);
    } else {
      console.log(`\n✅ All products are already marked as admin products!`);
    }

    // Verify final count
    const finalAdminCount = await Product.countDocuments({ isAdminProduct: true });
    console.log(`\n🎯 Final admin products count: ${finalAdminCount}/${totalProducts}`);

    await mongoose.connection.close();
    console.log(`\n✅ Database connection closed`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

markExistingProductsAsAdmin();
