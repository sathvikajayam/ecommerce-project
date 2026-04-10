import Product from "../models/Product.js";
import supabase from "../config/supabaseClient.js";
import { getNextFormattedId } from "../utils/idGenerator.js";

// 🔍 SEARCH PRODUCTS
export const searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword;

    // If no keyword sent
    if (!keyword) {
      return res.status(400).json({ message: "Search keyword is required" });
    }

    // Case-insensitive search using regex
    const products = await Product.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
      ],
    });

    res.status(200).json(products);

  } catch (error) {
    res.status(500).json({
      message: "Search failed",
      error: error.message,
    });
  }
};
// ADD PRODUCT WITH IMAGE
export const addProduct = async (req, res) => {
  try {

    const file = req.file;

    let imageUrl = "";

    if (file) {

      const fileName = Date.now() + "-" + file.originalname;

      const { data, error } = await supabase.storage
        .from("Ecommerce")
        .upload(`product-image/${fileName}`, file.buffer);

      if (error) {
        return res.status(400).json({ message: "Image upload failed", error });
      }

      const { data } = supabase.storage
        .from("Ecommerce")
        .getPublicUrl(`product-image/${fileName}`);

      imageUrl = data?.publicUrl || "";
      if (!imageUrl) {
        console.error("Failed to get public URL from Supabase. Data:", data);
      }
    }

    const productId = await getNextFormattedId({
      name: "product",
      prefix: "PRD",
      pad: 4,
      separator: "-"
    });

    const product = new Product({
      productId,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      image: imageUrl
    });

    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (error) {
    res.status(500).json({
      message: "Product creation failed",
      error: error.message
    });
  }
};
