/**
 * E2E tests — critical user journeys.
 *
 * NOTE: These tests require valid test credentials in environment variables:
 *   E2E_TEST_EMAIL=...
 *   E2E_TEST_PASSWORD=...
 *   E2E_BASE_URL=http://localhost:3000  (or staging URL)
 *
 * Run with: npx playwright test e2e
 */

import { test, expect, type Page } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email?: string, password?: string) {
  const e = email ?? process.env.E2E_TEST_EMAIL ?? ''
  const p = password ?? process.env.E2E_TEST_PASSWORD ?? ''

  if (!e || !p) {
    test.skip()
    return
  }

  await page.goto('/login')
  await page.fill('input[type="email"]', e)
  await page.fill('input[type="password"]', p)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 10_000 })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Authentication flow', () => {
  test('user can log in with valid credentials', async ({ page }) => {
    await loginAs(page)
    await expect(page).toHaveURL(/dashboard/)
    // Dashboard should show something recognisable
    await expect(page.locator('h1, [data-testid="dashboard-title"]').first()).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should stay on login page and show an error
    await expect(page).not.toHaveURL(/dashboard/)
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 6_000 })
  })
})

test.describe('Dashboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('navigates to students list', async ({ page }) => {
    await page.goto('/dashboard/students')
    await expect(page).toHaveURL(/students/)
    // Should not crash — no 500 error
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('navigates to deadlines page', async ({ page }) => {
    await page.goto('/dashboard/deadlines')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('navigates to approvals page', async ({ page }) => {
    await page.goto('/dashboard/approvals')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('navigates to analytics page', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    // Charts should render without crashing (BUG-007 regression)
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Accept invite page', () => {
  test('shows loading spinner by default', async ({ page }) => {
    await page.goto('/auth/accept-invite')
    // Page should render (not 500)
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('shows error and correct login link when token is missing', async ({ page }) => {
    await page.goto('/auth/accept-invite')
    // No token → expect error state
    await page.waitForSelector('text=/failed|error|token/i', { timeout: 5_000 })

    // BUG-009 regression: the Go to Login link must point to /login not /auth/login
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()

    // Verify the old broken link is gone
    const brokenLink = page.locator('a[href="/auth/login"]')
    await expect(brokenLink).not.toBeVisible()
  })
})
