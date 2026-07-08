import { NextResponse } from "next/server";
import { getBotConfig, callAI } from "@/lib/ai";
import prisma from "@/lib/prisma";
import { clearTypingContent } from "@/lib/typing";

// POST /api/chat - Send a message to the bot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, botId, message, conversationId, customerName, customerEmail, channel = "widget" } = body;

    if (!companyId || !message) {
      return NextResponse.json({ error: "companyId and message are required" }, { status: 400 });
    }

    const config = await getBotConfig(companyId, botId);
    if (!config || !config.apiKey) {
      return NextResponse.json(
        { error: "AI not configured. Contact admin." },
        { status: 400 }
      );
    }

    // Get or create conversation
    let convId = conversationId;
    let history: Array<{ role: string; content: string }> = [];

    if (convId) {
      const existing = await prisma.conversation.findUnique({
        where: { id: convId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      });
      if (existing) {
        history = existing.messages.map((m) => ({
          role: m.role === "agent" ? "assistant" : m.role,
          content: m.content,
        }));
      } else {
        convId = null;
      }
    }

    if (!convId) {
      const newConv = await prisma.conversation.create({
        data: {
          companyId,
          botId: config.bot?.id || "",
          channel,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
        },
      });
      convId = newConv.id;
    }

    // Check if conversation is in handoff_active mode → save message but skip AI, let agents handle
    const conv = await prisma.conversation.findUnique({ where: { id: convId } });
    if (conv?.status === "handoff_active") {
      // Save user message so agent can see it
      const newMsg = await prisma.message.create({
        data: {
          conversationId: convId,
          role: "user",
          content: message,
          source: "user",
        },
      });

      // Push user message via SSE so agent panel gets it in real-time
      try {
        const { pushEvent } = await import("@/lib/sse");
        pushEvent(convId, {
          type: "new_message",
          message: {
            id: newMsg.id,
            role: "user",
            content: message,
            source: "user",
          },
        });
      } catch {}

      return NextResponse.json({
        reply: "📨 Message sent to agent.",
        conversationId: convId,
        handoffActive: true,
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "user",
        content: message,
        source: "user",
      },
    });

    // Simple RAG - fetch knowledge base content
    let ragInstructions: string[] = [];
    let ragFacts: string[] = [];
    if (config.useRag) {
      const kb = await prisma.knowledgeBase.findMany({
        where: { companyId, active: true },
      });
      for (const k of kb) {
        if (k.qaData && k.qaData.length > 2) {
          try {
            const pairs = JSON.parse(k.qaData);
            if (Array.isArray(pairs)) {
              for (const p of pairs) {
                // INSTRUCTION: has a short question but NO answer → behavior rule
                // (long questions >100 chars are probably content in wrong field, treat as fact)
                if (p.question && (!p.answer || !p.answer.trim()) && !p.question.startsWith("From ") && p.question.length < 100) {
                  ragInstructions.push(p.question);
                }
                // Long content without answer → fact (user put content in question field)
                else if (p.question && (!p.answer || !p.answer.trim()) && p.question.length >= 100) {
                  ragFacts.push(`• ${p.question}`);
                }
                // FACT: has both question and answer → Q&A knowledge
                else if (p.question && p.answer && p.answer.trim()) {
                  ragFacts.push(`• Question: ${p.question}\n  Answer: ${p.answer}`);
                }
                // CONTENT: no question, just answer → pure knowledge
                else if (!p.question && p.answer && p.answer.trim()) {
                  ragFacts.push(`• ${p.answer}`);
                }
              }
            }
          } catch {}
        }
      }
    }

    // Inject instructions directly INTO the user message for maximum AI compliance
    const enhancedUserMsg = ragInstructions.length > 0
      ? `[📋 INSTRUCTIONS — You MUST follow these rules in your response: ${ragInstructions.join("; ")}]\n\n${message}`
      : message;

    // Call AI
    const result = await callAI({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      systemPrompt: config.systemPrompt,
      messages: [...history, { role: "user", content: enhancedUserMsg }],
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      ragInstructions: ragInstructions.length > 0 ? ragInstructions : undefined,
      ragFacts: ragFacts.length > 0 ? ragFacts : undefined,
    });

    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: result.content,
        source: "ai",
      },
    });

    // Check if message triggers handoff
    let handoffDetected = false;
    if (config.bot?.handoffTrigger) {
      const trigger = config.bot.handoffTrigger;
      const keywords = config.bot.handoffKeywords?.split(",").map((k: string) => k.trim().toLowerCase()) || [];
      const msgLower = message.toLowerCase();

      if (trigger === "keyword" && keywords.length > 0) {
        handoffDetected = keywords.some((kw: string) => msgLower.includes(kw));
      }
      if (trigger === "auto") {
        // Auto-trigger for specific patterns (EN + GE)
        // GE: using roots to catch all cases (ადამიანს, ადამიანთან, ადამიანმა...)
        const autoKeywords = [
          "agent", "human", "operator", "person", "talk to a real", "speak to someone", "real person",
          // GE: Georgian script
          "ადამიან", "ოპერატორ", "ნამდვილ", "დამეხმარე", "დამიკავშირდი", "რეალურ",
          // GE: Latin transliteration of Georgian keywords
          "adami", "damakavshir", "damexmare", "nadmnil", "realuri", "mkas",
        ];
        handoffDetected = autoKeywords.some((kw) => msgLower.includes(kw));
      }
    }

    if (handoffDetected) {
      await prisma.conversation.update({
        where: { id: convId },
        data: { status: "handoff_requested" },
      });
      await prisma.message.create({
        data: {
          conversationId: convId,
          role: "system",
          content: "🔄 Customer requested a human agent",
          source: "system",
        },
      });
    }

    // Update conversation stats
    const tokenCost = result.usage?.total_tokens || 0;
    await prisma.conversation.update({
      where: { id: convId },
      data: {
        messageCount: { increment: 2 },
        tokenCost: { increment: tokenCost },
      },
    });

    // Update company token usage
    await prisma.company.update({
      where: { id: companyId },
      data: { tokensUsed: { increment: tokenCost } },
    });

    return NextResponse.json({
      reply: handoffDetected ? `${result.content}\n\n🔄 A human agent will take over shortly!` : result.content,
      conversationId: convId,
      usage: result.usage,
      handoffDetected,
      handoffActive: false,
    });
  } catch (err: any) {
    console.error("[Chat API]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
