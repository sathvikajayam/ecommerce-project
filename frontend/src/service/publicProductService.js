import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/products";

// Get all products (public endpoint with optional pagination)
export const getAllProducts = async (page = 1, limit = 8) => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    throw error;
  }
};

// Search products
export const searchProducts = async (keyword) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: { keyword },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to search products:", error);
    throw error;
  }
};
