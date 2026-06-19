import { NextResponse } from "next/server";

// Facebook Messenger Webhook
// GET — Verification (Facebook sends this to verify your webhook)
// POST — Incoming messages

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // The verifyToken should match what you configure in Facebook App dashboard
  // For multi-tenant, you'd look up the company by pageId, but Facebook only gives us token
  // We'll accept any token that matches at least one company's facebookVerifyToken

  if (mode === "subscribe" && token) {
    // In a real multi-tenant setup, validate token against DB
    // For now, if token is provided and mode is subscribe, return challenge
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

// POST — Receive messages from Facebook
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Facebook Page webhook event
    if (body.object === "page") {
      for (const entry of body.entry || []) {
        const pageId = entry.id;
        for (const messaging of entry.messaging || []) {
          const senderId = messaging.sender?.id;
          const message = messaging.message?.text;
          const timestamp = messaging.timestamp;

          if (!senderId || !message) continue;

          // Find the company by facebookPageId
          // For now, log the message (multi-tenant lookup would happen here)
          console.log(`[Messenger Webhook] Page: ${pageId}, From: ${senderId}, Msg: ${message}`);

          // In a real implementation, you would:
          // 1. Look up company by facebookPageId
          // 2. Create or find conversation
          // 3. Send message to AI and reply via Facebook Send API
          // 4. Use the company's facebookToken to call Graph API
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[Messenger Webhook] Error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
