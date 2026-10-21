import { expect, signIn, test } from './fixtures';

test.describe('spending dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Spending insights' })).toBeVisible();
  });

  test('loads every card with the customer data', async ({ page }) => {
    for (const title of [
      'Profile',
      'Spending summary',
      'Monthly spending',
      'Spending by category',
      'Spending goals',
      'Recent transactions',
    ]) {
      await expect(page.locator('mat-card-title', { hasText: title })).toBeVisible();
    }

    await expect(
      page.locator('mat-card', { hasText: 'Profile' }).locator('.customer-name'),
    ).toHaveText('John Doe');
    await expect(page.locator('.hero-number')).toHaveText('R4,250.75');
    await expect(page.locator('.category-row')).toHaveCount(6);
    await expect(page.locator('.goal')).toHaveCount(2);
    await expect(page.getByText('Pick n Pay')).toBeVisible();
    await expect(page.getByText("Couldn't load this card.")).toHaveCount(0);
  });

  test('changes the spending period', async ({ page }) => {
    const summary = page.locator('mat-card', { hasText: 'Spending summary' });
    await expect(summary.locator('mat-card-subtitle')).toHaveText('Last 30 days');

    await page.getByRole('radio', { name: 'Last 7 days' }).click();

    await expect(summary.locator('mat-card-subtitle')).toHaveText('Last 7 days');
    await expect(page.getByRole('radio', { name: 'Last 7 days' })).toBeChecked();
    await expect(summary.locator('.hero-number')).toBeVisible();
  });

  test('spells out the month under focus in the trend chart', async ({ page }) => {
    const readout = page.locator('.trend-readout');
    await expect(readout).toContainText('June 2024');

    await page.getByRole('listitem', { name: /^January 2024/ }).focus();

    await expect(readout).toContainText('January 2024');
    await expect(readout).toContainText('R3,890.25');
  });

  test('refreshes a card from its menu', async ({ page }) => {
    const profile = page.locator('mat-card', { hasText: 'Profile' });

    await profile.getByRole('button', { name: 'Card options' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(profile.locator('.customer-name')).toHaveText('John Doe');
  });

  test('renders icons from the bundled icon font', async ({ page }) => {
    const icon = page.locator('mat-card', { hasText: 'Profile' }).locator('mat-icon').first();
    // A ligature renders as a single 24px glyph; a missing font would show the word "more_vert".
    await expect(icon).toHaveClass(/material-symbols-outlined/);
    expect((await icon.boundingBox())?.width).toBeLessThanOrEqual(24);
  });

  test('shows every period option within the screen width', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 0;
    for (const option of await page.getByRole('radio').all()) {
      const box = await option.boundingBox();
      expect(box, `"${await option.textContent()}" is laid out`).not.toBeNull();
      expect(box!.x + box!.width, `"${await option.textContent()}" right edge`).toBeLessThanOrEqual(
        viewportWidth,
      );
    }

    await page.getByRole('radio', { name: 'Last year' }).click();
    await expect(
      page.locator('mat-card', { hasText: 'Spending summary' }).locator('mat-card-subtitle'),
    ).toHaveText('Last year');
  });
});
