const cron = require("./cron");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const websiteRoutes = require("./routes/websites");
const businessAppRoutes = require("./routes/businessApps");

const app = express();

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

app.use("/api/websites", websiteRoutes);
app.use("/api/monitor/business-app", businessAppRoutes);

// ================================
// BASIC ROUTES
// ================================

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

// ================================
// MONGODB CONNECTION
// ================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
    // Run website monitoring immediately
    cron();

    // Run website monitoring every minute
    setInterval(cron, 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  }
};

startServer();
