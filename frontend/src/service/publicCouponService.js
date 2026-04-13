import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/coupons`;

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

