import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const themeCssPath = '../themes/dist/css/default.css';
const uiCssPath = 'dist/style.css';

if (!existsSync(themeCssPath)) {
  throw new Error(
    `Missing ${themeCssPath}. Build @prodivix/themes before @prodivix/ui.`
  );
}

if (!existsSync(uiCssPath)) {
  throw new Error(`Missing ${uiCssPath}. Build @prodivix/ui CSS first.`);
}

const themeCss = readFileSync(themeCssPath, 'utf8').trim();
const uiCss = readFileSync(uiCssPath, 'utf8').trimStart();

writeFileSync(uiCssPath, `${themeCss}\n\n${uiCss}`, 'utf8');
