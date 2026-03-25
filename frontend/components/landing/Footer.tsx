export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-2xl font-bold text-primary mb-4 font-headline">ApplyPilot</div>
            <p className="text-slate-500 text-sm leading-relaxed mb-4 max-w-sm">
              © 2024 ApplyPilot. The Academic Architect for modern admissions. Empowering consultants with institutional intelligence.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Product</span>
            <nav className="flex flex-col gap-3 text-sm">
              <a className="text-slate-500 hover:text-primary transition-all" href="#features">Features</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#pricing">Pricing</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="/request-access">Request Access</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="/login">Log In</a>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Company</span>
            <nav className="flex flex-col gap-3 text-sm">
              <a className="text-slate-500 hover:text-primary transition-all" href="#contact">Contact</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="/terms">Terms of Service</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="/privacy">Privacy Policy</a>
              <a
                className="text-slate-500 hover:text-primary transition-all"
                href="https://t.me/wwxusan"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram Support
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
