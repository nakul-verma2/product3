const axios = require("axios");
const Website = require("./models/Website");
const UptimeLog = require("./models/UptimeLog");

const checkWebsites = async () => {
  try {
    const websites = await Website.find();

    console.log(`Checking ${websites.length} website(s)...`);

    for (const website of websites) {
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
          `${website.name} - DOWN - ${statusCode || "No response"} - ${responseTimeMs}ms`,
        );
      }

      // Save uptime log
      await UptimeLog.create({
        websiteId: website._id,
        statusCode,
        responseTimeMs,
        isUp,
        checkedAt: new Date(),
      });

      // Update website
      await Website.findByIdAndUpdate(website._id, {
        status: isUp ? "up" : "down",
        avgResponseMs: responseTimeMs,
        lastCheckedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Website monitoring error:", error.message);
  }
};

module.exports = checkWebsites;
