export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-16">
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-2xl font-bold text-primary mb-8 font-headline">ApplyPilot</div>
            <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-sm">
              © 2024 ApplyPilot. The Academic Architect for modern admissions. Empowering consultants with institutional intelligence.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Product</span>
            <nav className="flex flex-col gap-4">
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Features</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Integrations</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Pricing</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#">API Documentation</a>
            </nav>
          </div>
          <div className="flex flex-col gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Resources</span>
            <nav className="flex flex-col gap-4">
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Case Studies</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Whitepapers</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Contact</a>
              <a className="text-slate-500 hover:text-primary transition-all" href="#">Security</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
