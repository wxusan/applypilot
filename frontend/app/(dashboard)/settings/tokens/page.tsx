export default function TokenUsagePage() {
  return (
    <div className="space-y-10">
      {/* Breadcrumbs & Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
          <span>Administration</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span>Billing</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-semibold">Token Usage</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-headline text-4xl font-extrabold text-primary tracking-tight">Token Usage Detail</h3>
            <p className="text-on-surface-variant mt-2 max-w-2xl">
              A comprehensive breakdown of your institutional computational resources utilized by AI Pilot during the current billing cycle.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">download</span> Export Report
            </button>
            <button className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white font-semibold rounded-lg shadow-lg shadow-primary/10 hover:brightness-110 transition-all text-sm">
              Purchase Credits
            </button>
          </div>
        </div>
      </section>

      {/* Usage Overview Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Area */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-[0_40px_40px_rgba(3,22,53,0.04)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Utilization Velocity</p>
              <h4 className="font-headline text-2xl font-bold text-primary">Resource Consumption</h4>
            </div>
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button className="px-4 py-1.5 text-xs font-bold bg-surface-container-lowest text-primary rounded shadow-sm">30 Days</button>
              <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">90 Days</button>
            </div>
          </div>
          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {[
              { day: 'Mon', h: 'h-40', input: 'h-1/3', output: 'h-2/3' },
              { day: 'Tue', h: 'h-48', input: 'h-1/2', output: 'h-1/2' },
              { day: 'Wed', h: 'h-32', input: 'h-2/3', output: 'h-1/3' },
              { day: 'Thu', h: 'h-56', input: 'h-2/5', output: 'h-3/5' },
              { day: 'Fri', h: 'h-44', input: 'h-1/4', output: 'h-3/4' },
              { day: 'Sat', h: 'h-24', input: 'h-1/2', output: 'h-1/2' },
              { day: 'Sun', h: 'h-20', input: 'h-1/2', output: 'h-1/2' },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden ${bar.h}`}>
                  <div className={`w-full bg-primary/20 ${bar.input}`}></div>
                  <div className={`w-full bg-primary ${bar.output}`}></div>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">{bar.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-outline-variant/15 flex gap-8">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span className="text-xs font-bold text-primary">Input Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary/20"></span>
              <span className="text-xs font-bold text-primary">Output Tokens</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-primary p-8 rounded-xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Current Balance</p>
              <h4 className="text-4xl font-extrabold tracking-tight mb-4">1,248,000</h4>
              <p className="text-sm font-medium opacity-80">Remaining tokens across all Pilot services.</p>
            </div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="bg-surface-container-low p-8 rounded-xl flex-1 border border-outline-variant/15">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 text-center">Efficiency Rating</p>
            <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
              <div className="w-32 h-32 rounded-full border-[10px] border-primary-container flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" fill="none" r="54" stroke="#031635" strokeDasharray="339.29" strokeDashoffset="67.85" strokeWidth="10"></circle>
                </svg>
                <span className="text-2xl font-extrabold text-primary">82%</span>
              </div>
              <p className="text-xs font-semibold text-on-surface-variant text-center leading-relaxed">
                Optimization level compared to peer institutional benchmarks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-headline text-2xl font-bold text-primary">Service Breakdown</h4>
          <span className="text-sm font-bold text-on-surface-variant">Last updated: Today, 10:42 AM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'description', title: 'Essay Analysis', desc: 'Structural review, tone assessment, and semantic coherence for student submissions.', tokens: '482,102', docs: '324 Documents', change: '+12% vs LY', width: 'w-[65%]' },
            { icon: 'alternate_email', title: 'Email Drafting', desc: 'Personalized correspondence automation for admissions and scholarship inquiries.', tokens: '215,890', docs: '1,240 Drafts', change: '-4% vs LY', width: 'w-[28%]' },
            { icon: 'person_search', title: 'Profile Reviews', desc: 'Holistic data synthesis and gap analysis for student academic and extracurricular profiles.', tokens: '549,908', docs: '142 Profiles', change: '+22% vs LY', width: 'w-[82%]' },
          ].map((service) => (
            <div key={service.title} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary">{service.icon}</span>
              </div>
              <h5 className="font-headline text-lg font-extrabold text-primary mb-2">{service.title}</h5>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{service.desc}</p>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-on-surface-variant uppercase">Token Usage</span>
                  <span className="text-lg font-bold text-primary">{service.tokens}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`bg-primary h-full ${service.width}`}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
                  <span>{service.docs}</span>
                  <span>{service.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Transactions Table */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h4 className="font-headline text-lg font-bold text-primary">Recent Transactions</h4>
          <div className="flex gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input className="pl-9 pr-4 py-1.5 bg-surface-container-low border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary w-64" placeholder="Search logs..." type="text" />
            </div>
            <button className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Operation</th>
              <th className="px-6 py-4">Client/Dossier</th>
              <th className="px-6 py-4">Resource Cost</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {[
              { time: 'Oct 24, 2023 · 14:22', op: 'Essay Analysis', client: 'Harvard 2024 Application Pack', tokens: '12,402 Tokens' },
              { time: 'Oct 24, 2023 · 12:05', op: 'Profile Reviews', client: 'Undergrad Portfolio: Anderson', tokens: '8,115 Tokens' },
              { time: 'Oct 24, 2023 · 09:14', op: 'Email Drafting', client: 'Yale Admissions Follow-up', tokens: '2,045 Tokens' },
              { time: 'Oct 23, 2023 · 17:45', op: 'Essay Analysis', client: 'Personal Statement: Thompson', tokens: '15,820 Tokens' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-5 text-xs font-medium text-on-surface-variant">{row.time}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-sm font-semibold text-primary">{row.op}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-medium">{row.client}</td>
                <td className="px-6 py-5 text-sm font-bold text-primary">{row.tokens}</td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container-highest text-primary text-[10px] font-bold rounded-full uppercase">Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-6 bg-surface-container-low flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface-variant">Showing 1-4 of 1,842 operations</span>
          <div className="flex gap-2">
            <button className="p-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg opacity-50 cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg hover:bg-surface transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
