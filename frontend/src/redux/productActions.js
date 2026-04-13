import axios from "axios";

const API = `${process.env.REACT_APP_API_URL}/api/products`;

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

