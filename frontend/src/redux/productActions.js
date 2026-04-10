import axios from "axios";

const API = "http://localhost:5000/api/products";

export const fetchProducts = () => async (dispatch) => {
  try {
    const { data } = await axios.get(API);
    dispatch({
      type: "SET_PRODUCTS",
      payload: data.products || data,
    });
  } catch (error) {
    console.log(error);
  }
};

