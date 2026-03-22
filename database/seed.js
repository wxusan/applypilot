/**
 * ApplyPilot — Seed test accounts & agency data
 * Run from the ApplyPilot root: node database/seed.js
 */
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js')

const SUPABASE_URL = 'https://hhvgwniixxmawdsryrep.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhodmd3bmlpeHhtYXdkc3J5cmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTI5NSwiZXhwIjoyMDg5NjMxMjk1fQ.Wa9qQb6XMC2rlAMWMfmmzFIzkA3m14Qgyw2c0Y2UNoY'

const ACCOUNTS = [
  { uid: '1e2ded68-bdfd-4a19-8138-8bd8296abf56', email: 'admin@premier.com',    password: 'ApplyPilot2024!', full_name: 'Sarah Johnson', role: 'admin' },
  { uid: '0443d2ac-0735-4ae5-9bdc-c5143cd12068', email: 'staff@premier.com',    password: 'ApplyPilot2024!', full_name: 'Michael Chen',  role: 'staff' },
  { uid: '8e59455e-6034-4981-83bb-b52fd76ead97', email: 'admin@edupath.com',    password: 'ApplyPilot2024!', full_name: 'David Park',    role: 'admin' },
  { uid: '5ed17294-37f1-4afa-85e5-818e86f5d522', email: 'owner@applypilot.com', password: 'ApplyPilot2024!', full_name: 'Xusan',         role: 'super_admin' },
]

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  console.log('🚀 ApplyPilot — Seeding test data\n')

  // 1. Reset passwords + confirm emails for all 4 accounts
  for (const acc of ACCOUNTS) {
    const { error } = await db.auth.admin.updateUserById(acc.uid, {
      password: acc.password,
      email_confirm: true,
    })
    console.log(error ? `❌ auth: ${acc.email} — ${error.message}` : `✅ auth: ${acc.email}`)
  }

  // 2. Upsert users table rows
  for (const acc of ACCOUNTS) {
    const { error } = await db.from('users').upsert(
      { id: acc.uid, email: acc.email, full_name: acc.full_name, role: acc.role },
      { onConflict: 'id' }
    )
    console.log(error ? `❌ users: ${acc.email} — ${error.message}` : `✅ users row: ${acc.email}`)
  }

  // 3. Get or create agencies
  const { data: existingAgencies } = await db.from('agencies').select('id, name')
  let premierAgencyId = existingAgencies?.find(a => a.name.toLowerCase().includes('premier'))?.id
  let edupathAgencyId = existingAgencies?.find(a => a.name.toLowerCase().includes('edupath'))?.id

  if (!premierAgencyId) {
    const { data, error } = await db.from('agencies')
      .insert({ name: 'Premier Education', primary_color: '#1D9E75' })
      .select('id').single()
    premierAgencyId = data?.id
    console.log(error ? `❌ agency Premier — ${error.message}` : `✅ agency created: Premier Education (${premierAgencyId})`)
  } else {
    console.log(`✅ agency exists: Premier Education (${premierAgencyId})`)
  }

  if (!edupathAgencyId) {
    const { data, error } = await db.from('agencies')
      .insert({ name: 'EduPath Global', primary_color: '#2563EB' })
      .select('id').single()
    edupathAgencyId = data?.id
    console.log(error ? `❌ agency EduPath — ${error.message}` : `✅ agency created: EduPath Global (${edupathAgencyId})`)
  } else {
    console.log(`✅ agency exists: EduPath Global (${edupathAgencyId})`)
  }

  // 4. Upsert agency_members
  const memberships = [
    { user_id: '1e2ded68-bdfd-4a19-8138-8bd8296abf56', agency_id: premierAgencyId, role: 'admin', is_active: true },
    { user_id: '0443d2ac-0735-4ae5-9bdc-c5143cd12068', agency_id: premierAgencyId, role: 'staff', is_active: true },
    { user_id: '8e59455e-6034-4981-83bb-b52fd76ead97', agency_id: edupathAgencyId, role: 'admin', is_active: true },
  ]

  for (const m of memberships) {
    if (!m.agency_id) {
      console.log(`⚠️  Skipping agency_member ${m.user_id} — no agency id`)
      continue
    }
    const { error } = await db.from('agency_members').upsert(m, { onConflict: 'user_id,agency_id' })
    const acc = ACCOUNTS.find(a => a.uid === m.user_id)
    console.log(error ? `❌ agency_members: ${acc?.email} — ${error.message}` : `✅ agency_members: ${acc?.email} (${m.role})`)
  }

  console.log('\n✅ Done! You can now log in at http://localhost:3000/login')
  console.log('\nAccounts:')
  console.log('  admin@premier.com    / ApplyPilot2024!  → /dashboard')
  console.log('  staff@premier.com    / ApplyPilot2024!  → /dashboard')
  console.log('  admin@edupath.com    / ApplyPilot2024!  → /dashboard')
  console.log('  owner@applypilot.com / ApplyPilot2024!  → /admin')
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
