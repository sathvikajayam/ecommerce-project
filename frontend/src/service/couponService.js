import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/admin/coupons`;

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

export const getAllCoupons = async () => {
  const response = await axios.get(API_BASE_URL, getAuthConfig());
  return response.data;
};

export const createCoupon = async (payload) => {
  const response = await axios.post(API_BASE_URL, payload, getAuthConfig());
  return response.data;
};

export const updateCoupon = async (id, payload) => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, payload, getAuthConfig());
  return response.data;
};

export const toggleCouponStatus = async (id) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/toggle-status`, null, getAuthConfig());
  return response.data;
};

export const deleteCoupon = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`, getAuthConfig());
  return response.data;
};

