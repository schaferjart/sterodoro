import { test, expect } from '@playwright/test';

test.describe('Debug Test', () => {
  test('Check what is actually on the page', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5181/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait longer for React to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot to see what's there
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    
    // Log the page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if there are any buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('Number of buttons found:', buttonCount);
    
    // Log all button texts
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    // Check for any text content
    const bodyText = await page.textContent('body');
    console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
    
    // Check for React root
    const reactRoot = page.locator('#root');
    const rootExists = await reactRoot.count();
    console.log('React root exists:', rootExists > 0);
    
    // Check for any divs
    const divs = page.locator('div');
    const divCount = await divs.count();
    console.log('Number of divs found:', divCount);
    
    // Check for any elements with text
    const elementsWithText = page.locator('*:has-text("Timer"), *:has-text("Record"), *:has-text("Settings")');
    const textElementsCount = await elementsWithText.count();
    console.log('Elements with Timer/Record/Settings text:', textElementsCount);
    
    // Check for any errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any console errors
    await page.waitForTimeout(2000);
    console.log('Console errors:', errors);
    
    // Check if there's a loading spinner or auth form
    const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"]');
    const authForm = page.locator('form, [class*="auth"], [class*="login"]');
    
    console.log('Loading spinner found:', await loadingSpinner.count());
    console.log('Auth form found:', await authForm.count());
  });
}); 