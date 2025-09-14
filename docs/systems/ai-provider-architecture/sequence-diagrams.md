# AI Provider Architecture - Sequence Diagrams

This document contains detailed sequence diagrams showing the interaction patterns within the AI Provider Architecture.

## Provider Initialization and Registration

### System Startup and Provider Registration

```mermaid
sequenceDiagram
    participant App as Application
    participant AIService
    participant ConfigManager
    participant TrialService
    participant Providers as Provider Classes
    participant Storage as Chrome Storage
    
    Note over App: Application startup
    App->>AIService: getInstance()
    AIService->>AIService: constructor()
    AIService->>ConfigManager: getInstance()
    AIService->>TrialService: shouldUseTrialMode()
    
    Note over AIService: Initialize system
    App->>AIService: initialize()
    AIService->>ConfigManager: initialize()
    ConfigManager->>Storage: load configuration
    Storage-->>ConfigManager: configuration data
    
    Note over AIService: Register providers
    AIService->>AIService: registerProviders()
    
    loop For each provider class
        AIService->>TrialService: shouldUseTrialMode()
        TrialService-->>AIService: trialMode status
        
        alt Trial mode and Gemini provider
            AIService->>TrialService: getTrialApiKey()
            TrialService-->>AIService: trial API key
            AIService->>Providers: new GeminiProvider(trialConfig)
        else Normal mode
            AIService->>ConfigManager: getProviderConfig(providerName)
            ConfigManager-->>AIService: provider config
            AIService->>Providers: new Provider(config)
        end
        
        Providers-->>AIService: provider instance
        AIService->>AIService: providers.set(name, provider)
    end
    
    Note over AIService: Set current provider
    AIService->>AIService: setCurrentProvider()
    
    alt Trial mode
        AIService->>AIService: currentProvider = geminiProvider
    else Normal mode
        AIService->>ConfigManager: getCurrentProvider()
        ConfigManager-->>AIService: current provider name
        AIService->>AIService: currentProvider = providers.get(name)
    end
    
    AIService-->>App: initialization complete
```

## Request Processing Flow

### Chat Response Generation with History

```mermaid
sequenceDiagram
    participant Client
    participant AIService
    participant TrialService
    participant ContextProcessor
    participant ErrorRecovery
    participant Provider
    participant FallbackProvider
    participant API as External API
    
    Note over Client: Request chat response
    Client->>AIService: generateChatResponseWithHistory(messages, onChunk)
    
    Note over AIService: Check trial limits
    AIService->>TrialService: shouldUseTrialMode()
    TrialService-->>AIService: trial status
    
    alt Trial mode active
        AIService->>TrialService: getRemainingTrialRequests()
        TrialService-->>AIService: remaining requests
        
        alt No requests remaining
            AIService-->>Client: Trial limit exceeded error
        else Requests available
            AIService->>TrialService: incrementTrialUsage()
        end
    end
    
    Note over AIService: Validate provider
    AIService->>AIService: validateCurrentProvider()
    
    alt Provider not configured
        AIService-->>Client: Configuration error
    end
    
    Note over AIService: Optimize context
    AIService->>ContextProcessor: getProviderTokenLimit(providerName)
    ContextProcessor-->>AIService: token limit
    AIService->>ContextProcessor: optimizeContext(messages, maxTokens)
    ContextProcessor-->>AIService: optimized messages
    
    Note over AIService: Format for provider
    AIService->>ContextProcessor: formatForProvider(messages, providerName)
    ContextProcessor-->>AIService: provider messages
    
    Note over AIService: Validate format
    AIService->>ContextProcessor: validateMessageFormat(messages, providerName)
    ContextProcessor-->>AIService: validation result
    
    alt Invalid format
        AIService-->>Client: Invalid message format error
    end
    
    Note over AIService: Execute with fallback
    AIService->>ErrorRecovery: executeWithFallback(primaryOperation, fallbackProviders, 'chat', data)
    
    Note over ErrorRecovery: Try primary provider
    ErrorRecovery->>ErrorRecovery: executeWithRetry(primaryOperation)
    
    loop Retry attempts (max 3)
        ErrorRecovery->>Provider: generateResponseWithHistory(messages, options)
        Provider->>API: HTTP request
        
        alt Request successful
            API-->>Provider: Response stream
            
            loop Stream chunks
                Provider->>Provider: process chunk
                Provider-->>ErrorRecovery: chunk
                ErrorRecovery-->>AIService: chunk
                AIService->>Client: onChunk(chunk)
            end
            
            Provider-->>ErrorRecovery: complete response
            break Success - exit retry loop
        else Request failed
            API-->>Provider: Error response
            Provider-->>ErrorRecovery: Provider error
            
            ErrorRecovery->>ErrorRecovery: isRetryableError(error)
            
            alt Retryable error
                ErrorRecovery->>ErrorRecovery: calculateBackoffDelay(attempt)
                ErrorRecovery->>ErrorRecovery: delay(backoffTime)
                Note over ErrorRecovery: Continue retry loop
            else Non-retryable error
                break Exit retry loop with error
            end
        end
    end
    
    alt Primary provider failed
        Note over ErrorRecovery: Try fallback providers
        loop For each fallback provider
            ErrorRecovery->>FallbackProvider: generateResponseWithHistory(messages, options)
            FallbackProvider->>API: HTTP request
            
            alt Fallback successful
                API-->>FallbackProvider: Response stream
                FallbackProvider-->>ErrorRecovery: response
                ErrorRecovery-->>AIService: {result, usedProvider}
                break Success with fallback
            else Fallback failed
                API-->>FallbackProvider: Error
                FallbackProvider-->>ErrorRecovery: Fallback error
                Note over ErrorRecovery: Try next fallback
            end
        end
        
        alt All providers failed
            ErrorRecovery-->>AIService: All providers failed error
        end
    else Primary provider succeeded
        ErrorRecovery-->>AIService: {result, usedProvider: null}
    end
    
    AIService-->>Client: Final response
```

### Provider Switching with Context Preservation

```mermaid
sequenceDiagram
    participant User
    participant AIService
    participant ConfigManager
    participant ConversationManager
    participant ContextProcessor
    participant OldProvider
    participant NewProvider
    
    Note over User: Request provider switch
    User->>AIService: switchProvider(newProviderName, options)
    
    Note over AIService: Validate new provider
    AIService->>AIService: providers.get(newProviderName)
    
    alt Provider not available
        AIService-->>User: Provider not available error
    end
    
    AIService->>NewProvider: isConfigured()
    NewProvider-->>AIService: configuration status
    
    alt Provider not configured
        AIService-->>User: Provider not configured error
    end
    
    Note over AIService: Store previous provider
    AIService->>AIService: previousProvider = currentProvider.name
    AIService->>AIService: currentProvider = newProvider
    AIService->>ConfigManager: setCurrentProvider(newProviderName)
    
    Note over AIService: Handle conversation context
    alt Preserve context option
        AIService->>ConversationManager: switchProvider(newProviderName, preserveContext)
        
        ConversationManager->>ConversationManager: getCurrentSession()
        
        alt Has current session
            ConversationManager->>ContextProcessor: validateContextConversion(oldProvider, newProvider, messages)
            ContextProcessor-->>ConversationManager: validation result
            
            alt Context can be converted
                ConversationManager->>ContextProcessor: convertContextBetweenProviders(messages, oldProvider, newProvider)
                ContextProcessor-->>ConversationManager: converted messages
                ConversationManager->>ConversationManager: updateSession(convertedMessages)
            else Context conversion not recommended
                ConversationManager->>ConversationManager: createNewSession(newProvider)
            end
        else No current session
            ConversationManager->>ConversationManager: createNewSession(newProvider)
        end
        
        ConversationManager-->>AIService: switch result
    else Clear context option
        AIService->>ConversationManager: clearCurrentSession()
        ConversationManager-->>AIService: session cleared
    end
    
    AIService-->>User: Provider switched successfully
```

## Error Recovery Sequences

### Network Error Recovery with Exponential Backoff

```mermaid
sequenceDiagram
    participant AIService
    participant ErrorRecovery
    participant NetworkMonitor
    participant Provider
    participant API
    
    Note over AIService: Execute request
    AIService->>ErrorRecovery: executeWithRetry(operation)
    
    loop Retry attempts (max 3)
        Note over ErrorRecovery: Check network connectivity
        ErrorRecovery->>NetworkMonitor: checkNetworkConnectivity()
        NetworkMonitor->>NetworkMonitor: fetch('https://www.google.com/favicon.ico')
        
        alt Network available
            NetworkMonitor-->>ErrorRecovery: network online
            
            ErrorRecovery->>Provider: generateResponse(message)
            Provider->>API: HTTP request
            
            alt Network error during request
                API-->>Provider: Network timeout/error
                Provider-->>ErrorRecovery: Network error
                
                ErrorRecovery->>ErrorRecovery: isRetryableError(networkError)
                ErrorRecovery->>ErrorRecovery: calculateBackoffDelay(attempt)
                
                Note over ErrorRecovery: Exponential backoff delay
                ErrorRecovery->>ErrorRecovery: delay(backoffTime)
                
                Note over ErrorRecovery: Continue retry loop
            else Request successful
                API-->>Provider: Successful response
                Provider-->>ErrorRecovery: Response
                ErrorRecovery-->>AIService: Success
                break Exit retry loop
            end
        else Network unavailable
            NetworkMonitor-->>ErrorRecovery: network offline
            ErrorRecovery-->>AIService: Network unavailable error
            break Exit with network error
        end
    end
    
    alt Max retries exceeded
        ErrorRecovery-->>AIService: Max retries exceeded error
    end
```

### Rate Limit Handling with Provider Fallback

```mermaid
sequenceDiagram
    participant AIService
    participant ErrorRecovery
    participant PrimaryProvider
    participant FallbackProvider1
    participant FallbackProvider2
    participant API1
    participant API2
    participant API3
    
    Note over AIService: Execute request
    AIService->>ErrorRecovery: executeWithFallback(operation, fallbackProviders)
    
    Note over ErrorRecovery: Try primary provider
    ErrorRecovery->>PrimaryProvider: generateResponse(message)
    PrimaryProvider->>API1: HTTP request
    
    Note over API1: Rate limit exceeded
    API1-->>PrimaryProvider: 429 Rate Limit Error
    PrimaryProvider-->>ErrorRecovery: Rate limit error
    
    Note over ErrorRecovery: Handle rate limit
    ErrorRecovery->>ErrorRecovery: isRetryableError(rateLimitError)
    ErrorRecovery->>ErrorRecovery: calculateBackoffDelay(rateLimitError)
    
    alt Backoff time acceptable
        ErrorRecovery->>ErrorRecovery: delay(backoffTime)
        ErrorRecovery->>PrimaryProvider: generateResponse(message)
        PrimaryProvider->>API1: Retry HTTP request
        
        alt Still rate limited
            API1-->>PrimaryProvider: 429 Rate Limit Error
            PrimaryProvider-->>ErrorRecovery: Rate limit error
            Note over ErrorRecovery: Switch to fallback
        else Rate limit cleared
            API1-->>PrimaryProvider: Successful response
            PrimaryProvider-->>ErrorRecovery: Response
            ErrorRecovery-->>AIService: Success with primary
        end
    else Backoff time too long
        Note over ErrorRecovery: Immediate fallback
    end
    
    Note over ErrorRecovery: Try first fallback
    ErrorRecovery->>FallbackProvider1: generateResponse(message)
    FallbackProvider1->>API2: HTTP request
    
    alt Fallback 1 successful
        API2-->>FallbackProvider1: Successful response
        FallbackProvider1-->>ErrorRecovery: Response
        ErrorRecovery-->>AIService: Success with fallback 1
    else Fallback 1 failed
        API2-->>FallbackProvider1: Error response
        FallbackProvider1-->>ErrorRecovery: Fallback 1 error
        
        Note over ErrorRecovery: Try second fallback
        ErrorRecovery->>FallbackProvider2: generateResponse(message)
        FallbackProvider2->>API3: HTTP request
        
        alt Fallback 2 successful
            API3-->>FallbackProvider2: Successful response
            FallbackProvider2-->>ErrorRecovery: Response
            ErrorRecovery-->>AIService: Success with fallback 2
        else All providers failed
            API3-->>FallbackProvider2: Error response
            FallbackProvider2-->>ErrorRecovery: Fallback 2 error
            ErrorRecovery-->>AIService: All providers failed error
        end
    end
```

## Context Processing Sequences

### Message Format Conversion and Optimization

```mermaid
sequenceDiagram
    participant AIService
    participant ContextProcessor
    participant TokenCounter
    participant MessageFormatter
    participant Optimizer
    
    Note over AIService: Process messages for provider
    AIService->>ContextProcessor: formatForProvider(messages, providerName)
    
    Note over ContextProcessor: Calculate current token count
    ContextProcessor->>TokenCounter: calculateTokenCount(messages)
    TokenCounter->>TokenCounter: estimate tokens from character count
    TokenCounter-->>ContextProcessor: current token count
    
    Note over ContextProcessor: Check provider limits
    ContextProcessor->>ContextProcessor: getProviderTokenLimit(providerName)
    
    alt Token count exceeds limit
        Note over ContextProcessor: Optimize context
        ContextProcessor->>Optimizer: optimizeContext(messages, maxTokens)
        
        Optimizer->>Optimizer: identifySystemMessages(messages)
        Optimizer->>Optimizer: identifyConversationMessages(messages)
        
        Note over Optimizer: Calculate token allocation
        Optimizer->>TokenCounter: calculateTokenCount(systemMessages)
        TokenCounter-->>Optimizer: system message tokens
        
        Optimizer->>Optimizer: availableTokens = maxTokens - systemTokens
        
        Note over Optimizer: Truncate conversation messages
        Optimizer->>Optimizer: truncateMessages(conversationMessages, availableTokens)
        
        loop From most recent backwards
            Optimizer->>TokenCounter: calculateTokenCount([message])
            TokenCounter-->>Optimizer: message tokens
            
            alt Fits in remaining space
                Optimizer->>Optimizer: include message
            else Exceeds remaining space
                Optimizer->>Optimizer: truncateMessage(message, remainingTokens)
                break Stop including messages
            end
        end
        
        Optimizer-->>ContextProcessor: optimized messages
    else Token count within limit
        ContextProcessor->>ContextProcessor: use original messages
    end
    
    Note over ContextProcessor: Format for specific provider
    ContextProcessor->>MessageFormatter: formatForProvider(messages, providerName)
    
    MessageFormatter->>MessageFormatter: switch(providerName)
    
    alt OpenAI format
        MessageFormatter->>MessageFormatter: formatForOpenAI(messages)
    else Anthropic format
        MessageFormatter->>MessageFormatter: formatForAnthropic(messages)
    else Gemini format
        MessageFormatter->>MessageFormatter: formatForGemini(messages)
        Note over MessageFormatter: Convert 'assistant' to 'model' for Gemini
    else Other providers
        MessageFormatter->>MessageFormatter: formatForStandard(messages)
    end
    
    MessageFormatter-->>ContextProcessor: formatted messages
    
    Note over ContextProcessor: Validate format
    ContextProcessor->>ContextProcessor: validateMessageFormat(formattedMessages, providerName)
    
    ContextProcessor-->>AIService: provider-ready messages
```

### Context Conversion Between Providers

```mermaid
sequenceDiagram
    participant ConversationManager
    participant ContextProcessor
    participant AIService
    participant Validator
    participant Converter
    
    Note over ConversationManager: Switch provider with context preservation
    ConversationManager->>ContextProcessor: convertContextBetweenProviders(messages, fromProvider, toProvider)
    
    Note over ContextProcessor: Check if conversion needed
    ContextProcessor->>ContextProcessor: fromProvider === toProvider?
    
    alt Same provider
        ContextProcessor-->>ConversationManager: original messages (no conversion)
    else Different providers
        Note over ContextProcessor: Validate conversion feasibility
        ContextProcessor->>AIService: validateContextConversion(fromProvider, toProvider, messages)
        
        AIService->>AIService: getProviderCapabilities(fromProvider)
        AIService->>AIService: getProviderCapabilities(toProvider)
        
        AIService->>Validator: checkTokenLimits(messages, toCapabilities)
        Validator-->>AIService: token validation
        
        AIService->>Validator: checkSystemMessageSupport(messages, toCapabilities)
        Validator-->>AIService: system message validation
        
        AIService->>Validator: checkConversationHistorySupport(messages, toCapabilities)
        Validator-->>AIService: history validation
        
        AIService-->>ContextProcessor: validation result
        
        alt Conversion feasible
            Note over ContextProcessor: Perform conversion
            ContextProcessor->>Converter: formatForProvider(messages, toProvider)
            
            Converter->>Converter: convertRoles(messages, toProvider)
            Converter->>Converter: adjustMessageFormat(messages, toProvider)
            Converter->>Converter: optimizeForTokenLimits(messages, toProvider)
            
            Converter-->>ContextProcessor: converted messages
            
            Note over ContextProcessor: Add conversion metadata
            ContextProcessor->>ContextProcessor: addConversionMetadata(convertedMessages, fromProvider, toProvider)
            
            Note over ContextProcessor: Check for significant changes
            ContextProcessor->>ContextProcessor: hasSignificantConversionChanges(original, converted)
            
            alt Significant changes detected
                ContextProcessor->>ContextProcessor: createConversionNotice(fromProvider, toProvider)
                ContextProcessor->>ContextProcessor: prependNotice(convertedMessages, notice)
            end
            
            ContextProcessor-->>ConversationManager: converted messages with metadata
        else Conversion not feasible
            ContextProcessor->>ContextProcessor: addConversionFailureMetadata(messages, fromProvider, toProvider)
            ContextProcessor-->>ConversationManager: original messages with failure metadata
        end
    end
```

## Performance Monitoring Sequences

### Response Time and Throughput Tracking

```mermaid
sequenceDiagram
    participant Client
    participant AIService
    participant PerformanceMonitor
    participant Provider
    participant MetricsStore
    
    Note over Client: Request AI response
    Client->>AIService: generateResponse(message)
    
    Note over AIService: Start performance tracking
    AIService->>PerformanceMonitor: startRequestTracking(requestId)
    PerformanceMonitor->>PerformanceMonitor: recordStartTime(requestId)
    PerformanceMonitor->>MetricsStore: initializeRequestMetrics(requestId)
    
    Note over AIService: Execute request
    AIService->>Provider: generateResponse(message)
    
    Note over Provider: First token received
    Provider->>PerformanceMonitor: recordFirstToken(requestId)
    PerformanceMonitor->>PerformanceMonitor: calculateTimeToFirstToken(requestId)
    PerformanceMonitor->>MetricsStore: updateLatencyMetrics(requestId, ttft)
    
    Note over Provider: Stream response chunks
    loop For each response chunk
        Provider->>AIService: response chunk
        AIService->>PerformanceMonitor: recordChunk(requestId, chunkSize)
        PerformanceMonitor->>PerformanceMonitor: calculateThroughput(requestId, chunkSize)
        PerformanceMonitor->>MetricsStore: updateThroughputMetrics(requestId, throughput)
        AIService->>Client: chunk
    end
    
    Note over Provider: Response complete
    Provider->>AIService: response complete
    AIService->>PerformanceMonitor: endRequestTracking(requestId)
    
    Note over PerformanceMonitor: Calculate final metrics
    PerformanceMonitor->>PerformanceMonitor: calculateTotalTime(requestId)
    PerformanceMonitor->>PerformanceMonitor: calculateAverageThroughput(requestId)
    PerformanceMonitor->>PerformanceMonitor: calculateTokensPerSecond(requestId)
    
    Note over PerformanceMonitor: Store metrics
    PerformanceMonitor->>MetricsStore: finalizeRequestMetrics(requestId, finalMetrics)
    
    Note over PerformanceMonitor: Update aggregated metrics
    PerformanceMonitor->>MetricsStore: updateProviderAverages(providerName, metrics)
    PerformanceMonitor->>MetricsStore: updateGlobalAverages(metrics)
    
    AIService-->>Client: complete response
```

### Error Rate and Health Monitoring

```mermaid
sequenceDiagram
    participant AIService
    participant HealthMonitor
    participant Provider
    participant AlertSystem
    participant MetricsStore
    
    Note over AIService: Execute request
    AIService->>Provider: generateResponse(message)
    
    alt Request successful
        Provider-->>AIService: Successful response
        AIService->>HealthMonitor: recordSuccess(providerName)
        HealthMonitor->>MetricsStore: incrementSuccessCounter(providerName)
    else Request failed
        Provider-->>AIService: Error response
        AIService->>HealthMonitor: recordError(providerName, errorType)
        HealthMonitor->>MetricsStore: incrementErrorCounter(providerName, errorType)
    end
    
    Note over HealthMonitor: Calculate error rates
    HealthMonitor->>MetricsStore: getRecentMetrics(providerName, timeWindow)
    MetricsStore-->>HealthMonitor: recent metrics
    
    HealthMonitor->>HealthMonitor: calculateErrorRate(metrics)
    HealthMonitor->>HealthMonitor: calculateAvailability(metrics)
    
    Note over HealthMonitor: Check thresholds
    HealthMonitor->>HealthMonitor: errorRate > threshold?
    
    alt Error rate exceeds threshold
        HealthMonitor->>AlertSystem: sendAlert(providerName, errorRate, threshold)
        AlertSystem->>AlertSystem: generateAlert(HIGH_ERROR_RATE)
        
        Note over HealthMonitor: Consider provider degradation
        HealthMonitor->>HealthMonitor: shouldDegradeProvider(providerName, errorRate)
        
        alt Should degrade provider
            HealthMonitor->>AIService: markProviderDegraded(providerName)
            AIService->>AIService: updateProviderPriority(providerName, DEGRADED)
        end
    else Error rate normal
        HealthMonitor->>HealthMonitor: recordHealthyStatus(providerName)
        
        Note over HealthMonitor: Check if provider was degraded
        HealthMonitor->>AIService: isProviderDegraded(providerName)
        
        alt Provider was degraded and now healthy
            HealthMonitor->>AIService: markProviderHealthy(providerName)
            AIService->>AIService: updateProviderPriority(providerName, NORMAL)
            AlertSystem->>AlertSystem: sendRecoveryNotification(providerName)
        end
    end
    
    Note over HealthMonitor: Update health dashboard
    HealthMonitor->>MetricsStore: updateHealthMetrics(providerName, healthStatus)
```

## Configuration and Testing Sequences

### Provider Configuration Testing

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant AIService
    participant ConfigManager
    participant TestProvider
    participant API
    
    Note over User: Test provider configuration
    User->>UI: testProviderConnection(providerName, config)
    UI->>AIService: testProviderConnection(providerName, config)
    
    Note over AIService: Create temporary provider instance
    AIService->>AIService: createTempProvider(providerName, config)
    
    alt Unknown provider
        AIService-->>UI: Unknown provider error
        UI-->>User: Error notification
    else Known provider
        AIService->>TestProvider: new Provider(config)
        TestProvider-->>AIService: provider instance
        
        Note over AIService: Check configuration
        AIService->>TestProvider: isConfigured()
        TestProvider-->>AIService: configuration status
        
        alt Not configured
            AIService-->>UI: Configuration incomplete
            UI-->>User: Configuration error
        else Configured
            Note over AIService: Test connectivity
            AIService->>TestProvider: generateResponse('Hello', testOptions)
            TestProvider->>API: HTTP test request
            
            alt Connection successful
                API-->>TestProvider: Test response
                TestProvider-->>AIService: Success
                AIService-->>UI: Connection successful
                UI-->>User: Success notification
                
                Note over User: Save configuration
                User->>UI: saveConfiguration()
                UI->>ConfigManager: saveProviderConfig(providerName, config)
                ConfigManager-->>UI: Configuration saved
            else Connection failed
                API-->>TestProvider: Connection error
                TestProvider-->>AIService: Connection failed
                AIService-->>UI: Connection error details
                UI-->>User: Connection failed notification
            end
        end
    end
```

### Bulk Provider Testing

```mermaid
sequenceDiagram
    participant AIService
    participant TestCoordinator
    participant Provider1
    participant Provider2
    participant ProviderN
    participant ResultAggregator
    
    Note over AIService: Test all providers
    AIService->>TestCoordinator: testAllProviders()
    
    Note over TestCoordinator: Get configured providers
    TestCoordinator->>TestCoordinator: getConfiguredProviders()
    
    Note over TestCoordinator: Test providers in parallel
    par Test Provider 1
        TestCoordinator->>Provider1: testConnection()
        Provider1->>Provider1: generateResponse('test')
        
        alt Provider 1 success
            Provider1-->>TestCoordinator: Success
        else Provider 1 failure
            Provider1-->>TestCoordinator: Error details
        end
    and Test Provider 2
        TestCoordinator->>Provider2: testConnection()
        Provider2->>Provider2: generateResponse('test')
        
        alt Provider 2 success
            Provider2-->>TestCoordinator: Success
        else Provider 2 failure
            Provider2-->>TestCoordinator: Error details
        end
    and Test Provider N
        TestCoordinator->>ProviderN: testConnection()
        ProviderN->>ProviderN: generateResponse('test')
        
        alt Provider N success
            ProviderN-->>TestCoordinator: Success
        else Provider N failure
            ProviderN-->>TestCoordinator: Error details
        end
    end
    
    Note over TestCoordinator: Aggregate results
    TestCoordinator->>ResultAggregator: aggregateTestResults(results)
    ResultAggregator->>ResultAggregator: processResults(results)
    ResultAggregator-->>TestCoordinator: aggregated results
    
    TestCoordinator-->>AIService: test results summary
```

These sequence diagrams provide comprehensive views of the AI Provider Architecture's interaction patterns, showing how components coordinate to provide reliable AI services with robust error handling and performance monitoring.