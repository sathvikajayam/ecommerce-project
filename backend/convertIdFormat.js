import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";
import Brand from "./models/brandModel.js";
import Counter from "./models/Counter.js";
import { getNextFormattedId } from "./utils/idGenerator.js";

dotenv.config();

const convertIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Convert existing category IDs from CAT001 format to CAT-0001 format
    console.log("\n🔄 Converting Category IDs...");
    const categories = await Category.find({ categoryId: { $exists: true, $ne: null } });
    
    for (const category of categories) {
      const newCategoryId = await getNextFormattedId({
        name: "category",
        prefix: "CAT",
        pad: 4,
        separator: "-"
      });
      
      await Category.updateOne({ _id: category._id }, { categoryId: newCategoryId });
      console.log(`  ${category.categoryId} → ${newCategoryId} (${category.name})`);
    }

    // Convert existing brand IDs from BRD001 format to BRD-0001 format
    console.log("\n🔄 Converting Brand IDs...");
    const brands = await Brand.find({ brandId: { $exists: true, $ne: null } });
    
    for (const brand of brands) {
      const newBrandId = await getNextFormattedId({
        name: "brand",
        prefix: "BRD",
        pad: 4,
        separator: "-"
      });
      
      await Brand.updateOne({ _id: brand._id }, { brandId: newBrandId });
      console.log(`  ${brand.brandId} → ${newBrandId} (${brand.name})`);
    }

    // Verify the conversion
    console.log("\n✅ Conversion Complete!");
    
    const categoryCounter = await Counter.findOne({ name: "category" });
    const brandCounter = await Counter.findOne({ name: "brand" });
    
    console.log(`\n📊 Current Counter Values:`);
    console.log(`  Category counter: ${categoryCounter?.seq || 0}`);
    console.log(`  Brand counter: ${brandCounter?.seq || 0}`);
    
    const lastCategory = await Category.findOne({ categoryId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select({ categoryId: 1, name: 1 })
      .lean();
    
    const lastBrand = await Brand.findOne({ brandId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select({ brandId: 1, name: 1 })
      .lean();

    console.log(`\n📈 Highest Existing IDs:`);
    if (lastCategory) console.log(`  Last Category: ${lastCategory.categoryId} - ${lastCategory.name}`);
    if (lastBrand) console.log(`  Last Brand: ${lastBrand.brandId} - ${lastBrand.name}`);

    console.log(`\n📝 Next IDs to be generated:`);
    console.log(`  Category: CAT-${String((categoryCounter?.seq || 9) + 1).padStart(4, '0')}`);
    console.log(`  Brand: BRD-${String((brandCounter?.seq || 8) + 1).padStart(4, '0')}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during conversion:", error);
    process.exit(1);
  }
};

convertIds();
