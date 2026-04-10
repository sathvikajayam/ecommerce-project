// src/redux/handleCart.js

const initialState = {
  items: [], // array of { productId: {...}, qty: n }
};

const handleCart = (state = initialState, action) => {
  switch (action.type) {
    case "SET_CART":
      return action.payload || { items: [] }; // replace state with backend cart

    default:
      return state;
  }
};

export default handleCart;
