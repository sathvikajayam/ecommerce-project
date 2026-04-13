import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/brands`;

// Get all brands (public endpoint - includes only active brands with product count)
export const getAllBrands = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    // Filter to show only active brands
    return response.data.filter(brand => brand.status === "active");
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    throw error;
  }
};

// Get single brand
export const getBrandById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch brand:", error);
    throw error;
  }
};

// Get products from a specific brand
export const getBrandProducts = async (brandId, page, limit) => {
  try {
    const params = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;

    const response = await axios.get(`${API_BASE_URL}/${brandId}/products`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch brand products:", error);
    throw error;
  }
};

// Search brands
export const searchBrands = async (keyword) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: { keyword },
    });
    return response.data.filter(brand => brand.status === "active");
  } catch (error) {
    console.error("Failed to search brands:", error);
    throw error;
  }
};

// Get homepage featured brands
export const getHomepageBrands = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/brands`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch homepage brands:", error);
    throw error;
  }
};

