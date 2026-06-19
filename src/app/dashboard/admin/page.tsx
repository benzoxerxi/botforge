"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Settings,
  Zap,
  Brain,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  Bot,
  ChevronDown,
} from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [provider, setProvider] = useState("deepseek");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-chat");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session.user?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      loadSettings();
    }
  }, [status, session, router]);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings) {
        setProvider(data.settings.ai_provider || "deepseek");
        setModel(data.settings.ai_model || "deepseek-chat");
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, string> = { ai_provider: provider, ai_model: model };
      if (apiKey) body.ai_api_key = apiKey;
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
        setApiKey("");
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (status !== "authenticated") return null;

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)] bg-[var(--color-accent)]/5">
            <Settings className="w-3 h-3" />
            Platform Settings
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            Configure platform-wide AI provider, API keys, and monitor billing.
          </p>
        </div>

        {/* AI Config Card */}
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Provider Configuration</h2>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Defaults for all companies. Companies can override.</p>
            </div>
          </div>

          {message && (
            <div className={`mt-4 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5">Default Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                  }}
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5">Default Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                  }}
                >
                  {provider === "deepseek" ? (
                    <>
                      <option value="deepseek-chat">DeepSeek Chat</option>
                      <option value="deepseek-reasoner">DeepSeek Reasoner</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  API Key {apiKey ? "(will update)" : "(current key active)"}
                </span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50"
                placeholder="sk-... (leave empty to keep current)"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50 glow-accent"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Billing Card */}
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Billing Overview</h2>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Monthly token usage across all companies</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold gradient-text">0</div>
              <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">Total tokens used this month</p>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden max-w-xs">
              <div className="h-full rounded-full w-0 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)]" />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
