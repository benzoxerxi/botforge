"use client";

import { useState, useEffect } from "react";
import BotForgeLogo from "./BotForgeLogo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--color-background)]/90 backdrop-blur-xl border-b border-[var(--color-border)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group">
          <BotForgeLogo size={28} />
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-bold tracking-tight text-white">Bot</span>
            <span className="text-base font-bold tracking-tight gradient-text">Forge</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-[var(--color-muted-foreground)] hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-[var(--color-muted-foreground)] hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-sm text-[var(--color-muted-foreground)] hover:text-white transition-colors"
          >
            Pricing
          </a>
          <a
            href="#contact"
            className="text-sm text-[var(--color-muted-foreground)] hover:text-white transition-colors"
          >
            Contact
          </a>
          <a href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Sign In
          </a>
          <a
            href="/login"
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] hover:opacity-90 transition-opacity glow-teal"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-[1.5px] bg-white transition-all ${
              mobileOpen ? "rotate-45 translate-y-[6px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-white transition-all ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-white transition-all ${
              mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-2 bg-[var(--color-background)]/95 backdrop-blur-xl border-b border-[var(--color-border)] flex flex-col gap-4">
          <a href="#features" className="text-sm text-[var(--color-muted-foreground)]" onClick={() => setMobileOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-[var(--color-muted-foreground)]" onClick={() => setMobileOpen(false)}>
            How It Works
          </a>
          <a href="#pricing" className="text-sm text-[var(--color-muted-foreground)]" onClick={() => setMobileOpen(false)}>
            Pricing
          </a>
          <a href="#contact" className="text-sm text-[var(--color-muted-foreground)]" onClick={() => setMobileOpen(false)}>
            Contact
          </a>
          <a
            href="/login"
            className="text-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)]"
            onClick={() => setMobileOpen(false)}
          >
            Sign In / Register
          </a>
        </div>
      </div>
    </nav>
  );
}
