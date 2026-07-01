import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function getSmtpSetting(key: string, fallback: string): Promise<string> {
  try {
    const setting = await prisma.platformSetting.findUnique({ where: { key } });
    return setting?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    // Priority 1: Resend API key (direct)
    if (RESEND_API_KEY) {
      return await sendViaResend(to, subject, html);
    }

    // Priority 2: SMTP credentials from PlatformSetting DB
    return await sendViaSmtp(to, subject, html);
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return false;
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY!);

    const { error } = await resend.emails.send({
      from: "BotForge <noreply@benzos.uk>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log(`[Email] Sent via Resend to ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Resend send failed, will try SMTP:", err);
    throw err; // let caller handle
  }
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const host = await getSmtpSetting("smtp_host", "smtp.resend.com");
  const portStr = await getSmtpSetting("smtp_port", "465");
  const user = await getSmtpSetting("smtp_user", "");
  const pass = await getSmtpSetting("smtp_pass", "");
  const from = await getSmtpSetting("smtp_from", "noreply@benzos.uk");

  const port = parseInt(portStr, 10) || 465;

  if (!user || !pass) {
    console.log("\n[Email] SMTP not configured — skipping email send");
    console.log(`[Email] Would send to: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] Body preview: ${html.slice(0, 200)}...\n`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `BotForge <${from}>`,
    to,
    subject,
    html,
  });

  console.log(`[Email] Sent via SMTP to ${to}`);
  return true;
}
