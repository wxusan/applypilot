import Link from 'next/link'

export const metadata = { title: 'Terms of Service — ApplyPilot' }

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl text-[#031635]">ApplyPilot</Link>
        <Link href="/login" className="text-sm font-bold text-[#031635] hover:underline">Back to Login →</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-[#031635]">Terms of Service</h1>
          <p className="text-[#64748b] text-sm">Last updated: January 1, 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 space-y-8 text-[#334155] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">1. Acceptance of Terms</h2>
            <p>By accessing or using ApplyPilot ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">2. Use of the Platform</h2>
            <p>ApplyPilot is a college consulting management platform designed for educational consulting agencies and their staff. You agree to use the Platform solely for lawful purposes and in accordance with these Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. ApplyPilot is not liable for losses resulting from unauthorized account access.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">4. Data and Privacy</h2>
            <p>Student and agency data stored on the Platform is subject to our Privacy Policy. You are responsible for ensuring you have appropriate consent to process student data through the Platform.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">5. Subscription and Billing</h2>
            <p>Subscription fees are billed in advance on a monthly or annual basis. You may cancel at any time; cancellation takes effect at the end of the current billing period. No refunds are provided for partial periods.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">6. Intellectual Property</h2>
            <p>All content, features, and functionality of the Platform are owned by ApplyPilot and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Platform without written permission.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">7. Limitation of Liability</h2>
            <p>ApplyPilot is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount paid by you in the preceding three months.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">8. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">9. Contact</h2>
            <p>
              Questions about these Terms? Contact us on{' '}
              <a href="https://t.me/wwxusan" target="_blank" rel="noopener noreferrer" className="font-bold text-[#031635] underline">
                Telegram @wwxusan
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
