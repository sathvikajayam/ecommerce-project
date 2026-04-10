import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

// ✅ GET all reviews for a product
router.get("/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).sort({
            createdAt: -1,
        });
        res.status(200).json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ POST a new review for a product
router.post("/:productId", async (req, res) => {
    try {
        const { userName, rating, review } = req.body;

        if (!userName || !rating || !review) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newReview = new Review({
            productId: req.params.productId,
            userName,
            rating,
            review,
        });

        const saved = await newReview.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
