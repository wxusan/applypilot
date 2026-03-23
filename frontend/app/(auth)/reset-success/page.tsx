import Link from 'next/link'

export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Background decorative elements */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-primary-fixed/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] rounded-full bg-secondary-fixed/20 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            <span className="font-headline font-extrabold text-2xl tracking-widest text-primary uppercase">ApplyPilot</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_40px_40px_-15px_rgba(3,22,53,0.06)] flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full scale-150 blur-xl"></div>
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center relative z-10">
              <span
                className="material-symbols-outlined text-on-primary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>

          <h1 className="font-headline font-bold text-3xl text-primary tracking-tight mb-4">
            Password Reset Successful
          </h1>
          <p className="text-on-surface-variant text-md leading-relaxed mb-10 px-4">
            Your security credentials have been updated. You can now use your new password to access your consultant portal and manage student applications.
          </p>

          <div className="w-full space-y-4">
            <Link
              href="/login"
              className="bg-gradient-to-br from-primary to-primary-container w-full py-4 rounded-xl flex items-center justify-center gap-2 text-on-primary font-label font-semibold text-md shadow-sm transition-transform active:scale-95"
            >
              Log in to Dashboard
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-outline-variant/15 w-full flex flex-col items-center gap-4">
            <p className="text-on-surface-variant text-sm">Need help with your account?</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-primary font-semibold text-sm hover:underline decoration-primary-fixed decoration-2 underline-offset-4">
                Support Center
              </a>
              <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
              <a href="#" className="text-primary font-semibold text-sm hover:underline decoration-primary-fixed decoration-2 underline-offset-4">
                Security Policy
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-on-surface-variant text-xs uppercase tracking-widest font-medium opacity-60">
            Academic Architect • Secure Authentication System
          </p>
        </div>
      </div>

      {/* Progress bar accent */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-surface-container-high overflow-hidden">
        <div className="h-full bg-primary w-1/3"></div>
      </div>
    </div>
  )
}
