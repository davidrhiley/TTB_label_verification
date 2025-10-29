const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // Run all tests in parallel
  fullyParallel: true,
  workers: 10,
  // Increase default timeout to allow for OCR processing
  timeout: 120000, // 2 minutes per test
  // Configure output folder for failed test screenshots with unique subdirectory per run
  use: {
    headless: false,
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    trace: 'retain-on-failure',
    viewport: { width: 1200, height: 800 },  // Wider browser windows
  },
  // Only create output directories for failed tests
  testDir: '.',
  outputDir: 'test-results',
  // Use custom reporter to add FAIL- prefix and list reporter for console output
  reporter: [
    ['./custom-reporter.js'],
    ['list']
  ],
  // Global teardown to remove .last-run.json after tests complete
  globalTeardown: './global-teardown.js',
});
