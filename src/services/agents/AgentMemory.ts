export interface MemoryEntry {
  key: string;
  value: any;
  timestamp: number;
  type: 'context' | 'result' | 'state' | 'plan';
}

export class AgentMemory {
  private memory: Map<string, MemoryEntry> = new Map();
  private conversationHistory: Array<{role: string, content: string, timestamp: number}> = [];

  remember(key: string, value: any, type: MemoryEntry['type'] = 'context'): void {
    this.memory.set(key, {
      key,
      value,
      timestamp: Date.now(),
      type
    });
  }

  recall(key: string): any {
    return this.memory.get(key)?.value;
  }

  recallByType(type: MemoryEntry['type']): MemoryEntry[] {
    return Array.from(this.memory.values()).filter(entry => entry.type === type);
  }

  addToConversation(role: string, content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now()
    });
  }

  getConversationContext(limit: number = 10): Array<{role: string, content: string}> {
    return this.conversationHistory
      .slice(-limit)
      .map(({role, content}) => ({role, content}));
  }

  cleanup(maxAge: number = 3600000): void {
    const cutoff = Date.now() - maxAge;
    for (const [key, entry] of this.memory.entries()) {
      if (entry.timestamp < cutoff) {
        this.memory.delete(key);
      }
    }
    
    this.conversationHistory = this.conversationHistory.filter(
      entry => entry.timestamp > cutoff
    );
  }

  getStateSummary(): any {
    return {
      memoryCount: this.memory.size,
      conversationLength: this.conversationHistory.length,
      lastActivity: Math.max(
        ...Array.from(this.memory.values()).map(e => e.timestamp),
        ...this.conversationHistory.map(e => e.timestamp)
      )
    };
  }
}