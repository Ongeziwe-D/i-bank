import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';
import { expect, signIn, test } from './fixtures';

/** Checks the page against WCAG 2.1 A and AA rules. */
async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary).toEqual([]);
}

test.describe('accessibility', () => {
  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in to i-bank' })).toBeVisible();

    await expectNoAccessibilityViolations(page);
  });

  test('dashboard', async ({ page }) => {
    await page.goto('/login');
    await signIn(page);
    await expect(page.locator('.hero-number')).toBeVisible();
    await expect(page.locator('mat-spinner')).toHaveCount(0);

    await expectNoAccessibilityViolations(page);
  });
});
