-- Migration 007: Fix addon_packages prices + ensure plan_configs is correct
--
-- Problem: The original addon prices were too cheap — Starter ($79) + Scale Pack ($99)
-- = $178 total gave MORE staff/students than Pro ($199). This made Pro a bad deal.
--
-- Fix: Raise seat add-on prices so the token limit remains the real upgrade driver.
-- Even with max seat add-ons, Starter is capped at 1.5M tokens.
-- Pro ($199) comes with 5M tokens built-in — that's the real trap.
--
-- Corrected add-on prices:
--   seats_growth  → $49/mo  (was $29)
--   seats_team    → $109/mo (was $59)
--   seats_scale   → $179/mo (was $99)
--
-- Also corrects plan_configs limits/prices to match the agreed-upon tiers.

-- ── 1. Ensure plan_configs has pricing columns ─────────────────────────────
alter table plan_configs
  add column if not exists price_monthly   int not null default 0,
  add column if not exists price_annual    int not null default 0,
  add column if not exists is_most_popular boolean not null default false;

-- ── 2. Upsert correct plan configs ────────────────────────────────────────
insert into plan_configs
  (plan, max_staff, max_students, ai_token_limit, price_monthly, price_annual, is_most_popular)
values
  ('starter',    2,   15,   1500000,  79,  790,  false),
  ('pro',        4,   35,   5000000,  199, 1990, true),
  ('enterprise', 0,   0,    0,        499, 4990, false)   -- 0 = unlimited
on conflict (plan) do update set
  max_staff        = excluded.max_staff,
  max_students     = excluded.max_students,
  ai_token_limit   = excluded.ai_token_limit,
  price_monthly    = excluded.price_monthly,
  price_annual     = excluded.price_annual,
  is_most_popular  = excluded.is_most_popular,
  updated_at       = now();

-- ── 3. Create addon_packages if it doesn't exist ──────────────────────────
create table if not exists addon_packages (
  id             text primary key,
  type           text not null,          -- 'seats' | 'tokens'
  label          text not null,
  extra_staff    int  not null default 0,
  extra_students int  not null default 0,
  extra_tokens   bigint not null default 0,
  price_monthly  int  not null default 0,
  sort_order     int  not null default 0
);

-- ── 4. Upsert corrected seat add-on prices ────────────────────────────────
-- Prices are now high enough that Pro ($199, 5M tokens) beats any Starter combo.
-- Starter + seats_scale = $79 + $179 = $258, and you're STILL stuck on 1.5M tokens.
-- Pro = $199 and comes with 5M tokens. The math forces upgrade.

insert into addon_packages
  (id, type, label, extra_staff, extra_students, extra_tokens, price_monthly, sort_order)
values
  -- Seat add-ons (tokens stay at plan limit — this is intentional)
  ('seats_growth', 'seats', '+2 Staff / +10 Students',  2, 10,   0,  49,  10),
  ('seats_team',   'seats', '+4 Staff / +20 Students',  4, 20,   0, 129,  20),
  ('seats_scale',  'seats', '+6 Staff / +35 Students',  6, 35,   0, 179,  30),

  -- Token add-ons (priced to make upgrading plans more attractive)
  ('tokens_boost', 'tokens', '+500k Tokens / mo',        0,  0,  500000,  29,  40),
  ('tokens_pro',   'tokens', '+2M Tokens / mo',           0,  0, 2000000,  89,  50),
  ('tokens_max',   'tokens', '+10M Tokens / mo',          0,  0, 10000000, 299,  60)
on conflict (id) do update set
  label          = excluded.label,
  extra_staff    = excluded.extra_staff,
  extra_students = excluded.extra_students,
  extra_tokens   = excluded.extra_tokens,
  price_monthly  = excluded.price_monthly,
  sort_order     = excluded.sort_order;
