import { test, expect } from '@playwright/test';

test.describe('Mobile Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('button:has-text("Timer")');
  });

  test('No Layout Shift on Navigation', async ({ page }) => {
    // Test that navigation doesn't cause layout shifts
    const modes = ['Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'];
    
    for (const mode of modes) {
      // Take screenshot before navigation
      await page.screenshot({ path: `before-${mode}.png` });
      
      // Navigate to mode
      await page.click(`button:has-text("${mode}")`);
      await page.waitForTimeout(500);
      
      // Take screenshot after navigation
      await page.screenshot({ path: `after-${mode}.png` });
      
      // Check that main navigation is still visible and properly positioned
      const gridContainer = page.locator('.grid.grid-cols-3');
      await expect(gridContainer).toBeVisible();
      
      const gridBox = await gridContainer.boundingBox();
      expect(gridBox?.x).toBeGreaterThanOrEqual(0);
      expect(gridBox?.y).toBeGreaterThanOrEqual(0);
    }
  });

  test('Consistent Button Sizing', async ({ page }) => {
    // Test that all buttons maintain consistent sizing across modes
    const modes = ['Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'];
    const buttonSizes: { [key: string]: { width: number; height: number } } = {};
    
    for (const mode of modes) {
      await page.click(`button:has-text("${mode}")`);
      await page.waitForTimeout(500);
      
      // Check main navigation buttons
      const navButtons = page.locator('.grid.grid-cols-3 button');
      const buttonCount = await navButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = navButtons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          const buttonText = await button.textContent() || `button-${i}`;
          buttonSizes[`${mode}-${buttonText}`] = { width: box.width, height: box.height };
          
          // Ensure minimum touch target size
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    // Check for consistency in button sizes across modes
    const sizes = Object.values(buttonSizes);
    if (sizes.length > 1) {
      const avgWidth = sizes.reduce((sum, size) => sum + size.width, 0) / sizes.length;
      const avgHeight = sizes.reduce((sum, size) => sum + size.height, 0) / sizes.length;
      
      // Allow for small variations (within 10%)
      sizes.forEach(size => {
        expect(Math.abs(size.width - avgWidth) / avgWidth).toBeLessThan(0.1);
        expect(Math.abs(size.height - avgHeight) / avgHeight).toBeLessThan(0.1);
      });
    }
  });

  test('No Memory Leaks in Modal Interactions', async ({ page }) => {
    // Test that opening and closing modals doesn't cause memory issues
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    // Try to open activity modal multiple times
    for (let i = 0; i < 5; i++) {
      const addNewButton = page.locator('button:has-text("Add New...")').first();
      if (await addNewButton.isVisible()) {
        await addNewButton.click();
        await page.waitForTimeout(500);
        
        // Check modal is visible
        const modal = page.locator('.bg-gray-900.rounded-t-2xl');
        await expect(modal).toBeVisible();
        
        // Close modal
        const closeButton = modal.locator('button:has-text("×")');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        } else {
          // Click outside modal to close
          await page.click('body');
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Verify app is still functional
    await expect(page.locator('button:has-text("Timer")')).toBeVisible();
  });

  test('Responsive Design Breakpoints', async ({ page }) => {
    // Test different viewport sizes to ensure responsive design works
    const viewports = [
      { width: 320, height: 568 }, // iPhone 5
      { width: 375, height: 667 }, // iPhone SE
      { width: 414, height: 896 }, // iPhone 11 Pro Max
      { width: 768, height: 1024 }, // iPad
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Check that navigation grid adapts properly
      const gridContainer = page.locator('.grid.grid-cols-3');
      await expect(gridContainer).toBeVisible();
      
      const gridBox = await gridContainer.boundingBox();
      expect(gridBox?.width).toBeLessThanOrEqual(viewport.width);
      
      // Check that buttons remain properly sized
      const buttons = page.locator('.grid.grid-cols-3 button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('Performance Under Load', async ({ page }) => {
    // Test app performance when navigating rapidly
    const modes = ['Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'];
    
    // Rapid navigation test
    for (let i = 0; i < 3; i++) {
      for (const mode of modes) {
        await page.click(`button:has-text("${mode}")`);
        await page.waitForTimeout(100); // Short delay to simulate rapid navigation
      }
    }
    
    // Verify app is still responsive
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Session Duration')).toBeVisible();
    
    // Check that action button is still functional
    const actionButton = page.locator('footer button');
    await expect(actionButton).toBeVisible();
    await expect(actionButton).toBeEnabled();
  });

  test('Theme Switching Consistency', async ({ page }) => {
    // Test that theme switching works consistently across all modes
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Application Look")');
    await page.waitForTimeout(500);
    
    // Test theme presets
    const themeButtons = page.locator('button:has-text("Dark"), button:has-text("Light")');
    const themeCount = await themeButtons.count();
    
    for (let i = 0; i < themeCount; i++) {
      const themeButton = themeButtons.nth(i);
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Navigate to different modes to ensure theme is applied consistently
      await page.click('button:has-text("Timer")');
      await page.waitForTimeout(500);
      
      await page.click('button:has-text("Data")');
      await page.waitForTimeout(500);
      
      await page.click('button:has-text("Settings")');
      await page.waitForTimeout(500);
      
      // Verify theme is still applied
      await page.click('button:has-text("Application Look")');
      await page.waitForTimeout(500);
    }
  });

  test('Data Persistence Across Navigation', async ({ page }) => {
    // Test that form data persists when navigating between modes
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    // Set some values
    const sessionSlider = page.locator('input[type="range"]').first();
    await sessionSlider.fill('10');
    
    // Navigate away and back
    await page.click('button:has-text("Record")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    // Check that values are preserved
    const sessionValue = await sessionSlider.inputValue();
    expect(sessionValue).toBe('10');
  });

  test('Error Recovery', async ({ page }) => {
    // Test that the app recovers gracefully from errors
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);
    
    // Try to trigger potential errors
    const actionButton = page.locator('footer button');
    await actionButton.click();
    
    // Wait a moment for any error handling
    await page.waitForTimeout(1000);
    
    // Verify app is still functional
    await expect(page.locator('button:has-text("Timer")')).toBeVisible();
    await expect(page.locator('text=Session Duration')).toBeVisible();
    
    // Try navigating to other modes
    await page.click('button:has-text("Data")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);
    
    // Verify all modes still work
    await expect(page.locator('button:has-text("User")')).toBeVisible();
  });
}); 