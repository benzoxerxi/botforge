import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml } from "@/lib/email-templates";

// POST /api/company/register — Self-register a new company
export async function POST(request: Request) {
  try {
    const { companyName, email, name, password } = await request.json();

    // Validate inputs
    if (!companyName || !email || !password) {
      return NextResponse.json({ error: "companyName, email, and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Generate slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) + "-" + Date.now().toString(36);

    // Check slug uniqueness
    const existingCompany = await prisma.company.findUnique({ where: { slug } });
    const finalSlug = existingCompany ? slug + "-" + Math.random().toString(36).slice(2, 6) : slug;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug: finalSlug,
          plan: "starter",
          tokenLimit: 50000,
          enableHumanHandoff: true,
          systemPrompt: `You are a helpful AI assistant for ${companyName}. Answer questions based on the provided knowledge base. If you don't know, say you don't know.`,
        },
      });

      // Create company admin user
      const user = await tx.user.create({
        data: {
          email,
          name: name || companyName + " Admin",
          password: hashedPassword,
          role: "company_admin",
          companyId: company.id,
          active: true,
        },
      });

      // Create default bot
      const bot = await tx.bot.create({
        data: {
          name: companyName + " Bot",
          companyId: company.id,
          systemPrompt: `You are a helpful customer support assistant for ${companyName}. Be friendly and concise.`,
          useRag: true,
          handoffTrigger: "auto",
        },
      });

      // Create chat widget
      const widget = await tx.chatWidget.create({
        data: {
          botId: bot.id,
          companyId: company.id,
          title: "Need help?",
          subtitle: `Ask us about ${companyName}`,
          greetingMessage: "Hi there! How can I help you today?",
        },
      });

      return { company, user, bot, widget };
    });

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token: verifyToken,
        expiresAt,
      },
    });

    console.log(`[Register] New company created: ${companyName} (${result.company.id})`);

    // Build verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://chat.benzos.uk";
    const verifyUrl = `${appUrl}/api/verify-email?token=${verifyToken}`;

    // Send welcome + verification email (non-blocking, fire and forget)
    sendEmail(
      email,
      "🎉 Welcome to BotForge — Verify Your Account",
      welcomeEmailHtml({
        name: name || companyName + " Admin",
        companyName,
        verifyUrl,
      }),
    ).catch((err: unknown) => {
      console.error("[Register] Welcome email failed (non-blocking):", err);
    });

    return NextResponse.json({
      success: true,
      message: "Company registered successfully! Check your email to verify your account.",
    });
  } catch (err: any) {
    console.error("[Register error]", err);
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
