import posthog from 'posthog-js';

class PostHogService {
  private static instance: PostHogService;
  private initialized = false;

  private constructor() {}

  static getInstance(): PostHogService {
    if (!PostHogService.instance) {
      PostHogService.instance = new PostHogService();
    }
    return PostHogService.instance;
  }

  initialize(): void {
    if (this.initialized) return;

    const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
    const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

    if (!apiKey || !host) {
      console.warn('PostHog configuration missing');
      return;
    }

    posthog.init(apiKey, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
      disable_surveys: true,
      cross_subdomain_cookie: false,
      persistence: 'localStorage',
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      }
    });

    this.initialized = true;
  }

  // Extension events
  trackExtensionInstalled(): void {
    this.track('extension_installed', {
      version: chrome.runtime.getManifest().version
    });
  }

  trackExtensionUpdated(previousVersion: string, currentVersion: string): void {
    this.track('extension_updated', {
      previous_version: previousVersion,
      current_version: currentVersion
    });
  }

  trackProviderSelected(provider: string, model?: string): void {
    this.track('provider_selected', { provider, model });
  }

  trackChatMessage(provider: string, messageLength: number, hasPageContext: boolean): void {
    this.track('chat_message_sent', {
      provider,
      message_length: messageLength,
      has_page_context: hasPageContext
    });
  }

  trackContextMenuAction(action: string, hasSelection: boolean): void {
    this.track('context_menu_action', {
      action,
      has_selection: hasSelection
    });
  }

  trackAgentAutomation(taskType: string, success: boolean): void {
    this.track('agent_automation_used', {
      task_type: taskType,
      success
    });
  }

  trackAIToolUsed(tool: string, provider: string): void {
    this.track('ai_tool_used', { tool, provider });
  }

  trackPageSummary(provider: string, summaryLength: string): void {
    this.track('page_summary_generated', {
      provider,
      summary_length: summaryLength
    });
  }

  trackModeSwitch(fromMode: string, toMode: string): void {
    this.track('mode_switched', {
      from_mode: fromMode,
      to_mode: toMode
    });
  }

  trackErrorRecovery(errorType: string, recoveryMethod: string, success: boolean): void {
    this.track('error_recovery', {
      error_type: errorType,
      recovery_method: recoveryMethod,
      success
    });
  }

  trackProviderFallback(primaryProvider: string, fallbackProvider: string): void {
    this.track('provider_fallback', {
      primary_provider: primaryProvider,
      fallback_provider: fallbackProvider
    });
  }

  // Generic tracking
  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    
    posthog.capture(event, {
      ...properties,
      extension_version: chrome.runtime.getManifest().version
    });
  }

  trackPage(pageName: string): void {
    if (!this.initialized) return;
    
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName
    });
  }
}

export default PostHogService.getInstance();