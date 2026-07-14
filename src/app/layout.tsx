import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ThemeProvider from "@/components/ThemeProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BotForge — AI Chatbot Platform for Your Business",
  description:
    "Create, train, and deploy intelligent AI chatbots. Connect Shopify, Facebook, Instagram. Human handoff when needed.",
  keywords: [
    "AI chatbot",
    "business chatbot",
    "Shopify chatbot",
    "Facebook Messenger bot",
    "Instagram bot",
    "RAG chatbot",
    "DeepSeek chatbot",
    "BotForge",
  ],
  openGraph: {
    title: "BotForge — AI Chatbot Platform",
    description: "Forge your AI. Connect your world.",
    url: "https://chat.benzos.uk",
    siteName: "BotForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BotForge — AI Chatbot Platform",
    description: "Forge your AI. Connect your world.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`}>
      {/* Sync localStorage theme BEFORE any paint to prevent flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("botforge-theme")||"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
        }}
      />
      <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)] font-sans">
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
