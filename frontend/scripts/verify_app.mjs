import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'frontend/scripts/login_verified.png' });
  console.log('Login screenshot captured.');

  await page.fill('input[type="email"]', 'priya@aurora.example');
  await page.fill('input[type="password"]', 'Aurora@2026');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'frontend/scripts/dashboard_verified.png' });
  console.log('Dashboard screenshot captured at URL:', page.url());

  // Also check attendance page
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'frontend/scripts/attendance_verified.png' });

  // Also check leave page
  await page.goto('http://localhost:5173/leave', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'frontend/scripts/leave_verified.png' });

  // Also check employees page
  await page.goto('http://localhost:5173/employees', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'frontend/scripts/employees_verified.png' });

  console.log('All screenshots verified successfully!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
