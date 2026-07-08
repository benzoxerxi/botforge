#!/usr/bin/env python3
with open('/root/.openclaw/workspace/botforge/src/app/app/agent/page.tsx', 'r') as f:
    txt = f.read()

# 1. Add typingPreview state
old1 = """  const [agentInput, setAgentInput] = useState("");"""
new1 = """  const [typingPreview, setTypingPreview] = useState<string | null>(null);
  const [agentInput, setAgentInput] = useState("");"""
txt = txt.replace(old1, new1)

# 2. Add typing poll in the existing message polling useEffect
old2 = """  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(async () => {
      const cur = convRef.current;
      if (!cur) return;
      try {
        const res = await fetch(`/api/handoff/status?conversationId=${cur.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) setSelectedConv(prev => prev ? { ...prev, messages: data.messages } : prev);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);"""

new2 = """  useEffect(() => {
    if (!selectedConv) return;
    // Poll messages
    const msgInterval = setInterval(async () => {
      const cur = convRef.current;
      if (!cur) return;
      try {
        const res = await fetch(`/api/handoff/status?conversationId=${cur.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) setSelectedConv(prev => prev ? { ...prev, messages: data.messages } : prev);
      } catch {}
    }, 3000);
    return () => clearInterval(msgInterval);
  }, [selectedConv?.id]);

  // Poll typing preview every 2s
  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/widget/typing/get?conversationId=${selectedConv.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.content && data.content.length > 0) {
          setTypingPreview(data.content);
        } else {
          setTypingPreview(null);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);"""

txt = txt.replace(old2, new2)

# 3. Add typing preview UI
old3 = '              <div ref={messagesEndRef} />'

new3 = """              {/* Typing preview */}
                {typingPreview && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] border border-amber-500/12 bg-amber-500/[0.03] rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span className="text-[10px] font-semibold text-amber-400/60">Customer typing...</span>
                      </div>
                      <p className="text-xs leading-relaxed italic text-[var(--color-muted-foreground)]" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {typingPreview}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />"""

txt = txt.replace(old3, new3)

# 4. Clear typing after send
old4 = """      if (data.message) {
        setSelectedConv(prev =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
        );
        setAgentInput("");"""

new4 = """      if (data.message) {
        setSelectedConv(prev =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
        );
        setAgentInput("");
        setTypingPreview(null);"""

txt = txt.replace(old4, new4)

with open('/root/.openclaw/workspace/botforge/src/app/app/agent/page.tsx', 'w') as f:
    f.write(txt)
print('done')
