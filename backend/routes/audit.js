const express = require("express");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const Website = require("../models/Website");
const Incident = require("../models/Incident");
const AuditReport = require("../models/AuditReport");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Generate audit report PDF
router.get("/report/generate", async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || "12months";

    const websites = await Website.find({ userId });

    if (websites.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No websites found for audit report",
      });
    }

    const websiteIds = websites.map((website) => website._id);

    const incidents = await Incident.find({
      websiteId: { $in: websiteIds },
    }).sort({ startedAt: -1 });

    // Calculate average uptime
    const totalUptime = websites.reduce(
      (sum, website) => sum + (website.uptimePercent || 0),
      0,
    );

    const uptimePercent =
      websites.length > 0
        ? Number((totalUptime / websites.length).toFixed(2))
        : 0;

    // Calculate MTTR for resolved incidents
    const resolvedIncidents = incidents.filter(
      (incident) =>
        incident.status === "resolved" && incident.durationMinutes !== null,
    );

    const totalDuration = resolvedIncidents.reduce(
      (sum, incident) => sum + incident.durationMinutes,
      0,
    );

    const mttrMinutes =
      resolvedIncidents.length > 0
        ? Number((totalDuration / resolvedIncidents.length).toFixed(2))
        : 0;

    // Create reports directory
    const reportsDirectory = path.join(__dirname, "../public/reports");

    if (!fs.existsSync(reportsDirectory)) {
      fs.mkdirSync(reportsDirectory, { recursive: true });
    }

    const fileName = `audit-${userId}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDirectory, fileName);

    // Create PDF
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(20).text("Website Care & Uptime Audit Report", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12).text(`Period: ${period}`);
    doc.text(`Generated At: ${new Date().toISOString()}`);

    doc.moveDown();

    doc.fontSize(16).text("Summary");
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Websites Monitored: ${websites.length}`);
    doc.text(`Average Uptime: ${uptimePercent}%`);
    doc.text(`Total Incidents: ${incidents.length}`);
    doc.text(`MTTR: ${mttrMinutes} minutes`);

    doc.moveDown();

    doc.fontSize(16).text("Website Details");
    doc.moveDown(0.5);

    websites.forEach((website) => {
      doc.fontSize(12).text(`Name: ${website.name}`);
      doc.text(`URL: ${website.url}`);
      doc.text(`Status: ${website.status}`);
      doc.text(`Uptime: ${website.uptimePercent}%`);
      doc.text(`Average Response Time: ${website.avgResponseMs} ms`);
      doc.moveDown();
    });

    doc.moveDown();

    doc.fontSize(16).text("Incidents");
    doc.moveDown(0.5);

    if (incidents.length === 0) {
      doc.fontSize(12).text("No incidents recorded.");
    } else {
      incidents.forEach((incident) => {
        doc.fontSize(11).text(`Website ID: ${incident.websiteId}`);
        doc.text(`Status: ${incident.status}`);
        doc.text(`Started: ${incident.startedAt}`);

        if (incident.endedAt) {
          doc.text(`Ended: ${incident.endedAt}`);
        }

        if (incident.durationMinutes !== null) {
          doc.text(`Duration: ${incident.durationMinutes} minutes`);
        }

        if (incident.rootCause) {
          doc.text(`Root Cause: ${incident.rootCause}`);
        }

        doc.moveDown();
      });
    }

    doc.end();

    writeStream.on("finish", async () => {
      const pdfUrl = `/reports/${fileName}`;

      const auditReport = await AuditReport.create({
        userId,
        period,
        uptimePercent,
        incidents: incidents.length,
        mttrMinutes,
        pdfUrl,
      });

      res.json({
        success: true,
        message: "Audit report generated successfully",
        report: auditReport,
        pdfUrl,
      });
    });

    writeStream.on("error", (error) => {
      console.error("PDF write error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to create audit PDF",
        });
      }
    });
  } catch (error) {
    console.error("Generate audit report error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate audit report",
    });
  }
});

// Get audit report history
router.get("/reports", async (req, res) => {
  try {
    const userId = req.user.userId;

    const reports = await AuditReport.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Get audit reports error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit reports",
    });
  }
});

module.exports = router;
