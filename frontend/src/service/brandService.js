import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/admin/brands`;
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

// Get all brands with product count
export const getAllBrands = async () => {
  try {
    const response = await axios.get(API_BASE_URL, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    throw error;
  }
};

// Get single brand
export const getBrandById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to fetch brand:", error);
    throw error;
  }
};

// Create brand
export const createBrand = async (brandData) => {
  try {
    const response = await axios.post(API_BASE_URL, brandData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to create brand:", error);
    throw error;
  }
};

// Update brand
export const updateBrand = async (id, brandData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, brandData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to update brand:", error);
    throw error;
  }
};

// Toggle brand status
export const toggleBrandStatus = async (id) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/${id}/toggle-status`, null, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to toggle brand status:", error);
    throw error;
  }
};

// Delete brand
export const deleteBrand = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Failed to delete brand:", error);
    throw error;
  }
};

// Search brands
export const searchBrands = async (keyword) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      ...getAuthConfig(),
      params: { keyword },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to search brands:", error);
    throw error;
  }
};
