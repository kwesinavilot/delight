# Multi-Agent Automation System - Sequence Diagrams

This document contains detailed sequence diagrams showing the interaction patterns within the Multi-Agent Automation System.

## Task Execution Lifecycle

### Complete Task Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Orchestrator
    participant Memory
    participant Messenger
    participant Planner
    participant Navigator
    participant Monitor
    participant AIService
    participant Browser
    
    User->>UI: Request automation task
    UI->>Orchestrator: executeTask(userInput, callbacks)
    
    Note over Orchestrator: Initialize execution state
    Orchestrator->>Orchestrator: isExecuting = true
    Orchestrator->>Memory: remember('currentTask', userInput)
    Orchestrator->>Memory: addToConversation('user', userInput)
    
    Note over Orchestrator: Start conversation
    Orchestrator->>Messenger: startConversation(taskId)
    
    Note over Orchestrator: Initialize agents
    Orchestrator->>Planner: initialize()
    Orchestrator->>Navigator: initialize()
    Orchestrator->>Monitor: initialize()
    
    Note over Orchestrator: Phase 1 - Planning
    Orchestrator->>UI: updateProgress({stage: 'planning'})
    Orchestrator->>Messenger: sendMessage('orchestrator', 'planner', 'plan_request', data)
    Orchestrator->>Planner: createPlan(userInput)
    
    Planner->>AIService: generateResponse(planningPrompt)
    AIService-->>Planner: planResponse
    Planner-->>Orchestrator: TaskPlan
    
    Orchestrator->>Memory: remember('currentPlan', plan)
    Orchestrator->>Memory: addToConversation('planner', planSummary)
    Orchestrator->>UI: onPlanCreated(plan.steps)
    
    Note over Orchestrator: Phase 2 - Iterative Execution
    Orchestrator->>UI: updateProgress({stage: 'executing'})
    
    loop Iterative Execution (max 20 iterations)
        Note over Orchestrator: Get next plan based on context
        Orchestrator->>Planner: createPlan(userInput, context)
        Planner->>AIService: generateResponse(contextualPrompt)
        AIService-->>Planner: nextStepPlan
        Planner-->>Orchestrator: TaskPlan
        
        alt Has steps to execute
            Note over Orchestrator: Execute first step
            Orchestrator->>UI: onStepStart(iteration, step)
            Orchestrator->>Navigator: executeStep(step)
            
            Navigator->>Browser: performAction(step)
            Browser-->>Navigator: actionResult
            Navigator-->>Orchestrator: stepResult
            
            Orchestrator->>Memory: remember(iterationResult, result)
            Orchestrator->>Memory: addToConversation('orchestrator', stepSummary)
            Orchestrator->>UI: onStepComplete(iteration, step, result)
            
            alt Task completion check
                Orchestrator->>Orchestrator: isTaskComplete(step, result)
                Note over Orchestrator: Break if complete
            end
        else No more steps
            Note over Orchestrator: Task complete - no more steps
            break
        end
        
        alt Error occurred
            Orchestrator->>Memory: remember(iterationError, error)
            Orchestrator->>Memory: addToConversation('orchestrator', errorMessage)
            Orchestrator->>UI: onStepError(iteration, step, error)
            Note over Orchestrator: Continue to next iteration for recovery
        end
    end
    
    Note over Orchestrator: Phase 3 - Validation
    Orchestrator->>UI: updateProgress({stage: 'validating'})
    Orchestrator->>Monitor: validateResult(results)
    Monitor-->>Orchestrator: ValidationResult
    
    Note over Orchestrator: Finalize execution
    Orchestrator->>Orchestrator: isExecuting = false
    Orchestrator-->>UI: AutomationResult
    UI-->>User: Task completion notification
```

## Agent Memory Interaction Patterns

### Memory Storage and Retrieval

```mermaid
sequenceDiagram
    participant Agent1 as Agent A
    participant Memory
    participant Agent2 as Agent B
    participant Storage as Chrome Storage
    
    Note over Agent1: Store context information
    Agent1->>Memory: remember('context_key', data, 'context')
    Memory->>Memory: memory.set(key, {value, timestamp, type})
    
    Note over Agent1: Store execution result
    Agent1->>Memory: remember('result_key', result, 'result')
    Memory->>Memory: memory.set(key, memoryEntry)
    
    Note over Agent1: Add to conversation
    Agent1->>Memory: addToConversation('agent_a', 'Action completed')
    Memory->>Memory: conversationHistory.push(entry)
    
    Note over Agent2: Retrieve specific data
    Agent2->>Memory: recall('context_key')
    Memory-->>Agent2: contextData
    
    Note over Agent2: Retrieve by type
    Agent2->>Memory: recallByType('result')
    Memory-->>Agent2: resultEntries[]
    
    Note over Agent2: Get conversation context
    Agent2->>Memory: getConversationContext(limit)
    Memory-->>Agent2: recentConversation[]
    
    Note over Memory: Periodic cleanup
    Memory->>Memory: cleanup(maxAge)
    Memory->>Storage: Persist important data
```

### Cross-Agent Communication

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Messenger
    participant Planner
    participant Navigator
    participant Memory
    
    Note over Orchestrator: Request planning
    Orchestrator->>Messenger: sendMessage('orchestrator', 'planner', 'plan_request', {userInput, context})
    Messenger->>Planner: deliverMessage(message)
    
    Note over Planner: Process planning request
    Planner->>Memory: getConversationContext()
    Memory-->>Planner: conversationHistory
    Planner->>Memory: recallByType('result')
    Memory-->>Planner: previousResults
    
    Note over Planner: Generate plan
    Planner->>Planner: createPlan(input, context)
    
    Note over Planner: Send response
    Planner->>Messenger: sendMessage('planner', 'orchestrator', 'plan_response', plan)
    Messenger->>Orchestrator: deliverMessage(response)
    
    Note over Orchestrator: Execute plan
    Orchestrator->>Navigator: executeStep(firstStep)
    
    Note over Navigator: Execution feedback
    Navigator->>Memory: remember('execution_status', status)
    Navigator->>Messenger: sendMessage('navigator', 'orchestrator', 'step_complete', result)
    Messenger->>Orchestrator: deliverMessage(result)
```

## Error Recovery Sequences

### Error Detection and Recovery

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Navigator
    participant Memory
    participant Planner
    participant AIService
    participant Browser
    
    Note over Orchestrator: Normal execution
    Orchestrator->>Navigator: executeStep(step)
    Navigator->>Browser: performAction(step)
    
    Note over Browser: Error occurs
    Browser-->>Navigator: ActionError
    Navigator-->>Orchestrator: StepError
    
    Note over Orchestrator: Handle error
    Orchestrator->>Memory: remember('iteration_N_error', errorMessage)
    Orchestrator->>Memory: addToConversation('orchestrator', 'Error: ' + errorMessage)
    
    Note over Orchestrator: Request recovery plan
    Orchestrator->>Planner: createPlan(userInput, errorContext)
    
    Note over Planner: Analyze error context
    Planner->>Memory: getConversationContext()
    Memory-->>Planner: contextWithError
    Planner->>AIService: generateResponse(recoveryPrompt)
    AIService-->>Planner: recoveryPlan
    
    Note over Planner: Return recovery steps
    Planner-->>Orchestrator: RecoveryPlan
    
    Note over Orchestrator: Execute recovery
    Orchestrator->>Navigator: executeStep(recoveryStep)
    Navigator->>Browser: performRecoveryAction(step)
    Browser-->>Navigator: RecoveryResult
    Navigator-->>Orchestrator: RecoverySuccess
    
    Note over Orchestrator: Continue execution
    Orchestrator->>Memory: remember('recovery_success', result)
```

### Cascading Error Handling

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Navigator
    participant ErrorRecovery as Error Recovery Agent
    participant Monitor
    participant Memory
    
    Note over Navigator: Primary action fails
    Navigator->>Navigator: ActionError
    Navigator->>ErrorRecovery: handleError(step, error)
    
    Note over ErrorRecovery: Attempt automatic recovery
    ErrorRecovery->>ErrorRecovery: analyzeError(error)
    ErrorRecovery->>Navigator: executeRecoveryAction(recoveryStep)
    
    alt Recovery successful
        Navigator-->>ErrorRecovery: RecoverySuccess
        ErrorRecovery-->>Orchestrator: RecoveredResult
        Orchestrator->>Memory: remember('recovery_applied', result)
    else Recovery failed
        Navigator-->>ErrorRecovery: RecoveryFailed
        ErrorRecovery->>Monitor: escalateError(error, context)
        
        Note over Monitor: Validate current state
        Monitor->>Monitor: validatePageState()
        Monitor->>Memory: remember('validation_failed', state)
        Monitor-->>Orchestrator: ValidationError
        
        Note over Orchestrator: Request new plan
        Orchestrator->>Orchestrator: Continue to next iteration
    end
```

## Specialized Agent Workflows

### Form Handler Agent Sequence

```mermaid
sequenceDiagram
    participant Orchestrator
    participant FormHandler
    participant PageAnalyzer
    participant Navigator
    participant Browser
    
    Note over Orchestrator: Form handling task
    Orchestrator->>FormHandler: handleFormStep(step, pageContext, automation)
    
    Note over FormHandler: Analyze form structure
    FormHandler->>PageAnalyzer: analyzePage(automation)
    PageAnalyzer->>Browser: getPageStructure()
    Browser-->>PageAnalyzer: DOMStructure
    PageAnalyzer-->>FormHandler: PageContext
    
    Note over FormHandler: Identify form elements
    FormHandler->>FormHandler: identifyFormElements(pageContext, step)
    
    alt Form found
        Note over FormHandler: Fill form fields
        loop For each form field
            FormHandler->>Navigator: executeStep(fillStep)
            Navigator->>Browser: fillField(selector, value)
            Browser-->>Navigator: FieldFilled
            Navigator-->>FormHandler: StepResult
        end
        
        Note over FormHandler: Submit form
        FormHandler->>Navigator: executeStep(submitStep)
        Navigator->>Browser: clickSubmit(submitSelector)
        Browser-->>Navigator: FormSubmitted
        Navigator-->>FormHandler: SubmissionResult
        
        FormHandler-->>Orchestrator: FormHandlingSuccess
    else Form not found
        FormHandler-->>Orchestrator: FormNotFoundError
    end
```

### Data Extractor Agent Sequence

```mermaid
sequenceDiagram
    participant Orchestrator
    participant DataExtractor
    participant PageAnalyzer
    participant Browser
    participant AIService
    
    Note over Orchestrator: Data extraction task
    Orchestrator->>DataExtractor: extractData(step, pageContext, automation)
    
    Note over DataExtractor: Analyze page for data
    DataExtractor->>PageAnalyzer: analyzePage(automation)
    PageAnalyzer->>Browser: getPageContent()
    Browser-->>PageAnalyzer: PageContent
    PageAnalyzer-->>DataExtractor: AnalyzedContent
    
    Note over DataExtractor: Identify extraction targets
    DataExtractor->>DataExtractor: identifyDataElements(content, step)
    
    alt Structured data found
        Note over DataExtractor: Extract using selectors
        DataExtractor->>Browser: extractBySelectors(selectors)
        Browser-->>DataExtractor: StructuredData
    else Unstructured data
        Note over DataExtractor: Use AI for extraction
        DataExtractor->>AIService: generateResponse(extractionPrompt)
        AIService-->>DataExtractor: ExtractedData
    end
    
    Note over DataExtractor: Validate and format data
    DataExtractor->>DataExtractor: validateExtractedData(data)
    DataExtractor->>DataExtractor: formatData(data, step.expectedFormat)
    
    DataExtractor-->>Orchestrator: ExtractionResult
```

## Performance Monitoring Sequences

### Execution Performance Tracking

```mermaid
sequenceDiagram
    participant Orchestrator
    participant PerformanceMonitor
    participant Memory
    participant Metrics as Metrics Store
    
    Note over Orchestrator: Start task execution
    Orchestrator->>PerformanceMonitor: startTaskTracking(taskId)
    PerformanceMonitor->>PerformanceMonitor: recordStartTime(taskId)
    
    Note over Orchestrator: Execute steps
    loop For each step
        Orchestrator->>PerformanceMonitor: startStepTracking(stepId)
        Orchestrator->>Orchestrator: executeStep(step)
        Orchestrator->>PerformanceMonitor: endStepTracking(stepId, result)
        
        PerformanceMonitor->>PerformanceMonitor: calculateStepMetrics(stepId)
        PerformanceMonitor->>Metrics: recordStepMetrics(metrics)
    end
    
    Note over Orchestrator: Complete task
    Orchestrator->>PerformanceMonitor: endTaskTracking(taskId, result)
    PerformanceMonitor->>PerformanceMonitor: calculateTaskMetrics(taskId)
    
    Note over PerformanceMonitor: Store performance data
    PerformanceMonitor->>Memory: remember('performance_metrics', metrics)
    PerformanceMonitor->>Metrics: recordTaskMetrics(taskMetrics)
    
    Note over PerformanceMonitor: Generate performance report
    PerformanceMonitor->>PerformanceMonitor: generatePerformanceReport(taskId)
    PerformanceMonitor-->>Orchestrator: PerformanceReport
```

### Memory Usage Monitoring

```mermaid
sequenceDiagram
    participant Memory
    participant PerformanceMonitor
    participant Cleanup as Cleanup Service
    participant Storage as Chrome Storage
    
    Note over Memory: Monitor memory usage
    loop Periodic monitoring
        Memory->>PerformanceMonitor: reportMemoryUsage(currentUsage)
        PerformanceMonitor->>PerformanceMonitor: checkMemoryThresholds(usage)
        
        alt Memory threshold exceeded
            PerformanceMonitor->>Cleanup: triggerCleanup(urgency: 'high')
            Cleanup->>Memory: cleanup(maxAge: reduced)
            Memory->>Memory: removeOldEntries()
            Memory->>Storage: persistImportantData()
            Cleanup-->>PerformanceMonitor: CleanupComplete
        else Normal usage
            PerformanceMonitor->>PerformanceMonitor: recordNormalUsage()
        end
    end
    
    Note over PerformanceMonitor: Generate memory report
    PerformanceMonitor->>PerformanceMonitor: generateMemoryReport()
```

## Integration Sequences

### AI Service Integration

```mermaid
sequenceDiagram
    participant Agent
    participant AIService
    participant Provider
    participant ErrorRecovery
    participant FallbackProvider
    
    Note over Agent: Request AI processing
    Agent->>AIService: generateResponse(prompt, options)
    
    Note over AIService: Use primary provider
    AIService->>Provider: generateResponse(prompt)
    
    alt Primary provider success
        Provider-->>AIService: Response
        AIService-->>Agent: ProcessedResponse
    else Primary provider fails
        Provider-->>AIService: ProviderError
        AIService->>ErrorRecovery: handleProviderError(error)
        
        Note over ErrorRecovery: Attempt fallback
        ErrorRecovery->>FallbackProvider: generateResponse(prompt)
        
        alt Fallback success
            FallbackProvider-->>ErrorRecovery: Response
            ErrorRecovery-->>AIService: FallbackResponse
            AIService-->>Agent: ProcessedResponse
        else All providers fail
            FallbackProvider-->>ErrorRecovery: FallbackError
            ErrorRecovery-->>AIService: AllProvidersFailed
            AIService-->>Agent: AIServiceError
        end
    end
```

### Browser Automation Integration

```mermaid
sequenceDiagram
    participant Navigator
    participant Automation as Browser Automation
    participant Playwright
    participant Puppeteer
    participant Browser
    
    Note over Navigator: Execute browser action
    Navigator->>Automation: performAction(step)
    
    Note over Automation: Select automation engine
    alt Use Playwright
        Automation->>Playwright: executeAction(step)
        Playwright->>Browser: performBrowserAction()
        Browser-->>Playwright: ActionResult
        Playwright-->>Automation: PlaywrightResult
    else Use Puppeteer
        Automation->>Puppeteer: executeAction(step)
        Puppeteer->>Browser: performBrowserAction()
        Browser-->>Puppeteer: ActionResult
        Puppeteer-->>Automation: PuppeteerResult
    end
    
    Note over Automation: Process result
    Automation->>Automation: processActionResult(result)
    Automation-->>Navigator: ProcessedResult
```

These sequence diagrams provide detailed views of how components interact within the Multi-Agent Automation System, showing the flow of data, error handling, and coordination patterns that enable complex web automation tasks.