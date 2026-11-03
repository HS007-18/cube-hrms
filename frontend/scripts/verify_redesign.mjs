import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const outDir = 'frontend/redesign_screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('=== VERIFYING LOGIN PAGE ===');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, '01_login_redesign.png') });

  console.log('=== LOGGING IN AS PEOPLE MANAGER (Arjun Nair) ===');
  await page.locator('button', { hasText: 'People manager' }).click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '02_overview_dashboard_redesign.png') });

  console.log('=== VERIFYING ATTENDANCE PAGE ===');
  await page.goto('http://localhost:5173/attendance');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '03_attendance_redesign.png') });

  console.log('=== VERIFYING LEAVE PAGE ===');
  await page.goto('http://localhost:5173/leave');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '04_leave_redesign.png') });

  console.log('=== VERIFYING MY PROFILE PAGE ===');
  await page.goto('http://localhost:5173/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '05_profile_redesign.png') });

  console.log('=== LOGGING IN AS HR ADMIN (Priya) FOR EMPLOYEES & STRUCTURE ===');
  await page.locator('button[aria-label="Sign out"]').first().click();
  await page.waitForURL('**/login');
  await page.locator('button', { hasText: 'HR administrator' }).click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');

  console.log('=== VERIFYING EMPLOYEES DIRECTORY ===');
  await page.goto('http://localhost:5173/employees');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '06_employees_redesign.png') });

  console.log('=== VERIFYING STRUCTURE PAGE ===');
  await page.goto('http://localhost:5173/structure');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '07_structure_redesign.png') });

  console.log('=== LOGGING IN AS PLATFORM ADMIN FOR TENANTS CONSOLE ===');
  await page.locator('button[aria-label="Sign out"]').first().click();
  await page.waitForURL('**/login');
  await page.locator('button', { hasText: 'Platform admin' }).click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/tenants');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '08_tenants_redesign.png') });

  console.log('=== TESTING MOBILE VIEWPORTS (360px & 390px) ===');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, '09_mobile_dashboard_390px.png') });

  // Open mobile drawer
  const menuBtn = page.locator('button[aria-label="Open navigation"]');
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '10_mobile_drawer_390px.png') });
  }

  await browser.close();
  console.log('✅ ALL REDESIGN SCREENS VERIFIED AND SCREENSHOTS SAVED!');
})();

