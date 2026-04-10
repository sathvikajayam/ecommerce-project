// For Add Item to Cart
export const addCart = (product, qty = 1) =>{
    return {
        type:"ADDITEM",
        payload:{ product, qty }
    }
}

// For Delete Item to Cart
export const delCart = (product) =>{
    return {
        type:"DELITEM",
        payload:product
    }
}

// For Clear Cart
export const clearCart = () =>{
    return {
        type:"CLEAR_CART"
    }
}
