import { test, expect } from '@playwright/test';

// Mobile UI/UX Test Suite for Productivity Timer App
// Tests all critical flows at 375px viewport (iPhone SE)

test.describe('Mobile UI/UX Tests - 375px Viewport', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for the main navigation to be visible
    await page.waitForSelector('button:has-text("Timer")');
  });

  test('Main Navigation - All buttons visible and properly sized', async ({ page }) => {
    // Check that all main navigation buttons are visible and properly sized
    const navigationButtons = [
      'Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'
    ];

    for (const buttonText of navigationButtons) {
      const button = page.locator(`button:has-text("${buttonText}")`);
      
      // Check button is visible
      await expect(button).toBeVisible();
      
      // Check button has minimum 44px touch target
      const buttonBox = await button.boundingBox();
      expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      
      // Check button is within viewport
      const viewport = page.viewportSize();
      expect(buttonBox?.x).toBeGreaterThanOrEqual(0);
      expect(buttonBox?.x + (buttonBox?.width || 0)).toBeLessThanOrEqual(viewport?.width || 375);
    }

    // Check grid layout is properly spaced
    const gridContainer = page.locator('.grid.grid-cols-3');
    await expect(gridContainer).toBeVisible();
  });

  test('No horizontal scrolling or overflow', async ({ page }) => {
    // Check that the page doesn't have horizontal scroll
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    const viewport = page.viewportSize();
    
    expect(bodyBox?.width).toBeLessThanOrEqual(viewport?.width || 375);
    
    // Check for any elements that might cause horizontal overflow
    const allElements = page.locator('*');
    const count = await allElements.count();
    
    for (let i = 0; i < Math.min(count, 100); i++) {
      const element = allElements.nth(i);
      const box = await element.boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width || 375);
      }
    }
  });

  test('Timer Mode - Complete flow', async ({ page }) => {
    // Navigate to Timer mode
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);

    // Check timer configuration is visible
    await expect(page.locator('text=Session Duration')).toBeVisible();
    await expect(page.locator('text=Break Duration')).toBeVisible();
    await expect(page.locator('text=Session Count')).toBeVisible();

    // Check sliders are properly sized
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    expect(sliderCount).toBeGreaterThan(0);

    for (let i = 0; i < sliderCount; i++) {
      const slider = sliders.nth(i);
      const box = await slider.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    // Check activity selection is visible
    await expect(page.locator('text=Activity Type')).toBeVisible();
    
    // Check action button is properly sized
    const actionButton = page.locator('footer button');
    await expect(actionButton).toBeVisible();
    const buttonBox = await actionButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Record Mode - Activity tracking flow', async ({ page }) => {
    // Navigate to Record mode
    await page.click('button:has-text("Record")');
    await page.waitForTimeout(500);

    // Check record configuration is visible
    await expect(page.locator('text=Start Time')).toBeVisible();
    await expect(page.locator('text=End Time')).toBeVisible();
    await expect(page.locator('text=Activity Type')).toBeVisible();

    // Check datetime inputs are properly sized
    const datetimeInputs = page.locator('input[type="datetime-local"]');
    const inputCount = await datetimeInputs.count();
    expect(inputCount).toBeGreaterThan(0);

    for (let i = 0; i < inputCount; i++) {
      const input = datetimeInputs.nth(i);
      const box = await input.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Intake Mode - Item selection flow', async ({ page }) => {
    // Navigate to Intake mode
    await page.click('button:has-text("Intake")');
    await page.waitForTimeout(500);

    // Check intake section is visible
    await expect(page.locator('text=Select Intake Item(s)')).toBeVisible();

    // Check "Create Your First Intake Item" button if no items exist
    const createButton = page.locator('button:has-text("Create Your First Intake Item")');
    if (await createButton.isVisible()) {
      const buttonBox = await createButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Reading Mode - Book selection flow', async ({ page }) => {
    // Navigate to Reading mode
    await page.click('button:has-text("Reading")');
    await page.waitForTimeout(500);

    // Check reading section is visible
    await expect(page.locator('text=Book')).toBeVisible();

    // Check "Create Your First Reading Object" button if no items exist
    const createButton = page.locator('button:has-text("Create Your First Reading Object")');
    if (await createButton.isVisible()) {
      const buttonBox = await createButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Note Mode - Note creation flow', async ({ page }) => {
    // Navigate to Note mode
    await page.click('button:has-text("Note")');
    await page.waitForTimeout(500);

    // Check note section is visible
    await expect(page.locator('text=Note Title')).toBeVisible();
    await expect(page.locator('text=Note Content')).toBeVisible();

    // Check textarea is properly sized
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    const textareaBox = await textarea.boundingBox();
    expect(textareaBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Data Mode - Logs display', async ({ page }) => {
    // Navigate to Data mode
    await page.click('button:has-text("Data")');
    await page.waitForTimeout(500);

    // Check data section is visible
    await expect(page.locator('text=Download All Data')).toBeVisible();

    // Check download button is properly sized
    const downloadButton = page.locator('button:has-text("Download All Data")');
    await expect(downloadButton).toBeVisible();
    const buttonBox = await downloadButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Settings Mode - User and customization', async ({ page }) => {
    // Navigate to Settings mode
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);

    // Check settings sub-navigation is visible
    await expect(page.locator('button:has-text("User")')).toBeVisible();
    await expect(page.locator('button:has-text("Application Look")')).toBeVisible();

    // Check sub-navigation buttons are properly sized
    const userButton = page.locator('button:has-text("User")');
    const appLookButton = page.locator('button:has-text("Application Look")');
    
    const userBox = await userButton.boundingBox();
    const appLookBox = await appLookButton.boundingBox();
    
    expect(userBox?.height).toBeGreaterThanOrEqual(44);
    expect(appLookBox?.height).toBeGreaterThanOrEqual(44);

    // Test User sub-section
    await page.click('button:has-text("User")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Logout')).toBeVisible();
    const logoutButton = page.locator('button:has-text("Logout")');
    const logoutBox = await logoutButton.boundingBox();
    expect(logoutBox?.height).toBeGreaterThanOrEqual(44);

    // Test Application Look sub-section
    await page.click('button:has-text("Application Look")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Theme')).toBeVisible();
    await expect(page.locator('text=Custom Colors')).toBeVisible();
  });

  test('Modal Accessibility - Add Activity Modal', async ({ page }) => {
    // Navigate to Timer mode
    await page.click('button:has-text("Timer")');
    await page.waitForTimeout(500);

    // Click on activity type to trigger modal
    const activitySection = page.locator('text=Activity Type').first();
    await activitySection.click();
    await page.waitForTimeout(500);

    // Look for "Add New..." button and click it
    const addNewButton = page.locator('button:has-text("Add New...")').first();
    if (await addNewButton.isVisible()) {
      await addNewButton.click();
      await page.waitForTimeout(500);

      // Check modal is visible and properly positioned
      const modal = page.locator('.bg-gray-900.rounded-t-2xl');
      await expect(modal).toBeVisible();
      
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      // Check modal is within viewport
      expect(modalBox?.x).toBeGreaterThanOrEqual(0);
      expect(modalBox?.x + (modalBox?.width || 0)).toBeLessThanOrEqual(viewport?.width || 375);
      
      // Check modal inputs are properly sized
      const inputs = modal.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Text Readability - No zoom required', async ({ page }) => {
    // Check that all text is readable without zoom
    const allTextElements = page.locator('h1, h2, h3, h4, h5, h6, p, span, button, label');
    const count = await allTextElements.count();
    
    for (let i = 0; i < Math.min(count, 50); i++) {
      const element = allTextElements.nth(i);
      if (await element.isVisible()) {
        const fontSize = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return parseFloat(style.fontSize);
        });
        
        // Ensure font size is at least 12px for readability
        expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    }
  });

  test('Touch Target Accessibility - All interactive elements', async ({ page }) => {
    // Check all buttons, inputs, and interactive elements have proper touch targets
    const interactiveElements = page.locator('button, input, select, textarea, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          // Check minimum touch target size (44px)
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
          
          // Check element is within viewport
          const viewport = page.viewportSize();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width || 375);
        }
      }
    }
  });

  test('Responsive Layout - No fixed widths causing overflow', async ({ page }) => {
    // Check that no elements have fixed widths that could cause overflow
    const allElements = page.locator('*');
    const count = await allElements.count();
    
    for (let i = 0; i < Math.min(count, 100); i++) {
      const element = allElements.nth(i);
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            width: style.width,
            maxWidth: style.maxWidth,
            minWidth: style.minWidth,
            position: style.position,
            left: style.left,
            right: style.right
          };
        });
        
        // Check for problematic fixed widths
        if (styles.width && styles.width !== 'auto' && !styles.width.includes('%')) {
          const widthValue = parseFloat(styles.width);
          if (widthValue > 375) {
            console.warn(`Element ${i} has fixed width ${styles.width} that may cause overflow`);
          }
        }
      }
    }
  });

  test('Navigation Flow - Complete app navigation', async ({ page }) => {
    // Test navigation between all main modes
    const modes = ['Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'];
    
    for (const mode of modes) {
      // Click on mode button
      await page.click(`button:has-text("${mode}")`);
      await page.waitForTimeout(500);
      
      // Verify mode-specific content is visible
      if (mode === 'Timer') {
        await expect(page.locator('text=Session Duration')).toBeVisible();
      } else if (mode === 'Record') {
        await expect(page.locator('text=Start Time')).toBeVisible();
      } else if (mode === 'Intake') {
        await expect(page.locator('text=Select Intake Item(s)')).toBeVisible();
      } else if (mode === 'Reading') {
        await expect(page.locator('text=Book')).toBeVisible();
      } else if (mode === 'Note') {
        await expect(page.locator('text=Note Title')).toBeVisible();
      } else if (mode === 'Data') {
        await expect(page.locator('text=Download All Data')).toBeVisible();
      } else if (mode === 'Settings') {
        await expect(page.locator('button:has-text("User")')).toBeVisible();
      }
      
      // Check that action button is always visible and properly sized
      const actionButton = page.locator('footer button');
      await expect(actionButton).toBeVisible();
      const buttonBox = await actionButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });
}); 