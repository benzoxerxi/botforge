// Typing preview manager — stores in-memory typing state per conversation
// Data lives only as long as the user is actively typing (auto-clears after inactivity)

export interface TypingSession {
  content: string;
  lastUpdate: number;
  conversationId: string;
}

const typingSessions = new Map<string, TypingSession>();

const TYPING_TTL_MS = 25_000; // clear if no update for 25s

export function setTypingContent(conversationId: string, content: string): void {
  typingSessions.set(conversationId, {
    content,
    lastUpdate: Date.now(),
    conversationId,
  });
}

export function getTypingContent(conversationId: string): TypingSession | null {
  const session = typingSessions.get(conversationId);
  if (!session) return null;

  if (Date.now() - session.lastUpdate > TYPING_TTL_MS) {
    typingSessions.delete(conversationId);
    return null;
  }
  return session;
}

export function clearTypingContent(conversationId: string): void {
  typingSessions.delete(conversationId);
}

/** Sweep stale sessions (call periodically) */
export function sweepStaleTyping(): void {
  const now = Date.now();
  for (const [convId, session] of typingSessions) {
    if (now - session.lastUpdate > TYPING_TTL_MS) {
      typingSessions.delete(convId);
    }
  }
}

/** Get all active typing sessions (for optional debug endpoint) */
export function getAllTyping(): Map<string, TypingSession> {
  sweepStaleTyping();
  return typingSessions;
}
