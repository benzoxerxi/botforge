// Email templates for BotForge
// All HTML — inline styles for Gmail/Outlook compatibility

interface WelcomeEmailParams {
  name: string;
  companyName: string;
  verifyUrl: string;
}

export function welcomeEmailHtml({ name, companyName, verifyUrl }: WelcomeEmailParams): string {
  const firstName = name?.split(" ")[0] || "there";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://chat.benzos.uk";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;min-height:100vh">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
        
        <!-- Logo area -->
        <tr>
          <td style="padding-bottom:24px;text-align:center">
            <span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00f0ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
              ⚡ BotForge
            </span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
            
            <!-- Header -->
            <h1 style="color:#fff;font-size:22px;margin:0 0 8px">
              👋 Welcome to BotForge, ${escapeHtml(firstName)}!
            </h1>
            <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;line-height:1.6">
              <strong style="color:#00f0ff">${escapeHtml(companyName)}</strong> just joined the revolution.
              Your AI chatbot is spinning up its neural circuits as we speak.
            </p>

            <!-- Divider -->
            <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:24px"></div>

            <!-- Fun copy -->
            <p style="color:#d1d5db;font-size:14px;margin:0 0 16px;line-height:1.6">
              ✨ <strong style="color:#fff">What's happening now:</strong>
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px">🚀 &nbsp; Your bot is being trained on company knowledge</td></tr>
              <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px">🎨 &nbsp; Chat widget styling is ready (go customize it!)</td></tr>
              <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px">📊 &nbsp; Analytics dashboard — just waiting for conversations</td></tr>
              <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px">🤖 &nbsp; Your bot is <em>technically</em> alive right now</td></tr>
            </table>

            <!-- Verify button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:16px">
              <tr>
                <td align="center" style="border-radius:999px;background:linear-gradient(135deg,#00f0ff,#7c3aed);padding:3px">
                  <a href="${verifyUrl}" style="display:inline-block;padding:13px 32px;border-radius:999px;background:#0a0e1a;color:#fff;font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap">
                    ✅ Verify My Account
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:12px;margin:0 0 20px;line-height:1.5">
              This link expires in <strong style="color:#9ca3af">24 hours</strong>.
              If you didn't sign up, just ignore this email — no hard feelings.
            </p>

            <!-- Divider -->
            <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:20px"></div>

            <!-- Footer copy -->
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px;line-height:1.5">
              🔥 <strong style="color:#9ca3af">Pro tip:</strong> Head to your 
              <a href="${siteUrl}/dashboard" style="color:#00f0ff;text-decoration:underline">dashboard</a> 
              to customize colors, upload knowledge, and make this bot truly yours.
            </p>
            <p style="color:#4b5563;font-size:11px;margin:0;line-height:1.5">
              Sent from the digital headquarters of BotForge — ${siteUrl}
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 0 0;text-align:center">
            <p style="color:#4b5563;font-size:11px;margin:0">
              If the button above doesn't work, copy and paste this URL into your browser:<br>
              <a href="${verifyUrl}" style="color:#00f0ff;text-decoration:underline;font-size:10px">${verifyUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
