import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createThemeStyleText, defaultFallbackTheme } from '../dist/index.js';

const outputPath = 'dist/css/default.css';
const cssText = `${createThemeStyleText(defaultFallbackTheme, {
  includeRootSelector: true,
})}
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, cssText, 'utf8');
