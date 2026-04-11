import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Brand from "./models/brandModel.js";
import User from "./models/User.js";
import Cart from "./models/Cart.js";
import Order from "./models/Order.js";
import Coupon from "./models/Coupon.js";
import Review from "./models/Review.js";
import Counter from "./models/Counter.js";
import Contact from "./models/Contact.js";
import Hero from "./models/Hero.js";
import HomepageBrand from "./models/HomepageBrand.js";
import HomepageCategory from "./models/HomepageCategory.js";
import HomepageSection from "./models/HomepageSection.js";
import TopPicksProduct from "./models/TopPicksProduct.js";

dotenv.config();

const LOCAL_URI = "mongodb://127.0.0.1:27017/react_ecommerce";
const ATLAS_URI = process.env.MONGO_URI;

const collectionsToMigrate = [
  { model: Product, name: "Products" },
  { model: Category, name: "Categories" },
  { model: Brand, name: "Brands" },
  { model: User, name: "Users" },
  { model: Cart, name: "Carts" },
  { model: Order, name: "Orders" },
  { model: Coupon, name: "Coupons" },
  { model: Review, name: "Reviews" },
  { model: Counter, name: "Counters" },
  { model: Contact, name: "Contacts" },
  { model: Hero, name: "Heroes" },
  { model: HomepageBrand, name: "HomepageBrands" },
  { model: HomepageCategory, name: "HomepageCategories" },
  { model: HomepageSection, name: "HomepageSections" },
  { model: TopPicksProduct, name: "TopPicksProducts" },
];

const migrate = async () => {
  try {
    console.log("🚀 Starting Migration...");

    // 1. Connect to Local MongoDB
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log("✅ Connected to Local MongoDB");

    // 2. Connect to Atlas MongoDB
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log("✅ Connected to Atlas MongoDB");

    for (const item of collectionsToMigrate) {
      console.log(`\n📦 Migrating ${item.name}...`);
      
      const LocalModel = localConn.model(item.model.modelName, item.model.schema);
      const AtlasModel = atlasConn.model(item.model.modelName, item.model.schema);

      const data = await LocalModel.find({});
      console.log(`📖 Found ${data.length} documents in local ${item.name}`);

      if (data.length > 0) {
        // Clear Atlas collection first
        await AtlasModel.deleteMany({});
        console.log(`🧹 Cleared Atlas ${item.name}`);

        // Insert into Atlas
        await AtlasModel.insertMany(data);
        console.log(`✅ Successfully migrated ${data.length} ${item.name} to Atlas`);
      } else {
        console.log(`⚠️ No data found for ${item.name}, skipping insert.`);
      }
    }

    console.log("\n✨ Migration Completed Successfully!");
    
    await localConn.close();
    await atlasConn.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration Error:", error);
    process.exit(1);
  }
};

migrate();
