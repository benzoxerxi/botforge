import prisma from "@/lib/prisma";

// Load platform-level setting
export async function getPlatformSetting(key: string): Promise<string | null> {
  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

// Get active bot config for a company
export async function getBotConfig(companyId: string, botId?: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      bots: {
        where: botId ? { id: botId } : { active: true },
        take: 1,
      },
    },
  });

  if (!company) return null;

  const bot = company.bots[0];
  // Company-level AI config takes priority over platform-level
  const provider = company.aiProvider || (await getPlatformSetting("ai_provider")) || "deepseek";
  const apiKey = company.aiApiKey || (await getPlatformSetting("ai_api_key"));
  const defaultModel = company.aiModel || (await getPlatformSetting("ai_model")) || "deepseek-chat";

  return {
    provider,
    apiKey,
    model: defaultModel,
    systemPrompt:
      bot?.systemPrompt ||
      company.systemPrompt ||
      "You are a helpful AI assistant.",
    temperature: bot?.temperature ?? company.temperature ?? 0.7,
    maxTokens: bot?.maxTokens ?? company.maxTokens ?? 2048,
    useRag: bot?.useRag ?? true,
    bot,
    company,
  };
}

// Call DeepSeek API
export async function callAI(config: {
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  maxTokens: number;
  ragInstructions?: string[];
  ragFacts?: string[];
}) {
  const { apiKey, model, systemPrompt, messages, temperature, maxTokens, ragInstructions, ragFacts } = config;

  let systemMsg = systemPrompt;

  // Handoff behavior instruction — ALWAYS present
  systemMsg += `

HANDOFF: If a user asks to talk to a real person, agent, human, operator, or says they want to speak to someone real — DO NOT provide contact information (phone, email, address). NEVER give out phone numbers or email addresses as a workaround. Instead, respond: "🔄 I'm transferring you to a real person..." and the system will automatically handle the connection.`;

  // Separate instructions (behavior rules) from facts (Q&A knowledge)
  if (ragInstructions?.length || ragFacts?.length) {
    systemMsg += "\n\n===== KNOWLEDGE BASE =====";

    // INSTRUCTIONS — explicit rules the AI MUST obey
    if (ragInstructions?.length) {
      systemMsg += `\n\n>> ABSOLUTE RULES — You MUST follow these rules in every response:\n`;
      systemMsg += ragInstructions.map((r) => `  • ${r}`).join("\n");
    }

    // FACTS — Q&A knowledge to answer from
    if (ragFacts?.length) {
      systemMsg += `\n\n>> REFERENCE FACTS — Use these to answer questions when relevant:\n`;
      systemMsg += ragFacts.join("\n");
    }

    // Closing instruction — rules always apply, facts only when directly asked
    systemMsg += `\n\nRULES: Apply the ABSOLUTE RULES (formatting/style rules) to every response — they always apply.` +
      `\nFACTS IMPORTANT: Only use the information that DIRECTLY answers the user\'s specific question.` +
      `\n- If user asks about PRICES: ONLY give prices. Do NOT add working hours, addresses, or any other info.` +
      `\n- If user asks about WORKING HOURS: ONLY give hours. Do NOT list products or addresses.` +
      `\n- If user asks about ADDRESSES/LOCATIONS: ONLY give locations. Do NOT add hours or prices.` +
      `\n- If the question is completely unrelated to Karcher, ignore ALL facts.` +
      `\nNEVER add extra information that the user did not ask for. Never offer to tell them about other topics.`;

    // Formatting: clean plain text, no markdown (no **bold**, no *italic*, no ```code```)
    if (!ragInstructions?.some(i => i.toLowerCase().includes('format'))) {
      systemMsg += "\n\nFORMATTING: Keep it simple. No markdown formatting (no **bold**, no *italic*, no code blocks). Use plain text, line breaks, and indentation only.";
    }
  }

  const body = {
    model,
    messages: [
      { role: "system", content: systemMsg },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature,
    max_tokens: maxTokens,
  };

  const baseUrl = config.provider === "openai"
    ? "https://api.openai.com/v1"
    : "https://api.deepseek.com";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}
