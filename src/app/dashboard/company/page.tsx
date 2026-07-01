"use client";
export const dynamic = "force-dynamic";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CatalogTab from "./CatalogTab";
import MessengerTab from "./MessengerTab";
import { useEffect, useRef, useState } from "react";

interface Bot {
  id: string;
  name: string;
  systemPrompt: string | null;
  temperature: number;
  maxTokens: number;
  useRag: boolean;
  active: boolean;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  tokenLimit: number;
  tokensUsed: number;
  bots: Bot[];
  chatWidgets: any[];
  enableFacebook: boolean;
  facebookToken: string | null;
}

interface KnowledgeItem {
  id: string;
  name: string;
  type: string;
  qaData: string | null;
  sourceUrl: string | null;
  chunkCount: number;
}

export default function CompanyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bot" | "knowledge" | "widget" | "test" | "agents" | "catalog" | "messenger">("bot");

  // Bot config state
  const [botName, setBotName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [useRag, setUseRag] = useState(true);
  const [saving, setSaving] = useState(false);
  // Widget settings state
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetSubtitle, setWidgetSubtitle] = useState("");
  const [widgetGreeting, setWidgetGreeting] = useState("");
  const [widgetAccent, setWidgetAccent] = useState("#00f0ff");
  const [widgetBg, setWidgetBg] = useState("#0a0e1a");
  const [widgetText, setWidgetText] = useState("#ffffff");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [agentBubbleColor, setAgentBubbleColor] = useState("rgba(255,255,255,0.06)");
  const [agentTextColor, setAgentTextColor] = useState("#ffffff");
  const [userBubbleColor, setUserBubbleColor] = useState("#00f0ff");
  const [userTextColor, setUserTextColor] = useState("#ffffff");
  const [botTextColor, setBotTextColor] = useState("#ffffff");
  const [resetButtonColor, setResetButtonColor] = useState("#00f0ff");
  const [resetButtonLabel, setResetButtonLabel] = useState("Start new chat");
  const [resetButtonTextColor, setResetButtonTextColor] = useState("#ffffff");
  const [endChatButtonColor, setEndChatButtonColor] = useState("#ef4444");
  const [endChatButtonLabel, setEndChatButtonLabel] = useState("End chat");
  const [endChatButtonTextColor, setEndChatButtonTextColor] = useState("#ffffff");
  const [widgetPreset, setWidgetPreset] = useState<string>("");
  const [widgetSaving, setWidgetSaving] = useState(false);
  const [widgetSaveMsg, setWidgetSaveMsg] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Knowledge state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [kbName, setKbName] = useState("");
  const [kbType, setKbType] = useState<"qa" | "crawl" | "document">("qa");
  const [qaPairs, setQaPairs] = useState<string>("");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editKbId, setEditKbId] = useState<string | null>(null);
  const [editKbName, setEditKbName] = useState("");
  const [editKbType, setEditKbType] = useState<"qa" | "crawl">("qa");
  const [editQaData, setEditQaData] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editingCrawl, setEditingCrawl] = useState(false);

  // Chat test state
  const [agents, setAgents] = useState<{ id: string; name: string | null; email: string; active: boolean; createdAt: string }[]>([]);
  const [testMessages, setTestMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [testInput, setTestInput] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testConvId, setTestConvId] = useState<string | null>(null);
  const testChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const [companyRes, kbRes] = await Promise.all([
        fetch(`/api/company/bot?companyId=${session?.user?.companyId}`),
        fetch(`/api/knowledge?companyId=${session?.user?.companyId}`),
      ]);
      const companyData = await companyRes.json();
      const kbData = await kbRes.json();

      if (companyData.company) {
        setCompany(companyData.company);
        const bot = companyData.company.bots?.[0];
        if (bot) {
          setBotName(bot.name || "");
          setSystemPrompt(bot.systemPrompt || "");
          setTemperature(bot.temperature ?? 0.7);
          setMaxTokens(bot.maxTokens ?? 2048);
          setUseRag(bot.useRag ?? true);
        }
        // Set greeting from widget config
        const greeting = companyData.company.chatWidgets?.[0]?.greetingMessage || "Hi! How can I help you today?";
        // Load widget settings
        const w = companyData.company.chatWidgets?.[0];
        if (w) {
          setWidgetTitle(w.title || "Need help?");
          setWidgetSubtitle(w.subtitle || "Ask us anything");
          setWidgetGreeting(w.greetingMessage || "Hi! How can I help you today?");
          setWidgetAccent(w.primaryColor || "#00f0ff");
          setWidgetBg(w.backgroundColor || "#0a0e1a");
          setWidgetText(w.textColor || "#ffffff");
          setWidgetPosition(w.position || "bottom-right");
          setAgentBubbleColor(w.agentBubbleColor || "rgba(255,255,255,0.06)");
          setAgentTextColor(w.agentTextColor || "#ffffff");
          setUserBubbleColor(w.userBubbleColor || "#00f0ff");
          setUserTextColor(w.userTextColor || "#ffffff");
          setBotTextColor(w.botTextColor || "#ffffff");
          setResetButtonColor(w.resetButtonColor || "#00f0ff");
          setResetButtonLabel(w.resetButtonLabel || "Start new chat");
          setResetButtonTextColor(w.resetButtonTextColor || "#ffffff");
          setEndChatButtonColor(w.endChatButtonColor || "#ef4444");
          setEndChatButtonLabel(w.endChatButtonLabel || "End chat");
          setEndChatButtonTextColor(w.endChatButtonTextColor || "#ffffff");
        }
    loadAgents();
        if (testMessages.length === 0) {
          setTestMessages([{ role: "assistant", content: greeting }]);
        }
      }
      if (kbData.knowledge) setKnowledge(kbData.knowledge);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadAgents = async () => {
    if (!session?.user?.companyId) return;
    try {
      const res = await fetch(`/api/company/agents?companyId=${session.user.companyId}`);
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch {}
  };

  const saveBotConfig = async () => {
    const bot = company?.bots?.[0];
    if (!bot) return;
    setSaving(true);
    setSaveMsg(null);

    const res = await fetch("/api/company/bot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botId: bot.id,
        name: botName,
        systemPrompt,
        temperature,
        maxTokens,
        useRag,
      }),
    });

    if (res.ok) {
      setSaveMsg("✅ Bot config saved!");
    } else {
      setSaveMsg("❌ Failed to save");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const saveWidgetSettings = async () => {
    if (!company?.id) return;
    setWidgetSaving(true);
    setWidgetSaveMsg(null);
    try {
      const res = await fetch("/api/company/widget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          title: widgetTitle,
          subtitle: widgetSubtitle,
          greetingMessage: widgetGreeting,
          primaryColor: widgetAccent,
          backgroundColor: widgetBg,
          textColor: widgetText,
          position: widgetPosition,
          agentBubbleColor,
          agentTextColor,
          userBubbleColor,
          userTextColor,
          botTextColor,
          resetButtonColor,
          resetButtonLabel,
          resetButtonTextColor,
          endChatButtonColor,
          endChatButtonLabel,
          endChatButtonTextColor,
        }),
      });
      if (res.ok) {
        setWidgetSaveMsg("✅ Widget settings saved!");
      } else {
        setWidgetSaveMsg("❌ Failed to save");
      }
    } catch {
      setWidgetSaveMsg("❌ Error saving");
    }
    setWidgetSaving(false);
    setTimeout(() => setWidgetSaveMsg(null), 3000);
  };

  const createWidget = async () => {
    if (!company?.id || !company?.bots?.[0]?.id) return;
    setWidgetSaving(true);
    try {
      await fetch("/api/company/widget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });
      await loadData();
    } catch {}
    setWidgetSaving(false);
  };

  const addKnowledge = async () => {
    if (!kbName) return;

    // File upload path
    if (kbType === "document") {
      if (!uploadFile) return alert("Select a file to upload");

      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", kbName);
      if (company?.id) formData.append("companyId", company.id);
      if (company?.bots?.[0]?.id) formData.append("botId", company.bots[0].id);

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      setUploading(false);
      if (res.ok) {
        setKbName("");
        setUploadFile(null);
        loadData();
      } else {
        const err = await res.json();
        alert("Upload failed: " + (err.error || "Unknown error"));
      }
      return;
    }

    // Q&A or Crawl path
    if (kbType === "qa" && !qaPairs.trim()) return alert("Enter at least one Q&A pair");
    if (kbType === "crawl" && !crawlUrl.trim()) return alert("Enter a website URL");

    const body: any = {
      name: kbName,
      type: kbType,
      companyId: company?.id,
      botId: company?.bots?.[0]?.id,
    };

    if (kbType === "qa") {
      const pairs = qaPairs
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const idx = l.indexOf("?");
          if (idx >= 0) {
            return { question: l.substring(0, idx).trim(), answer: l.substring(idx + 1).trim() };
          }
          return { question: l.trim(), answer: "" };
        });
      if (pairs.length === 0) return alert("No valid Q&A pairs — enter each fact on a separate line");
      body.qaData = pairs;
    } else if (kbType === "crawl") {
      body.sourceUrl = crawlUrl;
    }

    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setKbName("");
      setQaPairs("");
      setCrawlUrl("");
      loadData();
    }
  };

  const removeKnowledge = async (id: string) => {
    if (!confirm("Remove this knowledge source?")) return;
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const analyzeKnowledge = async () => {
    if (!knowledge.length) return alert("No knowledge entries to analyze.");
    setAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const res = await fetch("/api/knowledge/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: session?.user?.companyId }),
      });
      const data = await res.json();
      if (data.error) {
        setAnalyzeResult("❌ Error: " + data.error);
      } else {
        setAnalyzeResult(data.analysis || "Analysis returned no content.");
      }
    } catch {
      setAnalyzeResult("❌ Network error while analyzing");
    }
    setAnalyzing(false);
  };

  const openEditKb = (item: KnowledgeItem) => {
    setEditKbId(item.id);
    setEditKbName(item.name);
    if (item.type === "document") {
      setEditKbType("qa");  // documents are edited as Q&A content
      setEditingCrawl(false);
    } else {
      setEditKbType(item.type as "qa" | "crawl");
      setEditingCrawl(item.type === "crawl");
    }
    setEditSourceUrl(item.sourceUrl || "");
    if (item.qaData && item.qaData.length > 5) {
      try {
        const pairs = JSON.parse(item.qaData);
        if (Array.isArray(pairs)) {
          setEditQaData(pairs.map((p: any) => `${p.question}${p.answer ? "? " + p.answer : ""}`).join("\n"));
        }
      } catch {
        setEditQaData(item.qaData);
      }
    } else {
      setEditQaData("");
    }
  };

  const saveEditKb = async () => {
    if (!editKbId) return;

    const body: any = { id: editKbId, name: editKbName };

    if (editKbType === "qa") {
      // Parse Q&A text into the expected format
      const pairs = editQaData
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const idx = l.indexOf("?");
          if (idx >= 0) {
            return { question: l.substring(0, idx).trim(), answer: l.substring(idx + 1).trim() };
          }
          return { question: l.trim(), answer: "" };
        });
      body.qaData = pairs;
    } else {
      // Crawl: save the raw content as a single Q&A pair
      const content = editQaData.trim();
      body.qaData = content
        ? [{ question: `Website content from ${editKbName}`, answer: content }]
        : [];
      if (editSourceUrl) body.sourceUrl = editSourceUrl;
    }

    await fetch("/api/knowledge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEditKbId(null);
    loadData();
  };

  // Test chat send function
  async function sendTestMessage() {
    const msg = testInput.trim();
    if (!msg || testSending || !company) return;

    setTestInput("");
    setTestMessages((prev) => [...prev, { role: "user", content: msg }]);
    setTestSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          botId: company.bots?.[0]?.id,
          message: msg,
          conversationId: testConvId,
          channel: "test",
        }),
      });

      const data = await res.json();
      setTestMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response" }]);
      if (data.conversationId) setTestConvId(data.conversationId);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error connecting to AI. Make sure API key is configured in Admin Settings." },
      ]);
    }

    setTestSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tokenUsage = company ? Math.round((company.tokensUsed / company.tokenLimit) * 100) : 0;

  // Widget-like styling for test chat
  const accent = company?.chatWidgets?.[0]?.primaryColor || "#00f0ff";
  const bgColor = company?.chatWidgets?.[0]?.backgroundColor || "#0a0e1a";
  const textColor = company?.chatWidgets?.[0]?.textColor || "#ffffff";
  const previewBotTextColor = company?.chatWidgets?.[0]?.botTextColor || textColor;

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{company?.name || "Dashboard"}</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{company?.slug}</p>
        </div>
        {/* Token usage */}
        <div className="text-right">
          <div className="text-xs text-[var(--color-muted-foreground)]">Token Usage</div>
          <div className="text-sm font-semibold">
            {(company?.tokensUsed || 0).toLocaleString()} / {(company?.tokenLimit || 0).toLocaleString()}
          </div>
          {company && (
            <div className="w-24 h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(tokenUsage, 100)}%`,
                  backgroundColor: tokenUsage > 80 ? "#f43f5e" : "#00f0ff",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] w-fit">
        {[
          { id: "bot" as const, label: "🤖 Bot Config" },
          { id: "knowledge" as const, label: "📚 Knowledge Base" },
          { id: "widget" as const, label: "🌐 Widget" },
          { id: "agents" as const, label: "👤 Agents" },
          { id: "catalog" as const, label: "📦 Catalog" },
          { id: "messenger" as const, label: "📱 Messenger" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "text-themed hover:text-themed"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* BOT CONFIG TAB */}
      {activeTab === "bot" && (
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <h3 className="text-sm font-semibold mb-4">Bot Settings</h3>

          {saveMsg && (
            <div className="mb-4 px-3 py-2 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
              {saveMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-themed mb-1">Bot Name</label>
              <input
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                placeholder="Customer Support Bot"
              />
            </div>
            <div>
              <label className="block text-xs text-themed mb-1">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm placeholder-[var(--color-muted-foreground)]"
                placeholder="You are a helpful customer support assistant..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-themed mb-1">Temperature ({temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-xs text-themed mb-1">Max Tokens</label>
                <select
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                >
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                  <option value={2048}>2048</option>
                  <option value={4096}>4096</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseRag(!useRag)}
                className={`w-10 h-5 rounded-full relative transition-all ${
                  useRag ? "bg-[var(--color-accent)]" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    useRag ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-sm">Use Knowledge Base (RAG)</span>
            </div>
            <button
              onClick={saveBotConfig}
              disabled={saving}
              className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
            >
              {saving ? "Saving..." : "💾 Save Config"}
            </button>
          </div>
        </div>
      )}

      {/* KNOWLEDGE BASE TAB */}
      {activeTab === "knowledge" && (
        <div className="space-y-4">
          {/* Add knowledge */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <h3 className="text-sm font-semibold mb-4">Add Knowledge Source</h3>
            <div className="space-y-3">
              <input
                value={kbName}
                onChange={(e) => setKbName(e.target.value)}
                placeholder="Name (e.g. Product FAQs)"
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setKbType("qa")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    kbType === "qa"
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "bg-white/5 text-themed"
                  }`}
                >
                  📝 Q&A Pairs
                </button>
                <button
                  onClick={() => setKbType("crawl")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    kbType === "crawl"
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "bg-white/5 text-themed"
                  }`}
                >
                  🌐 Website Crawl
                </button>
                <button
                  onClick={() => setKbType("document")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    kbType === "document"
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "bg-white/5 text-themed"
                  }`}
                >
                  📄 Upload File
                </button>
              </div>
              {kbType === "qa" ? (
                <textarea
                  value={qaPairs}
                  onChange={(e) => setQaPairs(e.target.value)}
                  rows={4}
                  placeholder="Question? Answer (one per line)&#10;What are your hours? We're open 9-6&#10;Where are you located? 123 Main St"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm placeholder-[var(--color-muted-foreground)]"
                />
              ) : kbType === "crawl" ? (
                <input
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs text-themed">
                    Supported: PDF, TXT, MD, CSV
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-themed file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white file:bg-[var(--color-accent)]/20 file:hover:bg-[var(--color-accent)]/30 file:cursor-pointer transition-all"
                  />
                  {uploadFile && (
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={addKnowledge}
                disabled={uploading || (kbType === "document" && !uploadFile)}
                className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
              >
                {uploading ? "⏳ Uploading..." : kbType === "document" ? "📤 Upload" : "➕ Add"}
              </button>
            </div>
          </div>

          {/* Analyze button */}
          {knowledge.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={analyzeKnowledge}
                disabled={analyzing}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/10 transition-all disabled:opacity-50"
              >
                {analyzing ? "⏳ Analyzing..." : "🔍 Analyze KB"}
              </button>
            </div>
          )}

          {/* Analysis result dialog */}
          {analyzeResult && (
            <div className="mb-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">KB Analysis</span>
                <button onClick={() => setAnalyzeResult(null)} className="text-xs text-themed hover:text-themed">✕</button>
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap text-themed font-sans">{analyzeResult}</pre>
            </div>
          )}

          {/* Knowledge list */}
          <div className="space-y-2">
            {knowledge.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)] text-center py-8">
                No knowledge sources yet. Add Q&A pairs or a website URL above.
              </p>
            )}
            {knowledge.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {item.type === "qa" ? "📝 Q&A" : item.type === "crawl" ? "🌐 Web" : "📄 Document"} · {item.chunkCount} chunks{item.sourceUrl ? ` · ${item.sourceUrl}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditKb(item)}
                    className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent)]/80"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => removeKnowledge(item.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WIDGET TAB */}
      {activeTab === "widget" && company?.chatWidgets?.[0] && (
        <WidgetSettings
          widget={company?.chatWidgets?.[0]}
          companyName={company?.name}
          companyId={company?.id}
          title={widgetTitle}
          subtitle={widgetSubtitle}
          greeting={widgetGreeting}
          accent={widgetAccent}
          bg={widgetBg}
          text={widgetText}
          position_={widgetPosition}
          agentBubbleColor_={agentBubbleColor}
          agentTextColor_={agentTextColor}
          userBubbleColor_={userBubbleColor}
          userTextColor_={userTextColor}
          botTextColor_={botTextColor}
          resetButtonColor_={resetButtonColor}
          resetButtonLabel_={resetButtonLabel}
          resetButtonTextColor_={resetButtonTextColor}
          endChatButtonColor_={endChatButtonColor}
          endChatButtonLabel_={endChatButtonLabel}
          endChatButtonTextColor_={endChatButtonTextColor}
          preset={widgetPreset}
          saving={widgetSaving}
          saveMsg={widgetSaveMsg}
          onTitleChange={setWidgetTitle}
          onSubtitleChange={setWidgetSubtitle}
          onGreetingChange={setWidgetGreeting}
          onAccentChange={setWidgetAccent}
          onBgChange={setWidgetBg}
          onTextChange={setWidgetText}
          onPositionChange={setWidgetPosition}
          onAgentBubbleChange={setAgentBubbleColor}
          onAgentTextChange={setAgentTextColor}
          onUserBubbleChange={setUserBubbleColor}
          onUserTextChange={setUserTextColor}
          onBotTextChange={setBotTextColor}
          onResetColorChange={setResetButtonColor}
          onResetLabelChange={setResetButtonLabel}
          onResetTextChange={setResetButtonTextColor}
          onEndChatColorChange={setEndChatButtonColor}
          onEndChatLabelChange={setEndChatButtonLabel}
          onEndChatTextChange={setEndChatButtonTextColor}
          onPresetChange={setWidgetPreset}
          onSave={saveWidgetSettings}
        />
      )}
      {/* EDIT KB DIALOG */}
      {editKbId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditKbId(null)}>
          <div className="w-full max-w-lg mx-4 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">✏️ Edit: {editKbName}</h3>

            <div className="space-y-3">
              <input
                value={editKbName}
                onChange={(e) => setEditKbName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                placeholder="Name"
              />

              {editingCrawl && (
                <input
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                  placeholder="Source URL (optional)"
                />
              )}
              <textarea
                value={editQaData}
                onChange={(e) => setEditQaData(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm placeholder-[var(--color-muted-foreground)]"
                placeholder="Question? Answer (one per line)&#10;Each line is a separate knowledge fact"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditKbId(null)}
                  className="px-4 py-2 rounded-lg text-sm text-themed hover:text-themed/80 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditKb}
                  className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all glow-teal"
                >
                  💾 Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "widget" && !company?.chatWidgets?.[0] && (
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-center py-8">
          <div className="text-2xl mb-2">🌐</div>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-3">Widget not configured yet</p>
          <button
            onClick={createWidget}
            className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all glow-teal"
          >
            ➕ Create Widget
          </button>
        </div>
      )}

      {/* TEST CHAT TAB — styled like real widget */}
      {activeTab === "agents" && (
        <AgentSection companyId={company?.id} botId={company?.bots?.[0]?.id} />
      )}

      {/* CATALOG TAB */}
      {activeTab === "catalog" && <CatalogTab companyId={company?.id} />}

      {/* MESSENGER TAB */}
      {activeTab === "messenger" && <MessengerTab companyId={company?.id} company={company} />}


    </div>
    </ErrorBoundary>
  );
}

// ── Agent Management Section ──
function AgentSection({ companyId, botId }: { companyId?: string; botId?: string }) {
  const [agents, setAgents] = useState<{ id: string; name: string | null; email: string; active: boolean; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/company/agents?companyId=${companyId}`);
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch {}
    setLoading(false);
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password required"); return; }
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/company/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password, companyId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setCreating(false); return; }
      setSuccess(`Agent "${email}" created! Share their login.`);
      setShowCreate(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchAgents();
    } catch { setError("Network error"); }
    setCreating(false);
  };

  const toggleAgent = async (agentId: string, active: boolean) => {
    await fetch("/api/company/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, active: !active }),
    });
    fetchAgents();
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Delete this agent?")) return;
    await fetch(`/api/company/agents?agentId=${agentId}`, { method: "DELETE" });
    fetchAgents();
  };

  return (
    <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">👤 Support Agents</h3>
          <p className="text-xs text-themed mt-1">Agents can answer customer chats without accessing the dashboard.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-all"
        >
          + Add Agent
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createAgent} className="mb-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
          <h4 className="text-xs font-semibold">New Agent</h4>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)]" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)]" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required
            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-background)] border border-[var(--color-border)] text-themed placeholder-[var(--color-muted-foreground)]" />
          {error && <div className="text-xs text-red-400">{error}</div>}
          {success && <div className="text-xs text-green-400">{success}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-50">
              {creating ? "..." : "Create Agent"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 rounded-lg text-xs border border-[var(--color-border)] text-themed hover:bg-[var(--color-border)]/50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-xs text-themed text-center py-8">No agents yet. Create one to get started.</div>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
              <div>
                <div className="text-sm font-medium text-themed">{agent.name || agent.email}</div>
                <div className="text-xs text-themed">{agent.email} · {new Date(agent.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${agent.active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {agent.active ? "Active" : "Inactive"}
                </span>
                <button onClick={() => toggleAgent(agent.id, agent.active)}
                  className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-themed hover:bg-[var(--color-border)]/50">
                  {agent.active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteAgent(agent.id)}
                  className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === WIDGET SETTINGS COMPONENT ===
function WidgetSettings({
  widget, companyName, companyId,
  title, subtitle, greeting, accent, bg, text, position_,
  agentBubbleColor_, agentTextColor_, userBubbleColor_, userTextColor_, botTextColor_,
  resetButtonColor_, resetButtonLabel_, resetButtonTextColor_,
  endChatButtonColor_, endChatButtonLabel_, endChatButtonTextColor_,
  preset, saving, saveMsg,
  onTitleChange, onSubtitleChange, onGreetingChange,
  onAccentChange, onBgChange, onTextChange, onPositionChange,
  onAgentBubbleChange, onAgentTextChange, onUserBubbleChange, onUserTextChange, onBotTextChange,
  onResetColorChange, onResetLabelChange, onResetTextChange,
  onEndChatColorChange, onEndChatLabelChange, onEndChatTextChange,
  onPresetChange, onSave,
}: {
  widget: any; companyName: string; companyId: string;
  title: string; subtitle: string; greeting: string;
  accent: string; bg: string; text: string; position_: string;
  agentBubbleColor_: string; agentTextColor_: string; userBubbleColor_: string; userTextColor_: string; botTextColor_: string;
  resetButtonColor_: string; resetButtonLabel_: string; resetButtonTextColor_: string;
  endChatButtonColor_: string; endChatButtonLabel_: string; endChatButtonTextColor_: string;
  preset: string; saving: boolean; saveMsg: string | null;
  onTitleChange: (v: string) => void; onSubtitleChange: (v: string) => void; onGreetingChange: (v: string) => void;
  onAccentChange: (v: string) => void; onBgChange: (v: string) => void; onTextChange: (v: string) => void; onPositionChange: (v: string) => void;
  onAgentBubbleChange: (v: string) => void; onAgentTextChange: (v: string) => void;
  onUserBubbleChange: (v: string) => void; onUserTextChange: (v: string) => void; onBotTextChange: (v: string) => void;
  onResetColorChange: (v: string) => void; onResetLabelChange: (v: string) => void; onResetTextChange: (v: string) => void;
  onEndChatColorChange: (v: string) => void; onEndChatLabelChange: (v: string) => void; onEndChatTextChange: (v: string) => void;
  onPresetChange: (v: string) => void; onSave: () => void;
}) {
  const applyPreset = (name: string) => {
    onPresetChange(name);
    const presets: Record<string, any> = {
      cyber: { accent: "#00f0ff", bg: "#0a0e1a", text: "#ffffff", botText: "#ffffff", agentBubble: "rgba(255,255,255,0.06)", agentText: "#ffffff", userBubble: "#00f0ff", userText: "#ffffff", resetColor: "#00f0ff", resetText: "#ffffff", endColor: "#ef4444", endText: "#ffffff" },
      darkLux: { accent: "#a78bfa", bg: "#0c0015", text: "#e2e8f0", botText: "#e2e8f0", agentBubble: "rgba(255,255,255,0.04)", agentText: "#e2e8f0", userBubble: "#a78bfa", userText: "#ffffff", resetColor: "#a78bfa", resetText: "#ffffff", endColor: "#7f1d1d", endText: "#e2e8f0" },
      softBlue: { accent: "#3b82f6", bg: "#0f172a", text: "#f1f5f9", botText: "#f1f5f9", agentBubble: "rgba(59,130,246,0.08)", agentText: "#93c5fd", userBubble: "#3b82f6", userText: "#ffffff", resetColor: "#3b82f6", resetText: "#ffffff", endColor: "#dc2626", endText: "#ffffff" },
      warmAmber: { accent: "#f59e0b", bg: "#1c1917", text: "#fff7ed", botText: "#fff7ed", agentBubble: "rgba(251,191,36,0.08)", agentText: "#fde68a", userBubble: "#f59e0b", userText: "#000", resetColor: "#f59e0b", resetText: "#000", endColor: "#b91c1c", endText: "#fff7ed" },
      mintNight: { accent: "#34d399", bg: "#022c22", text: "#ecfdf5", botText: "#ecfdf5", agentBubble: "rgba(52,211,153,0.08)", agentText: "#6ee7b7", userBubble: "#34d399", userText: "#000", resetColor: "#34d399", resetText: "#000", endColor: "#7f1d1d", endText: "#ecfdf5" },
    };
    const p = presets[name];
    if (p) {
      onAccentChange(p.accent);
      onBgChange(p.bg);
      onTextChange(p.text);
      onAgentBubbleChange(p.agentBubble);
      onAgentTextChange(p.agentText);
      onUserBubbleChange(p.userBubble);
      onUserTextChange(p.userText);
      onBotTextChange(p.botText || p.text || "#ffffff");
      onResetColorChange(p.resetColor);
      onResetTextChange(p.resetText);
      onEndChatColorChange(p.endColor);
      onEndChatTextChange(p.endText);
    }
  };

  const colorRow = (label: string, value: string, onChange: (v: string) => void) => (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--color-muted-foreground)] min-w-[100px]">{label}</label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-2 py-1 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-mono" />
    </div>
  );

  const presets = ["cyber", "darkLux", "softBlue", "warmAmber", "mintNight"];
  const presetLabels: Record<string, string> = { cyber: "💠 Cyber", darkLux: "🌑 Dark Lux", softBlue: "🔵 Soft Blue", warmAmber: "🟠 Warm Amber", mintNight: "🌿 Mint Night" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Appearance Settings */}
      <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-4">
        <h3 className="text-sm font-semibold">🎨 Widget Appearance</h3>

        {/* Presets */}
        <div>
          <label className="text-xs text-[var(--color-muted-foreground)] mb-2 block">Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((name) => (
              <button key={name} onClick={() => applyPreset(name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preset === name ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]" : "bg-white/5 hover:bg-white/10 text-themed"
                }`}
              >
                {presetLabels[name]}
              </button>
            ))}
          </div>
        </div>

        {/* Header Text */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Header</label>
          <input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Widget title" className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
          <input value={subtitle} onChange={(e) => onSubtitleChange(e.target.value)} placeholder="Widget subtitle" className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
          <input value={greeting} onChange={(e) => onGreetingChange(e.target.value)} placeholder="Greeting message" className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
        </div>

        {/* Colors */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Colors</label>
          {colorRow("Accent", accent, onAccentChange)}
          {colorRow("Background", bg, onBgChange)}
          {colorRow("Text", text, onTextChange)}
        </div>

        {/* Position */}
        <div className="pt-2 border-t border-white/5">
          <label className="text-xs text-[var(--color-muted-foreground)] mb-2 block">Position</label>
          <select value={position_} onChange={(e) => onPositionChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm">
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>

        {/* Bubble Colors */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">💬 Chat Bubbles</label>
          {colorRow("Bot Text", botTextColor_, onBotTextChange)}
          {colorRow("Agent BG", agentBubbleColor_, onAgentBubbleChange)}
          {colorRow("Agent Text", agentTextColor_, onAgentTextChange)}
          {colorRow("User BG", userBubbleColor_, onUserBubbleChange)}
          {colorRow("User Text", userTextColor_, onUserTextChange)}
        </div>

        {/* Reset Button */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">🔄 Start New Chat Button</label>
          {colorRow("BG", resetButtonColor_, onResetColorChange)}
          {colorRow("Text", resetButtonTextColor_, onResetTextChange)}
          <input value={resetButtonLabel_} onChange={(e) => onResetLabelChange(e.target.value)} placeholder="Button label" className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
        </div>

        {/* End Chat Button */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">✕ End Chat Button</label>
          {colorRow("BG", endChatButtonColor_, onEndChatColorChange)}
          {colorRow("Text", endChatButtonTextColor_, onEndChatTextChange)}
          <input value={endChatButtonLabel_} onChange={(e) => onEndChatLabelChange(e.target.value)} placeholder="Button label" className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
        </div>

        {/* Save */}
        <button onClick={onSave} disabled={saving}
          className="w-full px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-teal"
        >
          {saving ? "Saving..." : "💾 Save Widget Settings"}
        </button>
        {saveMsg && <p className="text-xs text-center text-[var(--color-muted-foreground)]">{saveMsg}</p>}
      </div>

      {/* Right: Preview + Embed */}
      <div className="space-y-4">
        {/* Live Preview */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <h3 className="text-sm font-semibold mb-3">👁 Preview</h3>
          <div className="rounded-xl overflow-hidden border border-white/10" style={{ backgroundColor: bg }}>
            {/* Header */}
            <div className="p-3 flex items-center gap-2 border-b border-white/10" style={{ backgroundColor: bg }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: accent }}>B</div>
              <div>
                <div className="text-xs font-semibold" style={{ color: text }}>{title || "Need help?"}</div>
                <div className="text-[10px]" style={{ color: text + "99" }}>{subtitle || "Ask us anything"}</div>
              </div>
            </div>
            {/* Messages */}
            <div className="p-3 space-y-2 min-h-[120px]">
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl rounded-bl-sm text-[11px] leading-relaxed" style={{ backgroundColor: agentBubbleColor_ || "rgba(255,255,255,0.06)", color: agentTextColor_ || text || "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {greeting || "Hi! How can I help you today?"}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="px-3 py-2 rounded-xl rounded-br-sm text-[11px] leading-relaxed" style={{ backgroundColor: userBubbleColor_ || accent, color: userTextColor_ || "#fff" }}>
                  I need help with my order
                </div>
              </div>
            </div>
            {/* Reset button preview */}
            <div className="px-3 pb-3 flex justify-center">
              <div className="px-4 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: resetButtonColor_ || accent, color: resetButtonTextColor_ || "#fff" }}>
                {resetButtonLabel_ || "Start new chat"}
              </div>
            </div>
            {/* Input bar */}
            <div className="p-3 border-t border-white/10 flex gap-2" style={{ backgroundColor: bg }}>
              <div className="flex-1 h-7 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <div className="w-9 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <h3 className="text-sm font-semibold mb-1">📋 Embed Code</h3>
          <p className="text-xs text-[var(--color-muted-foreground)] mb-3">Add to your website</p>
          <div className="relative">
            <div className="p-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-mono text-themed break-all">
              {widget?.widgetCode
                ? `<script src="https://chat.benzos.uk/api/widget-embed/${widget.widgetCode}"><` + `/script>`
                : <span className="text-amber-400">Save widget settings first to get your embed code</span>
              }
            </div>
            {widget?.widgetCode && (
              <button onClick={() => navigator.clipboard.writeText(`<script src="https://chat.benzos.uk/api/widget-embed/${widget.widgetCode}"></script>`)}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-all"
              >
                📋 Copy
              </button>
            )}
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-400">
            💡 Paste just before &lt;/body&gt;
          </div>
        </div>
      </div>
    </div>
  );
}
