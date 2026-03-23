export default function StudentTranscriptsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">Academic Dossier</h2>
          <p className="text-on-surface-variant text-md max-w-xl">
            Comprehensive documentation and validated transcripts for university applications.
          </p>
        </div>
        <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-xl font-label text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:brightness-110 transition-all">
          <span className="material-symbols-outlined text-sm">upload_file</span>
          Upload New Document
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">All Files</button>
          <button className="px-5 py-1.5 rounded-full text-sm font-bold bg-primary text-white shadow-md">Transcripts</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Recommendations</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Test Scores</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Personal Essays</button>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="text-xs font-semibold uppercase tracking-widest">Sort by:</span>
          <button className="flex items-center gap-1 text-sm font-semibold text-primary">
            Date Added
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Transcripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Official Transcript */}
        <div className="group bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Validated
            </div>
          </div>
          <h3 className="font-headline font-bold text-lg text-primary mb-1">Official Final Transcript</h3>
          <p className="text-xs text-on-surface-variant font-medium mb-4">St. Jude&apos;s International Academy (2020-2024)</p>
          <div className="bg-surface-container-low rounded-xl p-3 mb-6 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-on-surface-variant uppercase tracking-wider">GPA:</span>
              <span className="text-primary font-bold">3.98 (Unweighted)</span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[98%]"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Size</span>
              <span className="text-xs font-semibold text-primary">2.4 MB</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-primary">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Mid-Year Report */}
        <div className="group bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[12px]">pending</span>
              Draft
            </div>
          </div>
          <h3 className="font-headline font-bold text-lg text-primary mb-1">Mid-Year Senior Report</h3>
          <p className="text-xs text-on-surface-variant font-medium mb-4">Current Academic Progress (Fall 2024)</p>
          <div className="bg-surface-container-low rounded-xl p-3 mb-6 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-on-surface-variant uppercase tracking-wider">Credits:</span>
              <span className="text-primary font-bold">18/22 Completed</span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[82%]"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Size</span>
              <span className="text-xs font-semibold text-primary">840 KB</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-primary">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Transfer Evaluation */}
        <div className="group bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Validated
            </div>
          </div>
          <h3 className="font-headline font-bold text-lg text-primary mb-1">Transfer Credit Report</h3>
          <p className="text-xs text-on-surface-variant font-medium mb-4">Summer Immersion - London School of Economics</p>
          <div className="bg-surface-container-low rounded-xl p-3 mb-6 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-on-surface-variant uppercase tracking-wider">Status:</span>
              <span className="text-primary font-bold">Verified Transfer</span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Size</span>
              <span className="text-xs font-semibold text-primary">1.1 MB</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-primary">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: AP Scores */}
        <div className="group bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Validated
            </div>
          </div>
          <h3 className="font-headline font-bold text-lg text-primary mb-1">Advanced Placement Score Report</h3>
          <p className="text-xs text-on-surface-variant font-medium mb-4">College Board Official Records (2022-2023)</p>
          <div className="bg-surface-container-low rounded-xl p-3 mb-6 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-on-surface-variant uppercase tracking-wider">Avg Score:</span>
              <span className="text-primary font-bold">4.8 (5 exams)</span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[96%]"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Size</span>
              <span className="text-xs font-semibold text-primary">1.7 MB</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-primary">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload Placeholder Card */}
        <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-surface hover:bg-surface-container-low transition-all cursor-pointer group">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary-container text-3xl">add_circle</span>
          </div>
          <p className="font-headline font-bold text-primary mb-1">Add Supplemental Transcript</p>
          <p className="text-xs text-on-surface-variant px-6">Upload school-specific or dual-enrollment documentation</p>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-[#031635] rounded-2xl p-1 shadow-2xl overflow-hidden relative">
        <div className="bg-white/80 backdrop-blur-xl relative rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-headline text-xl font-bold text-primary mb-2">Pilot Analysis: Transcript Strengths</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              Based on the uploaded transcripts, Alexandra shows a distinct upward trend in STEM rigor. Recommendation: Highlight the &apos;A+&apos; in AP Physics C during the Mid-Year Report in upcoming Ivy League drafts.
            </p>
          </div>
          <button className="bg-primary text-white px-6 py-3 rounded-full font-label text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
            Review Full Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
