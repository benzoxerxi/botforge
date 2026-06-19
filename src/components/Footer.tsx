import BotForgeLogo from "./BotForgeLogo";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-12 mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <BotForgeLogo size={24} />
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold tracking-tight text-white">Bot</span>
                <span className="text-sm font-bold tracking-tight gradient-text">Forge</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)] max-w-sm">
              Forge your AI chatbot. Train it with your knowledge, connect it to your platforms, 
              and let it handle customer conversations — with human handoff when it matters.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">
              Product
            </h4>
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">How It Works</a>
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Integrations</a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">
              Company
            </h4>
            <div className="flex flex-col gap-3">
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">About</a>
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Blog</a>
              <a href="#contact" className="text-sm text-white/70 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            &copy; {new Date().getFullYear()} BotForge. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Powered by{" "}
            <a href="https://benzos.uk" className="text-[var(--color-accent)] hover:underline">
              Benzo Labs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
