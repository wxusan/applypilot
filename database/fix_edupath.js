/**
 * Fix EduPath admin agency_members record
 * Run: node database/fix_edupath.js
 */
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js')

const db = createClient(
  'https://hhvgwniixxmawdsryrep.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhodmd3bmlpeHhtYXdkc3J5cmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTI5NSwiZXhwIjoyMDg5NjMxMjk1fQ.Wa9qQb6XMC2rlAMWMfmmzFIzkA3m14Qgyw2c0Y2UNoY',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  console.log('Checking DB state...\n')

  // Show all agency_members
  const { data: members, error: mErr } = await db.from('agency_members').select('*')
  console.log('Current agency_members:', JSON.stringify(members, null, 2))
  if (mErr) console.log('Error:', mErr)

  // Show all users
  const { data: users } = await db.from('users').select('id, email, role')
  console.log('\nUsers:', JSON.stringify(users, null, 2))

  // Show all agencies
  const { data: agencies } = await db.from('agencies').select('id, name')
  console.log('\nAgencies:', JSON.stringify(agencies, null, 2))

  // Find EduPath agency
  const edupathAgency = agencies?.find(a => a.name.toLowerCase().includes('edupath'))
  if (!edupathAgency) {
    console.log('\n❌ EduPath agency not found! Run node database/seed.js first')
    return
  }

  const edupathAdminUid = '8e59455e-6034-4981-83bb-b52fd76ead97'
  const existing = members?.find(m => m.user_id === edupathAdminUid)

  if (existing) {
    console.log('\n✅ EduPath admin agency_members record EXISTS:', existing)
    // Update to make sure is_active is true
    const { error } = await db.from('agency_members')
      .update({ is_active: true, role: 'admin' })
      .eq('user_id', edupathAdminUid)
    console.log(error ? `❌ Update failed: ${error.message}` : '✅ Updated is_active=true')
  } else {
    console.log('\n❌ EduPath admin has NO agency_members record. Inserting...')
    const { data, error } = await db.from('agency_members').insert({
      user_id: edupathAdminUid,
      agency_id: edupathAgency.id,
      role: 'admin',
      is_active: true,
    }).select()
    console.log(error ? `❌ Insert failed: ${error.message}\n${JSON.stringify(error)}` : `✅ Inserted: ${JSON.stringify(data)}`)
  }

  // Final check
  const { data: finalMembers } = await db.from('agency_members').select('*')
  console.log('\nFinal agency_members:', JSON.stringify(finalMembers, null, 2))
}

run().catch(console.error)
