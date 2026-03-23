'use client'

import { useState } from 'react'

interface TermsModalProps {
  onAccept: () => void
  onDecline: () => void
}

export default function TermsModal({ onAccept, onDecline }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white/80 backdrop-blur-2xl">
      <div className="w-full max-w-6xl h-full max-h-[900px] bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_rgba(3,22,53,0.06)] flex flex-col overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-container/20 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-8 py-10 sm:px-12 border-b border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary mb-2">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
              <span className="font-headline font-extrabold text-2xl tracking-tighter">ApplyPilot</span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">Terms of Service &amp; Usage Policy</h1>
            <p className="text-on-surface-variant font-medium">Last updated: October 2023</p>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-bold font-headline text-on-primary-fixed bg-primary-fixed px-3 py-1 rounded-full uppercase tracking-wider">Compliance Review Required</span>
            <p className="text-sm text-on-surface-variant mt-2 max-w-[240px]">Academic integrity and data protection are at the core of our platform.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* English Section */}
            <section className="space-y-10">
              <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  1. General Principles
                </h2>
                <div className="space-y-6 text-on-surface-variant leading-relaxed text-[0.95rem]">
                  <p>By accessing ApplyPilot, you agree to uphold the highest standards of academic integrity. Our platform is designed as a collaborative tool for educational consultants and applicants to streamline the documentation process.</p>
                  <p>Users are prohibited from utilizing the platform to generate fraudulent academic credentials or misrepresenting identity during the admissions cycle. ApplyPilot acts as an auxiliary processor of your institutional data.</p>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  2. Data Security &amp; Privacy
                </h2>
                <div className="space-y-4 text-on-surface-variant leading-relaxed text-[0.95rem]">
                  <p>We employ enterprise-grade encryption for all dossier transfers. Student data is processed in compliance with global standards, ensuring that personal identifiers are handled with institutional-level security protocols.</p>
                  <ul className="list-none space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                      <span>Full control over student dossier visibility.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                      <span>Regular automated security audits and logging.</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-6">
                <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
                  <p className="text-sm italic font-medium text-primary">&quot;The Academic Architect protocol ensures your data remains your intellectual property.&quot;</p>
                </div>
              </div>
            </section>

            {/* Uzbek Section */}
            <section className="space-y-10 border-l border-outline-variant/10 lg:pl-16">
              <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  1. Umumiy tamoyillar
                </h2>
                <div className="space-y-6 text-on-surface-variant leading-relaxed text-[0.95rem]">
                  <p>ApplyPilot dasturiga kirish orqali siz akademik halollikning eng yuqori standartlariga rioya qilishga rozilik bildirasiz. Bizning platformamiz ta&apos;lim bo&apos;yicha maslahatchilar va arizachilar uchun hujjatlashtirish jarayonini soddalashtirish uchun hamkorlik vositasi sifatida ishlab chiqilgan.</p>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  2. Ma&apos;lumotlar xavfsizligi
                </h2>
                <div className="space-y-4 text-on-surface-variant leading-relaxed text-[0.95rem]">
                  <p>Biz barcha dossier o&apos;tkazmalari uchun korporativ darajadagi shifrlashdan foydalanamiz. Talabalar ma&apos;lumotlari global standartlarga muvofiq qayta ishlanadi.</p>
                  <ul className="list-none space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                      <span>Talabalar hujjatlari ko&apos;rinishini to&apos;liq nazorat qilish.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                      <span>Doimiy avtomatlashtirilgan xavfsizlik auditi.</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-6">
                <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
                  <p className="text-sm italic font-medium text-primary">&quot;Akademik arxitektor protokoli ma&apos;lumotlaringiz sizning intellektual mulkingiz bo&apos;lib qolishini ta&apos;minlaydi.&quot;</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-8 py-8 sm:px-12 bg-surface-container-low border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                className="sr-only peer"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ms-3 text-sm font-semibold text-primary font-headline">I understand and agree to the terms / Shartlarga roziman</span>
            </label>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={onDecline}
              className="flex-1 sm:flex-none px-8 py-3.5 text-on-surface-variant font-bold text-sm hover:bg-surface-dim transition-colors rounded-xl"
            >
              Log Out / Chiqish
            </button>
            <button
              onClick={onAccept}
              disabled={!agreed}
              className="flex-1 sm:flex-none px-10 py-3.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(3,22,53,0.15)] hover:scale-[1.02] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Accept and Continue / Qabul qilish
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
