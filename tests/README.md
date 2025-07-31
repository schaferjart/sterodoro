# Mobile UI/UX Testing Suite

This directory contains comprehensive automated tests for mobile UI/UX validation using Playwright.

## Test Coverage

### 1. Mobile UI/UX Tests (`mobile-ui-ux.spec.ts`)
- **Main Navigation**: All buttons visible and properly sized (44px minimum)
- **No Horizontal Overflow**: Ensures no elements extend beyond viewport
- **Timer Mode**: Complete timer configuration flow
- **Record Mode**: Activity tracking with proper form inputs
- **Intake Mode**: Item selection and creation
- **Reading Mode**: Book selection and management
- **Note Mode**: Note creation with proper textarea sizing
- **Data Mode**: Logs display and download functionality
- **Settings Mode**: User management and theme customization
- **Modal Accessibility**: Add Activity modal positioning and sizing
- **Text Readability**: Minimum 12px font size for all text
- **Touch Targets**: All interactive elements meet 44px minimum
- **Responsive Layout**: No fixed widths causing overflow
- **Navigation Flow**: Complete app navigation testing

### 2. Accessibility Tests (`accessibility.spec.ts`)
- **ARIA Labels and Roles**: Proper accessibility markup
- **Keyboard Navigation**: Tab navigation through all elements
- **Screen Reader Compatibility**: Semantic markup and heading hierarchy
- **Color Contrast**: Sufficient contrast for readability
- **Focus Management**: Proper focus handling in modals
- **Error Handling**: Accessibility of error states

### 3. Regression Tests (`regression.spec.ts`)
- **Layout Shift Prevention**: No layout shifts during navigation
- **Consistent Button Sizing**: Uniform button dimensions across modes
- **Memory Leak Prevention**: Modal interactions don't cause memory issues
- **Responsive Breakpoints**: Multiple viewport size testing
- **Performance Under Load**: Rapid navigation testing
- **Theme Switching**: Consistent theme application
- **Data Persistence**: Form data preservation across navigation
- **Error Recovery**: Graceful error handling

## Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run only mobile tests (iPhone SE - 375px)
npm run test:mobile

# Run all mobile devices (iPhone + Android)
npm run test:all

# Run with UI for debugging
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug

# View test report
npm run test:report
```

### Test Configuration

The tests are configured for:
- **iPhone SE**: 375px × 667px viewport
- **Pixel 5**: 393px × 851px viewport
- **Touch simulation**: Enabled for mobile interaction
- **Device scale factor**: 2x for realistic mobile rendering

### Test Environment

Tests automatically:
1. Start the development server (`npm run dev`)
2. Wait for the app to load completely
3. Run all test scenarios
4. Generate screenshots on failure
5. Create video recordings for failed tests
6. Generate HTML reports

## Test Results

### Pass Criteria
- ✅ All buttons have 44px minimum touch targets
- ✅ No horizontal scrolling or overflow
- ✅ All text is readable (12px minimum)
- ✅ Modals are properly positioned within viewport
- ✅ Navigation works consistently across all modes
- ✅ Accessibility standards are met
- ✅ No layout shifts during navigation

### Failure Reporting

When tests fail, Playwright provides:
- **Screenshots**: Visual evidence of the failure
- **Video recordings**: Step-by-step reproduction
- **HTML reports**: Detailed test results with traces
- **Console logs**: JavaScript errors and warnings
- **Element selectors**: Exact location of problematic elements

## Adding New Tests

### For New Features
1. Add test cases to appropriate spec file
2. Follow the existing pattern of:
   - Navigate to feature
   - Check visibility and sizing
   - Verify touch targets
   - Test accessibility
   - Ensure no overflow

### Test Structure
```typescript
test('Feature Name - Description', async ({ page }) => {
  // Navigate to feature
  await page.click('button:has-text("Feature")');
  await page.waitForTimeout(500);

  // Check visibility
  await expect(page.locator('text=Feature Content')).toBeVisible();

  // Check sizing
  const element = page.locator('selector');
  const box = await element.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  // Check viewport bounds
  const viewport = page.viewportSize();
  expect(box?.x + (box?.width || 0)).toBeLessThanOrEqual(viewport?.width || 375);
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- **GitHub Actions**: Add to workflow for automated testing
- **Pull Requests**: Block merging if tests fail
- **Deployment**: Run before production deployment
- **Regression Detection**: Catch UI issues before they reach users

## Maintenance

### Regular Tasks
- Update selectors when UI changes
- Add tests for new features
- Review and update accessibility standards
- Monitor test performance and flakiness
- Update viewport configurations for new devices

### Troubleshooting
- **Flaky Tests**: Add longer wait times or better selectors
- **Selector Issues**: Use more specific selectors or data-testid attributes
- **Performance**: Optimize test execution time
- **Coverage**: Ensure all critical paths are tested 