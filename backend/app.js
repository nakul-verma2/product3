require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const websiteRoutes = require("./routes/websites");
const businessAppRoutes = require("./routes/businessApps");
const dashboardRoutes = require("./routes/dashboard");
const incidentRoutes = require("./routes/incidents");
const alertRoutes = require("./routes/alerts");
const cron = require("./cron");
const statusRoutes = require("./routes/status");
const auditRoutes = require("./routes/audit");
//const auditRoutes = require("./routes/audit");
const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/reports", express.static("public/reports"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/monitor/business-app", businessAppRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/alert", alertRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Website Care & Uptime Monitoring Backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

cron();
setInterval(cron, 60 * 1000);
