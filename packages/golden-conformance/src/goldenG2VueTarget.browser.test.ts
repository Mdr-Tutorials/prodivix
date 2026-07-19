import { expect as expectPage } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { createGoldenG2VueProjectedBundle } from './goldenG2VueTargetFixture';
import { verifyGoldenBrowserProject } from './generatedProjectHarness';

describe.runIf(process.env.PRODIVIX_VERIFY_G2_VUE_TARGET === '1')(
  'Golden G2 Vue/Vite independent package Gate',
  () => {
    it('installs, typechecks, tests, builds and runs the same CRUD journey in a browser', async () => {
      const bundle = createGoldenG2VueProjectedBundle();
      const evidence = await verifyGoldenBrowserProject(bundle, {
        routePath: '/',
        browserChannel: process.env.E2E_BROWSER_CHANNEL,
        verifyPage: async (page) => {
          await expectPage(
            page.getByRole('heading', { name: 'Prodivix Vue Data Target' })
          ).toBeVisible();
          await expectPage(page.getByTestId('status')).toHaveText('success');
          await expectPage(page.getByTestId('output')).toContainText('Alpha');

          await page
            .getByTestId('operation')
            .selectOption('data-products:create-product');
          await page
            .getByTestId('input')
            .fill('{"product":{"id":"p2","name":"Beta"}}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('status')).toHaveText('success');

          await page
            .getByTestId('operation')
            .selectOption('data-products:get-product');
          await page.getByTestId('input').fill('{"id":"p2"}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('output')).toContainText('Beta');

          await page
            .getByTestId('operation')
            .selectOption('data-products:update-product');
          await page
            .getByTestId('input')
            .fill('{"id":"p2","patch":{"name":"Beta Updated"}}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('status')).toHaveText('success');

          await page
            .getByTestId('operation')
            .selectOption('data-products:get-product');
          await page.getByTestId('input').fill('{"id":"p2"}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('output')).toContainText(
            'Beta Updated'
          );

          await page
            .getByTestId('operation')
            .selectOption('data-products:delete-product');
          await page.getByTestId('input').fill('{"id":"p2"}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('status')).toHaveText('success');

          await page
            .getByTestId('operation')
            .selectOption('data-products:list-products');
          await page.getByTestId('input').fill('{}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('output')).toContainText('Alpha');
          await expectPage(page.getByTestId('output')).not.toContainText(
            'Beta Updated'
          );

          await page
            .getByTestId('operation')
            .selectOption('data-products:page-products');
          await page.getByTestId('input').fill('{"offset":20,"limit":20}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('status')).toHaveText('running');
          await expectPage(page.getByTestId('status')).toHaveText('empty');
          await expectPage(page.getByTestId('output')).toContainText(
            '"offset": 20'
          );

          await page
            .getByTestId('operation')
            .selectOption('data-products:error-products');
          await page.getByTestId('input').fill('{}');
          await page.getByTestId('run').click();
          await expectPage(page.getByTestId('status')).toHaveText('error');
          await expectPage(page.getByTestId('output')).toContainText(
            'GOLDEN_DATA_UNAVAILABLE'
          );
          await expectPage(page.getByTestId('output')).toContainText(
            '"attempt": 2'
          );
        },
      });
      expect(evidence.completedCommands).toEqual([
        'install',
        'typecheck',
        'test',
        'build',
        'browser-smoke',
      ]);
      expect(evidence.bundleFileCount).toBe(bundle.files.length);
    }, 600_000);
  }
);
