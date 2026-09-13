const express = require("express");

const AlertSettings = require("../models/AlertSettings");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Get alert settings
router.get("/settings", async (req, res) => {
  try {
    const userId = req.user.userId;

    let settings = await AlertSettings.findOne({ userId });

    // Create default settings for first-time users
    if (!settings) {
      settings = await AlertSettings.create({
        userId,
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get alert settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch alert settings",
    });
  }
});

// Update alert settings
router.put("/settings", async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      whatsappEnabled,
      phone,
      alertOnDown,
      alertOnRecovery,
    } = req.body;

    const settings = await AlertSettings.findOneAndUpdate(
      { userId },
      {
        whatsappEnabled,
        phone,
        alertOnDown,
        alertOnRecovery,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Alert settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update alert settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update alert settings",
    });
  }
});

// Test alert
router.post("/test", async (req, res) => {
  try {
    const userId = req.user.userId;

    const settings = await AlertSettings.findOne({ userId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Alert settings not found",
      });
    }

    if (!settings.whatsappEnabled) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp alerts are disabled",
      });
    }

    if (!settings.phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is not configured",
      });
    }

    // Provider integration will be added later.
    console.log("Test WhatsApp alert requested:", {
      phone: settings.phone,
      userId,
    });

    res.json({
      success: true,
      message: "Test alert request received",
    });
  } catch (error) {
    console.error("Test alert error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to send test alert",
    });
  }
});

module.exports = router;