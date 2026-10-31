import { Router } from "express";
import {
  signup,
  verifyEmailOtp,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";
import { signupSchema } from "../utils/authValidators.js";
import { validateSignup } from "../middleware/validateRequest.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Public authentication endpoints
router.post("/signup", validateSignup(signupSchema), signup);
router.post("/verify-email", verifyEmailOtp);
router.post("/login", login);

// Protected authentication endpoints
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
