import { test, expect } from './auth-helper';

test.describe('Authentication Test', () => {
  test('Should authenticate successfully', async ({ authenticatedPage }) => {
    // If we get here, authentication worked
    console.log('✅ Authentication successful!');
    
    // Verify we can see the main navigation
    await expect(authenticatedPage.locator('.grid button:has-text("Timer")')).toBeVisible();
    await expect(authenticatedPage.locator('.grid button:has-text("Settings")')).toBeVisible();
    
    console.log('✅ Main navigation buttons are visible');
  });
}); 