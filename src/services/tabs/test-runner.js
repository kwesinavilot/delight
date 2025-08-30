/**
 * Manual Test Runner for Smart Sidepanel Tab Management
 * 
 * This script can be run in the browser console to perform
 * basic functionality tests of the tab management system.
 * 
 * Usage: Copy and paste this script into the browser console
 * when the extension is loaded.
 */

(async function runTabManagementTests() {
  console.log('🧪 Starting Smart Sidepanel Tab Management Tests');
  console.log('================================================');

  // Import the services (assuming they're available globally or via extension context)
  let services;
  try {
    // Try to access services - this will work if running in extension context
    services = {
      tabValidationService: window.tabValidationService,
      smartTabSelector: window.smartTabSelector,
      errorRecoveryManager: window.errorRecoveryManager,
      enhancedSidepanelManager: window.enhancedSidepanelManager
    };

    // If not available globally, try to import (this might not work in all contexts)
    if (!services.tabValidationService) {
      console.log('⚠️  Services not available globally. Make sure to run this in extension context.');
      return;
    }
  } catch (error) {
    console.error('❌ Failed to access tab management services:', error);
    return;
  }

  const tests = [];
  let passedTests = 0;
  let failedTests = 0;

  // Helper function to run a test
  async function runTest(name, testFn) {
    console.log(`\n🔍 Running: ${name}`);
    try {
      const result = await testFn();
      if (result) {
        console.log(`✅ PASSED: ${name}`);
        passedTests++;
      } else {
        console.log(`❌ FAILED: ${name}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${name} - ${error.message}`);
      failedTests++;
    }
  }

  // Test 1: Basic Chrome API Access
  await runTest('Chrome APIs Available', async () => {
    return chrome && chrome.tabs && chrome.sidePanel;
  });

  // Test 2: Tab Query Functionality
  await runTest('Tab Query Works', async () => {
    const tabs = await chrome.tabs.query({});
    console.log(`   Found ${tabs.length} total tabs`);
    return tabs.length > 0;
  });

  // Test 3: Tab Validation Service
  await runTest('Tab Validation Service', async () => {
    const tabs = await chrome.tabs.query({});
    if (tabs.length === 0) return false;

    const testTab = tabs[0];
    const isValid = services.tabValidationService.isValidForSidePanel(testTab);
    const score = services.tabValidationService.getTabScore(testTab);
    
    console.log(`   Test tab: ${testTab.url}`);
    console.log(`   Valid: ${isValid}, Score: ${score}`);
    
    return typeof isValid === 'boolean' && typeof score === 'number';
  });

  // Test 4: Smart Tab Selector
  await runTest('Smart Tab Selector', async () => {
    const bestTab = await services.smartTabSelector.findBestTab();
    console.log(`   Best tab: ${bestTab ? `${bestTab.id} - ${bestTab.url}` : 'None found'}`);
    
    // Should either find a tab or return null (both are valid)
    return bestTab === null || (bestTab && bestTab.id);
  });

  // Test 5: Diagnostic Information
  await runTest('Diagnostic Information', async () => {
    const diagnostics = await services.enhancedSidepanelManager.getDiagnosticInfo();
    
    console.log('   Diagnostics:', {
      totalTabs: diagnostics.totalTabs,
      validTabs: diagnostics.validTabs,
      accessibleTabs: diagnostics.accessibleTabs,
      topScoredCount: diagnostics.topScoredTabs.length
    });
    
    return diagnostics.totalTabs >= 0 && diagnostics.validTabs >= 0;
  });

  // Test 6: Health Check
  await runTest('System Health Check', async () => {
    const health = await services.enhancedSidepanelManager.performHealthCheck();
    
    console.log(`   System healthy: ${health.healthy}`);
    if (health.issues.length > 0) {
      console.log('   Issues:', health.issues);
    }
    if (health.recommendations.length > 0) {
      console.log('   Recommendations:', health.recommendations);
    }
    
    return typeof health.healthy === 'boolean';
  });

  // Test 7: Error Recovery Configuration
  await runTest('Error Recovery Configuration', async () => {
    const config = services.errorRecoveryManager.getConfig();
    
    console.log('   Error recovery config:', {
      maxRetryAttempts: config.maxRetryAttempts,
      retryDelayMs: config.retryDelayMs,
      enableDetailedLogging: config.enableDetailedLogging
    });
    
    return config.maxRetryAttempts > 0 && config.retryDelayMs > 0;
  });

  // Test 8: Tab Scoring Algorithm
  await runTest('Tab Scoring Algorithm', async () => {
    const tabs = await chrome.tabs.query({});
    if (tabs.length === 0) return true; // No tabs to test, but that's okay

    const scoredTabs = tabs.map(tab => ({
      tab,
      score: services.tabValidationService.getDetailedTabScore(tab)
    }));

    console.log('   Sample tab scores:');
    scoredTabs.slice(0, 3).forEach(({ tab, score }) => {
      console.log(`     ${tab.id}: ${score.score} (${score.reasons.join(', ')})`);
    });

    return scoredTabs.every(({ score }) => typeof score.score === 'number');
  });

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The smart sidepanel tab management system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the individual test results above for details.');
  }

  // Additional manual test suggestions
  console.log('\n📋 Manual Tests to Perform:');
  console.log('1. Open extension in fullscreen mode and click minimize button');
  console.log('2. Test with only chrome:// tabs open');
  console.log('3. Test with many tabs open (20+)');
  console.log('4. Test rapid clicking of minimize button');
  console.log('5. Test in incognito mode');
  console.log('6. Test with multiple browser windows');

  return {
    passed: passedTests,
    failed: failedTests,
    total: passedTests + failedTests,
    successRate: (passedTests / (passedTests + failedTests)) * 100
  };
})().catch(error => {
  console.error('❌ Test runner failed:', error);
});