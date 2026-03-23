export default function PublicNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm glass-nav">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 h-20">
        <div className="text-xl font-extrabold tracking-tighter text-primary font-headline">ApplyPilot</div>
        <div className="flex items-center gap-12">
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold font-headline">
            <a className="text-primary border-b-2 border-primary pb-1" href="#">Product</a>
            <a className="text-slate-600 hover:text-primary transition-colors" href="#">Platform</a>
            <a className="text-slate-600 hover:text-primary transition-colors" href="#">Pricing</a>
            <a className="text-slate-600 hover:text-primary transition-colors" href="#">Resources</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="px-6 py-2.5 text-sm font-bold text-on-primary btn-gradient rounded-xl active:scale-95 duration-200 transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low h-[1px] w-full absolute bottom-0 opacity-20"></div>
    </nav>
  )
}
