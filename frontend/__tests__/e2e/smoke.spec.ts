/**
 * Smoke tests — verify the app is not fundamentally broken.
 * These should always pass after any deploy.
 * Run with: npx playwright test smoke
 */

import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads with 200', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    // Should show email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Should show a submit button
    await expect(
      page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
    ).toBeVisible()
  })

  test('dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    // Should be redirected to the login page
    await expect(page).toHaveURL(/login/)
  })

  test('accept-invite page loads', async ({ page }) => {
    const response = await page.goto('/auth/accept-invite')
    expect(response?.status()).toBeLessThan(500)
  })

  test('404 page shows for unknown route', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-xyz')
    // Next.js returns 404 for unknown routes
    expect(response?.status()).toBe(404)
  })
})
