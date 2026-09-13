const axios = require("axios");

const Website = require("./models/Website");
const UptimeLog = require("./models/UptimeLog");
const BusinessApp = require("./models/BusinessApp");
const Incident = require("./models/Incident");

const checkWebsites = async () => {
  try {
    // =========================
    // CHECK WEBSITES
    // =========================

    const websites = await Website.find();

    console.log(`Checking ${websites.length} website(s)...`);

    for (const website of websites) {
      // Skip monitoring for paused websites
      if (website.paused) {
        console.log(`${website.name} - PAUSED`);
        continue;
      }

      const startTime = Date.now();

      let statusCode = null;
      let responseTimeMs = null;
      let isUp = false;

      try {
        const response = await axios.get(website.url, {
          timeout: 10000,
        });

        responseTimeMs = Date.now() - startTime;
        statusCode = response.status;
        isUp = response.status >= 200 && response.status < 400;

        console.log(
          `${website.name} - UP - ${statusCode} - ${responseTimeMs}ms`,
        );
      } catch (error) {
        responseTimeMs = Date.now() - startTime;

        if (error.response) {
          statusCode = error.response.status;
        }

        isUp = false;

        console.log(
          `${website.name} - DOWN - ${
            statusCode || "No response"
          } - ${responseTimeMs}ms`,
        );
      }

      // =========================
      // SAVE UPTIME LOG
      // =========================

      await UptimeLog.create({
        websiteId: website._id,
        statusCode,
        responseTimeMs,
        isUp,
        checkedAt: new Date(),
      });

      // =========================
      // CALCULATE UPTIME %
      // AND AVERAGE RESPONSE TIME
      // =========================

      const logs = await UptimeLog.find({
        websiteId: website._id,
      }).select("isUp responseTimeMs");

      const totalChecks = logs.length;

      const successfulChecks = logs.filter((log) => log.isUp).length;

      const uptimePercent =
        totalChecks > 0
          ? Number(((successfulChecks / totalChecks) * 100).toFixed(2))
          : 100;

      const responseTimes = logs
        .map((log) => log.responseTimeMs)
        .filter((time) => typeof time === "number");

      const avgResponseMs =
        responseTimes.length > 0
          ? Math.round(
              responseTimes.reduce((sum, time) => sum + time, 0) /
                responseTimes.length,
            )
          : 0;

      // =========================
      // UPDATE WEBSITE
      // =========================

      await Website.findByIdAndUpdate(website._id, {
        status: isUp ? "up" : "down",
        uptimePercent,
        avgResponseMs,
        lastCheckedAt: new Date(),
      });

      // =========================
      // INCIDENT HANDLING
      // =========================

      if (!isUp) {
        const ongoingIncident = await Incident.findOne({
          websiteId: website._id,
          status: "ongoing",
        });

        // Create incident only if one doesn't already exist
        if (!ongoingIncident) {
          await Incident.create({
            websiteId: website._id,
            startedAt: new Date(),
            status: "ongoing",
          });

          console.log(`${website.name} - INCIDENT CREATED`);
        }
      } else {
        // Website is UP
        // Resolve existing incident if there is one

        const ongoingIncident = await Incident.findOne({
          websiteId: website._id,
          status: "ongoing",
        });

        if (ongoingIncident) {
          const endedAt = new Date();

          const durationMinutes = Math.max(
            1,
            Math.round((endedAt - ongoingIncident.startedAt) / 60000),
          );

          ongoingIncident.endedAt = endedAt;
          ongoingIncident.durationMinutes = durationMinutes;
          ongoingIncident.status = "resolved";

          await ongoingIncident.save();

          console.log(
            `${website.name} - INCIDENT RESOLVED - ${durationMinutes} minute(s)`,
          );
        }
      }
    }

    // =========================
    // CHECK BUSINESS APPS
    // =========================

    const businessApps = await BusinessApp.find();

    console.log(`Checking ${businessApps.length} business application(s)...`);

    for (const businessApp of businessApps) {
      let isUp = false;

      try {
        const response = await axios.get(businessApp.url, {
          timeout: 10000,
        });

        isUp = response.status >= 200 && response.status < 400;

        console.log(
          `${businessApp.name} - ${isUp ? "UP" : "DOWN"} - ${response.status}`,
        );
      } catch (error) {
        isUp = false;

        console.log(
          `${businessApp.name} - DOWN - ${
            error.response?.status || "No response"
          }`,
        );
      }

      // Update business application status
      await BusinessApp.findByIdAndUpdate(businessApp._id, {
        status: isUp ? "up" : "down",
        lastChecked: new Date(),
      });
    }
  } catch (error) {
    console.error("Monitoring error:", error.message);
  }
};

module.exports = checkWebsites;
