import axios from "axios";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import { formatId, getNextSequence } from "./utils/idGenerator.js";
import connectDB from "./config/db.js";

dotenv.config();

// Define brands mapping for products
const brandMapping = {
  "electronics": ["Apple", "Samsung", "Sony", "LG"],
  "jewelery": ["Gucci", "Tiffany"],
  "men's clothing": ["Nike", "Adidas", "Puma"],
  "women's clothing": ["Nike", "Adidas"],
};

const getRandomBrand = (category) => {
  const brands = brandMapping[category.toLowerCase()] || ["Generic Brand"];
  return brands[Math.floor(Math.random() * brands.length)];
};

const seedProducts = async () => {
  try {
    await connectDB();

    const { data } = await axios.get("https://fakestoreapi.com/products");
    console.log(`Fetched ${data.length} products from FakeStore API`);

    await Product.deleteMany();
    console.log("Existing products cleared");

    const formattedProducts = [];
    for (const item of data) {
      const discount = Math.floor(Math.random() * 30) + 5; // 5-35% discount
      const price = parseFloat(item.price);
      const priceAfterDiscount = (price * (100 - discount) / 100).toFixed(2);
      const seq = await getNextSequence("product");
      const productId = formatId({ prefix: "PRD", seq, pad: 4, separator: "-" });

      formattedProducts.push({
        productId,
        title: item.title,
        price: item.price,
        description: item.description,
        image: item.image,
        category: item.category,
        brand: getRandomBrand(item.category),
        discount: discount,
        priceAfterDiscount: priceAfterDiscount,
        rating: Math.floor(Math.random() * 5) + 1,
      });
    }

    console.log(`Processing ${formattedProducts.length} products with brands, ratings, and discounts...`);

    const result = await Product.insertMany(formattedProducts);
    console.log(`✅ ${result.length} products seeded successfully with brands, ratings, and discounts!`);

    // Verify seeding
    const count = await Product.countDocuments();
    console.log(`Total products in DB: ${count}`);

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedProducts();
