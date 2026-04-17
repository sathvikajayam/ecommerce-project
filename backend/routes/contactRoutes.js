import express from "express";
import Contact from "../models/Contact.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const contact = await Contact.create(req.body);
  res.json({ message: "Message sent", contact });
});

router.get("/all", protect, adminOnly, requirePermission("contacts", "view"), async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
