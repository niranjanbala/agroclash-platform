import { test, expect } from '@playwright/test';

/**
 * Cross-platform feature parity tests
 * Ensures PWA and mobile app have consistent functionality
 */

interface FeatureTest {
  name: string;
  webSelector: string;
  mobileSelector: string;
  action?: string;
  expectedResult: string;
}

const CORE_FEATURES: FeatureTest[] = [
  {
    name: 'Authentication Flow',
    webSelector: '[data-testid="auth-form"]',
    mobileSelector: '[data-testid="auth-form"]',
    expectedResult: 'Authentication form should be present'
  },
  {
    name: 'Farm Dashboard',
    webSelector: '[data-testid="farm-dashboard"]',
    mobileSelector: '[data-testid="farm-dashboard"]',
    expectedResult: 'Dashboard should display farm overview'
  },
  {
    name: 'Plot Management',
    webSelector: '[data-testid="plot-manager"]',
    mobileSelector: '[data-testid="plot-manager"]',
    expectedResult: 'Plot management interface should be accessible'
  },
  {
    name: 'Crop Tracking',
    webSelector: '[data-testid="crop-tracker"]',
    mobileSelector: '[data-testid="crop-tracker"]',
    expectedResult: 'Crop tracking should be available'
  },
  {
    name: 'XP System',
    webSelector: '[data-testid="xp-bar"]',
    mobileSelector: '[data-testid="xp-bar"]',
    expectedResult: 'XP progress should be visible'
  },
  {
    name: 'Weather Widget',
    webSelector: '[data-testid="weather-widget"]',
    mobileSelector: '[data-testid="weather-widget"]',
    expectedResult: 'Weather information should be displayed'
  },
  {
    name: 'Marketplace',
    webSelector: '[data-testid="marketplace"]',
    mobileSelector: '[data-testid="marketplace"]',
    expectedResult: 'Marketplace should be accessible'
  },
  {
    name: 'Clan System',
    webSelector: '[data-testid="clan-dashboard"]',
    mobileSelector: '[data-testid="clan-dashboard"]',
    expectedResult: 'Clan features should be available'
  }
];

test.describe('Cross-Platform Feature Parity', () => {
  test.describe('Web PWA Features', () => {
    CORE_FEATURES.forEach(feature => {
      test(`should have ${feature.name} on web`, async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator(feature.webSelector)).toBeVisible();
      });
    });
  });

  test.describe('Mobile App Features', () => {
    CORE_FEATURES.forEach(feature => {
      test(`should have ${feature.name} on mobile`, async ({ page }) => {
        // Simulate mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/dashboard');
        await expect(page.locator(feature.mobileSelector)).toBeVisible();
      });
    });
  });

  test.describe('Responsive Design Consistency', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(viewport => {
      test(`should render correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/dashboard');
        
        // Check key elements are visible
        await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // Take screenshot for visual comparison
        await page.screenshot({ 
          path: `test-results/screenshots/${viewport.name.toLowerCase()}-dashboard.png`,
          fullPage: true 
        });
      });
    });
  });

  test.describe('Touch vs Click Interactions', () => {
    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // Test touch-friendly button sizes
      const buttons = page.locator('[data-testid*="button"]');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          // Ensure minimum touch target size (44px)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});