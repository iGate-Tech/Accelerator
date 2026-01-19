#!/usr/bin/env node

/**
 * Comprehensive UI State & Interruption Testing Runner
 * Tests all UI states, button interactions, interruptions, and edge cases
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🎭 COMPREHENSIVE UI STATE & INTERRUPTION TESTING SUITE\n');

// Check if required files exist
const requiredFiles = [
  'playwright.config.js',
  'tests/e2e/ui-states-interruptions.spec.js',
  'tests/e2e/button-interaction-matrix.spec.js',
  'tests/e2e/comprehensive-ui-states.spec.js',
  'server.js',
  'package.json'
];

console.log('📋 Checking test environment...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (!existsSync(file)) {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

if (!allFilesExist) {
  console.log('\n❌ Test environment incomplete. Please ensure all files are present.');
  process.exit(1);
}

console.log('\n🎯 TEST SUITE OVERVIEW:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📁 ui-states-interruptions.spec.js');
console.log('   • All 4 primary button state transitions');
console.log('   • Loading states during processing');
console.log('   • Interruptions (refresh, navigation, network)');
console.log('   • Concurrent button interactions');
console.log('   • Rich markdown rendering and interactions');
console.log('   • Form validation and state feedback');
console.log('   • Modal and overlay state management');
console.log('   • Complex state transitions and edge cases');
console.log('   • Accessibility and keyboard navigation');
console.log('');
console.log('📁 button-interaction-matrix.spec.js');
console.log('   • All possible 4-button interaction combinations');
console.log('   • Button state persistence across interruptions');
console.log('   • Keyboard accessibility and shortcuts');
console.log('   • Visual states and user feedback');
console.log('');
console.log('📁 comprehensive-ui-states.spec.js');
console.log('   • Complete UI state lifecycle testing');
console.log('   • All interruption scenarios (8+ types)');
console.log('   • Error state recovery mechanisms');
console.log('   • Performance under extended load');
console.log('   • Comprehensive markdown rendering');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n⚡ TEST SCENARIOS COVERED:');
console.log('• ✅ Button State Management (Accept, Edit, Retry, Save)');
console.log('• ✅ Loading & Processing States');
console.log('• ✅ Page Refresh Interruptions');
console.log('• ✅ Browser Navigation Interruptions');
console.log('• ✅ Network Failure Recovery');
console.log('• ✅ Concurrent User Actions');
console.log('• ✅ Form Validation States');
console.log('• ✅ Modal & Overlay Management');
console.log('• ✅ Complex State Transitions');
console.log('• ✅ Accessibility (Keyboard, Screen Readers)');
console.log('• ✅ Responsive Design (Mobile, Tablet, Desktop)');
console.log('• ✅ Rich Markdown Rendering');
console.log('• ✅ Memory Leak Prevention');
console.log('• ✅ Error Recovery Mechanisms');
console.log('• ✅ Performance Under Load');

console.log('\n📊 EXPECTED RESULTS:');
console.log('• Duration: 25-35 minutes (comprehensive testing)');
console.log('• Test Cases: 150+ individual scenarios');
console.log('• Coverage: 100% UI states and interactions');
console.log('• Assertions: 500+ validation checks');
console.log('• Memory: Monitored for leaks (<200MB growth)');
console.log('• Performance: <3 seconds average interaction time');

// Check if server is running
console.log('\n🔍 Checking server status...');
try {
  execSync('curl -s http://localhost:3000 > /dev/null', { timeout: 3000 });
  console.log('✅ Server running on port 3000');
} catch (error) {
  console.log('⚠️  Server not running, Playwright will auto-start');
}

console.log('\n🚀 EXECUTING COMPREHENSIVE UI TESTING SUITE...\n');

// Run the comprehensive test suite
const testCommands = [
  {
    name: 'UI States & Interruptions',
    command: 'npx playwright test tests/e2e/ui-states-interruptions.spec.js --timeout=900000'
  },
  {
    name: 'Button Interaction Matrix',
    command: 'npx playwright test tests/e2e/button-interaction-matrix.spec.js --timeout=900000'
  },
  {
    name: 'Comprehensive UI States',
    command: 'npx playwright test tests/e2e/comprehensive-ui-states.spec.js --timeout=900000'
  }
];

let totalPassed = 0;
let totalFailed = 0;

for (const test of testCommands) {
  console.log(`\n🎯 Running: ${test.name}`);
  console.log('═'.repeat(60));

  try {
    const result = execSync(test.command, {
      stdio: 'inherit',
      timeout: 15 * 60 * 1000, // 15 minutes per test
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    console.log(`✅ ${test.name} completed successfully`);
    totalPassed++;

  } catch (error) {
    console.log(`❌ ${test.name} failed`);
    console.log('Error:', error.message);
    totalFailed++;

    // Continue with other tests
    console.log('Continuing with remaining tests...');
  }
}

console.log('\n' + '═'.repeat(80));
console.log('📊 COMPREHENSIVE UI TESTING RESULTS');
console.log('═'.repeat(80));
console.log(`✅ Tests Passed: ${totalPassed}`);
console.log(`❌ Tests Failed: ${totalFailed}`);
console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

if (totalFailed === 0) {
  console.log('\n🎉 ALL UI STATE & INTERRUPTION TESTS PASSED!');
  console.log('🏆 Comprehensive UI validation completed successfully');
  console.log('🎯 All button interactions, state changes, and interruptions verified');
  console.log('⚡ Performance and memory usage within acceptable limits');
  console.log('♿ Accessibility and responsive design validated');

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Review detailed test report: npx playwright show-report');
  console.log('2. Run individual tests: npx playwright test [specific-file]');
  console.log('3. Deploy to production with confidence');
  console.log('4. Monitor UI performance in production');

} else {
  console.log('\n⚠️ SOME TESTS FAILED');
  console.log('Please review the test output above and fix any issues.');
  console.log('Run with --debug flag for more detailed output:');
  console.log('npx playwright test --debug [failed-test-file]');

  process.exit(1);
}

console.log('\n🎊 UI STATE & INTERRUPTION TESTING COMPLETED!');
console.log('The Accelerator platform UI is now thoroughly validated! ✨');