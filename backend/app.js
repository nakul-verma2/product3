require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const websiteRoutes = require("./routes/websites");
const businessAppRoutes = require("./routes/businessApps");
const cron = require("./cron");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/monitor/business-app", businessAppRoutes);

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
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

cron();
setInterval(cron, 60 * 1000);