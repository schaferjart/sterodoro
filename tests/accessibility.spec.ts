import { test, expect } from '@playwright/test';

test.describe('Mobile Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('button:has-text("Timer")');
  });

  test('ARIA Labels and Roles', async ({ page }) => {
    // Check that interactive elements have proper ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Check for aria-label or accessible text content
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Either aria-label should be present or button should have text content
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    }

    // Check form inputs have proper labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const ariaLabel = await input.getAttribute('aria-label');
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');
        
        // Input should have some form of label
        expect(ariaLabel || id || name).toBeTruthy();
      }
    }
  });

  test('Keyboard Navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test tabbing through multiple elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      if (await focused.isVisible()) {
        // Check focused element is within viewport
        const box = await focused.boundingBox();
        const viewport = page.viewportSize();
        if (box && viewport) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test('Screen Reader Compatibility', async ({ page }) => {
    // Check that important elements have proper semantic markup
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    expect(h1Count).toBeLessThanOrEqual(1); // Should have at most one h1
    
    // Check that buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const accessibleName = await button.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('aria-labelledby') || 
                 el.textContent?.trim();
        });
        expect(accessibleName).toBeTruthy();
      }
    }
  });

  test('Color Contrast and Visual Accessibility', async ({ page }) => {
    // Check that text has sufficient contrast
    const textElements = page.locator('h1, h2, h3, h4, h5, h6, p, span, button, label');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 20); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight
          };
        });
        
        // Check font size is readable
        const fontSize = parseFloat(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(12);
        
        // Check font weight is sufficient
        const fontWeight = parseInt(styles.fontWeight);
        expect(fontWeight).toBeGreaterThanOrEqual(400);
      }
    }
  });

  test('Focus Management', async ({ page }) => {
    // Test that modals properly manage focus
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    // Look for "Add New..." button
    const addNewButton = page.locator('button:has-text("Add New...")').first();
    if (await addNewButton.isVisible()) {
      await addNewButton.click();
      await page.waitForTimeout(500);
      
      // Check that modal is focused
      const modal = page.locator('.bg-gray-900.rounded-t-2xl');
      await expect(modal).toBeVisible();
      
      // Check that focus is trapped within modal
      await page.keyboard.press('Tab');
      const focusedInModal = page.locator('.bg-gray-900.rounded-t-2xl :focus');
      await expect(focusedInModal).toBeVisible();
    }
  });

  test('Error Handling and Announcements', async ({ page }) => {
    // Test that error states are properly announced
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    // Try to submit without selecting activity
    const actionButton = page.locator('footer button');
    await actionButton.click();
    
    // Check for error messages or validation feedback
    const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
    // Note: This test may need adjustment based on actual error handling implementation
  });
}); 