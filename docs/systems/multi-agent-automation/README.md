# Multi-Agent Automation System

The Multi-Agent Automation System is the core orchestration engine that coordinates multiple specialized AI agents to perform complex web automation tasks. It provides intelligent task planning, execution monitoring, and error recovery.

## System Overview

The system follows a hierarchical agent architecture where a central orchestrator manages specialized agents, each responsible for specific automation capabilities.

### Core Components

1. **Agent Orchestrator** - Central coordination and task management
2. **Agent Memory** - Shared memory system for inter-agent communication
3. **Specialized Agents** - Task-specific automation agents
4. **Agent Messenger** - Message passing between agents

## Architecture Diagram

```mermaid
graph TB
    subgraph "Agent Orchestrator Layer"
        AO[Agent Orchestrator]
        AM[Agent Memory]
        Messenger[Agent Messenger]
    end
    
    subgraph "Specialized Agents"
        Planner[Planner Agent]
        Navigator[Navigator Agent]
        Monitor[Monitor Agent]
        PageAnalyzer[Page Analyzer Agent]
        FormHandler[Form Handler Agent]
        DataExtractor[Data Extractor Agent]
        SearchAgent[Search Agent]
    end
    
    subgraph "External Systems"
        AIService[AI Service]
        Browser[Browser Automation]
        Storage[(Chrome Storage)]
    end
    
    AO --> AM
    AO --> Messenger
    AO --> Planner
    AO --> Navigator
    AO --> Monitor
    
    Navigator --> PageAnalyzer
    Navigator --> FormHandler
    Navigator --> DataExtractor
    Navigator --> SearchAgent
    
    Planner --> AIService
    Navigator --> Browser
    AM --> Storage
    
    style AO fill:#e3f2fd
    style AM fill:#f3e5f5
    style Messenger fill:#f3e5f5
    style AIService fill:#e8f5e8
    style Browser fill:#fff3e0
    style Storage fill:#fff3e0
```

## Component Details

### Agent Orchestrator
- **Purpose**: Central coordination of all automation tasks
- **Responsibilities**: Task planning, agent coordination, progress monitoring
- **Key Methods**: `executeTask()`, `executeIteratively()`, `stopCurrentTask()`

### Agent Memory
- **Purpose**: Shared memory system for agent communication and context preservation
- **Features**: Conversation history, result caching, state management
- **Storage Types**: Context, Result, State, Plan

### Specialized Agents
Each agent handles specific automation capabilities:

- **Planner Agent**: Creates execution plans from user input
- **Navigator Agent**: Executes browser automation steps
- **Monitor Agent**: Validates results and monitors execution
- **Page Analyzer Agent**: Analyzes page structure and content
- **Form Handler Agent**: Specialized form interaction handling
- **Data Extractor Agent**: Extracts structured data from pages
- **Search Agent**: Handles search operations and result processing

## Task Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant Memory
    participant Planner
    participant Navigator
    participant Monitor
    
    User->>Orchestrator: executeTask(userInput)
    Orchestrator->>Memory: remember('currentTask', userInput)
    Orchestrator->>Planner: createPlan(userInput)
    Planner-->>Orchestrator: TaskPlan
    
    loop For each iteration (max 20)
        Orchestrator->>Planner: createPlan(context)
        Planner-->>Orchestrator: TaskStep[]
        
        alt Has steps to execute
            Orchestrator->>Navigator: executeStep(step)
            Navigator-->>Orchestrator: StepResult
            Orchestrator->>Memory: remember(result)
            
            alt Task complete
                break Exit loop
            end
        else No more steps
            break Task complete
        end
    end
    
    Orchestrator->>Monitor: validateResult(results)
    Monitor-->>Orchestrator: ValidationResult
    Orchestrator-->>User: AutomationResult
```

## Agent Communication Patterns

### Memory-Based Communication
Agents share information through the centralized memory system:

```mermaid
graph LR
    subgraph "Agent Memory"
        Context[Context Store]
        Results[Result Store]
        State[State Store]
        Plans[Plan Store]
    end
    
    Agent1[Agent A] --> Context
    Agent2[Agent B] --> Results
    Agent3[Agent C] --> State
    
    Context --> Agent2
    Results --> Agent3
    State --> Agent1
    
    style Context fill:#e1f5fe
    style Results fill:#e8f5e8
    style State fill:#fff3e0
    style Plans fill:#f3e5f5
```

### Message Passing
Direct communication between agents using the messenger system:

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Messenger
    participant Planner
    participant Navigator
    
    Orchestrator->>Messenger: sendMessage('orchestrator', 'planner', 'plan_request', data)
    Messenger->>Planner: deliverMessage(message)
    Planner->>Messenger: sendResponse('planner', 'orchestrator', 'plan_response', plan)
    Messenger->>Orchestrator: deliverMessage(response)
```

## Error Recovery Workflow

```mermaid
flowchart TD
    Start[Task Execution] --> Execute[Execute Step]
    Execute --> Success{Step Success?}
    
    Success -->|Yes| Complete{Task Complete?}
    Success -->|No| Error[Handle Error]
    
    Error --> Memory[Store Error in Memory]
    Memory --> NextPlan[Request Next Plan]
    NextPlan --> HasPlan{Has Recovery Plan?}
    
    HasPlan -->|Yes| Execute
    HasPlan -->|No| MaxRetries{Max Iterations?}
    
    MaxRetries -->|No| Execute
    MaxRetries -->|Yes| Fail[Task Failed]
    
    Complete -->|Yes| Validate[Validate Results]
    Complete -->|No| NextPlan
    
    Validate --> End[Task Complete]
    
    style Error fill:#ffebee
    style Fail fill:#ffcdd2
    style End fill:#e8f5e8
```

## Agent Decision Trees

### Task Routing Decision Tree

```mermaid
flowchart TD
    Input[User Input] --> Analyze[Analyze Task Type]
    
    Analyze --> Navigation{Navigation Task?}
    Analyze --> Form{Form Task?}
    Analyze --> Data{Data Extraction?}
    Analyze --> Search{Search Task?}
    
    Navigation -->|Yes| Navigator[Navigator Agent]
    Form -->|Yes| FormHandler[Form Handler Agent]
    Data -->|Yes| DataExtractor[Data Extractor Agent]
    Search -->|Yes| SearchAgent[Search Agent]
    
    Navigation -->|No| Complex[Complex Task]
    Form -->|No| Complex
    Data -->|No| Complex
    Search -->|No| Complex
    
    Complex --> Orchestrator[Orchestrator Coordination]
    
    Navigator --> Execute[Execute Task]
    FormHandler --> Execute
    DataExtractor --> Execute
    SearchAgent --> Execute
    Orchestrator --> Execute
    
    style Complex fill:#fff3e0
    style Execute fill:#e8f5e8
```

## Performance Optimization

### Iterative Execution Strategy
The system uses an iterative approach to handle complex tasks:

1. **Dynamic Planning**: Plans are created iteratively based on current context
2. **Context Preservation**: Previous results inform future planning
3. **Early Termination**: Tasks complete when success conditions are met
4. **Error Resilience**: Errors are treated as context for replanning

### Memory Management
- **Conversation Context**: Maintains dialogue history for context-aware planning
- **Result Caching**: Stores intermediate results for reference
- **State Persistence**: Preserves execution state across iterations
- **Cleanup Policies**: Automatic memory cleanup based on age and relevance

## Integration Points

### AI Service Integration
```mermaid
graph LR
    Planner --> AIService[AI Service]
    AIService --> Providers[AI Providers]
    Providers --> Models[Language Models]
    
    Models --> Planning[Task Planning]
    Models --> Analysis[Page Analysis]
    Models --> Recovery[Error Recovery]
    
    style AIService fill:#e8f5e8
    style Models fill:#e1f5fe
```

### Browser Automation Integration
```mermaid
graph LR
    Navigator --> Automation[Browser Automation]
    Automation --> Playwright[Playwright Core]
    Automation --> Puppeteer[Puppeteer Core]
    
    Playwright --> Actions[Browser Actions]
    Puppeteer --> Actions
    
    Actions --> DOM[DOM Manipulation]
    Actions --> Events[Event Simulation]
    Actions --> Navigation[Page Navigation]
    
    style Automation fill:#fff3e0
    style Actions fill:#e8f5e8
```

## Configuration and Extensibility

### Adding New Agents
To add a new specialized agent:

1. Implement the agent interface
2. Register with the orchestrator
3. Define agent-specific capabilities
4. Integrate with the memory system

### Customizing Execution Flow
The orchestrator supports customization through:
- **Callback Functions**: Progress monitoring and step-by-step control
- **Configuration Options**: Timeout settings, retry policies
- **Agent Selection**: Dynamic agent routing based on task requirements

## Monitoring and Debugging

### Execution Monitoring
```mermaid
graph TB
    Orchestrator --> Progress[Progress Callbacks]
    Orchestrator --> Logging[Console Logging]
    Orchestrator --> Memory[Memory State]
    
    Progress --> UI[UI Updates]
    Logging --> Debug[Debug Information]
    Memory --> Context[Context Tracking]
    
    style Progress fill:#e8f5e8
    style Logging fill:#e1f5fe
    style Memory fill:#f3e5f5
```

### Debug Information
- **Task Progress**: Real-time execution status
- **Agent Communication**: Message passing logs
- **Memory State**: Current context and results
- **Error Details**: Comprehensive error information

## Best Practices

1. **Task Decomposition**: Break complex tasks into manageable steps
2. **Context Management**: Maintain relevant context without overwhelming the system
3. **Error Handling**: Implement graceful degradation and recovery
4. **Performance Monitoring**: Track execution time and resource usage
5. **Agent Coordination**: Use appropriate communication patterns for different scenarios

## Related Documentation

- [AI Provider Architecture](../ai-provider-architecture/README.md)
- [Conversation Management System](../conversation-management/README.md)
- [Browser Automation Architecture](../../browser-automation-architecture.md)