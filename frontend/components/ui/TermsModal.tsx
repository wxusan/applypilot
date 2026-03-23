'use client'

import { useState } from 'react'

interface TermsModalProps {
  onAccept: () => void
  onDecline: () => void
}

export default function TermsModal({ onAccept, onDecline }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [lang, setLang] = useState<'en' | 'uz'>('en')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4 md:p-12">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 bg-surface">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-fixed/30 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-container/20 blur-[100px] rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
      </div>

      <div className="relative w-full max-w-5xl h-full max-h-[900px] bg-surface-container-lowest rounded-xl shadow-[0_-4px_40px_rgba(3,22,53,0.06)] flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 bg-surface-container-lowest border-b border-outline-variant/15">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <div>
              <h1 className="font-headline font-bold text-xl text-primary tracking-tight">
                {lang === 'en' ? 'Terms of Service' : 'Foydalanish shartlari'}
              </h1>
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
                {lang === 'en' ? 'Version 2.4 — Last updated: October 2023' : 'Versiya 2.4 — Oxirgi yangilanish: Oktyabr 2023'}
              </p>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-all ${
                lang === 'en'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('uz')}
              className={`px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-all ${
                lang === 'uz'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              UZ
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left: Table of Contents */}
          <aside className="w-full md:w-72 bg-surface-container-low p-8 border-r border-outline-variant/10 overflow-y-auto hidden md:block" style={{ scrollbarWidth: 'none' }}>
            {lang === 'en' ? (
              <>
                <h2 className="font-headline font-extrabold text-sm text-primary mb-6">Contents</h2>
                <nav className="space-y-4">
                  <a className="block text-sm font-semibold text-primary border-l-2 border-primary pl-4 py-1" href="#section-1">1. General Principles</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#section-2">2. Data Security &amp; Privacy</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#section-3">3. Consultant Registration</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#section-4">4. Pilot AI Usage</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#section-5">5. Payment &amp; Subscriptions</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#section-6">6. Liability &amp; Warranties</a>
                </nav>
                <div className="mt-12 p-4 bg-primary-container rounded-lg">
                  <p className="text-[11px] leading-relaxed text-on-primary-container font-medium">
                    <span className="font-bold block mb-1">Important Note:</span>
                    This document is a legally binding agreement between you and Academic Architect.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-headline font-extrabold text-sm text-primary mb-6">Mundarija</h2>
                <nav className="space-y-4">
                  <a className="block text-sm font-semibold text-primary border-l-2 border-primary pl-4 py-1" href="#uz-section-1">1. Umumiy qoidalar</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#uz-section-2">2. Konsultant ro&apos;yxatdan o&apos;tishi</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#uz-section-3">3. Ma&apos;lumotlar maxfiyligi</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#uz-section-4">4. Pilot AI dan foydalanish</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#uz-section-5">5. To&apos;lov va obunalar</a>
                  <a className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors pl-4 py-1" href="#uz-section-6">6. Tomonlarning mas&apos;uliyati</a>
                </nav>
                <div className="mt-12 p-4 bg-primary-container rounded-lg">
                  <p className="text-[11px] leading-relaxed text-on-primary-container font-medium">
                    <span className="font-bold block mb-1">Muhim eslatma:</span>
                    Ushbu hujjat siz va Academic Architect o&apos;rtasidagi yuridik jihatdan majburiy shartnoma hisoblanadi.
                  </p>
                </div>
              </>
            )}
          </aside>

          {/* Right: Legal text */}
          <article className="flex-1 p-8 md:p-12 overflow-y-auto bg-surface-container-lowest leading-relaxed text-on-surface-variant selection:bg-primary-fixed" style={{ scrollbarWidth: 'none' }}>

            {lang === 'en' ? (
              <>
                <section className="mb-10" id="section-1">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">1. General Principles</h3>
                  <p className="mb-4 text-sm md:text-base">By accessing ApplyPilot, you agree to uphold the highest standards of academic integrity. Our platform is designed as a collaborative tool for educational consultants and applicants to streamline the documentation process.</p>
                  <p className="mb-4 text-sm md:text-base">Users are prohibited from utilizing the platform to generate fraudulent academic credentials or misrepresenting identity during the admissions cycle. ApplyPilot acts as an auxiliary processor of your institutional data.</p>
                </section>

                <section className="mb-10" id="section-2">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">2. Data Security &amp; Privacy</h3>
                  <div className="bg-surface-container-low p-6 rounded-xl mb-6">
                    <p className="text-sm italic border-l-4 border-primary-container/20 pl-4">
                      Consultants are required to provide accurate information about their professional qualifications and work experience.
                    </p>
                  </div>
                  <p className="mb-4 text-sm md:text-base">We employ enterprise-grade encryption for all dossier transfers. Student data is processed in compliance with global standards, ensuring that personal identifiers are handled with institutional-level security protocols.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary mb-2 block">lock</span>
                      <h4 className="font-bold text-primary text-sm mb-1">Data Encryption</h4>
                      <p className="text-xs">All student data is protected with end-to-end encryption (AES-256).</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary mb-2 block">security</span>
                      <h4 className="font-bold text-primary text-sm mb-1">Full Control</h4>
                      <p className="text-xs">Full control over student dossier visibility. Regular automated security audits and logging.</p>
                    </div>
                  </div>
                </section>

                <section className="mb-10" id="section-3">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">3. Consultant Registration</h3>
                  <ul className="list-disc pl-5 space-y-3 text-sm md:text-base">
                    <li>You are solely responsible for maintaining the confidentiality of your access credentials.</li>
                    <li>Any actions performed under your account are deemed to have been performed by you personally.</li>
                    <li>The Company reserves the right to suspend access in cases of suspected unauthorized use.</li>
                  </ul>
                </section>

                <section className="mb-10" id="section-4">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">4. Pilot AI Usage</h3>
                  <p className="mb-4 text-sm md:text-base">The Pilot AI assistant is provided as an auxiliary tool for optimizing the consultant&apos;s workflow. Pilot AI results are of an advisory nature.</p>
                  <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                    <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                      Pilot AI Limitations
                    </h4>
                    <p className="text-sm">Consultants must verify all Pilot AI recommendations before providing them to the end client (student). The Company is not responsible for decisions made solely on the basis of AI predictions.</p>
                  </div>
                </section>

                <section className="mb-10" id="section-5">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">5. Payment &amp; Subscriptions</h3>
                  <p className="text-sm md:text-base">Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by applicable law. The Company reserves the right to change pricing with 30 days&apos; notice.</p>
                </section>

                <section className="mb-10" id="section-6">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">6. Liability &amp; Warranties</h3>
                  <p className="text-sm md:text-base">Platform services are provided on an &quot;as is&quot; basis. The Company does not guarantee student admissions to specific educational institutions, as the final decision rests with university admissions committees.</p>
                </section>
              </>
            ) : (
              <>
                <section className="mb-10" id="uz-section-1">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">1. Umumiy qoidalar</h3>
                  <p className="mb-4 text-sm md:text-base">Ushbu Foydalanuvchi shartnomasi (keyingi o&apos;rinlarda — «Shartnoma») Academic Architect (keyingi o&apos;rinlarda — «Kompaniya») va xizmatdan foydalanadigan jismoniy yoki yuridik shaxs (keyingi o&apos;rinlarda — «Foydalanuvchi» yoki «Konsultant») o&apos;rtasidagi munosabatlarni tartibga soladi.</p>
                  <p className="mb-4 text-sm md:text-base">Academic Architect platformasidan foydalanish orqali siz ushbu shartlarni to&apos;liq o&apos;qib chiqqaningizni, tushunganingizni va ularga rioya qilishga rozilik bildirayotganingizni tasdiqlab berasiz.</p>
                </section>

                <section className="mb-10" id="uz-section-2">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">2. Konsultant ro&apos;yxatdan o&apos;tishi va hisob qaydnomasi</h3>
                  <div className="bg-surface-container-low p-6 rounded-xl mb-6">
                    <p className="text-sm italic border-l-4 border-primary-container/20 pl-4">
                      Konsultantlar o&apos;zlarining kasbiy malakasi va ish tajribasi haqida ishonchli ma&apos;lumot berishlari shart.
                    </p>
                  </div>
                  <ul className="list-disc pl-5 space-y-3 text-sm md:text-base">
                    <li>Siz kirish ma&apos;lumotlaringiz maxfiyligini saqlash uchun to&apos;liq javobgarsiz.</li>
                    <li>Sizning hisob qaydnomangiz orqali amalga oshirilgan har qanday harakatlar shaxsan siz tomonidan amalga oshirilgan deb hisoblanadi.</li>
                    <li>Kompaniya ruxsatsiz foydalanishga shubha bo&apos;lganda kirishni to&apos;xtatib qo&apos;yish huquqini o&apos;zida saqlaydi.</li>
                  </ul>
                </section>

                <section className="mb-10" id="uz-section-3">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">3. Ma&apos;lumotlar maxfiyligi va himoyasi</h3>
                  <p className="mb-4 text-sm md:text-base">Biz talabalar va konsultantlarning shaxsiy ma&apos;lumotlarini himoya qilishga jiddiy yondashamiz. Ma&apos;lumotlarni qayta ishlash O&apos;zbekiston Respublikasi qonunchiligi va Maxfiylik siyosatiga muvofiq amalga oshiriladi.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary mb-2 block">lock</span>
                      <h4 className="font-bold text-primary text-sm mb-1">Ma&apos;lumotlarni shifrlash</h4>
                      <p className="text-xs">Barcha talaba ma&apos;lumotlari uchidan-uchiga shifrlash (AES-256) bilan himoyalangan.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary mb-2 block">security</span>
                      <h4 className="font-bold text-primary text-sm mb-1">To&apos;liq nazorat</h4>
                      <p className="text-xs">Talabalar hujjatlari ko&apos;rinishini to&apos;liq nazorat qilish. Doimiy avtomatlashtirilgan xavfsizlik auditi.</p>
                    </div>
                  </div>
                </section>

                <section className="mb-10" id="uz-section-4">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">4. Pilot AI dan foydalanish</h3>
                  <p className="mb-4 text-sm md:text-base">Pilot AI intellektual yordamchisi konsultant ishini optimallashtirish uchun yordamchi vosita sifatida taqdim etiladi. Pilot AI natijalari tavsiya xarakteriga ega.</p>
                  <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                    <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                      Pilot AI cheklovlari
                    </h4>
                    <p className="text-sm">Konsultant barcha Pilot AI tavsiyalarini yakuniy mijozga (talabaga) taqdim etishdan oldin tekshirishi shart. Kompaniya faqat AI bashoratlari asosida qabul qilingan qarorlar uchun javobgar emas.</p>
                  </div>
                </section>

                <section className="mb-10" id="uz-section-5">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">5. To&apos;lov va obunalar</h3>
                  <p className="text-sm md:text-base">Obuna to&apos;lovlari oylik yoki yillik asosda oldindan hisoblanadi. Barcha to&apos;lovlar qaytarib berilmaydi, ammo qo&apos;llaniladigan qonunchilik talablaridan mustasno. Kompaniya 30 kunlik ogohlantirish bilan narxlarni o&apos;zgartirish huquqini o&apos;zida saqlaydi.</p>
                </section>

                <section className="mb-10" id="uz-section-6">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">6. Tomonlarning mas&apos;uliyati va kafolatlar</h3>
                  <p className="text-sm md:text-base">Platforma xizmatlari &quot;bor holida&quot; (as is) tamoyili asosida ko&apos;rsatiladi. Kompaniya talabalarning ma&apos;lum ta&apos;lim muassasalariga qabul qilinishini kafolatlamaydi, chunki yakuniy qaror universitetlarning qabul komissiyalarida qoladi.</p>
                </section>
              </>
            )}
          </article>
        </main>

        {/* Footer */}
        <footer className="p-8 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-6 border-t border-outline-variant/15">
          <div className="flex items-center gap-3">
            <label className="relative flex items-center cursor-pointer">
              <input
                className="peer h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="ml-3 text-sm font-medium text-on-surface">
                {lang === 'en'
                  ? 'I confirm that I have read and agree to the terms'
                  : 'Men shartlar bilan tanishib chiqdim va ularga roziman'}
              </span>
            </label>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={onDecline}
              className="flex-1 md:flex-none px-8 py-3 rounded-lg font-label font-semibold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              {lang === 'en' ? 'Log Out' : 'Chiqish'}
            </button>
            <button
              onClick={onAccept}
              disabled={!agreed}
              className="flex-1 md:flex-none px-10 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container font-label font-bold text-sm text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {lang === 'en' ? 'Accept and Continue' : 'Qabul qilish va davom etish'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
