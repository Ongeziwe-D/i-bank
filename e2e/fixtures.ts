import { Page, expect, test as base } from '@playwright/test';

export const DEMO_ACCOUNT = { email: 'john.doe@email.com', password: 'Password123!' };

/**
 * Every test fails if the page logs an error or throws, which also catches resources blocked by
 * the Content-Security-Policy when running against the Docker image.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'errors logged by the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function signIn(page: Page, account = DEMO_ACCOUNT): Promise<void> {
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
