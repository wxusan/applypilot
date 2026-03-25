'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Product', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
]

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-8 h-20">
          {/* Logo */}
          <Link href="/" className="text-xl font-extrabold tracking-tighter text-primary font-headline">
            ApplyPilot
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold font-headline">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-600 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-bold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/request-access"
              className="px-6 py-2.5 text-sm font-bold text-on-primary btn-gradient rounded-xl active:scale-95 duration-200 transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/5 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        <div className="bg-surface-container-low h-[1px] w-full absolute bottom-0 opacity-20" />
      </nav>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-20 left-0 right-0 bg-white shadow-2xl border-b border-outline-variant/20 px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-semibold text-primary py-2 border-b border-outline-variant/10 hover:text-primary/70 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/request-access"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-on-primary btn-gradient rounded-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
