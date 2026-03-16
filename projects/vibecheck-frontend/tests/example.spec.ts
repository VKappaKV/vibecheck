import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { expect, test } from '@playwright/test'

const localnet = algorandFixture()

test.beforeEach(async ({ page }) => {
  await localnet.newScope()
  await page.goto('http://localhost:5173/')
})

test('has title', async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('Vibecheck Trust Graph')
})

test('landing has demo CTA', async ({ page }) => {
  await expect(page.getByTestId('open-demo')).toHaveText('Open Demo')
})

test('authentication and trust score workspace', async ({ page }) => {
  await page.goto('http://localhost:5173/demo')
  page.on('dialog', async (dialog) => {
    dialog.message() === 'KMD password' ? await dialog.accept() : await dialog.dismiss()
  })

  // 1. Must be able to connect to a KMD wallet provider
  await page.getByTestId('connect-wallet').click()
  await page.getByTestId('kmd-connect').click()
  await page.getByTestId('close-wallet-modal').click()

  // 2. Trust score workspace should already be visible without extra click
  await expect(page.getByText('Trust score demo for APPs and ASAs')).toBeVisible()
})
