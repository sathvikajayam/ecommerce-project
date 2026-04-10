import handleCart from './handleCart'
import { productReducer } from './productReducer'
import { combineReducers } from "redux";
const rootReducers = combineReducers({
    handleCart,
    product: productReducer,
})
export default rootReducers
