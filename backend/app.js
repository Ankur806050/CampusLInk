

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import tpoRoutes from "./routes/tpoRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";

import {
  recruiterRouter as recruiterScheduleRoutes,
  tpoRouter as tpoScheduleRoutes,
  studentRouter as studentScheduleRoutes,
} from "./routes/scheduleRoutes.js";

import {
  recruiterPlacementRoutes,
  studentPlacementRoutes,
  tpoPlacementRoutes,
} from "./routes/placementRoutes.js";

import notificationRoutes from "./routes/notificationRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";


const app = express();

// Trust proxy only when explicitly configured for your deployment.
// Set TRUST_PROXY=true when running behind a trusted reverse proxy.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// CORS configuration
const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header may include server-to-server
      // requests and tools such as curl or Postman.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusLink API is running",
  });
});

// Authentication
app.use("/api/auth", authRoutes);

// Student features
app.use("/api/student", studentRoutes);
app.use("/api/student/schedules", studentScheduleRoutes);
app.use("/api/student/placement", studentPlacementRoutes);

// Recruiter features
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/recruiter/schedules", recruiterScheduleRoutes);
app.use("/api/recruiter/placement", recruiterPlacementRoutes);

// TPO features
app.use("/api/tpo", tpoRoutes);
app.use("/api/tpo/schedules", tpoScheduleRoutes);
app.use("/api/tpo/placement", tpoPlacementRoutes);
app.use("/api/tpo/audit-logs", auditRoutes);

// Shared resources
app.use("/api/jobs", jobRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/notifications", notificationRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Malformed JSON request body
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    Object.prototype.hasOwnProperty.call(err, "body")
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  // Request body exceeds configured parser limit
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  // CORS rejection
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "This origin is not allowed to access the API.",
    });
  }

  console.error("Unhandled application error:", err);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

export default app;
