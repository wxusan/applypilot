export default function Pricing() {
  return (
    <section className="px-8 py-32 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-extrabold font-headline text-primary mb-6">Architectural Investment</h2>
          <p className="text-on-surface-variant max-w-[600px] mx-auto text-lg">Scale your consultancy with precision-engineered pricing tiers built for performance.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* Starter */}
          <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 flex flex-col shadow-sm">
            <div className="mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Starter</span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-primary">$199</span>
                <span className="text-lg text-on-surface-variant">/mo</span>
              </div>
            </div>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-start gap-3 font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                Up to 25 Students
              </li>
              <li className="flex items-start gap-3 font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                Core AI Counselor
              </li>
              <li className="flex items-start gap-3 font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                Standard Templates
              </li>
            </ul>
            <button className="w-full py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">Start Trial</button>
          </div>

          {/* Pro */}
          <div className="bg-primary text-on-primary p-10 rounded-2xl shadow-2xl shadow-primary/30 relative overflow-hidden flex flex-col scale-105 z-10 border-4 border-primary-container">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-on-primary/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">Most Popular</span>
            </div>
            <div className="mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-on-primary-container">Professional</span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-on-primary">$499</span>
                <span className="text-lg text-on-primary-container">/mo</span>
              </div>
            </div>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-start gap-3 font-medium text-on-primary">
                <span className="material-symbols-outlined text-on-primary-container text-xl">check_circle</span>
                Unlimited Students
              </li>
              <li className="flex items-start gap-3 font-medium text-on-primary">
                <span className="material-symbols-outlined text-on-primary-container text-xl">check_circle</span>
                Advanced AI Analysis
              </li>
              <li className="flex items-start gap-3 font-medium text-on-primary">
                <span className="material-symbols-outlined text-on-primary-container text-xl">check_circle</span>
                Custom Branded Portals
              </li>
              <li className="flex items-start gap-3 font-medium text-on-primary">
                <span className="material-symbols-outlined text-on-primary-container text-xl">check_circle</span>
                Priority 24/7 Support
              </li>
            </ul>
            <button className="w-full py-4 bg-on-primary text-primary font-bold rounded-xl shadow-lg hover:bg-surface-bright transition-colors">Get Started</button>
          </div>

          {/* Enterprise */}
          <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 flex flex-col shadow-sm">
            <div className="mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Enterprise</span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-primary">Custom</span>
              </div>
            </div>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-start gap-3 font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                Multi-team Access
              </li>
              <li className="flex items-start gap-3 font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                SAML/SSO Integration
              </li>
              <li className="flex items-start gap-3 font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                API Documentation Access
              </li>
            </ul>
            <button className="w-full py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">Contact Sales</button>
          </div>

        </div>
      </div>
    </section>
  )
}
