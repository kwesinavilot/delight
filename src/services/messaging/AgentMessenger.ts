import { AgentMessage, AgentRole, MessageType } from './MessageTypes';

export class AgentMessenger {
  private static instance: AgentMessenger;
  private messageHandlers: Map<string, (message: AgentMessage) => void> = new Map();
  private messageHistory: AgentMessage[] = [];
  private conversationId: string = '';

  static getInstance(): AgentMessenger {
    if (!AgentMessenger.instance) {
      AgentMessenger.instance = new AgentMessenger();
    }
    return AgentMessenger.instance;
  }

  startConversation(conversationId: string): void {
    this.conversationId = conversationId;
    this.messageHistory = [];
  }

  sendMessage(from: AgentRole, to: AgentRole, type: MessageType, payload: any): string {
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      type,
      payload,
      timestamp: Date.now(),
      conversationId: this.conversationId
    };

    this.messageHistory.push(message);
    
    // Route message to handler
    const handlerKey = `${to}_${type}`;
    const handler = this.messageHandlers.get(handlerKey);
    
    if (handler) {
      setTimeout(() => handler(message), 0);
    }

    console.log(`📨 [AgentMessenger] ${from} → ${to}: ${type}`, payload);
    return message.id;
  }

  registerHandler(agent: AgentRole, messageType: MessageType, handler: (message: AgentMessage) => void): void {
    const key = `${agent}_${messageType}`;
    this.messageHandlers.set(key, handler);
  }

  getConversationHistory(): AgentMessage[] {
    return [...this.messageHistory];
  }

  getMessagesByAgent(agent: AgentRole): AgentMessage[] {
    return this.messageHistory.filter(msg => msg.from === agent || msg.to === agent);
  }

  clearHistory(): void {
    this.messageHistory = [];
  }
}