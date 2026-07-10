import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const uiCssPath = 'dist/style.css';
const outputDirectory = 'dist/assets/fonts';
const inlineFontPattern = /data:font\/(woff2|woff);base64,([a-zA-Z0-9+/=]+)/g;

let css = readFileSync(uiCssPath, 'utf8');
let emittedFontCount = 0;
const emittedFontUrls = new Map();

mkdirSync(outputDirectory, { recursive: true });

css = css.replace(inlineFontPattern, (_, extension, encodedFont) => {
  const existingUrl = emittedFontUrls.get(encodedFont);

  if (existingUrl) {
    return existingUrl;
  }

  const fontData = Buffer.from(encodedFont, 'base64');
  const contentHash = createHash('sha256')
    .update(fontData)
    .digest('hex')
    .slice(0, 16);
  const fileName = `font-${contentHash}.${extension}`;
  const outputPath = join(outputDirectory, fileName);
  const outputUrl = `./assets/fonts/${fileName}`;

  writeFileSync(outputPath, fontData);
  emittedFontUrls.set(encodedFont, outputUrl);
  emittedFontCount += 1;

  return outputUrl;
});

if (emittedFontCount === 0) {
  throw new Error('No inlined font assets were found in UI CSS.');
}

if (css.includes('data:font/')) {
  throw new Error('Unexpected inlined font asset remains in UI CSS.');
}

writeFileSync(uiCssPath, css, 'utf8');
