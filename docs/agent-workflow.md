# Delight Agent Automation Workflow

> **Phase 1 Implementation**: Multi-Agent System Architecture and Task Planning

## Overview

Delight's Agent Automation System is a revolutionary multi-agent framework that transforms natural language task descriptions into structured execution plans. This document outlines the complete workflow from user input to task completion.

## Architecture Components

### Core Agents

1. **🧠 Planner Agent** - Task analysis and plan creation
2. **⚡ Navigator Agent** - Step execution and browser interaction  
3. **🔍 Monitor Agent** - Progress tracking and validation

### Supporting Systems

- **AgentOrchestrator** - Coordinates agent communication
- **GeminiProvider** - Structured output for task planning
- **Agent UI** - Real-time progress visualization

## Complete Workflow

```mermaid
graph TD
    A[User Input: Natural Language Task] --> B[AgentOrchestrator]
    B --> C[Planner Agent]
    C --> D[Create Task Plan]
    D --> E[Navigator Agent]
    E --> F[Execute Steps]
    F --> G[Monitor Agent]
    G --> H[Validate Results]
    H --> I[Return Final Result]
    
    subgraph "Phase 1 - Current"
        C
        D
        G
        H
    end
    
    subgraph "Phase 2 - Future"
        E
        F
    end
```

## Detailed Agent Workflow

### 1. Task Initiation

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Agent UI
    participant O as Orchestrator
    
    U->>UI: Enter task description
    UI->>O: executeTask(userInput)
    O->>O: Generate taskId
    O->>UI: Progress: "Starting task..."
```

### 2. Planning Phase

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant P as Planner Agent
    participant G as Gemini Provider
    participant UI as Agent UI
    
    O->>P: createPlan(userInput)
    P->>G: generateStructuredResponse(prompt, schema)
    G->>G: Process with JSON schema
    G->>P: Return structured plan
    P->>O: TaskPlan object
    O->>UI: onPlanCreated(steps)
    UI->>UI: Display execution plan
```

### 3. Execution Phase (Phase 1)

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant N as Navigator Agent
    participant UI as Agent UI
    
    loop For each step
        O->>UI: onStepStart(stepIndex, step)
        O->>N: executeStep(step)
        N->>N: Simulate execution
        N->>O: Step result
        O->>UI: onStepComplete(stepIndex, result)
    end
```

### 4. Validation Phase

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant M as Monitor Agent
    participant UI as Agent UI
    
    O->>M: validateResult(executionResults)
    M->>M: Analyze results
    M->>O: Validation report
    O->>UI: Final result display
```

## Task Plan Structure

### JSON Schema for Task Planning

```typescript
interface TaskPlan {
  id: string;
  description: string;
  steps: TaskStep[];
  estimatedDuration: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

interface TaskStep {
  id: string;
  type: 'navigate' | 'click' | 'extract' | 'fill' | 'wait';
  selector?: string;
  url?: string;
  data?: any;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}
```

### Example Task Plan

```json
{
  "description": "Search for AI news on Google",
  "steps": [
    {
      "id": "step_1",
      "type": "navigate",
      "url": "https://google.com",
      "description": "Navigate to Google homepage"
    },
    {
      "id": "step_2", 
      "type": "fill",
      "selector": "input[name='q']",
      "data": "AI news",
      "description": "Enter search query"
    },
    {
      "id": "step_3",
      "type": "click", 
      "selector": "input[type='submit']",
      "description": "Submit search"
    }
  ],
  "estimatedDuration": 5000
}
```

## Agent Communication Protocol

```mermaid
graph LR
    subgraph "Agent Messages"
        A[AgentMessage] --> B[from: AgentType]
        A --> C[to: AgentType]
        A --> D[type: MessageType]
        A --> E[payload: any]
        A --> F[timestamp: number]
    end
    
    subgraph "Message Types"
        G[plan] --> H[Task planning]
        I[execute] --> J[Step execution]
        K[validate] --> L[Result validation]
        M[error] --> N[Error handling]
        O[progress] --> P[Status updates]
    end
```

## Error Handling & Recovery

```mermaid
flowchart TD
    A[Step Execution] --> B{Success?}
    B -->|Yes| C[Continue to Next Step]
    B -->|No| D[Error Detected]
    D --> E[Log Error]
    E --> F[Notify Monitor Agent]
    F --> G{Recoverable?}
    G -->|Yes| H[Retry Step]
    G -->|No| I[Fail Task]
    H --> A
    I --> J[Return Error Result]
```

## UI Progress Visualization

### Real-time Status Updates

```mermaid
stateDiagram-v2
    [*] --> Planning: User submits task
    Planning --> Executing: Plan created
    Executing --> StepRunning: For each step
    StepRunning --> StepComplete: Step succeeds
    StepRunning --> StepFailed: Step fails
    StepComplete --> StepRunning: More steps
    StepComplete --> Validating: All steps done
    StepFailed --> Failed: Unrecoverable
    Validating --> Completed: Success
    Validating --> Failed: Validation fails
    Completed --> [*]
    Failed --> [*]
```

### Log Entry Types

- **🧠 Planner**: Task analysis and plan creation
- **⚡ Navigator**: Step execution updates  
- **🔍 Monitor**: Progress tracking and validation
- **ℹ️ System**: General system messages
- **✅ Success**: Completed operations
- **❌ Error**: Failed operations

## Phase 2 Roadmap

### Planned Enhancements

```mermaid
timeline
    title Agent Automation Roadmap
    
    section Phase 1 (Current)
        Framework : Multi-agent architecture
                  : Task planning with Gemini
                  : UI visualization
                  : Error handling
    
    section Phase 2 (Next)
        Browser Automation : DOM interaction
                          : Form filling
                          : Data extraction
                          : Multi-tab coordination
    
    section Phase 3 (Future)
        Advanced Features : Agent templates
                         : Learning from feedback
                         : Complex workflows
                         : API integrations
```

### Browser Automation Capabilities

- **DOM Interaction**: Click, type, scroll, hover
- **Form Handling**: Fill forms, select options, upload files
- **Data Extraction**: Scrape content, parse structured data
- **Navigation**: Multi-tab coordination, page transitions
- **Validation**: Screenshot comparison, content verification

## Technical Implementation

### Key Files

```
src/services/agents/
├── AgentOrchestrator.ts     # Main coordination
├── PlannerAgent.ts          # Task planning
├── NavigatorAgent.ts        # Browser automation
├── MonitorAgent.ts          # Progress tracking
└── types/
    ├── AgentTypes.ts        # Type definitions
    └── TaskTypes.ts         # Task schemas

src/components/Agent/
├── AgentPage.tsx            # Main UI component
└── AgentInterface.tsx       # Progress visualization

src/services/ai/providers/
└── GeminiProvider.ts        # Structured output support
```

### Performance Considerations

- **Async Operations**: All agent communication is asynchronous
- **Error Boundaries**: Comprehensive error handling at each level
- **Memory Management**: Efficient task plan storage and cleanup
- **UI Responsiveness**: Non-blocking progress updates

## Security & Privacy

- **Local Execution**: All task planning happens locally
- **No Data Transmission**: Task plans never sent to external servers
- **Secure Storage**: Agent logs stored in Chrome's secure storage
- **Permission Model**: Browser automation requires explicit user consent

---

**Version**: 1.1.1 Phase 1  
**Last Updated**: September 2025  
**Status**: Framework Complete, Browser Automation In Development