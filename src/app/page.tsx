"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportChat from "@/components/SupportChat";
import {
  Bot,
  Brain,
  Share2,
  Users,
  BarChart3,
  MessageSquare,
  Check,
  Zap,
  Globe,
  Smartphone,
  ShoppingCart,
  MessageCircle,
  Camera,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Reply,
  SendHorizontal,
} from "lucide-react";

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 bg-grid pointer-events-none" />
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? "var(--color-accent)" : "var(--color-primary)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.15 + Math.random() * 0.2,
            animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

// Scroll reveal hook
function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-fade-in-up");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

function SectionReveal({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref as React.RefObject<HTMLElement | null>);
  return (
    <section ref={ref} id={id} className={`opacity-0 ${className}`}>
      {children}
    </section>
  );
}

// Typing indicator animation component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--color-muted)] w-fit">
      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

// Live chat demo in hero
function LiveChatDemo() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const stepRef = useRef(0);

  useEffect(() => {
    const steps = [
      { role: "user", text: "Hi! Do you ship to Europe?" },
      { role: "bot", text: "Let me check your company's shipping policy...", typing: true },
      { role: "bot", text: "Yes! We ship worldwide. Free shipping on orders over €50. Would you like to place an order?" },
      { role: "user", text: "I have a question about sizing" },
      { role: "bot", text: "I can't find specific sizing info in our knowledge base. Let me connect you with a human agent who can help!", typing: true },
      { role: "system", text: "🔄 Agent Sarah has joined the conversation" },
      { role: "agent", text: "Hi! I'm Sarah. Happy to help with sizing! Do you have a specific item in mind?" },
    ];

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (stepRef.current >= steps.length) {
          clearInterval(interval);
          return;
        }
        const step = steps[stepRef.current];
        if (step.typing) {
          setShowTyping(true);
          setTimeout(() => {
            setShowTyping(false);
            setMessages(prev => [...prev, { role: step.role, text: step.text }]);
            stepRef.current++;
          }, 1500);
        } else {
          setMessages(prev => [...prev, { role: step.role, text: step.text }]);
          stepRef.current++;
        }
      }, 2000);
      return () => clearInterval(interval);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-2xl w-full max-w-sm mx-auto">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">BotForge Assistant</div>
          <div className="text-[10px] text-white/70 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Online
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-medium">BETA</span>
      </div>

      {/* Chat messages */}
      <div className="p-4 max-h-[300px] overflow-y-auto space-y-3 bg-[var(--color-background)]">
        {messages.map((msg, i) => {
          if (msg.role === "system") {
            return (
              <div key={i} className="text-center">
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  {msg.text}
                </span>
              </div>
            );
          }
          const isUser = msg.role === "user";
          const isAgent = msg.role === "agent";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? "bg-[var(--color-primary)] text-white rounded-br-md"
                    : isAgent
                    ? "bg-amber-500/15 text-[var(--color-foreground)] border border-amber-500/20 rounded-bl-md"
                    : "bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-bl-md"
                }`}
              >
                {isAgent && <span className="text-[10px] font-semibold text-amber-500 block mb-0.5">👤 Agent Sarah</span>}
                {msg.text}
              </div>
            </div>
          );
        })}
        {showTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-muted)]">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-xs text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:outline-none"
            disabled
          />
          <SendHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Bot,
    title: "AI Chatbot Engine",
    desc: "Powered by DeepSeek API. Train with your documents, set boundaries, enable Google Sheets integration for dynamic data.",
  },
  {
    icon: Brain,
    title: "Knowledge Base",
    desc: "Upload PDFs, TXT, or add Q&A manually. RAG-powered answers from your data. Website crawling support.",
  },
  {
    icon: Share2,
    title: "Multi-Platform Connect",
    desc: "Embed on your website, connect Shopify, Facebook Messenger, and Instagram. Unified bot across all channels.",
  },
  {
    icon: Users,
    title: "Human Handoff",
    desc: "When AI can't answer or customer asks for a human — seamless handoff to your team. Same conversation, no context loss.",
  },
  {
    icon: MessageSquare,
    title: "Agent Panel",
    desc: "Your team members can log in, see live chats, and take over conversations. Perfect for support and sales teams.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track response times, popular questions, token usage, customer satisfaction. Actionable insights for your business.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Your Account",
    desc: "Sign up your company in 30 seconds. No credit card needed to start.",
  },
  {
    num: "02",
    title: "Train Your Bot",
    desc: "Upload your knowledge base, set system prompts, configure Google Sheets. Your bot learns everything it needs to know.",
  },
  {
    num: "03",
    title: "Connect Channels",
    desc: "Embed widget on your website, connect Shopify, Facebook, Instagram. One bot, everywhere.",
  },
  {
    num: "04",
    title: "Deploy & Monitor",
    desc: "Your AI handles conversations 24/7. Configure human handoff rules. Watch analytics and optimize.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "€49",
    period: "/month",
    tokens: "50K tokens",
    features: ["1 chatbot", "1 knowledge base", "Website widget", "Basic analytics", "Email support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Business",
    price: "€149",
    period: "/month",
    tokens: "250K tokens",
    features: [
      "3 chatbots",
      "Unlimited knowledge bases",
      "All channel integrations",
      "Human handoff",
      "Agent panel (up to 5 agents)",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tokens: "Custom tokens",
    features: [
      "Unlimited chatbots",
      "Unlimited everything",
      "Custom integrations",
      "Dedicated support",
      "On-premise deployment option",
      "Custom AI model fine-tuning",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

export default function Home() {
  return (
    <main data-theme="dark" className="relative min-h-screen bg-[var(--color-background)]">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
        <AnimatedGrid />
        <FloatingParticles />

        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
        />
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 mb-6 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border border-[var(--color-border)] text-[var(--color-accent)] bg-[var(--color-accent)]/5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Chatbot Platform
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                Forge Your{" "}
                <span className="gradient-text">AI</span>
                <br />
                Connect Your{" "}
                <span className="gradient-text">World</span>
              </h1>

              <p className="text-base md:text-lg text-[var(--color-muted-foreground)] max-w-xl mb-8 leading-relaxed">
                Train your AI chatbot with your knowledge, set its boundaries, connect it to{" "}
                <span className="text-[var(--color-foreground)] font-medium">Shopify, Facebook, Instagram</span> — 
                and let it handle your customers 24/7, with seamless human handoff when needed.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:justify-start gap-3">
                <a
                  href="#get-started"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition-all glow-violet"
                >
                  Start Building Your Bot
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 px-7 py-3.5 rounded-full text-sm font-medium text-[var(--color-muted-foreground)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-white transition-all"
                >
                  See How It Works
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-lg mx-auto lg:mx-0">
                {[
                  { value: "100ms", label: "Avg. Response" },
                  { value: "24/7", label: "Availability" },
                  { value: "10+", label: "Integrations" },
                  { value: "∞", label: "Knowledge Size" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live Chat Demo */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl opacity-10 blur-[80px]"
                style={{ background: "radial-gradient(ellipse at center, var(--color-primary), transparent)" }}
              />
              <div className="relative animate-float">
                <LiveChatDemo />
              </div>
              {/* Glow dots */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-[var(--color-primary)]/10 blur-xl animate-pulse-glow" />
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[var(--color-accent)]/10 blur-xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-[var(--color-muted-foreground)]" />
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <SectionReveal id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)]">
              <Zap className="w-3 h-3" />
              Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              One Platform,{" "}
              <span className="gradient-text">Infinite Possibilities</span>
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              From knowledge base training to multi-channel deployment and human handoff — your complete AI customer experience platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const IconComponent = f.icon;
              return (
                <div
                  key={i}
                  className="group relative p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/30 transition-all duration-300 hover:glow-violet cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:gradient-text transition-all">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </SectionReveal>

      {/* ===== HOW IT WORKS ===== */}
      <SectionReveal id="how-it-works" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-[var(--color-muted)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)]">
              <Globe className="w-3 h-3" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From Zero to{" "}
              <span className="gradient-text">AI-Powered</span>
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Get your chatbot live in minutes, not days.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/30 transition-all"
              >
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-primary)]/20 absolute top-4 right-6 leading-none">
                  {step.num}
                </span>
                <h3 className="text-xl font-semibold mb-3 relative z-10">{step.title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed relative z-10 max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ===== INTEGRATIONS ===== */}
      <SectionReveal className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)]">
              <Smartphone className="w-3 h-3" />
              Connect Everything
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your Channels,{" "}
              <span className="gradient-text">One Bot</span>
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Deploy your AI chatbot across all your customer touchpoints.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Website Widget",
                icon: Globe,
                desc: "Embeddable chat widget. One line of code.",
                status: "Ready",
              },
              {
                name: "Shopify",
                icon: ShoppingCart,
                desc: "Product queries, orders, customer support.",
                status: "Coming Soon",
              },
              {
                name: "Facebook Messenger",
                icon: MessageCircle,
                desc: "Bot-powered messaging on FB page.",
                status: "Coming Soon",
              },
              {
                name: "Instagram",
                icon: Camera,
                desc: "DM automation for Instagram Business.",
                status: "Coming Soon",
              },
            ].map((integration, i) => {
              const IconComponent = integration.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{integration.name}</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] mb-4">{integration.desc}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      integration.status === "Ready"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </SectionReveal>

      {/* ===== Agent Panel Highlight ===== */}
      <SectionReveal className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)]">
                <Users className="w-3 h-3" />
                Human Touch
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AI + Human{" "}
                <span className="gradient-text">Handoff</span>
              </h2>
              <p className="text-[var(--color-muted-foreground)] mb-6 leading-relaxed">
                When your AI can&apos;t answer or a customer asks for a real person — seamless handoff 
                to your team. Your agents see the full conversation history in our Agent Panel 
                and pick up right where AI left off.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time chat handoff",
                  "Full conversation history",
                  "Multiple agents per company",
                  "Toggle on/off anytime",
                  "Works across all channels",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--color-accent)]">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              {/* Agent Panel mockup */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-xs text-[var(--color-muted-foreground)] ml-2 font-medium">Agent Panel — Live Chats</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { name: "Sarah (Shopify)", status: "AI → Agent", msg: "Order status inquiry...", active: true },
                    { name: "Mike (FB)", status: "AI Active", msg: "Product recommendation...", active: false },
                    { name: "Anna (Widget)", status: "Waiting", msg: "Human requested", active: true },
                  ].map((chat, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg flex items-center gap-3 transition-all ${
                        chat.active ? "border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5" : "opacity-60"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {chat.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{chat.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            chat.status.includes("Agent") ? "bg-amber-500/10 text-amber-500" :
                            chat.status === "Waiting" ? "bg-red-500/10 text-red-500" :
                            "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                          }`}>
                            {chat.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{chat.msg}</p>
                      </div>
                      {chat.active && (
                        <button className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Reply className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* ===== PRICING ===== */}
      <SectionReveal id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-accent)]">
              <BarChart3 className="w-3 h-3" />
              Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Plans That{" "}
              <span className="gradient-text">Scale</span>
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Token-based billing. Pay for what you use. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-xl border ${
                  plan.popular
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-card)] glow-violet"
                    : "border-[var(--color-border)] bg-[var(--color-card)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-[var(--color-muted-foreground)]">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{plan.tokens} tokens included</p>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="text-[var(--color-accent)] mt-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#get-started"
                  className={`block text-center w-full py-3 rounded-full text-sm font-semibold transition-all ${
                    plan.popular
                      ? "text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 glow-violet"
                      : "text-white border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ===== CTA / GET STARTED ===== */}
      <SectionReveal id="get-started" className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 rounded-3xl opacity-5 blur-[100px]"
            style={{ background: "radial-gradient(ellipse, var(--color-accent), var(--color-primary))" }}
          />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to{" "}
              <span className="gradient-text">Forge</span> Your Bot?
            </h2>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-xl mx-auto mb-10">
              Join businesses that use BotForge to automate customer conversations, 
              boost sales, and deliver 24/7 support.
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="your@company.com"
                  className="flex-1 px-5 py-3.5 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-all"
                />
                <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition-all glow-violet whitespace-nowrap">
                  Get Early Access
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
                No credit card required. First 1,000 conversations free.
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* ===== CONTACT ===== */}
      <SectionReveal id="contact" className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Questions? Reach out at{" "}
            <a href="mailto:hello@benzos.uk" className="text-[var(--color-accent)] hover:underline">
              hello@benzos.uk
            </a>
          </p>
        </div>
      </SectionReveal>

      <Footer />
      <SupportChat />
    </main>
  );
}
