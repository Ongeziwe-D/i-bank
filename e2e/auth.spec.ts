import { DEMO_ACCOUNT, expect, signIn, test } from './fixtures';

test.describe('signing in and out', () => {
  test('sends signed-out visitors to the login page and back after signing in', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fdashboard$/);
    await expect(page.getByRole('heading', { name: 'Sign in to i-bank' })).toBeVisible();

    await signIn(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Spending insights' })).toBeVisible();
  });

  test('explains what is missing when the form is incomplete', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter your email address')).toBeVisible();
    await expect(page.getByText('Enter your password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects a wrong password and clears it', async ({ page }) => {
    await page.goto('/login');

    await signIn(page, { ...DEMO_ACCOUNT, password: 'not-the-password' });

    await expect(page.getByRole('alert')).toHaveText(/The email or password is incorrect/);
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('keeps the customer signed in across a reload', async ({ page }) => {
    await page.goto('/login');
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Spending insights' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Customer ID: 12345')).toBeVisible();
  });

  test('signs out and protects the dashboard afterwards', async ({ page }) => {
    await page.goto('/login');
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Spending insights' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fdashboard$/);
  });
});
