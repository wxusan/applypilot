'use client'

interface UpgradePlanModalProps {
  currentPlan?: string
  onUpgrade?: () => void
  onContactSales?: () => void
}

const PLANS = [
  {
    id: 'starter',
    tier: 'Base Tier',
    name: 'Starter',
    price: '$79',
    period: '/mo',
    features: [
      { text: 'Up to 15 active students', included: true },
      { text: '2 Staff seats', included: true },
      { text: '1.5M AI Tokens / month', included: true },
      { text: 'Custom branded portals', included: false },
    ],
    cta: 'Current Selection',
    isCurrent: true,
  },
  {
    id: 'pro',
    tier: 'Pro Tier',
    name: 'Pro',
    price: '$199',
    period: '/mo',
    features: [
      { text: 'Up to 35 active students', included: true },
      { text: '4 Staff seats', included: true },
      { text: '5M AI Tokens / month', included: true },
      { text: 'Advanced AI analysis', included: true },
      { text: 'Custom branded portals', included: true },
    ],
    cta: 'Request Upgrade',
    recommended: true,
  },
  {
    id: 'enterprise',
    tier: 'Institutional Tier',
    name: 'Enterprise',
    price: 'Custom',
    features: [
      { text: 'Unlimited students', included: true },
      { text: 'Unlimited staff seats', included: true },
      { text: 'Unlimited AI Tokens', included: true },
      { text: 'White-labeled portal access', included: true },
    ],
    cta: 'Contact Sales',
  },
]

export default function UpgradePlanModal({
  currentPlan = 'professional',
  onUpgrade,
  onContactSales,
}: UpgradePlanModalProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary mb-3">Elevate Your Agency</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">Select a plan that matches your growth. Our Academic Architect tools scale with your student roster and team size.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-fixed rounded-xl text-sm font-semibold">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          Current Plan: Professional
        </div>
      </header>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`p-8 rounded-2xl flex flex-col gap-6 relative ${
              plan.recommended
                ? 'bg-surface-container-lowest shadow-[0_40px_40px_rgba(3,22,53,0.06)] border-2 border-primary/5'
                : 'bg-surface-container-low border border-outline-variant/15'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                Recommended
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className={`font-headline text-sm font-bold uppercase tracking-widest ${plan.recommended ? 'text-surface-tint' : 'text-secondary'}`}>
                {plan.tier}
              </span>
              <h3 className="font-headline text-2xl font-bold text-primary">{plan.name}</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-primary">{plan.price}</span>
              {plan.period && <span className="text-on-surface-variant font-medium">{plan.period}</span>}
            </div>
            <div className="h-px bg-outline-variant/20 w-full"></div>
            <ul className="flex flex-col gap-4">
              {plan.features.map((feature, i) => (
                <li key={i} className={`flex items-center gap-3 ${feature.included ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                  <span
                    className={`material-symbols-outlined text-[20px] ${feature.included ? (plan.recommended ? 'text-primary' : 'text-secondary') : ''}`}
                    style={feature.included && plan.recommended ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {feature.included ? 'verified' : 'cancel'}
                  </span>
                  <span className={`text-sm ${feature.included && plan.recommended ? 'font-semibold text-primary' : ''}`}>{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              {plan.isCurrent ? (
                <button className="w-full py-3 px-6 rounded-lg font-semibold text-sm border border-outline text-outline cursor-not-allowed">
                  Current Selection
                </button>
              ) : plan.id === 'enterprise' ? (
                <button
                  onClick={onContactSales}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-sm border border-primary text-primary hover:bg-primary/5 transition-colors active:scale-95"
                >
                  Contact Sales
                </button>
              ) : (
                <button
                  onClick={onUpgrade}
                  className="w-full py-4 px-6 rounded-lg font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-on-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                >
                  Request Upgrade
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Breakdown */}
      <section className="bg-surface-container-low rounded-3xl p-10 mt-6">
        <h2 className="font-headline text-2xl font-bold text-primary mb-8">Capacity Breakdown</h2>
        <div className="flex flex-col gap-4">
          {[
            { icon: 'group', title: 'Student Roster', desc: 'Total active application dossiers managed', current: '15', upgrade: '35' },
            { icon: 'badge', title: 'Staff Accounts', desc: 'Consultants, writers, and administrators', current: '2', upgrade: '4' },
            { icon: 'bolt', title: 'AI Tokens / month', desc: 'Used for essays, emails, and Common App fill', current: '1.5M', upgrade: '5M' },
          ].map((item) => (
            <div key={item.title} className="bg-surface-container-lowest rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-surface-bright border border-outline-variant/10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-primary">{item.title}</h4>
                  <p className="text-sm text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-12 md:text-right">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-outline">Current</span>
                  <span className="font-bold text-primary">{item.current}</span>
                </div>
                <div className="flex flex-col text-primary">
                  <span className="text-[10px] uppercase font-bold text-surface-tint">Upgrade</span>
                  <span className="font-extrabold text-xl">{item.upgrade}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
