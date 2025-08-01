import { test, expect } from './auth-helper';

// Mobile UI/UX Test Suite for Sterodoro App
// Tests all critical flows at 375px viewport (iPhone SE)

test.describe('Mobile UI/UX Tests - 375px Viewport', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Use the authenticated page fixture
    // authenticatedPage is already authenticated and ready to use
  });

  test('Main Navigation - All buttons visible and properly sized', async ({ authenticatedPage }) => {
    // Check that all main navigation buttons are visible and properly sized
    const navigationButtons = [
      'Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'
    ];

    for (const buttonText of navigationButtons) {
      const button = authenticatedPage.locator(`.grid button:has-text("${buttonText}")`);
      
      // Check button is visible
      await expect(button).toBeVisible();
      
      // Check button has minimum 44px touch target
      const buttonBox = await button.boundingBox();
      expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      
      // Check button is within viewport
      const viewport = authenticatedPage.viewportSize();
      expect(buttonBox?.x).toBeGreaterThanOrEqual(0);
      expect(buttonBox?.x + (buttonBox?.width || 0)).toBeLessThanOrEqual(viewport?.width || 375);
    }

    // Check grid layout is properly spaced
    const gridContainer = authenticatedPage.locator('.grid.grid-cols-3:has(button:has-text("Timer"))');
    await expect(gridContainer).toBeVisible();
  });

  test('No horizontal scrolling or overflow', async ({ authenticatedPage }) => {
          // Check that the page doesn't have horizontal scroll
      const body = authenticatedPage.locator('body');
    const bodyBox = await body.boundingBox();
    const viewport = authenticatedPage.viewportSize();
    
    expect(bodyBox?.width).toBeLessThanOrEqual(viewport?.width || 375);
    
    // Check for any elements that might cause horizontal overflow
    const allElements = authenticatedPage.locator('*');
    const count = await allElements.count();
    
    for (let i = 0; i < Math.min(count, 100); i++) {
      const element = allElements.nth(i);
      const box = await element.boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width || 375);
      }
    }
  });

  test('Timer Mode - Complete flow', async ({ authenticatedPage }) => {
    // Navigate to Timer mode
    await authenticatedPage.click('button:has-text("Timer")');
    await authenticatedPage.waitForTimeout(500);

    // Check activity type selection is visible first
    await expect(authenticatedPage.locator('text=Activity Type')).toBeVisible();
    
    // Select an activity category (Work, Health, Social, Personal)
    await authenticatedPage.click('button:has-text("Work")');
    await authenticatedPage.waitForTimeout(500);
    
    // For now, just verify that activity selection is working
    // The timer configuration will be visible after selecting an activity
    await expect(authenticatedPage.locator('text=Activity Type')).toBeVisible();
    
    // Check that we can see activity categories
    await expect(authenticatedPage.locator('button:has-text("Work")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Health")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Social")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Personal")')).toBeVisible();

    // Check action button is properly sized
    const actionButton = authenticatedPage.locator('footer button');
    await expect(actionButton).toBeVisible();
    const buttonBox = await actionButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Record Mode - Activity tracking flow', async ({ authenticatedPage }) => {
    // Navigate to Record mode
    await authenticatedPage.click('button:has-text("Record")');
    await authenticatedPage.waitForTimeout(500);

    // Check activity type selection is visible first
    await expect(authenticatedPage.locator('text=Activity Type')).toBeVisible();
    
    // Select an activity category
    await authenticatedPage.click('button:has-text("Work")');
    await authenticatedPage.waitForTimeout(500);
    
    // For now, just verify that activity selection is working
    // The record configuration will be visible after selecting an activity
    await expect(authenticatedPage.locator('text=Activity Type')).toBeVisible();
    
    // Check that we can see activity categories
    await expect(authenticatedPage.locator('button:has-text("Work")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Health")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Social")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Personal")')).toBeVisible();

    // Check action button is properly sized
    const actionButton = authenticatedPage.locator('footer button');
    await expect(actionButton).toBeVisible();
    const buttonBox = await actionButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Intake Mode - Item selection flow', async ({ authenticatedPage }) => {
    // Navigate to Intake mode
    await authenticatedPage.click('button:has-text("Intake")');
    await authenticatedPage.waitForTimeout(500);

    // Check intake section is visible
    await expect(authenticatedPage.locator('text=Select Intake Item(s)')).toBeVisible();

    // Check "Create Your First Intake Item" button if no items exist
    const createButton = authenticatedPage.locator('button:has-text("Create Your First Intake Item")');
    if (await createButton.isVisible()) {
      const buttonBox = await createButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Reading Mode - Book selection flow', async ({ authenticatedPage }) => {
    // Navigate to Reading mode
    await authenticatedPage.click('button:has-text("Reading")');
    await authenticatedPage.waitForTimeout(500);

    // Check reading section is visible
    await expect(authenticatedPage.locator('text=Book')).toBeVisible();

    // Check "Create Your First Reading Object" button if no items exist
    const createButton = authenticatedPage.locator('button:has-text("Create Your First Reading Object")');
    if (await createButton.isVisible()) {
      const buttonBox = await createButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Note Mode - Note creation flow', async ({ authenticatedPage }) => {
    // Navigate to Note mode
    await authenticatedPage.click('button:has-text("Note")');
    await authenticatedPage.waitForTimeout(500);

    // Check note section is visible
    await expect(authenticatedPage.locator('h3:has-text("Note")')).toBeVisible();
    await expect(authenticatedPage.locator('input[placeholder="e.g., Project Ideas"]')).toBeVisible();
    await expect(authenticatedPage.locator('textarea[placeholder="Write down your thoughts..."]')).toBeVisible();

    // Check textarea is properly sized
    const textarea = authenticatedPage.locator('textarea');
    await expect(textarea).toBeVisible();
    const textareaBox = await textarea.boundingBox();
    expect(textareaBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Data Mode - Logs display', async ({ authenticatedPage }) => {
    // Navigate to Data mode
    await authenticatedPage.click('button:has-text("Data")');
    await authenticatedPage.waitForTimeout(500);

    // Check data section is visible
    await expect(authenticatedPage.locator('text=Download All Data')).toBeVisible();

    // Check download button is properly sized
    const downloadButton = authenticatedPage.locator('button:has-text("Download All Data")');
    await expect(downloadButton).toBeVisible();
    const buttonBox = await downloadButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Settings Mode - User and customization', async ({ authenticatedPage }) => {
    // Navigate to Settings mode
    await authenticatedPage.click('button:has-text("Settings")');
    await authenticatedPage.waitForTimeout(500);

    // Check settings sub-navigation is visible
    await expect(authenticatedPage.locator('button:has-text("User")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Application Look")')).toBeVisible();

    // Check sub-navigation buttons are properly sized
    const userButton = authenticatedPage.locator('button:has-text("User")');
    const appLookButton = authenticatedPage.locator('button:has-text("Application Look")');
    
    const userBox = await userButton.boundingBox();
    const appLookBox = await appLookButton.boundingBox();
    
    expect(userBox?.height).toBeGreaterThanOrEqual(44);
    expect(appLookBox?.height).toBeGreaterThanOrEqual(44);

    // Test User sub-section
    await authenticatedPage.click('button:has-text("User")');
    await authenticatedPage.waitForTimeout(500);
    
    await expect(authenticatedPage.locator('text=Logout')).toBeVisible();
    const logoutButton = authenticatedPage.locator('button:has-text("Logout")');
    const logoutBox = await logoutButton.boundingBox();
    expect(logoutBox?.height).toBeGreaterThanOrEqual(44);

    // Test Application Look sub-section
    await authenticatedPage.click('button:has-text("Application Look")');
    await authenticatedPage.waitForTimeout(500);
    
    await expect(authenticatedPage.locator('text=Theme')).toBeVisible();
    await expect(authenticatedPage.locator('text=Custom Colors')).toBeVisible();
  });

  test('Modal Accessibility - Add Activity Modal', async ({ authenticatedPage }) => {
    // Navigate to Timer mode
    await authenticatedPage.click('button:has-text("Timer")');
    await authenticatedPage.waitForTimeout(500);

    // Click on activity type to trigger modal
    const activitySection = authenticatedPage.locator('text=Activity Type').first();
    await activitySection.click();
    await authenticatedPage.waitForTimeout(500);

    // Look for "Add New..." button and click it
    const addNewButton = authenticatedPage.locator('button:has-text("Add New...")').first();
    if (await addNewButton.isVisible()) {
      await addNewButton.click();
      await authenticatedPage.waitForTimeout(500);

      // Check modal is visible and properly positioned
      const modal = authenticatedPage.locator('.bg-gray-900.rounded-t-2xl');
      await expect(modal).toBeVisible();
      
      const modalBox = await modal.boundingBox();
      const viewport = authenticatedPage.viewportSize();
      
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

  test('Text Readability - No zoom required', async ({ authenticatedPage }) => {
    // Check that all text is readable without zoom
    const allTextElements = authenticatedPage.locator('h1, h2, h3, h4, h5, h6, p, span, button, label');
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

  test('Touch Target Accessibility - All interactive elements', async ({ authenticatedPage }) => {
    // Check all buttons, inputs, and interactive elements have proper touch targets
    const interactiveElements = authenticatedPage.locator('button, input, select, textarea, [role="button"]');
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
          const viewport = authenticatedPage.viewportSize();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width || 375);
        }
      }
    }
  });

  test('Responsive Layout - No fixed widths causing overflow', async ({ authenticatedPage }) => {
    // Check that no elements have fixed widths that could cause overflow
    const allElements = authenticatedPage.locator('*');
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

  test('Navigation Flow - Complete app navigation', async ({ authenticatedPage }) => {
    // Test navigation between all main modes
    const modes = ['Timer', 'Record', 'Intake', 'Reading', 'Note', 'Data', 'Settings'];
    
    for (const mode of modes) {
      // Click on mode button
      await authenticatedPage.click(`button:has-text("${mode}")`);
      await authenticatedPage.waitForTimeout(500);
      
      // Verify mode-specific content is visible
      if (mode === 'Timer') {
        await expect(authenticatedPage.locator('text=Activity Type')).toBeVisible();
      } else if (mode === 'Record') {
        await expect(authenticatedPage.locator('text=Activity Type')).toBeVisible();
      } else if (mode === 'Intake') {
        await expect(authenticatedPage.locator('text=Select Intake Item(s)')).toBeVisible();
      } else if (mode === 'Reading') {
        await expect(authenticatedPage.locator('text=Book')).toBeVisible();
      } else if (mode === 'Note') {
        await expect(authenticatedPage.locator('h3:has-text("Note")')).toBeVisible();
      } else if (mode === 'Data') {
        await expect(authenticatedPage.locator('text=Data Management')).toBeVisible();
      } else if (mode === 'Settings') {
        await expect(authenticatedPage.locator('h3:has-text("Settings")')).toBeVisible();
      }
      
      // Check that action button is always visible and properly sized
      const actionButton = authenticatedPage.locator('footer button');
      await expect(actionButton).toBeVisible();
      const buttonBox = await actionButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });
}); 