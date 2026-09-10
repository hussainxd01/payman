import nodemailer from "nodemailer";
import { jsonOk, jsonError } from "@/lib/apiHelpers";

// Sends the report information via SMTP email.
// Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// (and optionally EMAIL_FROM) in .env.local.
// Works with Gmail (app password), Outlook, or any transactional
// email provider's SMTP relay (Resend, SendGrid, Postmark, etc.).
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { to, subject, text } = body;

    if (!to || !String(to).trim()) {
      return jsonError("A recipient email address is required.", 422);
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } =
      process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return jsonError(
        "Email sending isn't configured yet. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to .env.local (see .env.example).",
        500,
      );
    }

    const port = Number(SMTP_PORT) || 587;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // true for 465 (SSL), false for 587/others (STARTTLS)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: EMAIL_FROM || SMTP_USER,
      to: String(to).trim(),
      subject: subject || "Payment Collection Report",
      text: text || "Please find the payment collection report below.",
    });

    return jsonOk({ sent: true });
  } catch (err) {
    return jsonError(err.message || "Failed to send email.", 500);
  }
}
