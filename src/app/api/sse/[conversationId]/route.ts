// GET /api/sse/[conversationId] — Server-Sent Events endpoint for real-time agent messages
// Customer widget opens this connection and receives messages instantly

import { addConnection, removeConnection, getConnectionCount } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  if (!conversationId) {
    return new Response("conversationId required", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      addConnection(conversationId, controller);

      // Send initial connected event
      const initEvent = JSON.stringify({
        type: "connected",
        conversationId,
        activeConnections: getConnectionCount(conversationId),
      });
      controller.enqueue(new TextEncoder().encode(`data: ${initEvent}\n\n`));

      // Send periodic keepalive every 30s to prevent proxy timeouts
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        removeConnection(conversationId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
