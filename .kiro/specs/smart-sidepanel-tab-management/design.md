# Design Document

## Overview

This design addresses the ERR_FILE_NOT_FOUND error that occurs when switching from fullscreen mode to sidepanel mode. The current implementation in `minimizeToSidePanel()` has a basic tab selection strategy that can fail when no suitable tabs are found or when the selected tab becomes invalid. We will implement a robust tab management system with intelligent fallback strategies.

## Architecture

### Current Issues Analysis

1. **Limited Tab Validation**: Current code only checks for `chrome://` and `chrome-extension://` URLs
2. **No Fallback for Invalid Tabs**: When no suitable tab is found, the function just calls `window.close()`
3. **Race Conditions**: Tab state can change between query and usage
4. **Missing Error Recovery**: No retry logic or alternative strategies

### Proposed Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Smart Tab Manager                            │
├─────────────────────────────────────────────────────────────┤
│  1. Tab Validation Service                                  │
│     - URL validation                                        │
│     - Tab accessibility check                               │
│     - Tab state verification                                │
│                                                             │
│  2. Tab Selection Strategy                                  │
│     - Most recent valid tab                                 │
│     - Fallback to other valid tabs                          │
│     - New tab creation as last resort                       │
│                                                             │
│  3. Error Recovery System                                   │
│     - Retry logic for failed operations                     │
│     - Graceful degradation                                  │
│     - User-friendly error handling                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Tab Validation Service

```typescript
interface TabValidationService {
  isValidForSidePanel(tab: chrome.tabs.Tab): boolean;
  isAccessible(tab: chrome.tabs.Tab): Promise<boolean>;
  getTabScore(tab: chrome.tabs.Tab): number; // For prioritization
}
```

**Responsibilities:**
- Validate tab URLs against restricted patterns
- Check if tab is accessible and not in error state
- Assign priority scores for tab selection

**Invalid URL Patterns:**
- `chrome://` - Chrome internal pages
- `chrome-extension://` - Extension pages
- `file://` - Local file URLs (main cause of ERR_FILE_NOT_FOUND)
- `about:` - Browser about pages
- `moz-extension://` - Firefox extension pages (for future compatibility)

### 2. Smart Tab Selector

```typescript
interface SmartTabSelector {
  findBestTab(options?: TabSelectionOptions): Promise<chrome.tabs.Tab | null>;
  createFallbackTab(): Promise<chrome.tabs.Tab>;
  ensureValidTab(): Promise<chrome.tabs.Tab>;
}

interface TabSelectionOptions {
  excludeCurrentTab?: boolean;
  preferRecentlyActive?: boolean;
  windowId?: number;
}
```

**Selection Strategy:**
1. **Primary**: Most recently active valid tab in current window
2. **Secondary**: Any valid tab in current window (by recency)
3. **Tertiary**: Most recently active valid tab in any window
4. **Fallback**: Create new tab with safe URL

### 3. Enhanced Sidepanel Manager

```typescript
interface EnhancedSidepanelManager {
  minimizeToSidePanel(): Promise<void>;
  openSidepanelOnTab(tabId: number): Promise<void>;
  handleTabTransition(fromFullscreen: boolean): Promise<void>;
}
```

**Responsibilities:**
- Orchestrate the minimize operation
- Handle all error scenarios gracefully
- Maintain user state during transitions

## Data Models

### Tab Priority Score

```typescript
interface TabScore {
  tabId: number;
  score: number;
  reasons: string[];
  lastActive: number;
  isValid: boolean;
}
```

**Scoring Criteria:**
- **+100**: Recently active (within last 5 minutes)
- **+50**: Normal web page (http/https)
- **+30**: Has content (not blank page)
- **+20**: In current window
- **+10**: Not pinned (easier to work with)
- **-50**: Restricted URL pattern
- **-100**: Inaccessible or error state

### Fallback Configuration

```typescript
interface FallbackConfig {
  defaultNewTabUrl: string;
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableLogging: boolean;
}
```

## Error Handling

### Error Categories

1. **Tab Query Errors**: Chrome API failures when querying tabs
2. **Tab Access Errors**: Permission or state issues with specific tabs
3. **Sidepanel API Errors**: Failures in sidepanel operations
4. **Race Condition Errors**: Tab state changes during operation

### Recovery Strategies

```typescript
class ErrorRecoveryManager {
  async handleTabQueryError(): Promise<chrome.tabs.Tab> {
    // Fallback: Create new tab immediately
  }
  
  async handleTabAccessError(tabId: number): Promise<chrome.tabs.Tab> {
    // Retry with different tab or create new one
  }
  
  async handleSidepanelError(tabId: number): Promise<void> {
    // Retry sidepanel operation or fallback to popup
  }
}
```

### Graceful Degradation

1. **Level 1**: Smart tab selection works perfectly
2. **Level 2**: Basic tab selection with enhanced validation
3. **Level 3**: Force create new tab and attach sidepanel
4. **Level 4**: Fallback to popup mode if sidepanel fails entirely

## Testing Strategy

### Unit Tests

1. **Tab Validation Tests**
   - Test URL pattern matching
   - Test accessibility checks
   - Test scoring algorithm

2. **Tab Selection Tests**
   - Test selection priority logic
   - Test fallback scenarios
   - Test edge cases (no tabs, all invalid tabs)

3. **Error Handling Tests**
   - Test retry logic
   - Test graceful degradation
   - Test error logging

### Integration Tests

1. **End-to-End Transition Tests**
   - Test fullscreen to sidepanel transition
   - Test with various tab states
   - Test with restricted URLs

2. **Chrome API Integration Tests**
   - Test with real Chrome tabs API
   - Test permission scenarios
   - Test concurrent operations

### Manual Testing Scenarios

1. **Common Cases**
   - Switch with normal web pages open
   - Switch with multiple valid tabs
   - Switch with mixed valid/invalid tabs

2. **Edge Cases**
   - Switch with only file:// URLs open
   - Switch with only chrome:// pages open
   - Switch with no tabs open (shouldn't happen but test anyway)
   - Switch during page loading
   - Switch with tabs in error state

3. **Error Recovery**
   - Simulate Chrome API failures
   - Test with rapidly changing tab states
   - Test with permission restrictions

## Implementation Plan

### Phase 1: Core Tab Management
- Implement TabValidationService
- Implement SmartTabSelector with basic strategy
- Add comprehensive URL pattern validation

### Phase 2: Enhanced Selection Logic
- Add tab scoring system
- Implement priority-based selection
- Add cross-window tab search

### Phase 3: Error Recovery
- Implement retry logic
- Add graceful degradation
- Implement comprehensive error logging

### Phase 4: Integration and Testing
- Integrate with existing MainSidePanel component
- Add comprehensive test suite
- Performance optimization and edge case handling

## Security Considerations

1. **URL Validation**: Ensure no bypass of Chrome's security restrictions
2. **Permission Checks**: Verify tab access permissions before operations
3. **Error Information**: Avoid exposing sensitive information in error messages
4. **API Usage**: Follow Chrome extension best practices for tab manipulation

## Performance Considerations

1. **Tab Query Optimization**: Minimize Chrome API calls
2. **Caching Strategy**: Cache tab information for short periods
3. **Async Operations**: Use proper async/await patterns to avoid blocking
4. **Memory Management**: Clean up event listeners and avoid memory leaks