import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '360px mobile', width: 360, height: 740 },
  { name: '390px mobile', width: 390, height: 844 },
  { name: '768px tablet', width: 768, height: 1024 },
  { name: '1024px laptop', width: 1024, height: 768 },
  { name: '1366px desktop', width: 1366, height: 768 },
  { name: '1920px large desktop', width: 1920, height: 1080 }
];

const BASE_URL = 'http://localhost:5173';
const screenshotsDir = path.resolve('frontend', 'audit_screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runRegressionAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  const regressionReport = {
    pagesInspected: 0,
    responsiveBreakpointsTested: VIEWPORTS.length,
    contrastIssues: 0,
    overflowIssues: 0,
    selectFixVerified: false,
    primaryButtonStyled: false,
    activeTabContrastVerified: false,
    bannerContrastVerified: false,
    mobileNavigationVerified: false,
    platformAdminVerified: false,
  };

  console.log('=== STEP 1: AUDITING LOGIN PAGE ===');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  regressionReport.pagesInspected++;

  // 1. Check Primary Button Computed Styles on Login
  const buttonStyle = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (!btn) return null;
    const computed = window.getComputedStyle(btn);
    return {
      bg: computed.backgroundColor,
      color: computed.color,
      cursor: computed.cursor,
      text: btn.textContent.trim()
    };
  });
  console.log('Login Submit Button Computed Styles:', buttonStyle);
  if (buttonStyle.bg.includes('37, 99, 235') && buttonStyle.color.includes('255, 255, 255')) {
    regressionReport.primaryButtonStyled = true;
    console.log('✅ Button Color Fix VERIFIED: Button is blue and text is white!');
  } else {
    console.error('❌ Button Color Fix Failed:', buttonStyle);
  }

  // Check responsive overflow on Login across all viewports
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(100);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (hasOverflow) regressionReport.overflowIssues++;
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'login_verified.png') });

  // === STEP 2: LOGGING IN AS HR ADMIN ===
  console.log('\n=== STEP 2: LOGGING IN AS HR ADMIN ===');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator('button', { hasText: 'HR administrator' }).click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Successfully navigated to /dashboard');

  const hrPages = [
    { route: '/dashboard', name: 'Overview' },
    { route: '/employees', name: 'People' },
    { route: '/structure', name: 'Structure' },
    { route: '/attendance', name: 'Attendance' },
    { route: '/leave', name: 'Leave' },
    { route: '/profile', name: 'Profile' }
  ];

  for (const p of hrPages) {
    console.log(`\n--- Inspecting Page: ${p.route} (${p.name}) ---`);
    await page.goto(`${BASE_URL}${p.route}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    regressionReport.pagesInspected++;

    // Test responsive viewports & mobile drawer
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(150);

      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (hasOverflow) {
        console.warn(`Overflow on ${p.route} at ${vp.name}`);
        regressionReport.overflowIssues++;
      }

      if (vp.width < 1024) {
        const menuBtn = page.locator('button[aria-label="Open navigation"]');
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          await page.waitForTimeout(200);
          const closeBtn = page.locator('button[aria-label="Close navigation"]').last();
          const closeVisible = await closeBtn.isVisible();
          if (closeVisible) {
            regressionReport.mobileNavigationVerified = true;
          }
          await closeBtn.click();
          await page.waitForTimeout(150);
        }
      }
    }

    // Reset to desktop viewport for detailed checks
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.screenshot({ path: path.join(screenshotsDir, `${p.name.toLowerCase()}_verified.png`) });

    // Check banner contrast
    if (p.route === '/dashboard' || p.route === '/attendance') {
      const bannerContrast = await page.evaluate(() => {
        const darkBanner = document.querySelector('.bg-on-background');
        if (!darkBanner) return null;
        const h1 = darkBanner.querySelector('h1, .font-display');
        if (!h1) return null;
        const computed = window.getComputedStyle(h1);
        return {
          bg: window.getComputedStyle(darkBanner).backgroundColor,
          headingColor: computed.color,
        };
      });
      console.log(`Banner contrast on ${p.route}:`, bannerContrast);
      if (bannerContrast?.headingColor?.includes('255, 255, 255')) {
        regressionReport.bannerContrastVerified = true;
        console.log(`✅ Banner Contrast Fix VERIFIED on ${p.route}: Text is white!`);
      }
    }

    // Check Segmented component active tab contrast on /leave or /attendance
    if (p.route === '/leave') {
      const activeTabStyle = await page.evaluate(() => {
        const activeTab = document.querySelector('button[role="tab"][aria-selected="true"]');
        if (!activeTab) return null;
        const computed = window.getComputedStyle(activeTab);
        return {
          bg: computed.backgroundColor,
          color: computed.color,
          text: activeTab.textContent.trim()
        };
      });
      console.log('Segmented Active Tab Style:', activeTabStyle);
      if (activeTabStyle?.color?.includes('255, 255, 255')) {
        regressionReport.activeTabContrastVerified = true;
        console.log('✅ Segmented Active Tab Contrast Fix VERIFIED: Text is white on dark background!');
      }
    }
  }

  // === STEP 3: VERIFY SELECT COMPONENT SELECTION DISPLAY ===
  console.log('\n=== STEP 3: VERIFYING SELECT COMPONENT BEHAVIOR ===');
  await page.goto(`${BASE_URL}/employees`);
  await page.waitForLoadState('networkidle');
  const deptSelect = page.locator('button[aria-expanded]').first();
  const initialText = await deptSelect.locator('span').first().textContent();
  console.log('Select initially shows:', initialText);

  await deptSelect.click();
  await page.waitForTimeout(200);
  const optionToClick = page.getByRole('option', { name: 'Production', exact: true });
  if (await optionToClick.isVisible()) {
    await optionToClick.click({ force: true });
    await page.waitForTimeout(300);
    const updatedText = await deptSelect.locator('span').first().textContent();
    console.log('Select after clicking "Production" shows:', updatedText);
    if (updatedText === 'Production') {
      regressionReport.selectFixVerified = true;
      console.log('✅ Select Component Fix VERIFIED: Displays the selected option text!');
    } else {
      console.error('❌ Select Component Fix FAILED. Still shows:', updatedText);
    }
  }

  // === STEP 4: VERIFY PLATFORM ADMIN CONSOLE ===
  console.log('\n=== STEP 4: VERIFYING PLATFORM ADMIN (/tenants) ===');
  const signOutBtn = page.locator('button[aria-label="Sign out"]').first();
  await signOutBtn.click();
  await page.waitForURL('**/login', { timeout: 10000 });
  console.log('Signed out cleanly.');

  // Log in as platform admin
  await page.locator('button', { hasText: 'Platform admin' }).click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/tenants', { timeout: 10000 });
  console.log('Navigated to /tenants as Platform Admin');
  regressionReport.pagesInspected++;
  regressionReport.platformAdminVerified = true;

  await page.screenshot({ path: path.join(screenshotsDir, 'tenants_verified.png') });

  // Test Manage Tenant Dialog
  const manageBtn = page.locator('button', { hasText: 'Manage' }).first();
  if (await manageBtn.isVisible()) {
    await manageBtn.click();
    await page.waitForTimeout(300);
    const dialogTitle = await page.locator('#dialog-title').textContent();
    console.log('Tenant Manage Dialog opened successfully:', dialogTitle);
    const closeDialog = page.locator('button[aria-label="Close dialog"]');
    await closeDialog.click();
  }

  // === STEP 5: VERIFY 404 NOT FOUND PAGE ===
  console.log('\n=== STEP 5: VERIFYING NOT FOUND (404) PAGE ===');
  await page.goto(`${BASE_URL}/non-existent-page-url`);
  await page.waitForLoadState('networkidle');
  regressionReport.pagesInspected++;
  const notFoundHeading = await page.locator('h1').textContent();
  console.log('404 Page Heading:', notFoundHeading);
  await page.screenshot({ path: path.join(screenshotsDir, '404_verified.png') });

  // Click back button to ensure navigation works
  await page.locator('button', { hasText: 'Back to your workspace' }).click();
  await page.waitForTimeout(500);

  console.log('\n========================================');
  console.log('🏁 REGRESSION AUDIT RESULTS');
  console.log('========================================');
  console.log('Total Pages Inspected:', regressionReport.pagesInspected);
  console.log('Responsive Breakpoints Tested:', regressionReport.responsiveBreakpointsTested);
  console.log('Console Errors:', consoleErrors);
  console.log('Overflow Issues:', regressionReport.overflowIssues);
  console.log('Primary Button Styling Verified:', regressionReport.primaryButtonStyled);
  console.log('Select Dropdown Verified:', regressionReport.selectFixVerified);
  console.log('Banner Contrast Verified:', regressionReport.bannerContrastVerified);
  console.log('Active Tab Contrast Verified:', regressionReport.activeTabContrastVerified);
  console.log('Mobile Navigation Verified:', regressionReport.mobileNavigationVerified);
  console.log('Platform Admin Flow Verified:', regressionReport.platformAdminVerified);
  console.log('Screenshots Saved to:', screenshotsDir);

  await browser.close();
}

runRegressionAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
