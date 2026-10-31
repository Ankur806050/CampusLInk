
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import EmailOtp from "../models/EmailOtp.js";
import { sendVerificationOtp } from "../utils/emailService.js";
import jwt from "jsonwebtoken";
import { z } from "zod";

const OTP_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const RESEND_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

function createOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(`${email}:${otp}`)
    .digest("hex");
}

function safeEqualHex(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a, "hex"),
    Buffer.from(b, "hex")
  );
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    accountStatus: user.accountStatus,
  };
}

export async function signup(req, res) {
  let createdUserId;

  try {
    if (!process.env.OTP_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Email verification is not configured.",
      });
    }

    const data = req.validatedBody;

    if (
      data.role === "TPO" &&
      (!process.env.TPO_REGISTRATION_SECRET ||
        data.tpoRegistrationSecret !== process.env.TPO_REGISTRATION_SECRET)
    ) {
      return res.status(403).json({
        success: false,
        message: "TPO registration is not authorized.",
      });
    }

    const existingUser = await User.findOne({ email: data.email });

    if (existingUser?.emailVerified) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const otp = createOtp();
    const now = new Date();

    const userFields = {
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: data.role,
      emailVerified: false,
      accountStatus: "PENDING_VERIFICATION",
    };

    if (data.role === "STUDENT") {
      Object.assign(userFields, {
        rollNumber: data.rollNumber,
        studentYear: data.studentYear,
        branch: data.branch,
        cgpa: data.cgpa,
      });
    }

    if (data.role === "RECRUITER") {
      Object.assign(userFields, {
        companyName: data.companyName,
        designation: data.designation,
      });
    }

    let user = existingUser;

    if (user) {
      // Replace an expired/unverified signup attempt.
      Object.assign(user, userFields);
      await user.save();
    } else {
      user = await User.create(userFields);
    }

    createdUserId = user._id;

    await EmailOtp.findOneAndUpdate(
      { email: data.email },
      {
        $set: {
          email: data.email,
          otpHash: hashOtp(data.email, otp),
          expiresAt: new Date(now.getTime() + OTP_MINUTES * 60_000),
          attempts: 0,
          lastSentAt: now,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    try {
      await sendVerificationOtp(data.email, otp);
    } catch (emailError) {
      // Do not leave a new account in a misleading state if email delivery fails.
      await EmailOtp.deleteOne({ email: data.email });

      if (existingUser) {
        // Keep the unverified account available for a retry, but remove
        // the newly created password/state rather than claiming signup succeeded.
        await User.deleteOne({ _id: user._id, emailVerified: false });
      } else {
        await User.deleteOne({ _id: user._id, emailVerified: false });
      }

      console.error("OTP email delivery failed:", emailError.message);

      return res.status(502).json({
        success: false,
        message: "We could not send the verification email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration started. Check your email for the verification code.",
      data: {
        email: data.email,
        expiresInSeconds: OTP_MINUTES * 60,
        resendAfterSeconds: RESEND_SECONDS,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
}

export async function verifyEmailOtp(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "");

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address and 6-digit code.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
        data: { accountStatus: user.accountStatus },
      });
    }

    const otpRecord = await EmailOtp.findOne({ email }).select("+otpHash");

    if (!otpRecord || otpRecord.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Request a new code.",
      });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new verification code.",
      });
    }

    const submittedHash = hashOtp(email, otp);

    if (!safeEqualHex(submittedHash, otpRecord.otpHash)) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    user.emailVerified = true;
    user.accountStatus =
      user.role === "RECRUITER" ? "PENDING_APPROVAL" : "ACTIVE";

    await user.save();
    await EmailOtp.deleteOne({ email });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: {
        user: safeUser(user),
        nextStep:
          user.role === "RECRUITER"
            ? "Await TPO approval before publishing jobs."
            : "You can now log in.",
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Email verification failed. Please try again.",
    });
  }
}



const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
});

export async function login(req, res) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const { email, password } = result.data;

    // Password is excluded from queries by default in User.js.
    const user = await User.findOne({ email }).select("+password");

    // Use the same error for unknown email and wrong password.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before logging in.",
      });
    }

    if (user.accountStatus === "REJECTED") {
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected.",
      });
    }

    if (
      user.accountStatus !== "ACTIVE" &&
      !(user.role === "RECRUITER" &&
        user.accountStatus === "PENDING_APPROVAL")
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        tokenType: "Bearer",
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        user: safeUser(user),
        nextStep:
          user.role === "RECRUITER" &&
          user.accountStatus === "PENDING_APPROVAL"
            ? "AWAIT_TPO_APPROVAL"
            : "OPEN_DASHBOARD",
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser(user),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch current user.",
    });
  }
}

export async function logout(req, res) {
  // With the current stateless JWT strategy, the client must discard
  // its token. Server-side invalidation will require a token/session
  // revocation mechanism if immediate logout invalidation is needed.
  return res.status(200).json({
    success: true,
    message: "Logged out. Discard your access token.",
  });
}
