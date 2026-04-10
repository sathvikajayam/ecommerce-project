import express from "express";
import Cart from "../models/Cart.js";

const router = express.Router();

/**
 * GET CART BY USER
 * URL: /api/cart/:userId
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId })
      .populate("items.productId");

    // If no cart exists, return empty cart structure
    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ADD ITEM TO CART
 * URL: /api/cart
 * BODY: { userId, productId, qty }
 */
router.post("/", async (req, res) => {
  console.log("ADD TO CART REQUEST BODY:", req.body);
  try {
    const { userId, productId, qty = 1 } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [{ productId, qty }],
      });
    } else {
      // Check if product already exists
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].qty += qty;
      } else {
        cart.items.push({ productId, qty });
      }
    }

    await cart.save();

    const populatedCart = await cart.populate("items.productId");
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * REMOVE ITEM FROM CART
 * URL: /api/cart/remove
 * BODY: { userId, productId }
 */
router.post("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.json({ items: [] });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    const populatedCart = await cart.populate("items.productId");
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * CLEAR CART (OPTIONAL)
 * URL: /api/cart/clear/:userId
 */
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

