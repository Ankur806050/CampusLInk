import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticate(req, res, next) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("Authentication configuration error: JWT_SECRET is missing.");
    return res.status(500).json({
      success: false,
      message: "Authentication is temporarily unavailable.",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    // Read current account state from the database rather than trusting
    // role or account status claims embedded in the token.
    const user = await User.findById(decoded.sub).select(
      "name email role accountStatus emailVerified"
    );

    if (!user || !user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    if (user.accountStatus === "REJECTED") {
      return res.status(403).json({
        success: false,
        message: "This account has been rejected.",
      });
    }

    // Pending recruiters may authenticate, but authorizeRoles blocks them
    // from performing protected actions until their account is ACTIVE.
    if (
      user.accountStatus !== "ACTIVE" &&
      !(user.role === "RECRUITER" && user.accountStatus === "PENDING_APPROVAL")
    ) {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus: user.accountStatus,
    };

    return next();
  } catch (error) {
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError" ||
      error?.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    console.error("Authentication error:", error?.message || error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}
