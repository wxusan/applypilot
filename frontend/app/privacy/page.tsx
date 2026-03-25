import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — ApplyPilot' }

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <nav className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl text-[#031635]">ApplyPilot</Link>
        <Link href="/login" className="text-sm font-bold text-[#031635] hover:underline">Back to Login →</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-[#031635]">Privacy Policy</h1>
          <p className="text-[#64748b] text-sm">Last updated: January 1, 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 space-y-8 text-[#334155] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account (name, email, agency details), student data you enter into the Platform, and usage data to improve our service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve the Platform, send service-related communications, and ensure platform security. We do not sell your data to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">3. Student Data</h2>
            <p>Student data entered into the Platform is owned by your agency. ApplyPilot processes this data solely to provide the service. We do not use student data for any other purpose.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits to protect your data.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">5. Data Retention</h2>
            <p>We retain your data for the duration of your subscription plus 30 days after cancellation. You may request data deletion at any time by contacting us.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. Contact us on Telegram to exercise these rights.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#031635]">8. Contact</h2>
            <p>
              Privacy questions?{' '}
              <a href="https://t.me/wwxusan" target="_blank" rel="noopener noreferrer" className="font-bold text-[#031635] underline">
                Message us on Telegram @wwxusan
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
