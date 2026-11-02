import posthog from 'posthog-js/dist/module.full.no-external';

class PostHogService {
  private static instance: PostHogService;
  private initialized = false;
  private consented = false;
  private consentLoading = false;
  private consentVersion = 0;
  private watching = false;
  private configured = false;
  async setEnabled(enabled: boolean) {
    await chrome.storage.local.set({ analyticsOptIn: enabled });
    this.consentVersion++;
    this.consented = enabled;
    if (!enabled) {
      if (this.initialized) { posthog.opt_out_capturing(); posthog.reset(); }
      this.initialized = false;
    } else {
      this.initialize();
    }
  }

  private constructor() {}

  static getInstance(): PostHogService {
    if (!PostHogService.instance) {
      PostHogService.instance = new PostHogService();
    }
    return PostHogService.instance;
  }

  initialize(): void {
    if (!this.watching) {
      this.watching = true;
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes.analyticsOptIn) return;
        this.consentVersion++;
        this.consented = changes.analyticsOptIn.newValue === true;
        if (this.consented) this.initialize();
        else {
          if (this.initialized) { posthog.opt_out_capturing(); posthog.reset(); }
          this.initialized = false;
        }
      });
    }
    if (this.initialized) return;
    if (!this.consented) {
      if (this.consentLoading) return;
      this.consentLoading = true;
      const version = this.consentVersion;
      void chrome.storage.local.get(['analyticsOptIn']).then(result => {
        if (version !== this.consentVersion) return;
        this.consented = result.analyticsOptIn === true;
        if (this.consented) this.initialize();
      }).catch(() => {}).finally(() => { this.consentLoading = false; });
      return;
    }
    if (this.configured) {
      posthog.opt_in_capturing({ captureEventName: false });
      this.initialized = true;
      return;
    }

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
      capture_pageleave: false,
      ip: false,
      opt_out_capturing_by_default: true,
      property_denylist: ['$current_url', '$referrer', '$referring_domain', '$pathname', '$initial_current_url', '$initial_referrer'],
      disable_session_recording: true,
      disable_surveys: true,
      autocapture: false,
      capture_dead_clicks: false,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      cross_subdomain_cookie: false,
      persistence: 'localStorage',
      loaded: (posthog) => {
        if (this.consented) posthog.opt_in_capturing({ captureEventName: false });
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      }
    });

    this.initialized = true;
    this.configured = true;
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
      task_type: ['navigation', 'search', 'form', 'extraction'].includes(taskType) ? taskType : 'other',
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
    if (!this.initialized || !this.consented) return;
    
    posthog.capture(event, {
      ...properties,
      extension_version: chrome.runtime.getManifest().version
    });
  }

  trackPage(pageName: string): void {
    if (!this.initialized || !this.consented) return;
    
    posthog.capture('$pageview', {
      page_name: pageName
    });
  }
}

export default PostHogService.getInstance();
