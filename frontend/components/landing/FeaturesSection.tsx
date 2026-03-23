export default function FeaturesSection() {
  return (
    <section className="px-8 py-32 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl font-extrabold font-headline text-primary mb-4">Intelligence at Every Touchpoint</h2>
          <div className="w-20 h-1.5 bg-primary rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* AI Counselor Card */}
          <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-8">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="text-2xl font-bold font-headline text-primary mb-4">AI Counselor</h3>
              <p className="text-on-surface-variant leading-relaxed mb-8">Autonomous drafting of recommendation letters and application critiques with a personal touch.</p>
            </div>
            <div className="rounded-xl overflow-hidden h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="AI Collaboration"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR9m8dnFZxeZ8JJKASUzxIlrjN7DhSPb0QhYkjRVPXu4PWCR3r7WdkMmK-sl7R7Dl6OfvIO62gUmKpKPoChuJ9_DRB6qX6YpV4lpYx2iK5UHtl3NGP46i8pbLIC7TAOXkzBIPCDAN0SMdTbqNprAUsXpUItgeTYrzYGIIo9suz8-nE_FODJgWkCrWBWp7u1H18GNqY6UutVMNxyMnFRjlQl3Br3G-QOaTCrAluve62MMrumYjtT6zCnumtdM4Vs1CNXoRkRWsLU24"
              />
            </div>
          </div>

          {/* Secure Dossiers */}
          <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary mb-8">
              <span className="material-symbols-outlined">folder_managed</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-primary mb-4">Secure Dossiers</h3>
            <p className="text-on-surface-variant leading-relaxed mb-8">Enterprise-grade storage for transcripts, portfolios, and sensitive student records.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-primary">description</span>
                <span className="font-semibold text-primary">Student_Portfolio_V2.pdf</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-primary">description</span>
                <span className="font-semibold text-primary">Transcript_Official.docx</span>
              </div>
            </div>
          </div>

          {/* Unified Pipeline */}
          <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary mb-8">
              <span className="material-symbols-outlined">monitoring</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-primary mb-4">Unified Pipeline</h3>
            <p className="text-on-surface-variant leading-relaxed mb-8">Real-time tracking of application statuses across hundreds of institutions.</p>
            <div className="h-40 bg-surface-container-low rounded-xl flex items-end gap-3 px-8 pb-4">
              <div className="w-full bg-primary/20 h-[40%] rounded-t-lg"></div>
              <div className="w-full bg-primary/40 h-[60%] rounded-t-lg"></div>
              <div className="w-full bg-primary/60 h-[85%] rounded-t-lg"></div>
              <div className="w-full bg-primary h-[55%] rounded-t-lg"></div>
            </div>
          </div>

          {/* Branded Portals */}
          <div className="bg-primary text-on-primary p-10 rounded-2xl border border-primary-container shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-on-primary-container">brand_awareness</span>
            </div>
            <h3 className="text-2xl font-bold font-headline mb-4">Branded Portals</h3>
            <p className="text-on-primary-container leading-relaxed mb-8">Your agency&#39;s look and feel, delivering a premium student-facing experience.</p>
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary bg-slate-300"></div>
              <div className="w-12 h-12 rounded-full border-4 border-primary bg-slate-400"></div>
              <div className="w-12 h-12 rounded-full border-4 border-primary bg-slate-500"></div>
              <div className="w-12 h-12 rounded-full border-4 border-primary bg-primary-container flex items-center justify-center text-xs font-bold">+12</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
