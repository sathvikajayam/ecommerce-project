// Retrieve initial state from localStorage if available
const getInitialCart = () => {
  const stored = localStorage.getItem("cart");
  if (!stored) return { items: [] };
  try {
    const parsed = JSON.parse(stored);
    // Normalize to object shape { items: [...] }
    if (Array.isArray(parsed)) return { items: parsed };
    if (parsed && typeof parsed === "object") return parsed;
    return { items: [] };
  } catch (e) {
    return { items: [] };
  }
};

const extractId = (val) => {
  if (!val) return undefined;
  if (typeof val === "string") return val;
  return val._id || val.id || undefined;
};

const findById = (item, id) => {
  // item may be { productId: { _id } } or a plain item with id/_id
  const itemId = extractId(item.productId) || extractId(item);
  return itemId === id;
};

const normalizeAddPayload = (payload) => {
  if (payload && typeof payload === "object" && payload.product) {
    return { product: payload.product, qty: Number(payload.qty) || 1 };
  }
  return { product: payload, qty: 1 };
};

const updateItemsForAdd = (items, payload) => {
  const { product, qty } = normalizeAddPayload(payload);
  const safeQty = Math.max(1, Number(qty) || 1);
  const id = extractId(product) || product?.productId;
  const exist = items.find((x) => findById(x, id));
  if (exist) {
    return items.map((x) => (findById(x, id) ? { ...x, qty: (x.qty || 0) + safeQty } : x));
  }
  // create item shape matching backend: { productId: {...}, qty: 1 }
  const newItem = product && (product.price || product.title || product.name || product._id)
    ? { productId: product, qty: safeQty }
    : { productId: id, qty: safeQty };
  return [...items, newItem];
};

const updateItemsForDel = (items, product) => {
  const id = extractId(product) || product?.productId;
  const exist = items.find((x) => findById(x, id));
  if (!exist) return items;
  if ((exist.qty || 0) <= 1) return items.filter((x) => !findById(x, id));
  return items.map((x) => (findById(x, id) ? { ...x, qty: x.qty - 1 } : x));
};

const handleCart = (state = getInitialCart(), action) => {
  const payload = action.payload;
  let updated;

  switch (action.type) {
    case "SET_CART":
      // payload expected to be { items: [...] } from backend
      localStorage.setItem("cart", JSON.stringify(payload.items || payload));
      return payload;

    case "ADDITEM":
      // support both shapes: state.items (object) or array (legacy)
      if (Array.isArray(state)) {
        updated = updateItemsForAdd(state, payload);
        localStorage.setItem("cart", JSON.stringify(updated));
        return updated;
      }
      // object shape
      const itemsAdded = updateItemsForAdd(state.items || [], payload);
      updated = { ...state, items: itemsAdded };
      localStorage.setItem("cart", JSON.stringify(updated.items));
      return updated;

    case "DELITEM":
      if (Array.isArray(state)) {
        updated = updateItemsForDel(state, payload);
        localStorage.setItem("cart", JSON.stringify(updated));
        return updated;
      }
      const itemsRemoved = updateItemsForDel(state.items || [], payload);
      updated = { ...state, items: itemsRemoved };
      localStorage.setItem("cart", JSON.stringify(updated.items));
      return updated;

    case "CLEAR_CART":
      localStorage.removeItem("cart");
      return { items: [] };

    default:
      return state;
  }
};

export default handleCart;
