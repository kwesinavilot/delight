import { z } from 'zod';

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export abstract class BaseAction {
  abstract name(): string;
  abstract schema(): z.ZodType;
  abstract execute(params: any, context: any): Promise<ActionResult>;
  
  hasIndex(): boolean {
    return false;
  }
}

export class ActionRegistry {
  private actions: Map<string, BaseAction> = new Map();
  private retryAttempts: number = 3;

  registerAction(action: BaseAction): void {
    this.actions.set(action.name(), action);
    console.log(`✅ [ActionRegistry] Registered action: ${action.name()}`);
  }

  getAction(name: string): BaseAction | undefined {
    return this.actions.get(name);
  }

  getAllActions(): BaseAction[] {
    return Array.from(this.actions.values());
  }

  generateDynamicSchema(): z.ZodType {
    const actionSchemas: Record<string, z.ZodType> = {};
    
    for (const action of this.actions.values()) {
      actionSchemas[action.name()] = action.schema();
    }

    return z.object({
      actions: z.array(
        z.discriminatedUnion('type', 
          Object.entries(actionSchemas).map(([name, schema]) =>
            z.object({
              type: z.literal(name),
              params: schema
            })
          ) as any
        )
      )
    });
  }

  async executeWithRetry(
    actionName: string, 
    params: any, 
    context: any
  ): Promise<ActionResult> {
    const action = this.actions.get(actionName);
    if (!action) {
      return {
        success: false,
        error: `Action ${actionName} not found`,
        timestamp: Date.now()
      };
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 [ActionRegistry] Executing ${actionName} (attempt ${attempt})`);
        
        const result = await action.execute(params, context);
        
        if (result.success) {
          console.log(`✅ [ActionRegistry] ${actionName} succeeded on attempt ${attempt}`);
          return result;
        } else {
          lastError = new Error(result.error || 'Action failed');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ [ActionRegistry] ${actionName} failed attempt ${attempt}:`, lastError.message);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return {
      success: false,
      error: `Action failed after ${this.retryAttempts} attempts: ${lastError?.message}`,
      timestamp: Date.now()
    };
  }
}