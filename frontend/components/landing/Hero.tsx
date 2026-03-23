export default function Hero() {
  return (
    <section className="px-8 pt-24 pb-20 text-center bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold tracking-wider uppercase mb-8">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          Intelligence for Institutions
        </div>
        <h1 className="text-6xl lg:text-7xl font-extrabold font-headline text-primary tracking-tight leading-[1.1] mb-8 max-w-[900px] mx-auto">
          Orchestrate Excellence in College Consulting
        </h1>
        <p className="text-xl text-on-surface-variant max-w-[600px] mx-auto mb-12 leading-relaxed">
          The bespoke digital atelier for elite admissions teams. Secure, deliberate, and powered by institutional-grade intelligence.
        </p>
        <div className="flex items-center justify-center gap-6 mb-20">
          <a
            href="/login"
            className="px-10 py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/10 active:scale-95 transition-all"
          >
            Get Started
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
          <button className="px-10 py-4 bg-white border border-outline-variant text-primary rounded-2xl font-bold hover:bg-surface-bright active:scale-95 transition-all">
            View Dossier Demo
          </button>
        </div>
        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(3,22,53,0.15)] bg-[#76A8A4] p-12 lg:p-20 aspect-[16/10] flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="SaaS Application Dashboard Preview"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ3k6H2WLNeam4lQV-kZjr8Mvdt_3H71Rvp157BOG_T41xu0igwD_Q1L6vQNx6dtXYi4-eYWZvRFEwycTAw8kOi0_dY2fY773tdbsaB3_4M7c6MMfFO7eh0sjlJFVBpogCHP_yvybpnjCysgAu-7e4seM0vcMNxRTGqVTvBcnBS6Buw4ebQuQ5HjdU_K54WJKyfmSZ5DeeIaXxeLnVOzTLGE1AOuOnmla5NRb_51oKZzMusRd1WjCFOSfvAkRTccAG9-5C_Ph5z5Y"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
