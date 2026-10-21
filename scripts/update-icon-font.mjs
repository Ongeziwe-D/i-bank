// Downloads a Material Symbols Outlined font containing only the icons listed below, so the app
// ships a few kilobytes instead of the full 4 MB font and makes no requests to Google at runtime.
//
// When you use a new icon, add its name here and run: npm run icons
// Names: https://fonts.google.com/icons
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ICONS = [
  'account_balance',
  'bolt',
  'category',
  'check_circle',
  'dashboard',
  'directions_car',
  'error_outline',
  'info',
  'logout',
  'menu',
  'more_vert',
  'movie',
  'refresh',
  'restaurant',
  'shopping_bag',
  'shopping_cart',
  'trending_down',
  'trending_up',
  'visibility',
  'visibility_off',
  'warning',
];

const OUTPUT = new URL('../src/assets/fonts/material-symbols-outlined.woff2', import.meta.url);

// Google Fonts requires the names in alphabetical order.
const names = [...new Set(ICONS)].sort().join(',');
const cssUrl =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0' +
  `&icon_names=${names}&display=block`;

// A modern browser user agent makes Google serve woff2.
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const css = await fetchOk(cssUrl, { headers: { 'User-Agent': userAgent } }).then((r) => r.text());
const fontUrl = /src:\s*url\(([^)]+)\)/.exec(css)?.[1];
if (!fontUrl) {
  throw new Error(`No font URL found in the Google Fonts response:\n${css}`);
}

const font = Buffer.from(await fetchOk(fontUrl).then((r) => r.arrayBuffer()));
await writeFile(OUTPUT, font);
console.log(`Wrote ${ICONS.length} icons (${font.length} bytes) to ${fileURLToPath(OUTPUT)}`);

async function fetchOk(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }
  return response;
}
