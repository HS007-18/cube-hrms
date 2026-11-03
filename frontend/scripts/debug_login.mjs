import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('response', resp => console.log('RESP:', resp.status(), resp.url()));
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'priya@aurora.example');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('Final URL:', page.url());
  const errorText = await page.locator('[role="alert"]').innerText().catch(() => 'no alert');
  console.log('Error alert text:', errorText);
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

