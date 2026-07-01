"use client";

import {
  X,
  Save,
  Loader2,
  Key,
  ToggleLeft,
  Cpu,
  DollarSign,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useState } from "react";

interface CompanyData {
  id: string;
  name: string;
  active: boolean;
  plan: string;
  tokenLimit: number;
  tokensUsed: number;
  aiApiKey: string | null;
  aiProvider: string | null;
  aiModel: string | null;
}

interface Props {
  company: CompanyData;
  open: boolean;
  onClose: () => void;
}

export default function ManageCompanyModal({ company, open, onClose }: Props) {
  if (!open || !company) return null;
  const [active, setActive] = useState(company.active);
  const [plan, setPlan] = useState(company.plan || "starter");
  const [tokenLimit, setTokenLimit] = useState(company.tokenLimit.toString());
  const [tokensUsed, setTokensUsed] = useState(company.tokensUsed.toString());
  const [aiApiKey, setAiApiKey] = useState(company.aiApiKey || "");
  const [aiProvider, setAiProvider] = useState(company.aiProvider || "deepseek");
  const [aiModel, setAiModel] = useState(company.aiModel || "deepseek-chat");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active,
          plan,
          tokenLimit: parseInt(tokenLimit) || 0,
          tokensUsed: parseInt(tokensUsed) || 0,
          aiApiKey: aiApiKey || undefined,
          aiProvider,
          aiModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMessage({ type: "success", text: "Company updated successfully" });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1200);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-sm font-semibold">{company.name}</h2>
            <p className="text-[10px] text-[var(--color-muted-foreground)]">{company.id.slice(0, 12)}...</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Status */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <ToggleLeft className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                Status
              </span>
              {active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              )}
              {!active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                  <ShieldOff className="w-3 h-3" /> Inactive
                </span>
              )}
            </label>
            <button
              onClick={() => setActive(!active)}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                active
                  ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {active ? "Deactivate" : "Activate"}
            </button>
          </div>

          {/* Plan */}
          <div>
            <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Tokens */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                Token Limit
              </label>
              <input
                type="number"
                value={tokenLimit}
                onChange={(e) => setTokenLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                Tokens Used
              </label>
              <input
                type="number"
                value={tokensUsed}
                onChange={(e) => setTokensUsed(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50"
              />
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
              AI API Key
            </label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder="sk-... (leave empty to keep current)"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)]/40 focus:outline-none focus:border-[var(--color-accent)]/50 font-mono"
            />
            <p className="text-[9px] text-[var(--color-muted-foreground)] mt-1">Leave empty to keep the existing key. Enter new key to replace it.</p>
          </div>

          {/* Provider + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/50"
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude (Anthropic)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5">Model</label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="deepseek-chat"
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)]/40 focus:outline-none focus:border-[var(--color-accent)]/50"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {message.type === "success" ? "✓" : "⚠"} {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
