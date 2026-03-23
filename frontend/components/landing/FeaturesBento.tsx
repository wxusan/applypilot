'use client'

import { Brain, Bot, FileText, Send, Clock, Globe2, Target } from 'lucide-react'

const AGENTS = [
  {
    title: "Document Processor",
    desc: "Extracts physical PDFs via GPT-4o Vision OCR straight into the main database without manual typing.",
    icon: FileText,
    col: "md:col-span-2",
    color: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    title: "Intake Agent",
    desc: "Pings parents over Telegram asking 20 automated questions to complete missing profiles naturally.",
    icon: Bot,
    col: "md:col-span-1",
    color: "text-purple-400",
    bg: "bg-purple-500/10"
  },
  {
    title: "Essay Writer",
    desc: "Drafts Common App supplements using dynamic word limits contextually aware of the student's entire history.",
    icon: Brain,
    col: "md:col-span-1",
    color: "text-rose-400",
    bg: "bg-rose-500/10"
  },
  {
    title: "Browser Automation",
    desc: "The Steel.dev headless cloud engine drives physical browsers navigating university portals entirely on autopilot.",
    icon: Globe2,
    col: "md:col-span-2",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Deadline Tracker",
    desc: "Alerts staff relentlessly at 30 days, 14 days, and 24 hours prior to application cut-off dates.",
    icon: Clock,
    col: "md:col-span-1",
    color: "text-amber-400",
    bg: "bg-amber-500/10"
  },
  {
    title: "Email Dispatch",
    desc: "Sits on the IMAP connection intercepting university acceptances filtering noise into distinct actionable cards.",
    icon: Send,
    col: "md:col-span-2",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10"
  }
]

export default function FeaturesBento() {
  return (
    <section id="features" className="py-24 bg-[#0B1629] relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
            <Target size={12} className="text-indigo-400" />
            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">Core Architecture</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Meet the 7 Autonomous Agents.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-[15px] leading-relaxed">
            ApplyPilot isn't just an empty CRM framework — it's a squad of highly specialized 
            micro-services working asynchronously below the surface to process real world mechanical labor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENTS.map((agent, i) => (
            <div 
              key={i} 
              className={`relative overflow-hidden group rounded-2xl bg-[#132035] border border-white/10 p-8 hover:bg-[#1a2d4a] transition-colors ${agent.col}`}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/5 ${agent.bg}`}>
                    <agent.icon className={agent.color} size={24} />
                  </div>
                  <h3 className="text-[20px] font-semibold text-white mb-3">
                    {agent.title}
                  </h3>
                  <p className="text-[14px] text-gray-400 leading-relaxed font-light">
                    {agent.desc}
                  </p>
                </div>
              </div>

              {/* Hover gradient flare */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 50%)'
                }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
