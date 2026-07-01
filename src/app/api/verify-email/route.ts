import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://chat.benzos.uk";

// GET /api/verify-email?token=xxx
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/verify-email/error?reason=missing-token`);
    }

    // Find the token
    const verifyToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verifyToken) {
      return NextResponse.redirect(`${APP_URL}/verify-email/error?reason=invalid-token`);
    }

    if (verifyToken.used) {
      return NextResponse.redirect(`${APP_URL}/verify-email/error?reason=already-used`);
    }

    if (new Date() > verifyToken.expiresAt) {
      return NextResponse.redirect(`${APP_URL}/verify-email/error?reason=expired`);
    }

    // Mark token as used and activate user
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: verifyToken.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email: verifyToken.email },
        data: { emailVerified: new Date() },
      }),
    ]);

    console.log(`[Verify] Email verified for ${verifyToken.email}`);

    return NextResponse.redirect(`${APP_URL}/verify-email/success`);
  } catch (err: any) {
    console.error("[Verify email error]", err);
    return NextResponse.redirect(`${APP_URL}/verify-email/error?reason=server-error`);
  }
}
