import { AIService } from '@/services/ai/AIService';
import { ConversationManager } from '@/services/chat/ConversationManager';
import { ConfigManager } from '@/services/config/ConfigManager';

export interface ProviderSwitchOptions {
  preserveContext?: boolean;
  convertContext?: boolean;
  createNewSession?: boolean;
  validateConversion?: boolean;
}

export interface ProviderSwitchResult {
  success: boolean;
  warnings?: string[];
  newSessionId?: string;
  contextConverted?: boolean;
  error?: string;
}

/**
 * Utility class for handling provider switching with context preservation
 */
export class ProviderSwitchingUtil {
  private static instance: ProviderSwitchingUtil;

  static getInstance(): ProviderSwitchingUtil {
    if (!ProviderSwitchingUtil.instance) {
      ProviderSwitchingUtil.instance = new ProviderSwitchingUtil();
    }
    return ProviderSwitchingUtil.instance;
  }

  /**
   * Switch to a new provider with the given options
   */
  async switchProvider(
    targetProvider: string,
    options: ProviderSwitchOptions = {}
  ): Promise<ProviderSwitchResult> {
    try {
      const aiService = AIService.getInstance();
      const conversationManager = ConversationManager.getInstance();
      const configManager = ConfigManager.getInstance();

      // Validate target provider
      const availableProviders = aiService.getAvailableProviders();
      if (!availableProviders.includes(targetProvider)) {
        return {
          success: false,
          error: `Provider ${targetProvider} is not available`
        };
      }

      // Check if provider is configured
      const isConfigured = await configManager.isProviderConfigured(targetProvider);
      if (!isConfigured) {
        return {
          success: false,
          error: `Provider ${targetProvider} is not configured. Please add an API key.`
        };
      }

      const currentProvider = aiService.getCurrentProviderName();
      
      // If same provider, no switch needed
      if (currentProvider === targetProvider) {
        return {
          success: true,
          warnings: ['Already using the selected provider']
        };
      }

      // Get current session info
      const sessionInfo = conversationManager.getCurrentSessionInfo();
      const hasActiveConversation = sessionInfo && sessionInfo.messageCount > 0;

      // Determine default behavior if not specified
      const finalOptions = await this.resolveOptions(options, hasActiveConversation ?? false);

      // Switch the AI service provider
      await aiService.switchProvider(targetProvider, {
        preserveContext: finalOptions.preserveContext,
        clearContext: !finalOptions.preserveContext && !finalOptions.createNewSession
      });

      // Handle conversation context
      let result: ProviderSwitchResult = { success: true };
      
      if (hasActiveConversation) {
        const switchResult = await conversationManager.switchProvider(
          targetProvider,
          finalOptions.preserveContext,
          {
            createNewSession: finalOptions.createNewSession,
            convertContext: finalOptions.convertContext,
            validateConversion: finalOptions.validateConversion
          }
        );

        result = {
          success: switchResult.success,
          warnings: switchResult.warnings,
          newSessionId: switchResult.newSessionId,
          contextConverted: switchResult.contextConverted
        };
      }

      console.log(`Successfully switched from ${currentProvider} to ${targetProvider}`);
      return result;

    } catch (error) {
      console.error('Provider switch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get recommendations for switching to a target provider
   */
  async getSwitchRecommendations(targetProvider: string) {
    try {
      const conversationManager = ConversationManager.getInstance();
      return await conversationManager.getProviderSwitchRecommendations(targetProvider);
    } catch (error) {
      console.error('Failed to get switch recommendations:', error);
      return {
        canPreserveContext: false,
        shouldConvertContext: false,
        warnings: ['Unable to analyze context compatibility'],
        recommendations: ['Consider starting a new conversation']
      };
    }
  }

  /**
   * Check if a provider switch requires user confirmation
   */
  async requiresConfirmation(targetProvider: string): Promise<boolean> {
    try {
      const conversationManager = ConversationManager.getInstance();
      const sessionInfo = conversationManager.getCurrentSessionInfo();
      
      if (!sessionInfo || sessionInfo.messageCount === 0) {
        return false; // No confirmation needed for empty conversations
      }

      const recommendations = await this.getSwitchRecommendations(targetProvider);
      
      // Require confirmation if there are warnings or if context can't be preserved
      return recommendations.warnings.length > 0 || !recommendations.canPreserveContext;
    } catch (error) {
      console.error('Failed to check confirmation requirement:', error);
      return true; // Default to requiring confirmation on error
    }
  }

  /**
   * Resolve options based on user settings and conversation state
   */
  private async resolveOptions(
    options: ProviderSwitchOptions,
    hasActiveConversation: boolean
  ): Promise<Required<ProviderSwitchOptions>> {
    const conversationManager = ConversationManager.getInstance();
    const messageStore = conversationManager['messageStore']; // Access private member
    const settings = await messageStore.getSettings();

    return {
      preserveContext: options.preserveContext ?? (
        hasActiveConversation && 
        settings.preserveOnProviderSwitch && 
        settings.providerSwitchBehavior !== 'new_session'
      ),
      convertContext: options.convertContext ?? settings.enableContextConversion,
      createNewSession: options.createNewSession ?? (
        settings.providerSwitchBehavior === 'new_session'
      ),
      validateConversion: options.validateConversion ?? true
    };
  }

  /**
   * Quick switch without confirmation (for programmatic use)
   */
  async quickSwitch(targetProvider: string): Promise<ProviderSwitchResult> {
    return this.switchProvider(targetProvider, {
      preserveContext: false,
      createNewSession: true,
      convertContext: false,
      validateConversion: false
    });
  }

  /**
   * Switch with context preservation (for user-initiated switches)
   */
  async switchWithContext(targetProvider: string): Promise<ProviderSwitchResult> {
    return this.switchProvider(targetProvider, {
      preserveContext: true,
      convertContext: true,
      createNewSession: false,
      validateConversion: true
    });
  }
}

// Export singleton instance
export const providerSwitchingUtil = ProviderSwitchingUtil.getInstance();