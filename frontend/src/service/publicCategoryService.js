import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/categories`;

// Get all categories (public endpoint - includes only active categories with product count)
export const getAllCategories = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    // Filter to show only active categories
    return response.data.filter(category => category.status === "active");
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

// Get single category
export const getCategoryById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch category:", error);
    throw error;
  }
};

// Search categories
export const searchCategories = async (keyword) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: { keyword },
    });
    return response.data.filter(category => category.status === "active");
  } catch (error) {
    console.error("Failed to search categories:", error);
    throw error;
  }
};

// Get homepage featured categories
export const getHomepageCategories = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/homepage/categories`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch homepage categories:", error);
    throw error;
  }
};

// Get products from a specific category (supports optional pagination)
export const getCategoryProductsById = async (categoryId, page, limit) => {
  try {
    const params = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;

    const response = await axios.get(`${API_BASE_URL}/${categoryId}/products`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch category products:", error);
    throw error;
  }
};

