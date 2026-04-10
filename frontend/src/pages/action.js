import axios from "axios";

const API = "http://localhost:5000/api/cart";

// Fetch cart
export const fetchCart = (userId) => async (dispatch) => {
  const { data } = await axios.get(`${API}/${userId}`);
  dispatch({ type: "SET_CART", payload: data });
};

// Add item
export const addCart = (productId, userId, qty = 1) => async (dispatch) => {
  await axios.post(API, {
    userId,
    productId,
    qty: Number(qty) || 1,
  });

  dispatch(fetchCart(userId));
};

// Remove item
export const delCart = (productId, userId) => async (dispatch) => {
  await axios.post(`${API}/remove`, {
    userId,
    productId,
  });

  dispatch(fetchCart(userId));
};
// Clear cart
export const clearCart = (userId) => async (dispatch) => {
  await axios.delete(`${API}/clear/${userId}`);
  dispatch({ type: "SET_CART", payload: { items: [] } });
};
