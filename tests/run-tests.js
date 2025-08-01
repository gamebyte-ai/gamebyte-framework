#!/usr/bin/env node

/**
 * Test runner script for GameByte Framework
 * Provides a comprehensive way to run different test suites
 */

const { execSync } = require('child_process');
const path = require('path');

const testSuites = {
  unit: {
    description: 'Run unit tests only',
    command: 'npm run test:unit'
  },
  integration: {
    description: 'Run integration tests only',
    command: 'npm run test:integration'
  },
  coverage: {
    description: 'Run all tests with coverage report',
    command: 'npm run test:coverage'
  },
  watch: {
    description: 'Run tests in watch mode',
    command: 'npm run test:watch'
  },
  all: {
    description: 'Run all tests',
    command: 'npm test'
  }
};

function showHelp() {
  console.log('GameByte Framework Test Runner\n');
  console.log('Usage: node run-tests.js [suite]\n');
  console.log('Available test suites:');
  
  Object.entries(testSuites).forEach(([key, suite]) => {
    console.log(`  ${key.padEnd(12)} - ${suite.description}`);
  });
  
  console.log('\nExamples:');
  console.log('  node run-tests.js unit      # Run unit tests');
  console.log('  node run-tests.js coverage  # Run with coverage');
  console.log('  node run-tests.js           # Run all tests (default)');
}

function runTestSuite(suiteName) {
  const suite = testSuites[suiteName];
  
  if (!suite) {
    console.error(`Unknown test suite: ${suiteName}`);
    console.error('Run "node run-tests.js --help" for available suites');
    process.exit(1);
  }
  
  console.log(`Running ${suite.description}...`);
  console.log(`Command: ${suite.command}\n`);
  
  try {
    execSync(suite.command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`\n✅ ${suite.description} completed successfully`);
  } catch (error) {
    console.error(`\n❌ ${suite.description} failed`);
    process.exit(error.status || 1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const suiteName = args[0] || 'all';

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

runTestSuite(suiteName);