'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────

interface PlanPricing {
  price_monthly: number
  price_annual: number
  is_most_popular: boolean
}

interface PlansData {
  starter: PlanPricing
  pro: PlanPricing
  enterprise: PlanPricing
}

// ── Static config (everything except price, which comes from the DB) ─────────

const TIER_META = [
  {
    key: 'starter' as const,
    label: 'Starter',
    sublabel: 'STARTER',
    features: ['2 Staff Seats', '15 Students', '1.5M AI Tokens / mo', 'Core AI Counselor', 'Standard Templates'],
    cta: 'Start Trial',
    href: '/request-access',
  },
  {
    key: 'pro' as const,
    label: 'Professional',
    sublabel: 'PROFESSIONAL',
    features: ['4 Staff Seats', '35 Students', '5M AI Tokens / mo', 'Advanced AI Analysis', 'Custom Branded Portals', 'Priority 24/7 Support'],
    cta: 'Get Started',
    href: '/login',
  },
  {
    key: 'enterprise' as const,
    label: 'Enterprise',
    sublabel: 'ENTERPRISE',
    features: ['∞ Staff Seats', '∞ Students', '∞ AI Tokens / mo', 'Multi-team Access', 'SAML/SSO Integration', 'API Documentation Access'],
    cta: 'Contact Sales',
    href: '/request-access',
  },
]

// ── Fallback prices shown while loading ─────────────────────────────────────

const FALLBACK: PlansData = {
  starter:    { price_monthly: 79,  price_annual: 790,  is_most_popular: false },
  pro:        { price_monthly: 199, price_annual: 1990, is_most_popular: true  },
  enterprise: { price_monthly: 499, price_annual: 4990, is_most_popular: false },
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Pricing() {
  const [plans, setPlans] = useState<PlansData>(FALLBACK)
  const [annual, setAnnual] = useState(false)

  useEffect(() => {
    fetch('/api/public/plan-configs')
      .then((r) => r.json())
      .then((data) => {
        if (data?.plans) setPlans({ ...FALLBACK, ...data.plans })
      })
      .catch(() => {/* silently use fallback */})
  }, [])

  return (
    <section id="pricing" className="px-8 py-20 bg-surface">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-extrabold font-headline text-primary mb-6">Architectural Investment</h2>
          <p className="text-on-surface-variant max-w-[600px] mx-auto text-lg">
            Scale your consultancy with precision-engineered pricing tiers built for performance.
          </p>
        </motion.div>

        {/* Monthly / Annual toggle — pill style */}
        <div className="flex items-center justify-center mb-14">
          <div className="inline-flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !annual
                  ? 'bg-primary text-on-primary shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                annual
                  ? 'bg-primary text-on-primary shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Annual
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                2 months free
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {TIER_META.map((tier, i) => {
            const pricing = plans[tier.key]
            const highlight = pricing.is_most_popular
            const displayPrice = annual ? pricing.price_annual : pricing.price_monthly
            const period = annual ? '/yr' : '/mo'

            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className={`p-6 rounded-2xl flex flex-col relative ${
                  highlight
                    ? 'bg-primary text-on-primary shadow-2xl shadow-primary/30 border-4 border-primary-container scale-105 z-10'
                    : 'bg-surface-container-lowest border border-outline-variant/10 shadow-sm'
                }`}
              >
                {/* Most Popular badge */}
                {highlight && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-on-primary/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-6">
                  <span className={`text-xs font-bold uppercase tracking-widest ${highlight ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    {tier.sublabel}
                  </span>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-5xl font-extrabold transition-all duration-300 ${highlight ? 'text-on-primary' : 'text-primary'}`}>
                      ${displayPrice.toLocaleString()}
                    </span>
                    <span className={`text-lg ${highlight ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                      {period}
                    </span>
                  </div>
                  {annual && (
                    <p className={`text-xs mt-1 ${highlight ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                      ${pricing.price_monthly}/mo billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className={`flex items-start gap-3 font-medium ${highlight ? 'text-on-primary' : 'text-on-surface-variant'}`}
                    >
                      <span className={`material-symbols-outlined text-xl ${highlight ? 'text-on-primary-container' : 'text-primary'}`}>
                        check_circle
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={tier.href}
                  className={`w-full py-4 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    highlight
                      ? 'bg-on-primary text-primary hover:bg-surface-bright shadow-lg'
                      : 'border-2 border-primary text-primary hover:bg-primary/5'
                  }`}
                >
                  {tier.cta}
                </a>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
