const express = require("express");
const mongoose = require("mongoose");

const Website = require("../models/Website");
const UptimeLog = require("../models/UptimeLog");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All website routes require authentication
router.use(protect);

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

    const userId = req.user.userId;

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
    const userId = req.user.userId;

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

// Delete website
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid website ID",
      });
    }

    const website = await Website.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    await UptimeLog.deleteMany({
      websiteId: id,
    });

    await Website.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("Delete website error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete website",
    });
  }
});

// Pause / Resume website monitoring
router.patch("/:id/pause", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid website ID",
      });
    }

    const website = await Website.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    website.paused = !website.paused;

    await website.save();

    res.json({
      success: true,
      message: website.paused
        ? "Website monitoring paused"
        : "Website monitoring resumed",
      paused: website.paused,
    });
  } catch (error) {
    console.error("Pause website error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update website monitoring",
    });
  }
});

// Get website uptime logs
router.get("/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const days = Number(req.query.days) || 7;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid website ID",
      });
    }

    // Make sure the website belongs to the logged-in user
    const website = await Website.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

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
