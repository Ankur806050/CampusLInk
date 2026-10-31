
import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

const PORT = Number(process.env.PORT) || 5000;

let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`CampusLink API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error(
        "MongoDB cleanup failed:",
        disconnectError.message
      );
    }

    process.exit(1);
  }
};

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `${signal} received. Shutting down CampusLink API...`
  );

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);

  forceExitTimer.unref();

  const closeDatabase = async () => {
    try {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    } catch (error) {
      console.error(
        "Error closing MongoDB connection:",
        error.message
      );
      process.exitCode = 1;
    } finally {
      clearTimeout(forceExitTimer);
      process.exit(process.exitCode || 0);
    }
  };

  if (!server) {
    void closeDatabase();
    return;
  }

  server.close((error) => {
    if (error) {
      console.error(
        "Error closing HTTP server:",
        error.message
      );
      process.exitCode = 1;
    }

    void closeDatabase();
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
