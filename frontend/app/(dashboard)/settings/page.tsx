import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const db = createServiceClient()
  const { data: member } = await db
    .from('agency_members')
    .select('role, agency:agencies (*), user:users (*)')
    .eq('user_id', session!.user.id)
    .single()

  const agency = Array.isArray(member?.agency) ? member!.agency[0] : member?.agency
  const user = Array.isArray(member?.user) ? member!.user[0] : member?.user

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight mb-2">
          Agency Profile
        </h2>
        <p className="text-on-surface-variant text-lg">
          Manage your consulting firm&#39;s identity and global dossier preferences.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Settings Form */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/15">
          <h3 className="text-xl font-bold font-headline text-primary mb-8">Basic Information</h3>
          <SettingsForm agency={agency} user={user} role={member?.role ?? 'staff'} />
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Agency Logo placeholder */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/15 text-center">
            <h3 className="text-sm font-bold font-headline text-primary mb-6 text-left">Agency Logo</h3>
            <div className="relative inline-block group cursor-pointer">
              <div className="h-32 w-32 rounded-3xl bg-primary-container flex items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant group-hover:border-primary/30 transition-colors mx-auto">
                <span className="font-headline font-extrabold text-on-primary-container text-3xl">
                  {agency?.name?.slice(0, 2).toUpperCase() ?? 'AP'}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <span className="material-symbols-outlined text-base">edit</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-6 leading-relaxed">
              Recommended: 400x400px.<br />PNG or SVG format.
            </p>
          </div>

          {/* AI Status card */}
          <div className="bg-primary text-white rounded-2xl p-6 shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-primary-fixed opacity-60 mb-2">auto_awesome</span>
              <h4 className="text-sm font-bold font-headline mb-1">AI Assistant Active</h4>
              <p className="text-xs text-primary-fixed-dim leading-relaxed">
                Pilot AI is ready to assist with student dossiers and application strategies.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-9xl">robot_2</span>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="col-span-12 bg-surface-container-low rounded-3xl p-10 border border-outline-variant/10">
          <div className="flex items-start justify-between mb-10">
            <div>
              <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                Dossier Preferences
              </h3>
              <p className="text-on-surface-variant">
                Configure how student application folders are structured and automated.
              </p>
            </div>
            <span className="material-symbols-outlined text-primary/20 text-5xl">folder_managed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'auto_stories',
                bg: 'bg-primary-fixed',
                label: 'Narrative Auto-Draft',
                desc: 'Enable AI-assisted first drafts for student personal statements based on interview notes.',
                enabled: true,
              },
              {
                icon: 'shield',
                bg: 'bg-secondary-fixed',
                label: 'Blind Review Mode',
                desc: 'Anonymize student profiles for internal scholarship committee reviews.',
                enabled: false,
              },
              {
                icon: 'history_edu',
                bg: 'bg-tertiary-fixed',
                label: 'Academic Dossier Pro',
                desc: 'Include standardized test history and detailed GPA trend analysis in exports.',
                enabled: true,
              },
            ].map((pref) => (
              <div
                key={pref.label}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`h-10 w-10 rounded-xl ${pref.bg} flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined">{pref.icon}</span>
                  </div>
                  <h4 className="font-bold text-primary">{pref.label}</h4>
                </div>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">{pref.desc}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-5 ${pref.enabled ? 'bg-primary' : 'bg-surface-container-highest'} rounded-full relative`}>
                    <div className={`absolute ${pref.enabled ? 'right-1' : 'left-1'} top-1 h-3 w-3 bg-white rounded-full`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${pref.enabled ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                    {pref.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
