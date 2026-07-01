"use client";
import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    title: "BotForge",
    subtitle: "AI Chatbot Platform",
    content: (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{
          width: 64, height: 64, margin: "0 auto 24px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(255,234,0,0.12), rgba(255,107,53,0.06))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
          fontWeight: 700, color: "#ffea00",
        }}>B</div>
        <p style={{ fontSize: 17, color: "#999", maxWidth: 480, margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>
          Smart AI chatbot platform for business.<br />
          Engage customers, automate support,<br />
          boost sales — all from one dashboard.
        </p>
        <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {["Registration", "Bot Setup", "Chat Widget", "Agent Panel", "Analytics"].map((t, i) => (
            <span key={i} style={{
              padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 500,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#888",
            }}>{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Registration",
    subtitle: "Step 1",
    content: (
      <div style={{ padding: "10px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(255,234,0,0.06), rgba(255,107,53,0.04))",
          borderRadius: 16, padding: 28,
          border: "1px solid rgba(255,234,0,0.1)",
          marginBottom: 16,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginBottom: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(255,234,0,0.15), rgba(255,107,53,0.1))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#ffea00",
            }}>01</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>Company Sign Up</div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>Register and your bot is ready</div>
            </div>
          </div>
          <ul style={{ fontSize: 14, lineHeight: 2.4, color: "#999", paddingLeft: 20, margin: 0 }}>
            <li>Enter company name, email, and password</li>
            <li>AI bot is created automatically</li>
            <li>Full admin panel access from day one</li>
            <li>Secure JWT authentication</li>
          </ul>
        </div>
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap",
        }}>
          {["Dashboard", "AI Bot Active", "Widget Code", "Knowledge Base", "Agent Panel"].map((t, i) => (
            <span key={i} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12,
              background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)",
              color: "#00d4ff", fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Bot Setup",
    subtitle: "Step 2",
    content: (
      <div style={{ padding: "10px 0" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
        }}>
          {[
            {
              title: "AI Configuration",
              items: ["API key (DeepSeek, OpenAI, Claude)", "Choose AI model", "Bot personality & behavior"],
              color: "#ffea00",
            },
            {
              title: "Widget Customization",
              items: ["Colors & branding", "Bot name & greeting", "Widget position & style"],
              color: "#ff6b35",
            },
            {
              title: "Chat Bubbles",
              items: ["User message bubbles", "Bot message bubbles", "Agent message bubbles"],
              color: "#00d4ff",
            },
            {
              title: "Knowledge Base",
              items: ["Add Q&A pairs", "Bot learns from your data", "Website crawl (coming soon)"],
              color: "#7c3aed",
            },
          ].map((col, i) => (
            <div key={i} style={{
              padding: 20, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              border: `1px solid ${col.color}15`,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: col.color, marginBottom: 10,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                  background: col.color,
                }} />
                {col.title}
              </div>
              <ul style={{ fontSize: 13, color: "#888", lineHeight: 2, paddingLeft: 16, margin: 0 }}>
                {col.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Chat Widget",
    subtitle: "Step 3",
    content: (
      <div style={{ padding: "10px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(255,234,0,0.03))",
          borderRadius: 16, padding: 28,
          border: "1px solid rgba(0,212,255,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.06))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#00d4ff",
            }}>02</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>Embed on Your Website</div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>One script tag — done</div>
            </div>
          </div>
          <div style={{
            padding: 16, borderRadius: 12, background: "#0a0a0a", border: "1px solid #222",
            fontSize: 13, color: "#ffea00", fontFamily: "monospace", marginBottom: 24, lineHeight: 1.6,
          }}>
            &lt;script src="https://chat.benzos.uk/api/widget-embed/CODE"&gt;&lt;/script&gt;
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{
              padding: 18, borderRadius: 12,
              background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.08)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#00d4ff", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>For Visitors</div>
              <ul style={{ fontSize: 13, color: "#999", lineHeight: 2.2, paddingLeft: 16, margin: 0 }}>
                <li>Click chat button and widget opens</li>
                <li>Type any question — AI answers instantly</li>
                <li>Knowledge base provides accurate responses</li>
                <li>Request a human agent if needed</li>
              </ul>
            </div>
            <div style={{
              padding: 18, borderRadius: 12,
              background: "rgba(255,107,53,0.04)", border: "1px solid rgba(255,107,53,0.08)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#ff6b35", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>For Your Team</div>
              <ul style={{ fontSize: 13, color: "#999", lineHeight: 2.2, paddingLeft: 16, margin: 0 }}>
                <li>View all conversations in real-time</li>
                <li>Monitor active chats live</li>
                <li>Change design anytime</li>
                <li>Track token usage and costs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Agent Panel",
    subtitle: "Step 4",
    content: (
      <div style={{ padding: "10px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(0,212,255,0.03))",
          borderRadius: 16, padding: 28,
          border: "1px solid rgba(124,58,237,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.06))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#a78bfa",
            }}>03</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>AI to Human Handoff</div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>Bot handles first, human takes over</div>
            </div>
          </div>
          <div style={{
            display: "flex", gap: 24, marginBottom: 20,
          }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: "0 auto 8px",
                background: "linear-gradient(135deg, rgba(255,234,0,0.12), rgba(255,107,53,0.06))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "#ffea00",
              }}>AI</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8 }}>AI Bot</div>
              <ul style={{ fontSize: 12, color: "#888", lineHeight: 2, paddingLeft: 14, margin: 0, textAlign: "left" }}>
                <li>Handles routine questions</li>
                <li>Answers from knowledge base</li>
                <li>Available 24/7</li>
                <li>Instant responses</li>
              </ul>
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#555", fontSize: 14, letterSpacing: 2,
              writingMode: "vertical-lr" as any,
            }}>
              <span style={{ opacity: 0.4 }}>→ AI → HUMAN →</span>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: "0 auto 8px",
                background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(124,58,237,0.06))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "#00d4ff",
              }}>H</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8 }}>Live Agent</div>
              <ul style={{ fontSize: 12, color: "#888", lineHeight: 2, paddingLeft: 14, margin: 0, textAlign: "left" }}>
                <li>Takes over complex issues</li>
                <li>Sees full conversation history</li>
                <li>Real-time notifications</li>
                <li>Sales assistance tools</li>
              </ul>
            </div>
          </div>
          <div style={{
            padding: "12px 18px", borderRadius: 12,
            background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)",
            fontSize: 12, color: "#a78bfa", textAlign: "center",
          }}>
            Visitor clicks "Talk to a Human" → Agent gets notified → Takes over chat → AI tools assist the agent
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Analytics",
    subtitle: "Step 5",
    content: (
      <div style={{ padding: "10px 0" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 16,
        }}>
          {[
            { label: "TOTAL CONVERSATIONS", value: "All Time", color: "#ffea00" },
            { label: "ACTIVE NOW", value: "Real-time", color: "#00d4ff" },
            { label: "MESSAGES SENT", value: "Monthly", color: "#ff6b35" },
            { label: "HANDOFF REQUESTS", value: "Tracked", color: "#7c3aed" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 18, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "#666", marginBottom: 6, letterSpacing: 1, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,107,53,0.03))",
          borderRadius: 14, padding: 24,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#ff6b35", marginBottom: 12 }}>
            Token Usage & Monitoring
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
            fontSize: 13, color: "#999"
          }}>
            {["7-day token chart", "Daily consumption", "Plan limits & remaining", "Per-company costs"].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: ["#ffea00","#00d4ff","#ff6b35","#7c3aed"][i], fontSize: 10 }}>◆</span> {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{
              width: "67%", height: "100%", borderRadius: 4,
              background: "linear-gradient(90deg, #ffea00, #ff6b35)",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", right: -4, top: -3,
                width: 14, height: 14, borderRadius: "50%",
                background: "#ff6b35", border: "2px solid #0a0a0a",
              }} />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Admin Panel",
    subtitle: "Company Management",
    content: (
      <div style={{ padding: "10px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,212,255,0.03))",
          borderRadius: 16, padding: 24,
          border: "1px solid rgba(0,212,255,0.08)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { title: "Company Dashboard", items: ["View all conversations", "Configure bot", "Manage knowledge base", "Customize widget"], color: "#ffea00" },
              { title: "Super Admin", items: ["Manage all companies", "Activate/deactivate", "Change plans & limits", "Global API keys"], color: "#ff6b35" },
              { title: "Agent Dashboard", items: ["Handoff requests", "Take over chats", "Chat history", "Response tools"], color: "#00d4ff" },
              { title: "Widget Settings", items: ["Color presets", "Live preview", "Embed code", "Test chat"], color: "#7c3aed" },
            ].map((col, i) => (
              <div key={i} style={{
                padding: 18, borderRadius: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: col.color, marginBottom: 8 }}>{col.title}</div>
                <ul style={{ fontSize: 12, color: "#888", lineHeight: 2.2, paddingLeft: 16, margin: 0 }}>
                  {col.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Start Now",
    subtitle: "Get your AI chatbot today",
    content: (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          width: 56, height: 56, margin: "0 auto 20px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255,234,0,0.1), rgba(255,107,53,0.05))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, color: "#ffea00",
        }}>B</div>
        <p style={{ fontSize: 16, color: "#aaa", maxWidth: 440, margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>
          Register your company, configure your bot,<br />
          embed the widget on your site, and start<br />
          engaging customers with AI.
        </p>
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {["Register", "Configure Bot", "Embed Widget", "Set Up Agents", "Track Analytics"].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 100,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12, color: "#888",
            }}>
              <span style={{ color: "#ffea00", fontWeight: 600 }}>{i + 1}.</span> {s}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <a href="https://chat.benzos.uk/register"
             style={{
               display: "inline-flex", padding: "12px 36px", borderRadius: 100,
               background: "linear-gradient(135deg, #ffea00, #ff6b35)",
               color: "#000", fontSize: 15, fontWeight: 700,
               textDecoration: "none", letterSpacing: 0.3,
             }}>
            Register Now
          </a>
        </div>
      </div>
    ),
  },
];

export default function PresentationSlideshow() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState("right");
  const slide = slides[idx];

  const next = useCallback(() => {
    setDir("right");
    setIdx((prev) => (prev + 1) % slides.length);
  }, []);
  const prev = useCallback(() => {
    setDir("left");
    setIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e0e0e0",
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 20px 80px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            borderRadius: "50%",
            background: ["#ffea00", "#ff6b35", "#00d4ff", "#7c3aed"][i % 4],
            opacity: 0.06 + Math.random() * 0.1,
            animation: `float ${10 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
          }} />
        ))}
      </div>

      {/* Gradient auras */}
      <div style={{
        position: "fixed", top: "15%", left: "8%",
        width: 350, height: 350,
        background: "radial-gradient(circle, rgba(255,234,0,0.03) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
        animation: "pulse 5s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", bottom: "20%", right: "5%",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
        animation: "pulse 6s ease-in-out infinite",
        animationDelay: "2.5s",
      }} />

      {/* Counter */}
      <div style={{
        position: "fixed", top: 24, right: 28, zIndex: 10,
        fontSize: 11, color: "#555", fontFamily: "monospace",
        background: "rgba(255,255,255,0.02)", padding: "6px 14px",
        borderRadius: 100, border: "1px solid rgba(255,255,255,0.06)",
        letterSpacing: 1,
      }}>
        {String(idx + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      <div style={{
        width: "100%", maxWidth: 700,
        display: "flex", flexDirection: "column", flex: 1,
        justifyContent: "center", zIndex: 1,
        position: "relative",
      }}>
        {/* Slide */}
        <div key={idx} style={{
          animation: dir === "right"
            ? "slideInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
            : "slideInLeft 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "44px 40px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Corner decoration */}
            <div style={{
              position: "absolute", top: -50, right: -50,
              width: 140, height: 140,
              background: "radial-gradient(circle, rgba(255,234,0,0.05) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(255,234,0,0.1), rgba(255,107,53,0.05))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "#ffea00",
              }}>
                {String.fromCharCode(66 + (idx % 26))}
              </div>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                  background: "linear-gradient(90deg, #ffea00, #ff6b35)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 4,
                }}>
                  {slide.subtitle}
                </div>
                <h1 style={{
                  fontSize: 24, fontWeight: 700, color: "#fff", margin: 0,
                  letterSpacing: -0.3,
                }}>
                  {slide.title}
                </h1>
              </div>
            </div>

            {slide.content}
          </div>
        </div>
      </div>

      {/* Fixed bottom navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "linear-gradient(0deg, rgba(10,10,10,0.95) 60%, transparent)",
        padding: "24px 20px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}>
        <button onClick={prev}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            color: "#666", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#666"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {slides.map((_, i) => (
          <button key={i} onClick={() => { setDir(i > idx ? "right" : "left"); setIdx(i); }}
            style={{
              height: i === idx ? 24 : 6,
              width: i === idx ? 6 : 6,
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              background: i === idx
                ? "linear-gradient(180deg, #ffea00, #ff6b35)"
                : "rgba(255,255,255,0.1)",
              boxShadow: i === idx ? "0 0 6px rgba(255,234,0,0.2)" : "none",
            }}
          />
        ))}

        <button onClick={next}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            color: "#666", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#666"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.06; }
          50% { transform: translateY(-16px); opacity: 0.18; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.6; }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(40px) scale(0.98); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-40px) scale(0.98); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
