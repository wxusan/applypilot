import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public endpoint — no auth required.
// Returns plan_configs for display on the public pricing page.
// Cache for 60s so a price change is live within a minute.
export const revalidate = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const DEFAULTS: Record<string, { price_monthly: number; price_annual: number; is_most_popular: boolean }> = {
  starter:    { price_monthly: 79,  price_annual: 790,  is_most_popular: false },
  pro:        { price_monthly: 199, price_annual: 1990, is_most_popular: true  },
  enterprise: { price_monthly: 499, price_annual: 4990, is_most_popular: false },
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('plan_configs')
      .select('plan, price_monthly, price_annual, is_most_popular')
      .in('plan', ['starter', 'pro', 'enterprise'])

    if (error) throw error

    // Merge DB values over defaults (handles missing rows or columns gracefully)
    const configs: Record<string, { price_monthly: number; price_annual: number; is_most_popular: boolean }> = {
      ...DEFAULTS,
    }
    for (const row of data ?? []) {
      configs[row.plan] = {
        price_monthly:   row.price_monthly   ?? DEFAULTS[row.plan]?.price_monthly,
        price_annual:    row.price_annual    ?? DEFAULTS[row.plan]?.price_annual,
        is_most_popular: row.is_most_popular ?? DEFAULTS[row.plan]?.is_most_popular,
      }
    }

    return NextResponse.json({ plans: configs }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (err) {
    // Fall back to hardcoded defaults so the page never breaks
    return NextResponse.json({ plans: DEFAULTS }, {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    })
  }
}
