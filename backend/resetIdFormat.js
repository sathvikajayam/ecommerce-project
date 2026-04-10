import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";
import Brand from "./models/brandModel.js";
import Counter from "./models/Counter.js";
import { formatId } from "./utils/idGenerator.js";

dotenv.config();

const resetAndReassignIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Reset category counter and reassign IDs starting from CAT-0001
    console.log("\n🔄 Resetting Category IDs to start from CAT-0001...");
    await Counter.updateOne({ name: "category" }, { seq: 0 }, { upsert: true });
    
    const categories = await Category.find().sort({ createdAt: 1, _id: 1 });
    let categorySeq = 0;
    
    for (const category of categories) {
      categorySeq++;
      const newCategoryId = formatId({ prefix: "CAT", seq: categorySeq, pad: 4, separator: "-" });
      await Category.updateOne({ _id: category._id }, { categoryId: newCategoryId });
      console.log(`  ${categorySeq} → ${newCategoryId} (${category.name})`);
    }
    
    // Update counter to final sequence
    await Counter.updateOne({ name: "category" }, { seq: categorySeq }, { upsert: true });

    // Reset brand counter and reassign IDs starting from BRD-0001
    console.log("\n🔄 Resetting Brand IDs to start from BRD-0001...");
    await Counter.updateOne({ name: "brand" }, { seq: 0 }, { upsert: true });
    
    const brands = await Brand.find().sort({ createdAt: 1, _id: 1 });
    let brandSeq = 0;
    
    for (const brand of brands) {
      brandSeq++;
      const newBrandId = formatId({ prefix: "BRD", seq: brandSeq, pad: 4, separator: "-" });
      await Brand.updateOne({ _id: brand._id }, { brandId: newBrandId });
      console.log(`  ${brandSeq} → ${newBrandId} (${brand.name})`);
    }
    
    // Update counter to final sequence
    await Counter.updateOne({ name: "brand" }, { seq: brandSeq }, { upsert: true });

    // Verify the reset
    console.log("\n✅ Reset Complete!");
    
    const categoryCounter = await Counter.findOne({ name: "category" });
    const brandCounter = await Counter.findOne({ name: "brand" });
    
    console.log(`\n📊 Final Counter Values:`);
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

    console.log(`\n📈 Current ID Range:`);
    if (lastCategory) console.log(`  Last Category: ${lastCategory.categoryId} - ${lastCategory.name}`);
    if (lastBrand) console.log(`  Last Brand: ${lastBrand.brandId} - ${lastBrand.name}`);

    console.log(`\n📝 Next IDs to be generated:`);
    console.log(`  Category: CAT-${String((categoryCounter?.seq || 9) + 1).padStart(4, '0')}`);
    console.log(`  Brand: BRD-${String((brandCounter?.seq || 8) + 1).padStart(4, '0')}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during reset:", error);
    process.exit(1);
  }
};

resetAndReassignIds();
