// SSE connection manager — shared between SSE route and handoff route
// Stored in a module-level Map (works with long-running Node.js processes)

type SSEController = ReadableStreamDefaultController;

const connections = new Map<string, Set<SSEController>>();

export function addConnection(conversationId: string, controller: SSEController): void {
  if (!connections.has(conversationId)) {
    connections.set(conversationId, new Set());
  }
  connections.get(conversationId)!.add(controller);
}

export function removeConnection(conversationId: string, controller: SSEController): void {
  const conns = connections.get(conversationId);
  if (!conns) return;
  conns.delete(controller);
  if (conns.size === 0) connections.delete(conversationId);
}

export function pushEvent(conversationId: string, event: Record<string, unknown>): void {
  const conns = connections.get(conversationId);
  if (!conns || conns.size === 0) return;

  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();

  for (const controller of conns) {
    try {
      controller.enqueue(encoder.encode(data));
    } catch {
      // Client disconnected — remove stale connection
      conns.delete(controller);
    }
  }

  if (conns.size === 0) connections.delete(conversationId);
}

export function getConnectionCount(conversationId: string): number {
  return connections.get(conversationId)?.size ?? 0;
}
