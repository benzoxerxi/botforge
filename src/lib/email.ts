import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

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
    const host = await getSmtpSetting("smtp_host", "smtp.mailgun.org");
    const portStr = await getSmtpSetting("smtp_port", "587");
    const user = await getSmtpSetting("smtp_user", "");
    const pass = await getSmtpSetting("smtp_pass", "");
    const from = await getSmtpSetting("smtp_from", "noreply@benzos.uk");

    const port = parseInt(portStr, 10) || 587;

    // If no SMTP credentials configured, log and return false
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

    console.log(`[Email] Sent successfully to ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return false;
  }
}
