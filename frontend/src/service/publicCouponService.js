import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/coupons";

export const listAvailableCoupons = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const validateCoupon = async ({ code, userId, items }) => {
  const response = await axios.post(`${API_BASE_URL}/validate`, {
    code,
    userId,
    items,
  });
  return response.data;
};

