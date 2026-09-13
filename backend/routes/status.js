const express = require("express");
const Website = require("../models/Website");

const router = express.Router();

// Public status page
// No JWT required
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const websites = await Website.find({ userId })
      .select(
        "name url status uptimePercent avgResponseMs lastCheckedAt paused"
      )
      .sort({ createdAt: -1 });

    const total = websites.length;

    const upCount = websites.filter(
      (website) => website.status === "up"
    ).length;

    const downCount = websites.filter(
      (website) => website.status === "down"
    ).length;

    const pausedCount = websites.filter(
      (website) => website.paused
    ).length;

    const activeWebsites = websites.filter(
      (website) => !website.paused
    );

    const averageUptime =
      activeWebsites.length > 0
        ? activeWebsites.reduce(
            (sum, website) => sum + (website.uptimePercent || 0),
            0
          ) / activeWebsites.length
        : 0;

    const overallStatus =
      downCount === 0
        ? "operational"
        : upCount > 0
        ? "degraded"
        : "down";

    res.json({
      success: true,

      status: {
        overall: overallStatus,
        totalWebsites: total,
        websitesUp: upCount,
        websitesDown: downCount,
        websitesPaused: pausedCount,
        averageUptimePercent: Number(averageUptime.toFixed(2)),
      },

      websites,
    });
  } catch (error) {
    console.error("Public status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch public status",
    });
  }
});

module.exports = router;