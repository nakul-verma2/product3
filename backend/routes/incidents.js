const express = require("express");

const Incident = require("../models/Incident");
const Website = require("../models/Website");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All incident routes require authentication
router.use(protect);

// Get incidents for logged-in user
router.get("/list", async (req, res) => {
  try {
    // Find user's websites
    const websites = await Website.find({
      userId: req.user.userId,
    }).select("_id");

    const websiteIds = websites.map((website) => website._id);

    // Find incidents belonging to those websites
    const incidents = await Incident.find({
      websiteId: { $in: websiteIds },
    }).sort({
      startedAt: -1,
    });

    res.json({
      success: true,
      incidents,
    });
  } catch (error) {
    console.error("List incidents error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch incidents",
    });
  }
});

module.exports = router;