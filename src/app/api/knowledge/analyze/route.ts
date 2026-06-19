import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPlatformSetting } from "@/lib/ai";

// POST /api/knowledge/analyze — Send all KB entries to AI for analysis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId } = body;
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    // Get AI config
    const provider = (await getPlatformSetting("ai_provider")) || "deepseek";
    const apiKey = await getPlatformSetting("ai_api_key");
    const model = (await getPlatformSetting("ai_model")) || "deepseek-chat";
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key not configured" }, { status: 400 });
    }

    // Fetch all active KB entries
    const kb = await prisma.knowledgeBase.findMany({
      where: { companyId, active: true },
    });

    if (!kb.length) {
      return NextResponse.json({ analysis: "No knowledge base entries found. Add some first!" });
    }

    // Format KB content for analysis
    let kbSummary = "";
    for (const k of kb) {
      kbSummary += `\n--- Entry: ${k.name} (type: ${k.type}) ---\n`;
      if (k.qaData && k.qaData.length > 2) {
        try {
          const pairs = JSON.parse(k.qaData);
          if (Array.isArray(pairs)) {
            for (const p of pairs) {
              if (p.question && p.answer) {
                kbSummary += `Q: ${p.question}\nA: ${p.answer}\n\n`;
              } else if (p.question) {
                kbSummary += `Instruction: ${p.question}\n\n`;
              } else if (p.answer) {
                kbSummary += `${p.answer.substring(0, 200)}...\n\n`;
              }
            }
          }
        } catch {}
      }
      if (k.sourceUrl) {
        kbSummary += `Source URL: ${k.sourceUrl}\n`;
      }
    }

    // Build the analysis prompt
    const systemPrompt = `You are a knowledge base quality analyst. Analyze the following knowledge base content and provide:
1. A brief summary of what topics are covered
2. Any issues you notice (duplicates, conflicts, missing info, formatting problems)
3. Suggestions for improvement
4. How well the bot can answer customer questions with this content

Keep your analysis concise and actionable. Answer in the same language as the content.`;

    // Call AI
    const baseUrl = provider === "openai" ? "https://api.openai.com/v1" : "https://api.deepseek.com";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: kbSummary },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `AI API error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const analysis = data.choices?.[0]?.message?.content || "Analysis failed";
    return NextResponse.json({ analysis, entryCount: kb.length });
  } catch (err: any) {
    console.error("[Knowledge Analyze]", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
