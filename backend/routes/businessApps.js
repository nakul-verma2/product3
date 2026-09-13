const express = require("express");
const BusinessApp = require("../models/BusinessApp");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All business application routes require authentication
router.use(protect);

// Add a business application
router.post("/add", async (req, res) => {
  try {
    const { name, url, type } = req.body;

    if (!name || !url || !type) {
      return res.status(400).json({
        success: false,
        message: "Name, URL and type are required",
      });
    }

    // Get userId from authenticated JWT
    const userId = req.user.userId;

    const businessApp = await BusinessApp.create({
      userId,
      name,
      url,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Business application added successfully",
      businessApp,
    });
  } catch (error) {
    console.error("Add business app error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add business application",
    });
  }
});

// List user's business applications
router.get("/list", async (req, res) => {
  try {
    // Get userId from authenticated JWT
    const userId = req.user.userId;

    const businessApps = await BusinessApp.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      businessApps,
    });
  } catch (error) {
    console.error("List business apps error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch business applications",
    });
  }
});

module.exports = router;
