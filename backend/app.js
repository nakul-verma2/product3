const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

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

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  }
};

startServer();
