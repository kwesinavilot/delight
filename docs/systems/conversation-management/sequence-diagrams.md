# Conversation Management System - Sequence Diagrams

This document contains detailed sequence diagrams showing the interaction patterns within the Conversation Management System.

## Message Lifecycle Sequences

### Complete Message Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant ConversationManager
    participant MessageStore
    participant ContextProcessor
    participant PerformanceOptimizer
    participant ChromeStorage
    
    Note over User: Send message
    User->>UI: Input message
    UI->>ConversationManager: addMessage({role: 'user', content: message})
    
    Note over ConversationManager: Ensure session exists
    ConversationManager->>ConversationManager: getCurrentSession()
    
    alt No current session
        ConversationManager->>ConversationManager: createNewSession()
        ConversationManager->>MessageStore: createSession(provider)
        MessageStore->>MessageStore: generateId()
        MessageStore->>ChromeStorage: save session data
        ChromeStorage-->>MessageStore: session saved
        MessageStore-->>ConversationManager: new session
    end
    
    Note over ConversationManager: Create full message
    ConversationManager->>ConversationManager: generateMessageId()
    ConversationManager->>ConversationManager: fullMessage = {id, timestamp, ...message}
    
    Note over ConversationManager: Store message
    ConversationManager->>MessageStore: addMessage(sessionId, fullMessage)
    
    MessageStore->>MessageStore: getSession(sessionId)
    MessageStore->>MessageStore: session.messages.push(fullMessage)
    
    Note over MessageStore: Check history limits
    MessageStore->>MessageStore: messages.length > maxHistoryLength?
    
    alt Exceeds limit
        MessageStore->>MessageStore: optimizeMessageHistory()
        MessageStore->>MessageStore: keepSystemMessages()
        MessageStore->>MessageStore: keepRecentMessages()
    end
    
    MessageStore->>MessageStore: updateSession(session)
    MessageStore->>ChromeStorage: save updated session
    ChromeStorage-->>MessageStore: session updated
    MessageStore-->>ConversationManager: message added
    
    Note over ConversationManager: Update local session
    ConversationManager->>ConversationManager: currentSession.messages.push(fullMessage)
    ConversationManager->>ConversationManager: currentSession.lastUpdated = now
    
    ConversationManager-->>UI: message added successfully
    UI-->>User: Message sent confirmation
    
    Note over UI: Process AI response
    UI->>ConversationManager: getContextForProvider(providerName)
    ConversationManager->>ContextProcessor: getContextForProvider(providerName)
    
    Note over ContextProcessor: Optimize context
    ContextProcessor->>ContextProcessor: optimizeContext(messages, tokenLimit)
    ContextProcessor->>ContextProcessor: formatForProvider(optimizedMessages, providerName)
    ContextProcessor-->>ConversationManager: provider messages
    
    ConversationManager-->>UI: optimized context
    
    Note over UI: Get AI response and add to conversation
    UI->>ConversationManager: addMessage({role: 'assistant', content: aiResponse})
    
    Note over ConversationManager: Repeat storage process for AI response
    ConversationManager->>MessageStore: addMessage(sessionId, aiResponseMessage)
    MessageStore->>ChromeStorage: save AI response
    ChromeStorage-->>MessageStore: response saved
    MessageStore-->>ConversationManager: AI response added
    
    ConversationManager-->>UI: AI response stored
    UI-->>User: Display AI response
```

### Session Creation and Management

```mermaid
sequenceDiagram
    participant ConversationManager
    participant MessageStore
    participant PerformanceOptimizer
    participant ChromeStorage
    participant Settings
    
    Note over ConversationManager: Create new session
    ConversationManager->>MessageStore: createSession(provider)
    
    Note over MessageStore: Generate session data
    MessageStore->>MessageStore: generateId()
    MessageStore->>MessageStore: session = {id, messages: [], createdAt, provider}
    
    Note over MessageStore: Load and update storage
    MessageStore->>ChromeStorage: get(STORAGE_KEY)
    ChromeStorage-->>MessageStore: current data
    
    MessageStore->>MessageStore: data.sessions[sessionId] = session
    MessageStore->>MessageStore: data.currentSessionId = sessionId
    
    MessageStore->>ChromeStorage: set(STORAGE_KEY, data)
    ChromeStorage-->>MessageStore: data saved
    
    MessageStore-->>ConversationManager: new session
    
    Note over ConversationManager: Update local state
    ConversationManager->>ConversationManager: currentSession = session
    
    Note over ConversationManager: Initialize performance monitoring
    ConversationManager->>PerformanceOptimizer: initializeSessionMonitoring(sessionId)
    PerformanceOptimizer->>PerformanceOptimizer: startSessionTracking(sessionId)
    
    ConversationManager-->>ConversationManager: session ready
```

## Context Processing Sequences

### Context Optimization for Large Histories

```mermaid
sequenceDiagram
    participant ConversationManager
    participant ContextProcessor
    participant PerformanceOptimizer
    participant MessageStore
    participant Settings
    
    Note over ConversationManager: Request context for provider
    ConversationManager->>ContextProcessor: getContextForProvider(providerName)
    
    Note over ContextProcessor: Get conversation history
    ContextProcessor->>ConversationManager: getConversationHistory()
    ConversationManager-->>ContextProcessor: messages[]
    
    Note over ContextProcessor: Check if performance optimization needed
    ContextProcessor->>MessageStore: getSettings()
    MessageStore-->>ContextProcessor: settings
    
    ContextProcessor->>ContextProcessor: messages.length > lazyLoadThreshold?
    
    alt Large history - use performance optimization
        Note over ContextProcessor: Async optimization for large histories
        ContextProcessor->>PerformanceOptimizer: optimizeContextAsync(messages, maxTokens)
        
        PerformanceOptimizer->>PerformanceOptimizer: analyzeMessageImportance(messages)
        PerformanceOptimizer->>PerformanceOptimizer: identifyRedundantMessages(messages)
        PerformanceOptimizer->>PerformanceOptimizer: calculateOptimalTruncation(messages, maxTokens)
        
        Note over PerformanceOptimizer: Apply optimization strategies
        PerformanceOptimizer->>PerformanceOptimizer: preserveSystemMessages(messages)
        PerformanceOptimizer->>PerformanceOptimizer: keepRecentConversation(messages)
        PerformanceOptimizer->>PerformanceOptimizer: summarizeMiddleSection(messages)
        
        PerformanceOptimizer-->>ContextProcessor: optimizationResult
        
        Note over ContextProcessor: Use optimized messages
        ContextProcessor->>ContextProcessor: optimizedMessages = result.optimizedMessages
        
    else Standard optimization
        Note over ContextProcessor: Standard context optimization
        ContextProcessor->>ContextProcessor: optimizeContext(messages, maxTokens)
        
        ContextProcessor->>ContextProcessor: calculateTokenCount(messages)
        ContextProcessor->>ContextProcessor: truncateContext(messages, maxTokens)
        
        ContextProcessor->>ContextProcessor: optimizedMessages = truncatedMessages
    end
    
    Note over ContextProcessor: Format for provider
    ContextProcessor->>ContextProcessor: formatForProvider(optimizedMessages, providerName)
    
    ContextProcessor->>ContextProcessor: validateMessageFormat(formattedMessages, providerName)
    
    ContextProcessor-->>ConversationManager: provider-ready messages
```

### Provider Switching with Context Conversion

```mermaid
sequenceDiagram
    participant User
    participant ConversationManager
    participant ContextProcessor
    participant AIService
    participant MessageStore
    participant ChromeStorage
    
    Note over User: Request provider switch
    User->>ConversationManager: switchProvider(newProvider, preserveContext, options)
    
    Note over ConversationManager: Get current session
    ConversationManager->>ConversationManager: getCurrentSession()
    
    alt No current session
        ConversationManager->>ConversationManager: createNewSession(newProvider)
        ConversationManager-->>User: {success: true, newSessionId}
    else Has current session
        Note over ConversationManager: Determine context preservation strategy
        ConversationManager->>MessageStore: getSettings()
        MessageStore-->>ConversationManager: settings
        
        ConversationManager->>ConversationManager: shouldPreserveContext = preserveContext ?? settings.preserveOnProviderSwitch
        
        alt Preserve context
            Note over ConversationManager: Validate context conversion
            ConversationManager->>AIService: validateContextConversion(oldProvider, newProvider, messages)
            
            AIService->>AIService: getProviderCapabilities(oldProvider)
            AIService->>AIService: getProviderCapabilities(newProvider)
            AIService->>ContextProcessor: calculateTokenCount(messages)
            ContextProcessor-->>AIService: token count
            
            AIService->>AIService: validation = {canConvert, warnings, tokensAfterConversion}
            AIService-->>ConversationManager: validation result
            
            alt Context conversion recommended
                Note over ConversationManager: Convert context format
                ConversationManager->>ContextProcessor: convertContextBetweenProviders(messages, oldProvider, newProvider)
                
                ContextProcessor->>ContextProcessor: formatForProvider(messages, newProvider)
                ContextProcessor->>ContextProcessor: normalizeRoles(messages, newProvider)
                ContextProcessor->>ContextProcessor: addConversionMetadata(messages)
                
                ContextProcessor-->>ConversationManager: converted messages
                
                Note over ConversationManager: Update session
                ConversationManager->>ConversationManager: currentSession.messages = convertedMessages
                ConversationManager->>ConversationManager: currentSession.provider = newProvider
                ConversationManager->>ConversationManager: addProviderSwitchMetadata()
                
                ConversationManager->>MessageStore: updateSession(currentSession)
                MessageStore->>ChromeStorage: save updated session
                ChromeStorage-->>MessageStore: session saved
                MessageStore-->>ConversationManager: session updated
                
                ConversationManager-->>User: {success: true, contextConverted: true, warnings}
            else Context conversion not recommended
                Note over ConversationManager: Create new session
                ConversationManager->>ConversationManager: createNewSession(newProvider)
                ConversationManager-->>User: {success: true, newSessionId, warnings}
            end
        else Create new session
            ConversationManager->>ConversationManager: createNewSession(newProvider)
            ConversationManager-->>User: {success: true, newSessionId}
        end
    end
```

## Performance Optimization Sequences

### Lazy Loading Implementation

```mermaid
sequenceDiagram
    participant UI
    participant ConversationManager
    participant MessageStore
    participant PerformanceOptimizer
    participant ChromeStorage
    participant MemoryCache
    
    Note over UI: Request conversation history
    UI->>ConversationManager: getConversationHistory()
    
    Note over ConversationManager: Check current session
    ConversationManager->>ConversationManager: getCurrentSession()
    
    alt Session in memory
        ConversationManager-->>UI: session.messages
    else Session not in memory
        Note over ConversationManager: Load session
        ConversationManager->>MessageStore: getSession(sessionId)
        
        Note over MessageStore: Check if lazy loading enabled
        MessageStore->>MessageStore: getSettings()
        MessageStore->>MessageStore: settings.enableLazyLoading?
        
        alt Lazy loading enabled
            MessageStore->>PerformanceOptimizer: loadSessionLazily(sessionId, messageStore)
            
            Note over PerformanceOptimizer: Check memory cache first
            PerformanceOptimizer->>MemoryCache: get(sessionId)
            
            alt Session in cache
                MemoryCache-->>PerformanceOptimizer: cached session
                PerformanceOptimizer-->>MessageStore: cached session
            else Session not in cache
                Note over PerformanceOptimizer: Load from storage
                PerformanceOptimizer->>ChromeStorage: get(STORAGE_KEY)
                ChromeStorage-->>PerformanceOptimizer: storage data
                
                PerformanceOptimizer->>PerformanceOptimizer: session = data.sessions[sessionId]
                
                Note over PerformanceOptimizer: Check if session is large
                PerformanceOptimizer->>PerformanceOptimizer: session.messages.length > threshold?
                
                alt Large session
                    Note over PerformanceOptimizer: Load incrementally
                    PerformanceOptimizer->>PerformanceOptimizer: loadRecentMessages(session, limit)
                    PerformanceOptimizer->>PerformanceOptimizer: markAsPartiallyLoaded(session)
                else Normal session
                    Note over PerformanceOptimizer: Load completely
                    PerformanceOptimizer->>PerformanceOptimizer: loadCompleteSession(session)
                end
                
                Note over PerformanceOptimizer: Cache for future use
                PerformanceOptimizer->>MemoryCache: set(sessionId, session, ttl)
                
                PerformanceOptimizer-->>MessageStore: loaded session
            end
            
            MessageStore-->>ConversationManager: session
        else Direct loading
            MessageStore->>ChromeStorage: get(STORAGE_KEY)
            ChromeStorage-->>MessageStore: storage data
            MessageStore->>MessageStore: session = data.sessions[sessionId]
            MessageStore-->>ConversationManager: session
        end
        
        Note over ConversationManager: Update local state
        ConversationManager->>ConversationManager: currentSession = session
        ConversationManager-->>UI: session.messages
    end
```

### Background Cleanup Process

```mermaid
sequenceDiagram
    participant Timer
    participant PerformanceOptimizer
    participant MessageStore
    participant ConversationManager
    participant ChromeStorage
    participant MemoryCache
    
    Note over Timer: Periodic cleanup trigger
    Timer->>PerformanceOptimizer: triggerScheduledCleanup()
    
    Note over PerformanceOptimizer: Check if cleanup needed
    PerformanceOptimizer->>MessageStore: getSettings()
    MessageStore-->>PerformanceOptimizer: settings
    
    PerformanceOptimizer->>PerformanceOptimizer: shouldRunCleanup(settings)
    
    alt Cleanup needed
        Note over PerformanceOptimizer: Get performance metrics
        PerformanceOptimizer->>PerformanceOptimizer: getPerformanceMetrics()
        
        Note over PerformanceOptimizer: Create cleanup policy
        PerformanceOptimizer->>PerformanceOptimizer: createCleanupPolicy(settings, metrics)
        
        Note over PerformanceOptimizer: Get all sessions
        PerformanceOptimizer->>MessageStore: getAllSessions()
        MessageStore->>ChromeStorage: get(STORAGE_KEY)
        ChromeStorage-->>MessageStore: storage data
        MessageStore-->>PerformanceOptimizer: sessions[]
        
        Note over PerformanceOptimizer: Apply cleanup policy
        PerformanceOptimizer->>PerformanceOptimizer: applyCleanupPolicy(sessions, policy)
        
        loop For each session
            PerformanceOptimizer->>PerformanceOptimizer: analyzeSession(session)
            
            alt Session too old
                PerformanceOptimizer->>PerformanceOptimizer: markForDeletion(session)
            else Session too large
                PerformanceOptimizer->>PerformanceOptimizer: compressSession(session)
            else Session inactive
                PerformanceOptimizer->>PerformanceOptimizer: archiveSession(session)
            end
        end
        
        Note over PerformanceOptimizer: Execute cleanup actions
        PerformanceOptimizer->>MessageStore: deleteMarkedSessions(markedSessions)
        PerformanceOptimizer->>MessageStore: updateCompressedSessions(compressedSessions)
        
        MessageStore->>ChromeStorage: save updated data
        ChromeStorage-->>MessageStore: data saved
        
        Note over PerformanceOptimizer: Clear memory cache
        PerformanceOptimizer->>MemoryCache: clearExpired()
        PerformanceOptimizer->>MemoryCache: compactCache()
        
        Note over PerformanceOptimizer: Update performance metrics
        PerformanceOptimizer->>PerformanceOptimizer: updateCleanupMetrics(cleanupResult)
        
        Note over PerformanceOptimizer: Notify active sessions
        PerformanceOptimizer->>ConversationManager: notifyCleanupComplete(cleanupResult)
        
        PerformanceOptimizer-->>Timer: cleanup completed
    else No cleanup needed
        PerformanceOptimizer-->>Timer: cleanup skipped
    end
```

## Error Recovery Sequences

### Storage Error Recovery

```mermaid
sequenceDiagram
    participant ConversationManager
    participant MessageStore
    participant ErrorHandler
    participant ChromeStorage
    participant MemoryCache
    participant FallbackStorage
    
    Note over ConversationManager: Attempt to save message
    ConversationManager->>MessageStore: addMessage(sessionId, message)
    
    MessageStore->>ChromeStorage: set(STORAGE_KEY, data)
    
    Note over ChromeStorage: Storage error occurs
    ChromeStorage-->>MessageStore: QuotaExceededError
    
    Note over MessageStore: Handle storage error
    MessageStore->>ErrorHandler: handleStorageError(error, operation, data)
    
    ErrorHandler->>ErrorHandler: classifyError(error)
    
    alt Quota exceeded error
        Note over ErrorHandler: Emergency cleanup
        ErrorHandler->>MessageStore: triggerEmergencyCleanup()
        
        MessageStore->>MessageStore: cleanup(aggressiveMode: true)
        MessageStore->>ChromeStorage: delete old sessions
        ChromeStorage-->>MessageStore: space freed
        
        Note over ErrorHandler: Retry original operation
        ErrorHandler->>ChromeStorage: set(STORAGE_KEY, data)
        
        alt Retry successful
            ChromeStorage-->>ErrorHandler: success
            ErrorHandler-->>MessageStore: operation completed
            MessageStore-->>ConversationManager: message saved
        else Retry failed
            Note over ErrorHandler: Use fallback storage
            ErrorHandler->>FallbackStorage: saveToMemory(data)
            FallbackStorage-->>ErrorHandler: saved to memory
            
            ErrorHandler->>ErrorHandler: scheduleRetryLater()
            ErrorHandler-->>MessageStore: saved to fallback
            MessageStore-->>ConversationManager: message saved (fallback)
        end
        
    else Network/connection error
        Note over ErrorHandler: Retry with exponential backoff
        ErrorHandler->>ErrorHandler: calculateBackoffDelay(attempt)
        ErrorHandler->>ErrorHandler: delay(backoffTime)
        
        ErrorHandler->>ChromeStorage: set(STORAGE_KEY, data)
        
        alt Retry successful
            ChromeStorage-->>ErrorHandler: success
            ErrorHandler-->>MessageStore: operation completed
        else Max retries exceeded
            Note over ErrorHandler: Use memory cache
            ErrorHandler->>MemoryCache: set(sessionId, session)
            MemoryCache-->>ErrorHandler: cached
            
            ErrorHandler->>ErrorHandler: schedulePeriodicRetry()
            ErrorHandler-->>MessageStore: saved to cache
        end
        
    else Data corruption error
        Note over ErrorHandler: Attempt data recovery
        ErrorHandler->>ErrorHandler: validateStorageData()
        
        alt Data recoverable
            ErrorHandler->>ErrorHandler: repairCorruptedData(data)
            ErrorHandler->>ChromeStorage: set(STORAGE_KEY, repairedData)
            ChromeStorage-->>ErrorHandler: success
            ErrorHandler-->>MessageStore: data repaired and saved
        else Data not recoverable
            Note over ErrorHandler: Initialize fresh storage
            ErrorHandler->>ErrorHandler: initializeFreshStorage()
            ErrorHandler->>ChromeStorage: set(STORAGE_KEY, freshData)
            ChromeStorage-->>ErrorHandler: initialized
            
            ErrorHandler->>ConversationManager: notifyDataLoss()
            ErrorHandler-->>MessageStore: storage reinitialized
        end
    end
```

### Context Processing Error Recovery

```mermaid
sequenceDiagram
    participant ConversationManager
    participant ContextProcessor
    participant ErrorHandler
    participant AIService
    participant FallbackProcessor
    
    Note over ConversationManager: Request context processing
    ConversationManager->>ContextProcessor: getContextForProvider(providerName)
    
    Note over ContextProcessor: Process messages
    ContextProcessor->>ContextProcessor: optimizeContext(messages, maxTokens)
    
    Note over ContextProcessor: Error during processing
    ContextProcessor->>ErrorHandler: handleContextError(error, messages, provider)
    
    ErrorHandler->>ErrorHandler: analyzeContextError(error)
    
    alt Token limit exceeded error
        Note over ErrorHandler: Apply aggressive optimization
        ErrorHandler->>ContextProcessor: aggressiveOptimization(messages, reducedTokens)
        
        ContextProcessor->>ContextProcessor: truncateToEssentials(messages)
        ContextProcessor->>ContextProcessor: removeNonEssentialMetadata(messages)
        ContextProcessor->>ContextProcessor: compressLongMessages(messages)
        
        ContextProcessor-->>ErrorHandler: aggressively optimized messages
        
        ErrorHandler->>ContextProcessor: formatForProvider(optimizedMessages, provider)
        
        alt Aggressive optimization successful
            ContextProcessor-->>ErrorHandler: formatted messages
            ErrorHandler-->>ConversationManager: recovered context
        else Still exceeds limits
            Note over ErrorHandler: Use minimal context
            ErrorHandler->>ErrorHandler: createMinimalContext(messages)
            ErrorHandler-->>ConversationManager: minimal context + warning
        end
        
    else Message format error
        Note over ErrorHandler: Attempt format correction
        ErrorHandler->>ContextProcessor: correctMessageFormat(messages, provider)
        
        ContextProcessor->>ContextProcessor: sanitizeMessages(messages)
        ContextProcessor->>ContextProcessor: normalizeRoles(messages)
        ContextProcessor->>ContextProcessor: validateStructure(messages)
        
        alt Format correction successful
            ContextProcessor-->>ErrorHandler: corrected messages
            ErrorHandler->>ContextProcessor: formatForProvider(correctedMessages, provider)
            ContextProcessor-->>ErrorHandler: formatted messages
            ErrorHandler-->>ConversationManager: corrected context
        else Format correction failed
            Note over ErrorHandler: Use fallback processor
            ErrorHandler->>FallbackProcessor: processWithFallback(messages, provider)
            FallbackProcessor-->>ErrorHandler: fallback processed messages
            ErrorHandler-->>ConversationManager: fallback context + warning
        end
        
    else Provider-specific error
        Note over ErrorHandler: Try alternative provider format
        ErrorHandler->>AIService: getAlternativeProviders(currentProvider)
        AIService-->>ErrorHandler: alternative providers
        
        loop For each alternative provider
            ErrorHandler->>ContextProcessor: formatForProvider(messages, alternativeProvider)
            
            alt Format successful
                ContextProcessor-->>ErrorHandler: formatted messages
                ErrorHandler-->>ConversationManager: alternative format + provider suggestion
                break
            else Format failed
                Note over ErrorHandler: Try next alternative
            end
        end
        
        alt No alternatives worked
            ErrorHandler->>ErrorHandler: useGenericFormat(messages)
            ErrorHandler-->>ConversationManager: generic format + error details
        end
    end
```

## Performance Monitoring Sequences

### Real-time Performance Tracking

```mermaid
sequenceDiagram
    participant Operation
    participant PerformanceMonitor
    participant MetricsCollector
    participant AlertSystem
    participant Dashboard
    
    Note over Operation: Start performance-critical operation
    Operation->>PerformanceMonitor: startTracking(operationId, operationType)
    
    PerformanceMonitor->>MetricsCollector: initializeMetrics(operationId)
    MetricsCollector->>MetricsCollector: startTimer(operationId)
    MetricsCollector->>MetricsCollector: recordStartMemory(operationId)
    
    Note over Operation: Execute operation steps
    loop Operation steps
        Operation->>PerformanceMonitor: recordStep(operationId, stepName, stepData)
        PerformanceMonitor->>MetricsCollector: recordStepMetrics(operationId, stepName, stepData)
        
        MetricsCollector->>MetricsCollector: calculateStepDuration(operationId, stepName)
        MetricsCollector->>MetricsCollector: recordMemoryUsage(operationId, stepName)
        MetricsCollector->>MetricsCollector: updateThroughputMetrics(operationId, stepData)
        
        Note over MetricsCollector: Check performance thresholds
        MetricsCollector->>MetricsCollector: checkThresholds(currentMetrics)
        
        alt Performance threshold exceeded
            MetricsCollector->>AlertSystem: sendPerformanceAlert(operationId, threshold, currentValue)
            AlertSystem->>AlertSystem: generateAlert(PERFORMANCE_DEGRADATION)
            AlertSystem->>Dashboard: updateAlertStatus(alert)
        end
        
        Note over MetricsCollector: Update real-time dashboard
        MetricsCollector->>Dashboard: updateRealTimeMetrics(operationId, currentMetrics)
    end
    
    Note over Operation: Complete operation
    Operation->>PerformanceMonitor: endTracking(operationId, result)
    
    PerformanceMonitor->>MetricsCollector: finalizeMetrics(operationId, result)
    MetricsCollector->>MetricsCollector: calculateTotalDuration(operationId)
    MetricsCollector->>MetricsCollector: calculateAverageMemoryUsage(operationId)
    MetricsCollector->>MetricsCollector: calculateOverallThroughput(operationId)
    
    Note over MetricsCollector: Store final metrics
    MetricsCollector->>MetricsCollector: storeHistoricalMetrics(operationId, finalMetrics)
    
    Note over MetricsCollector: Update aggregated statistics
    MetricsCollector->>MetricsCollector: updateOperationTypeAverages(operationType, finalMetrics)
    MetricsCollector->>MetricsCollector: updateGlobalPerformanceStats(finalMetrics)
    
    Note over MetricsCollector: Send completion notification
    MetricsCollector->>Dashboard: updateCompletedOperation(operationId, finalMetrics)
    
    PerformanceMonitor-->>Operation: tracking completed
```

### Memory Usage Optimization

```mermaid
sequenceDiagram
    participant MemoryMonitor
    participant MemoryManager
    participant ConversationManager
    participant MessageStore
    participant GarbageCollector
    
    Note over MemoryMonitor: Periodic memory check
    MemoryMonitor->>MemoryMonitor: checkMemoryUsage()
    
    MemoryMonitor->>MemoryMonitor: getCurrentMemoryUsage()
    MemoryMonitor->>MemoryMonitor: getMemoryThresholds()
    
    alt Memory usage high
        MemoryMonitor->>MemoryManager: triggerMemoryOptimization(urgency: 'high')
        
        Note over MemoryManager: Analyze memory usage
        MemoryManager->>ConversationManager: getMemoryUsage()
        ConversationManager-->>MemoryManager: conversation memory usage
        
        MemoryManager->>MessageStore: getMemoryUsage()
        MessageStore-->>MemoryManager: storage memory usage
        
        Note over MemoryManager: Identify optimization targets
        MemoryManager->>MemoryManager: identifyLargeObjects()
        MemoryManager->>MemoryManager: identifyUnusedCaches()
        MemoryManager->>MemoryManager: identifyOptimizationOpportunities()
        
        Note over MemoryManager: Execute optimization strategies
        MemoryManager->>ConversationManager: optimizeSessionCache()
        ConversationManager->>ConversationManager: clearUnusedSessions()
        ConversationManager->>ConversationManager: compressLargeSessions()
        ConversationManager-->>MemoryManager: cache optimized
        
        MemoryManager->>MessageStore: optimizeStorage()
        MessageStore->>MessageStore: clearExpiredCache()
        MessageStore->>MessageStore: compressOldMessages()
        MessageStore-->>MemoryManager: storage optimized
        
        Note over MemoryManager: Force garbage collection
        MemoryManager->>GarbageCollector: forceCollection()
        GarbageCollector->>GarbageCollector: collectUnusedObjects()
        GarbageCollector-->>MemoryManager: collection completed
        
        Note over MemoryManager: Verify improvement
        MemoryManager->>MemoryMonitor: checkMemoryUsage()
        MemoryMonitor-->>MemoryManager: updated memory usage
        
        alt Sufficient improvement
            MemoryManager->>MemoryManager: recordOptimizationSuccess()
        else Insufficient improvement
            Note over MemoryManager: Apply more aggressive optimization
            MemoryManager->>ConversationManager: aggressiveOptimization()
            ConversationManager->>ConversationManager: clearAllNonEssentialCache()
            ConversationManager-->>MemoryManager: aggressive optimization completed
        end
        
        MemoryManager-->>MemoryMonitor: optimization completed
        
    else Memory usage normal
        MemoryMonitor->>MemoryMonitor: recordNormalUsage()
    end
    
    Note over MemoryMonitor: Update monitoring dashboard
    MemoryMonitor->>MemoryMonitor: updateMemoryDashboard()
```

These sequence diagrams provide comprehensive views of the Conversation Management System's interaction patterns, showing how components coordinate to provide efficient message handling, context processing, performance optimization, and error recovery.