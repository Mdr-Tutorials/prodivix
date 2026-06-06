import { expect, test } from '@playwright/test';

test.describe('application smoke', () => {
  test('loads the home page @smoke', async ({ page }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation');

    await expect(page).toHaveTitle(/prodivix/i);
    await expect(
      navigation.getByRole('link', { name: /Prodivix/i })
    ).toBeVisible();
    await expect(navigation.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/Mdr-Tutorials/prodivix'
    );
  });

  test('opens the editor shell @smoke', async ({ page }) => {
    await page.goto('/editor');

    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(
      page.getByText(/Loading editor|Prodivix|项目|Project/i).first()
    ).toBeVisible();
  });
});
