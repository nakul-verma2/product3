const express = require("express");

const Website = require("../models/Website");
const BusinessApp = require("../models/BusinessApp");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.userId;

    const [websites, businessApps] = await Promise.all([
      Website.find({ userId }).select("status"),
      BusinessApp.find({ userId }).select("status"),
    ]);

    const websiteTotal = websites.length;
    const websiteUp = websites.filter(
      (website) => website.status === "up"
    ).length;
    const websiteDown = websites.filter(
      (website) => website.status === "down"
    ).length;

    const businessAppTotal = businessApps.length;
    const businessAppUp = businessApps.filter(
      (app) => app.status === "up"
    ).length;
    const businessAppDown = businessApps.filter(
      (app) => app.status === "down"
    ).length;

    res.json({
      success: true,

      websites: {
        total: websiteTotal,
        up: websiteUp,
        down: websiteDown,
      },

      businessApps: {
        total: businessAppTotal,
        up: businessAppUp,
        down: businessAppDown,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
});

module.exports = router;