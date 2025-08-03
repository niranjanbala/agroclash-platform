/**
 * Comprehensive Test Configuration for AgroClash Platform
 * Centralizes all test settings and environment configuration
 */

const path = require('path');

const testConfig = {
  // Global test settings
  global: {
    timeout: 30000,
    retries: 2,
    parallel: true,
    coverage: {
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.d.ts',
        '**/test-utils.ts',
        '**/jest.setup.js',
        '**/jest.config.js'
      ]
    }
  },

  // Environment variables for testing
  environment: {
    // Supabase test configuration
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    EXPO_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    
    // Service configuration
    USE_MOCK_WEATHER: 'true',
    USE_MOCK_MARKET: 'true',
    USE_MOCK_PEST: 'true',
    USE_MOCK_NOTIFICATIONS: 'true',
    USE_MOCK_AUTH: 'true',
    
    // API keys for real service testing (if available)
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
    MARKET_API_KEY: process.env.MARKET_API_KEY || '',
    
    // Test database configuration
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/agroclash_test',
    
    // Performance test settings
    LOAD_TEST_USERS: '10',
    LOAD_TEST_DURATION: '60',
    PERFORMANCE_THRESHOLD_MS: '500',
    
    // Visual regression settings
    VISUAL_THRESHOLD: '0.2',
    UPDATE_SNAPSHOTS: process.env.UPDATE_SNAPSHOTS || 'false'
  },

  // Test suites configuration
  suites: {
    unit: {
      pattern: '**/*.{test,spec}.{js,jsx,ts,tsx}',
      exclude: [
        '**/e2e/**',
        '**/integration/**',
        '**/performance/**',
        '**/visual/**'
      ],
      coverage: true,
      parallel: true
    },
    
    integration: {
      pattern: '**/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
      timeout: 60000,
      sequential: true,
      setupFiles: ['./test-setup/integration-setup.js']
    },
    
    e2e: {
      pattern: '**/e2e/**/*.spec.{js,ts}',
      timeout: 120000,
      retries: 3,
      browsers: ['chromium', 'firefox', 'webkit'],
      devices: ['Desktop Chrome', 'iPhone 12', 'Pixel 5'],
      headless: process.env.CI === 'true',
      video: 'retain-on-failure',
      screenshot: 'only-on-failure'
    },
    
    performance: {
      pattern: '**/performance/**/*.{test,spec}.{js,ts}',
      timeout: 300000,
      retries: 1,
      thresholds: {
        responseTime: 500,
        memoryUsage: 100 * 1024 * 1024, // 100MB
        errorRate: 0.05 // 5%
      }
    },
    
    visual: {
      pattern: '**/visual/**/*.spec.{js,ts}',
      threshold: 0.2,
      updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
      browsers: ['chromium'],
      devices: ['Desktop Chrome', 'iPhone 12', 'iPad']
    },
    
    crossPlatform: {
      pattern: '**/cross-platform/**/*.{test,spec}.{js,ts}',
      platforms: ['web', 'mobile'],
      viewports: [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ]
    },
    
    offline: {
      pattern: '**/*offline*.spec.{js,ts}',
      timeout: 60000,
      networkConditions: ['offline', 'slow-3g', 'fast-3g']
    }
  },

  // Mock data configuration
  mocks: {
    users: {
      count: 100,
      seed: 'test-users-2024'
    },
    plots: {
      count: 500,
      maxPlotsPerUser: 10,
      seed: 'test-plots-2024'
    },
    crops: {
      count: 1000,
      types: ['tomato', 'corn', 'wheat', 'rice', 'potato'],
      seed: 'test-crops-2024'
    },
    weather: {
      locations: 50,
      historicalDays: 30,
      seed: 'test-weather-2024'
    },
    market: {
      priceHistory: 90, // days
      volatility: 0.1,
      seed: 'test-market-2024'
    }
  },

  // Reporting configuration
  reporting: {
    formats: ['json', 'html', 'junit'],
    outputDir: './test-results',
    includeScreenshots: true,
    includeVideos: true,
    includeCoverage: true,
    generateTrends: true
  },

  // CI/CD specific settings
  ci: {
    parallel: process.env.CI === 'true',
    workers: process.env.CI === 'true' ? 2 : undefined,
    retries: process.env.CI === 'true' ? 3 : 1,
    timeout: process.env.CI === 'true' ? 60000 : 30000,
    headless: process.env.CI === 'true',
    video: process.env.CI === 'true' ? 'retain-on-failure' : 'off'
  },

  // Database setup for integration tests
  database: {
    setup: {
      migrations: './lib/supabase/migrations',
      seeds: './lib/supabase/seeds',
      cleanup: true
    },
    isolation: 'transaction' // or 'database' for full isolation
  },

  // Service dependencies
  services: {
    supabase: {
      required: true,
      healthCheck: '/health',
      timeout: 10000
    },
    redis: {
      required: false,
      healthCheck: 'ping',
      timeout: 5000
    }
  }
};

// Helper functions
const getTestConfig = (suite) => {
  return {
    ...testConfig.global,
    ...testConfig.suites[suite],
    environment: testConfig.environment
  };
};

const setupTestEnvironment = () => {
  // Set environment variables
  Object.entries(testConfig.environment).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
  
  // Create test results directory
  const fs = require('fs');
  if (!fs.existsSync(testConfig.reporting.outputDir)) {
    fs.mkdirSync(testConfig.reporting.outputDir, { recursive: true });
  }
};

const validateTestEnvironment = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  testConfig,
  getTestConfig,
  setupTestEnvironment,
  validateTestEnvironment
};