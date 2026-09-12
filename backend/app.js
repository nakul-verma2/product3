
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();

const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

// ================================
// ROUTES
// ================================

// Authentication routes
app.use("/api/auth", authRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Website Care & Uptime Monitoring Backend is running",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
  });
});

// ================================
// START SERVER
// ================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:");
    console.error(error.message);
  }
};

startServer();