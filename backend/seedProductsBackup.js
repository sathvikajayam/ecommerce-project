import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./models/Product.js";
import { formatId, getNextSequence } from "./utils/idGenerator.js";
import connectDB from "./config/db.js";

dotenv.config();

const sampleProducts = [
  {
    title: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    price: 109.95,
    description: "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday",
    category: "electronics",
    brand: "Apple",
    image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
    rating: 3.9
  },
  {
    title: "Mens Casual Premium Slim Fit T-Shirts ",
    price: 22.3,
    description: "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing.",
    category: "men's clothing",
    brand: "Nike",
    image: "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg",
    rating: 4.1
  },
  {
    title: "Mens Cotton Jacket",
    price: 55.99,
    description: "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors.",
    category: "men's clothing",
    brand: "Adidas",
    image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg",
    rating: 4.7
  },
  {
    title: "Solid Gold Petite Micropave ",
    price: 168,
    description: "Satisfaction Guaranteed. Return or exchange any order within 30 days.Designed and sold by Hafeez Center in the United States. Satisfaction Guaranteed. Return or exchange any order within 30 days.",
    category: "jewelery",
    brand: "Tiffany",
    image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_.jpg",
    rating: 3.9
  }
];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("Existing products clearing...");
    await Product.deleteMany();
    console.log("Existing products cleared");

    const formattedProducts = [];
    for (const item of sampleProducts) {
      const discount = Math.floor(Math.random() * 30) + 5; 
      const priceAfterDiscount = (item.price * (100 - discount) / 100).toFixed(2);
      const seq = await getNextSequence("product");
      const productId = formatId({ prefix: "PRD", seq, pad: 4, separator: "-" });

      formattedProducts.push({
        ...item,
        productId,
        discount,
        priceAfterDiscount,
      });
    }

    const result = await Product.insertMany(formattedProducts);
    console.log(`✅ ${result.length} products seeded successfully from backup!`);

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedProducts();
