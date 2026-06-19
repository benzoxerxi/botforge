import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// POST /api/auth/reset — Request password reset (generate token)
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists — always return success
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Construct reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://chat.benzos.uk"}/reset-password/${token}`;

    // Log the token (fallback)
    console.log("\n=== PASSWORD RESET ===");
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("======================\n");

    // Send email via SMTP (non-blocking, errors are caught gracefully)
    await sendEmail(
      email,
      "Password Reset - BotForge",
      `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e1a;border-radius:12px;color:#fff">
        <div style="font-size:24px;font-weight:700;margin-bottom:8px">🔐 BotForge</div>
        <p style="color:#9ca3af;margin-bottom:24px">You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:linear-gradient(135deg,#00f0ff,#7c3aed);color:#fff;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">
          If you didn't request this, ignore this email.
          <br/>Reset link: <a href="${resetUrl}" style="color:#00f0ff">${resetUrl}</a>
        </p>
      </div>`,
    ).catch((err: unknown) => {
      console.error("[Reset] Email send failed (non-blocking):", err);
    });

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, a reset link has been sent.",
    });
  } catch (err: any) {
    console.error("[Reset request error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
