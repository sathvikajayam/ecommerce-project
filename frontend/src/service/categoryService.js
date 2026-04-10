import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/admin/categories";
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

// Get all categories with product and brand count
export const getAllCategories = async () => {
  try {
    const response = await axios.get(API_BASE_URL, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

// Get single category
export const getCategoryById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to fetch category:", error);
    throw error;
  }
};

// Create category
export const createCategory = async (categoryData) => {
  try {
    const response = await axios.post(API_BASE_URL, categoryData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error;
  }
};

// Update category
export const updateCategory = async (id, categoryData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, categoryData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to update category:", error);
    throw error;
  }
};

// Toggle category status
export const toggleCategoryStatus = async (id) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/${id}/toggle-status`, null, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to toggle category status:", error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
};

// Search categories
export const searchCategories = async (keyword) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      ...getAuthConfig(),
      params: { keyword },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to search categories:", error);
    throw error;
  }
};
