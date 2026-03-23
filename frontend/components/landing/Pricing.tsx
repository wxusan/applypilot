'use client'

import { motion } from 'framer-motion'

const tiers = [
  {
    name: 'Starter',
    price: '$199',
    period: '/mo',
    features: ['Up to 25 Students', 'Core AI Counselor', 'Standard Templates'],
    cta: 'Start Trial',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$499',
    period: '/mo',
    features: ['Unlimited Students', 'Advanced AI Analysis', 'Custom Branded Portals', 'Priority 24/7 Support'],
    cta: 'Get Started',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Multi-team Access', 'SAML/SSO Integration', 'API Documentation Access'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="px-8 py-20 bg-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-extrabold font-headline text-primary mb-6">Architectural Investment</h2>
          <p className="text-on-surface-variant max-w-[600px] mx-auto text-lg">Scale your consultancy with precision-engineered pricing tiers built for performance.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className={`p-6 rounded-2xl flex flex-col relative ${
                tier.highlight
                  ? 'bg-primary text-on-primary shadow-2xl shadow-primary/30 border-4 border-primary-container scale-105 z-10'
                  : 'bg-surface-container-lowest border border-outline-variant/10 shadow-sm'
              }`}
            >
              {tier.badge && (
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-on-primary/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">{tier.badge}</span>
                </div>
              )}
              <div className="mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest ${tier.highlight ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>{tier.name}</span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-5xl font-extrabold ${tier.highlight ? 'text-on-primary' : 'text-primary'}`}>{tier.price}</span>
                  {tier.period && <span className={`text-lg ${tier.highlight ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>{tier.period}</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feat) => (
                  <li key={feat} className={`flex items-start gap-3 font-medium ${tier.highlight ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                    <span className={`material-symbols-outlined text-xl ${tier.highlight ? 'text-on-primary-container' : 'text-primary'}`}>check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 font-bold rounded-xl transition-colors ${
                tier.highlight
                  ? 'bg-on-primary text-primary hover:bg-surface-bright shadow-lg'
                  : 'border-2 border-primary text-primary hover:bg-primary/5'
              }`}>
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
