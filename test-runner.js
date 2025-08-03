#!/usr/bin/env node

/**
 * Comprehensive Test Runner for AgroClash Platform
 * Runs all types of tests in sequence with proper reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, duration: 0 },
      integration: { passed: 0, failed: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, duration: 0 },
      performance: { passed: 0, failed: 0, duration: 0 },
      visual: { passed: 0, failed: 0, duration: 0 },
      crossPlatform: { passed: 0, failed: 0, duration: 0 },
      offline: { passed: 0, failed: 0, duration: 0 }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runCommand(command, cwd = process.cwd()) {
    this.log(`Running: ${command}`, 'info');
    const startTime = Date.now();
    
    try {
      const output = execSync(command, { 
        cwd, 
        stdio: 'pipe',
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const duration = Date.now() - startTime;
      this.log(`✅ Command completed in ${duration}ms`, 'success');
      
      return { success: true, output, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ Command failed in ${duration}ms: ${error.message}`, 'error');
      
      return { success: false, error: error.message, duration };
    }
  }

  async runUnitTests() {
    this.log('🧪 Running Unit Tests', 'info');
    
    // Web unit tests
    const webResult = await this.runCommand('npm test -- --coverage --watchAll=false', './agroclash-web');
    
    // Mobile unit tests
    const mobileResult = await this.runCommand('npm test -- --coverage --watchAll=false', './agroclash-mobile');
    
    // Lib unit tests
    const libResult = await this.runCommand('npm test -- --coverage --watchAll=false', './lib');
    
    this.results.unit.duration = webResult.duration + mobileResult.duration + libResult.duration;
    this.results.unit.passed = webResult.success && mobileResult.success && libResult.success ? 1 : 0;
    this.results.unit.failed = this.results.unit.passed ? 0 : 1;
    
    return webResult.success && mobileResult.success && libResult.success;
  }

  async runIntegrationTests() {
    this.log('🔗 Running Integration Tests', 'info');
    
    const result = await this.runCommand('npm test -- --testPathPattern=integration --watchAll=false', './lib');
    
    this.results.integration.duration = result.duration;
    this.results.integration.passed = result.success ? 1 : 0;
    this.results.integration.failed = result.success ? 0 : 1;
    
    return result.success;
  }

  async runE2ETests() {
    this.log('🎭 Running End-to-End Tests', 'info');
    
    // Start the development server
    this.log('Starting development server...', 'info');
    const serverProcess = require('child_process').spawn('npm', ['run', 'dev'], {
      cwd: './agroclash-web',
      stdio: 'pipe'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      const result = await this.runCommand('npx playwright test --reporter=json', './agroclash-web');
      
      this.results.e2e.duration = result.duration;
      this.results.e2e.passed = result.success ? 1 : 0;
      this.results.e2e.failed = result.success ? 0 : 1;
      
      return result.success;
    } finally {
      // Kill the server
      serverProcess.kill();
    }
  }

  async runPerformanceTests() {
    this.log('⚡ Running Performance Tests', 'info');
    
    // Memory tests
    const memoryResult = await this.runCommand('npx playwright test tests/performance/memory-test.spec.ts', './agroclash-web');
    
    // Load tests (if k6 is available)
    let loadResult = { success: true, duration: 0 };
    try {
      loadResult = await this.runCommand('k6 run tests/performance/load-test.js', './agroclash-web');
    } catch (error) {
      this.log('⚠️ k6 not available, skipping load tests', 'warning');
    }
    
    this.results.performance.duration = memoryResult.duration + loadResult.duration;
    this.results.performance.passed = memoryResult.success && loadResult.success ? 1 : 0;
    this.results.performance.failed = this.results.performance.passed ? 0 : 1;
    
    return memoryResult.success && loadResult.success;
  }

  async runVisualTests() {
    this.log('👁️ Running Visual Regression Tests', 'info');
    
    const result = await this.runCommand('npx playwright test --grep @visual', './agroclash-web');
    
    this.results.visual.duration = result.duration;
    this.results.visual.passed = result.success ? 1 : 0;
    this.results.visual.failed = result.success ? 0 : 1;
    
    return result.success;
  }

  async runCrossPlatformTests() {
    this.log('📱 Running Cross-Platform Tests', 'info');
    
    const result = await this.runCommand('npm test -- --testPathPattern=cross-platform --watchAll=false', './tests');
    
    this.results.crossPlatform.duration = result.duration;
    this.results.crossPlatform.passed = result.success ? 1 : 0;
    this.results.crossPlatform.failed = result.success ? 0 : 1;
    
    return result.success;
  }

  async runOfflineTests() {
    this.log('📴 Running Offline Tests', 'info');
    
    const result = await this.runCommand('npx playwright test --grep @offline', './agroclash-web');
    
    this.results.offline.duration = result.duration;
    this.results.offline.passed = result.success ? 1 : 0;
    this.results.offline.failed = result.success ? 0 : 1;
    
    return result.success;
  }

  generateReport() {
    this.log('📊 Generating Test Report', 'info');
    
    const totalTests = Object.values(this.results).reduce((sum, result) => sum + result.passed + result.failed, 0);
    const totalPassed = Object.values(this.results).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, result) => sum + result.failed, 0);
    const totalDuration = Object.values(this.results).reduce((sum, result) => sum + result.duration, 0);
    
    const report = {
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        duration: totalDuration,
        successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0
      },
      details: this.results,
      timestamp: new Date().toISOString()
    };
    
    // Write report to file
    fs.writeFileSync('test-results/comprehensive-test-report.json', JSON.stringify(report, null, 2));
    
    // Console output
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${report.summary.successRate}%)`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
    
    Object.entries(this.results).forEach(([testType, result]) => {
      const status = result.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${testType.padEnd(15)}: ${result.passed}/${result.passed + result.failed} (${(result.duration / 1000).toFixed(2)}s)`);
    });
    
    console.log('='.repeat(60));
    
    return report;
  }

  async runAll() {
    this.log('🚀 Starting Comprehensive Test Suite', 'info');
    
    // Ensure test results directory exists
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    
    const testSuites = [
      { name: 'Unit Tests', fn: () => this.runUnitTests() },
      { name: 'Integration Tests', fn: () => this.runIntegrationTests() },
      { name: 'Cross-Platform Tests', fn: () => this.runCrossPlatformTests() },
      { name: 'E2E Tests', fn: () => this.runE2ETests() },
      { name: 'Offline Tests', fn: () => this.runOfflineTests() },
      { name: 'Performance Tests', fn: () => this.runPerformanceTests() },
      { name: 'Visual Tests', fn: () => this.runVisualTests() }
    ];
    
    let allPassed = true;
    
    for (const suite of testSuites) {
      try {
        const passed = await suite.fn();
        if (!passed) {
          allPassed = false;
          this.log(`❌ ${suite.name} failed`, 'error');
        } else {
          this.log(`✅ ${suite.name} passed`, 'success');
        }
      } catch (error) {
        allPassed = false;
        this.log(`💥 ${suite.name} crashed: ${error.message}`, 'error');
      }
    }
    
    const report = this.generateReport();
    
    if (allPassed) {
      this.log('🎉 All tests passed!', 'success');
      process.exit(0);
    } else {
      this.log('💔 Some tests failed', 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  if (args.length === 0) {
    runner.runAll();
  } else {
    const testType = args[0];
    const methodMap = {
      'unit': 'runUnitTests',
      'integration': 'runIntegrationTests',
      'e2e': 'runE2ETests',
      'performance': 'runPerformanceTests',
      'visual': 'runVisualTests',
      'cross-platform': 'runCrossPlatformTests',
      'offline': 'runOfflineTests'
    };
    
    if (methodMap[testType]) {
      runner[methodMap[testType]]().then(success => {
        process.exit(success ? 0 : 1);
      });
    } else {
      console.error(`Unknown test type: ${testType}`);
      console.error('Available types:', Object.keys(methodMap).join(', '));
      process.exit(1);
    }
  }
}

module.exports = TestRunner;