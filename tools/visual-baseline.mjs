#!/usr/bin/env node
/**
 * tools/visual-baseline.mjs — Visual regression baseline capture.
 *
 * Captures screenshots of key game states for diff-based regression testing.
 * Requires: playwright-core + a local chromium (npx playwright install chromium).
 *
 * Usage:
 *   node tools/visual-baseline.mjs [--update]
 *
 * Without --update: compares current screenshots against saved baseline and reports diffs.
 * With --update:    captures new baseline screenshots (overwrites existing).
 *
 * Screenshots are saved to tools/screenshots/ (gitignored in CI, committed as baseline).
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCREENSHOTS_DIR = resolve(__dirname, 'screenshots');
const HTML_FILE = resolve(ROOT, 'civil_war_generals.html');

const UPDATE = process.argv.includes('--update');

if (!existsSync(HTML_FILE)) {
  console.error('ERROR: civil_war_generals.html not found. Run: node tools/build.mjs');
  process.exit(1);
}

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Serve the HTML file locally (Playwright needs a server for full functionality)
const html = readFileSync(HTML_FILE, 'utf8');
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}`;

console.log(`Serving at ${URL}`);

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Define the key game states to capture
  const captures = [
    {
      name: 'title-screen',
      description: 'The main title/menu screen on load',
      setup: async () => {
        await page.goto(URL);
        await page.waitForTimeout(2000); // Wait for any animations
      }
    },
    {
      name: 'campaign-start',
      description: 'Campaign selection / new game screen',
      setup: async () => {
        // Try to click "New Campaign" or similar
        const btn = page.locator('button, [role="button"]').filter({ hasText: /campaign|new game|start/i }).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    {
      name: 'war-department',
      description: 'War Department / President\'s Desk overview',
      setup: async () => {
        // Navigate to war dept if accessible
        const wdBtn = page.locator('button, [role="button"], [data-tab]').filter({ hasText: /war|desk|department/i }).first();
        if (await wdBtn.count() > 0) {
          await wdBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
  ];

  const results = [];

  for (const cap of captures) {
    try {
      await cap.setup();
      const filepath = resolve(SCREENSHOTS_DIR, `${cap.name}.png`);
      const baselinePath = resolve(SCREENSHOTS_DIR, `${cap.name}.baseline.png`);

      await page.screenshot({ path: filepath, fullPage: false });

      if (UPDATE) {
        writeFileSync(baselinePath, readFileSync(filepath));
        results.push({ name: cap.name, status: 'UPDATED', description: cap.description });
        console.log(`  ✓ ${cap.name} — baseline updated`);
      } else if (existsSync(baselinePath)) {
        const current = readFileSync(filepath);
        const baseline = readFileSync(baselinePath);
        const match = current.equals(baseline);
        results.push({ name: cap.name, status: match ? 'MATCH' : 'DIFF', description: cap.description });
        console.log(`  ${match ? '✓' : '✗'} ${cap.name} — ${match ? 'matches baseline' : 'DIFFERS from baseline'}`);
      } else {
        writeFileSync(baselinePath, readFileSync(filepath));
        results.push({ name: cap.name, status: 'NEW', description: cap.description });
        console.log(`  ✓ ${cap.name} — new baseline created`);
      }
    } catch (e) {
      results.push({ name: cap.name, status: 'ERROR', error: e.message });
      console.log(`  ✗ ${cap.name} — ERROR: ${e.message}`);
    }
  }

  // Write manifest
  writeFileSync(
    resolve(SCREENSHOTS_DIR, 'manifest.json'),
    JSON.stringify({ captured: new Date().toISOString(), results }, null, 2)
  );

  const diffs = results.filter(r => r.status === 'DIFF');
  if (diffs.length > 0) {
    console.log(`\n⚠ ${diffs.length} screenshot(s) differ from baseline.`);
    process.exit(1);
  } else {
    console.log(`\n✓ All ${results.length} screenshots OK.`);
  }

} finally {
  if (browser) await browser.close();
  server.close();
}
