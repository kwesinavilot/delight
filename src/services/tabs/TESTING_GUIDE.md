# Smart Sidepanel Tab Management - Testing Guide

This document provides comprehensive testing scenarios for the smart sidepanel tab management system.

## Overview

The smart tab management system consists of several components that work together to provide robust sidepanel functionality:

1. **Tab Validation Service** - Validates URLs and checks tab accessibility
2. **Smart Tab Selector** - Finds the best available tab for sidepanel attachment
3. **Error Recovery Manager** - Handles failures and provides fallback strategies
4. **Enhanced Sidepanel Manager** - Orchestrates the entire minimize-to-sidepanel operation

## Manual Testing Scenarios

### 1. Basic Functionality Tests

#### Test 1.1: Normal Minimize to Sidepanel
**Setup:**
- Open extension in fullscreen mode (tab mode)
- Have at least one regular HTTP/HTTPS tab open

**Steps:**
1. Click the minimize button in the extension
2. Observe the transition

**Expected Result:**
- Extension should minimize to sidepanel on the HTTP/HTTPS tab
- Current fullscreen tab should close
- Target tab should become active

#### Test 1.2: Multiple Valid Tabs Available
**Setup:**
- Open extension in fullscreen mode
- Have multiple HTTP/HTTPS tabs open with different last access times

**Steps:**
1. Click minimize button
2. Check which tab was selected

**Expected Result:**
- Should select the most recently active valid tab
- Should prioritize HTTPS over HTTP
- Should avoid pinned tabs if possible

### 2. Edge Case Tests

#### Test 2.1: No Valid Tabs Available
**Setup:**
- Open extension in fullscreen mode
- Close all regular tabs, leaving only chrome:// or extension tabs

**Steps:**
1. Click minimize button
2. Observe behavior

**Expected Result:**
- Should create a new tab with fallback URL (Google.com)
- Should attach sidepanel to the new tab
- Should log the fallback creation

#### Test 2.2: All Tabs Are Restricted URLs
**Setup:**
- Open extension in fullscreen mode
- Have only chrome://, file://, or chrome-extension:// tabs open

**Steps:**
1. Click minimize button
2. Check console logs

**Expected Result:**
- Should detect no valid tabs
- Should create fallback tab
- Should log "No valid tabs found, creating fallback"

#### Test 2.3: Target Tab Becomes Invalid During Operation
**Setup:**
- Open extension in fullscreen mode
- Have one valid tab open
- During minimize operation, navigate that tab to chrome://

**Steps:**
1. Start minimize operation
2. Quickly navigate the target tab to chrome://settings
3. Observe recovery behavior

**Expected Result:**
- Should detect tab became invalid
- Should use error recovery to find alternative or create new tab
- Should complete operation successfully

### 3. Error Recovery Tests

#### Test 3.1: Chrome API Failure Simulation
**Setup:**
- Open browser developer tools
- Set breakpoints or use network throttling to simulate API delays

**Steps:**
1. Attempt minimize operation during simulated API issues
2. Observe retry behavior

**Expected Result:**
- Should retry failed operations with exponential backoff
- Should eventually succeed or gracefully fail with fallback
- Should log retry attempts

#### Test 3.2: Sidepanel API Failure
**Setup:**
- Have valid tabs available
- Simulate sidepanel.open() failure (can be done by temporarily disabling sidepanel permission)

**Steps:**
1. Attempt minimize operation
2. Observe error recovery

**Expected Result:**
- Should detect sidepanel operation failure
- Should attempt recovery strategies
- Should log error recovery attempts

### 4. Performance Tests

#### Test 4.1: Large Number of Tabs
**Setup:**
- Open 50+ tabs with mixed URL types
- Open extension in fullscreen mode

**Steps:**
1. Click minimize button
2. Measure operation time
3. Check console for performance logs

**Expected Result:**
- Should complete operation in reasonable time (< 3 seconds)
- Should log transition time
- Should select appropriate tab despite large number

#### Test 4.2: Rapid Successive Operations
**Setup:**
- Open extension in fullscreen mode
- Have valid tabs available

**Steps:**
1. Click minimize button rapidly multiple times
2. Observe behavior

**Expected Result:**
- Should prevent multiple simultaneous operations
- Button should show loading state
- Should complete first operation and ignore subsequent clicks

### 5. Cross-Window Tests

#### Test 5.1: Multiple Browser Windows
**Setup:**
- Open multiple browser windows
- Have valid tabs in different windows
- Open extension in fullscreen mode

**Steps:**
1. Click minimize button
2. Observe which window/tab is selected

**Expected Result:**
- Should prefer tabs in current window
- Should fall back to other windows if needed
- Should focus the selected window/tab

#### Test 5.2: Incognito Mode Compatibility
**Setup:**
- Open incognito window with valid tabs
- Open extension in fullscreen mode in incognito

**Steps:**
1. Test minimize operation in incognito mode
2. Verify functionality

**Expected Result:**
- Should work normally in incognito mode
- Should only consider incognito tabs
- Should not interfere with regular browsing session

### 6. State Preservation Tests

#### Test 6.1: Extension State During Transition
**Setup:**
- Open extension in fullscreen mode
- Have active chat conversation or settings changes

**Steps:**
1. Make changes in extension (chat messages, settings)
2. Minimize to sidepanel
3. Check if state is preserved

**Expected Result:**
- Extension state should be preserved
- Chat history should remain
- Settings should be maintained

### 7. Diagnostic and Health Check Tests

#### Test 7.1: Diagnostic Information
**Setup:**
- Have various types of tabs open (valid, invalid, restricted)

**Steps:**
1. Open browser console
2. Run: `enhancedSidepanelManager.getDiagnosticInfo()`
3. Review output

**Expected Result:**
- Should show accurate count of total, valid, and accessible tabs
- Should list top-scored tabs with reasons
- Should provide useful debugging information

#### Test 7.2: Health Check
**Setup:**
- Various browser states (normal, restricted permissions, etc.)

**Steps:**
1. Run: `enhancedSidepanelManager.performHealthCheck()`
2. Review health status and recommendations

**Expected Result:**
- Should accurately assess system health
- Should provide actionable recommendations
- Should identify permission or configuration issues

## Console Logging Verification

During testing, monitor the browser console for these log patterns:

### Normal Operation Logs
```
[EnhancedSidepanelManager] Starting enhanced minimize to sidepanel operation
[EnhancedSidepanelManager] Selected existing tab: 123 https://example.com
[EnhancedSidepanelManager] Opening sidepanel on tab: 123
[EnhancedSidepanelManager] Successfully completed minimize to sidepanel in 250ms
```

### Fallback Operation Logs
```
[EnhancedSidepanelManager] No suitable existing tab, using error recovery
[ErrorRecovery:MinimizeToSidepanel] Starting comprehensive recovery
[SmartTabSelector] Creating fallback tab with URL: https://www.google.com
[EnhancedSidepanelManager] Successfully completed minimize to sidepanel in 1200ms
```

### Error Recovery Logs
```
[ErrorRecovery:TabQuery] Starting error recovery for tab query failure
[ErrorRecovery:TabQuery] Attempt 1: Retrying tab query
[ErrorRecovery:TabQuery] Creating fallback tab as recovery strategy
```

## Expected Behavior Summary

| Scenario | Expected Behavior |
|----------|------------------|
| Valid tabs available | Select best tab based on scoring algorithm |
| No valid tabs | Create fallback tab with Google.com |
| API failures | Retry with exponential backoff, then fallback |
| Multiple windows | Prefer current window, fallback to others |
| Rapid clicks | Prevent concurrent operations |
| Large tab count | Complete within 3 seconds |
| State preservation | Maintain extension state across transitions |

## Troubleshooting Common Issues

### Issue: "No valid tabs found"
- **Cause:** All open tabs have restricted URLs
- **Solution:** Open an HTTP/HTTPS tab or let system create fallback

### Issue: "Sidepanel operation failed"
- **Cause:** Chrome API temporary failure or permission issue
- **Solution:** System should auto-retry and recover

### Issue: Slow performance with many tabs
- **Cause:** Large number of tabs to process
- **Solution:** System should still complete within reasonable time

### Issue: Extension state lost during transition
- **Cause:** Improper state management
- **Solution:** Verify extension background script and storage

## Success Criteria

The smart sidepanel tab management system is considered successful if:

1. ✅ Handles all edge cases without user-visible errors
2. ✅ Provides appropriate fallbacks for every failure scenario
3. ✅ Completes operations within reasonable time limits
4. ✅ Preserves extension state during transitions
5. ✅ Provides clear logging for debugging
6. ✅ Works across different browser configurations
7. ✅ Prevents the original ERR_FILE_NOT_FOUND errors

## Automated Testing Considerations

While this implementation focuses on manual testing, future automated testing could include:

- Unit tests for individual service methods
- Integration tests for service interactions
- End-to-end tests using Chrome extension testing frameworks
- Performance benchmarks for large tab scenarios
- Mock Chrome API testing for error conditions