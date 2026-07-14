"use client";

import { useState } from "react";
import { MessageSquare, HelpCircle, CheckCircle2, Copy } from "lucide-react";

interface Company {
  id: string;
  name: string;
  enableFacebook: boolean;
  facebookToken: string | null;
}

interface Props {
  companyId: string | undefined;
  company: Company | null;
}

export default function MessengerTab({ companyId, company }: Props) {
  const [copied, setCopied] = useState(false);
  const [webhookUrl] = useState("https://chat.benzos.uk/api/messenger/webhook");
  const [verifyToken] = useState(`botforge_${companyId?.slice(0, 8)}`);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold">Facebook Messenger Integration</h3>
        </div>
        <p className="text-xs text-white/40 mb-4">
          Connect your Facebook Page to allow customers to chat with your bot directly from Messenger.
        </p>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          company?.enableFacebook
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${company?.enableFacebook ? "bg-green-400" : "bg-slate-400"}`} />
          {company?.enableFacebook ? "Connected" : "Not Connected"}
        </div>
      </div>

      {/* Setup Guide */}
      <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold">Setup Guide</h3>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-400/10 text-violet-400 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
            <div>
              <h4 className="text-xs font-semibold mb-1">Create a Facebook App</h4>
              <p className="text-[11px] text-white/40">
                Go to the{" "}
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Facebook Developers Console
                </a>{" "}
                and create a new app with the &quot;Business&quot; type. Add the &quot;Messenger&quot; product.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-400/10 text-violet-400 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
            <div>
              <h4 className="text-xs font-semibold mb-1">Generate a Page Access Token</h4>
              <p className="text-[11px] text-white/40">
                In your Facebook App dashboard under &quot;Messenger&quot; → &quot;Settings&quot;, link your Facebook Page and generate a Page Access Token. Paste it into the field below.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-400/10 text-violet-400 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
            <div>
              <h4 className="text-xs font-semibold mb-1">Configure Webhook</h4>
              <p className="text-[11px] text-white/40 mb-2">
                In &quot;Messenger&quot; → &quot;Webhooks&quot;, set up a webhook with the following details:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-white/5">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/40">Callback URL</div>
                    <div className="text-xs font-mono mt-0.5">{webhookUrl}</div>
                  </div>
                  <button onClick={() => copyToClipboard(webhookUrl)} className="p-1.5 rounded-lg hover:bg-white/5/50 transition-all">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-white/5">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/40">Verify Token</div>
                    <div className="text-xs font-mono mt-0.5">{verifyToken}</div>
                  </div>
                  <button onClick={() => copyToClipboard(verifyToken)} className="p-1.5 rounded-lg hover:bg-white/5/50 transition-all">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-400/10 text-violet-400 flex items-center justify-center shrink-0 text-xs font-bold">4</div>
            <div>
              <h4 className="text-xs font-semibold mb-1">Subscribe to Events</h4>
              <p className="text-[11px] text-white/40">
                Subscribe to <strong>messages</strong> and <strong>messaging_postbacks</strong> events. Your bot will automatically respond to incoming messages.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token config placeholder */}
      <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold mb-3">Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
              Facebook Page Access Token
            </label>
            <div className="flex gap-2">
              <input
                defaultValue={company?.facebookToken || ""}
                placeholder="EAAG... (paste your token here)"
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50 transition-all font-mono"
                type="password"
              />
              <button
                className="px-4 py-2 rounded-xl text-xs font-medium bg-violet-400 text-black hover:bg-violet-400/90 transition-all"
              >
                Save
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-1.5">
              This token is stored encrypted and only used to send messages back to Messenger.
            </p>
          </div>
        </div>
      </div>

      {/* Test section */}
      <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold mb-3">🧪 Test Your Integration</h3>
        <p className="text-xs text-white/40">
          After configuring your webhook, send a message to your Facebook Page. The bot should respond within seconds. Check the{" "}
          <a href="/dashboard/history" className="text-blue-400 hover:underline">Chat History</a> page to see incoming messages.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-400">
          💡 Make sure your Facebook App is in &quot;Development&quot; mode and you&apos;ve added test users to test before going live.
        </div>
      </div>
    </div>
  );
}
