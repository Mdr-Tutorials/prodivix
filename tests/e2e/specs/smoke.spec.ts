import { expect, test } from '@playwright/test';

test.describe('application smoke', () => {
  test('opens the editor shell @smoke', async ({ page }) => {
    await page.goto('/editor');

    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(
      page.getByText(/Loading editor|Prodivix|项目|Project/i).first()
    ).toBeVisible();
  });
});
