import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/')
})

test('has title', async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('Vibecheck Trust Graph')
})

test('landing has demo CTA', async ({ page }) => {
  await expect(page.getByTestId('open-demo')).toHaveText('Open Demo')
})

test('wallet modal lists testnet wallets and trust score workspace is visible', async ({ page }) => {
  await page.goto('http://localhost:5173/demo')

  // 1. Wallet modal should expose the configured wallet providers
  await page.getByTestId('connect-wallet').click()
  await expect(page.getByTestId('pera-connect')).toBeVisible()
  await expect(page.getByTestId('lute-connect')).toBeVisible()
  await page.getByTestId('close-wallet-modal').click()

  // 2. Trust score workspace should already be visible without extra click
  await expect(page.getByText('Trust score demo for APPs and ASAs')).toBeVisible()
})
