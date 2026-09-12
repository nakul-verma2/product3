const express = require("express");
const Website = require("../models/Website");
const UptimeLog = require("../models/UptimeLog");

const router = express.Router();

// Add a website
router.post("/add", async (req, res) => {
  try {
    const { url, name } = req.body;

    if (!url || !name) {
      return res.status(400).json({
        success: false,
        message: "URL and name are required",
      });
    }

    // Temporary userId for API development.
    // This will be replaced with req.user.userId
    // after the authentication middleware is merged.
    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const website = await Website.create({
      userId,
      url,
      name,
    });

    res.status(201).json({
      success: true,
      message: "Website added successfully",
      website,
    });
  } catch (error) {
    console.error("Add website error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add website",
    });
  }
});

// List user's websites
router.get("/list", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const websites = await Website.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      websites,
    });
  } catch (error) {
    console.error("List websites error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch websites",
    });
  }
});

// Get website uptime logs
router.get("/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const days = Number(req.query.days) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await UptimeLog.find({
      websiteId: id,
      checkedAt: { $gte: startDate },
    }).sort({
      checkedAt: 1,
    });

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Get website logs error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch website logs",
    });
  }
});

module.exports = router;
