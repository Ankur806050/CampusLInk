import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);

  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      "Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS."
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return transporter;
}

export async function sendVerificationOtp(email, otp) {
  if (typeof email !== "string" || !email.trim()) {
    throw new Error("A recipient email address is required.");
  }

  if (typeof otp !== "string" || !otp.trim()) {
    throw new Error("A verification code is required.");
  }

  const sender = process.env.SMTP_USER?.trim();
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const safeExpiryMinutes = Number.isFinite(expiryMinutes) && expiryMinutes > 0
    ? expiryMinutes
    : 10;

  await getTransporter().sendMail({
    from: `"CampusLink" <${sender}>`,
    to: email.trim(),
    subject: "Your CampusLink email verification code",
    text: [
      `Your CampusLink verification code is: ${otp}`,
      "",
      `This code expires in ${safeExpiryMinutes} minutes.`,
      "Do not share this code with anyone.",
    ].join("\n"),
  });
}
