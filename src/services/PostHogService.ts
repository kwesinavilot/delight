import posthog from 'posthog-js/dist/module.full.no-external';

type Properties = Record<string, unknown>;
const choices = (...values: string[]) => (value: unknown) => typeof value === 'string' && values.includes(value) ? value : 'other';
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(Math.round(value), 86400000) : undefined;
const bool = (value: unknown) => typeof value === 'boolean' ? value : undefined;
const provider = choices('openai', 'deepseek', 'mistral', 'anthropic', 'gemini', 'grok', 'groq', 'sambanova', 'ollama');
const model = choices('gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-5', 'gpt-5-mini', 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'deepseek-chat', 'deepseek-reasoner', 'mistral-small-latest', 'mistral-large-latest', 'grok-3-mini', 'grok-beta', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama3.2', 'llama3.1', 'codellama', 'mistral', 'gpt-oss:20b', 'gpt-oss:120b', 'DeepSeek-V3.1');
const outcome = choices('success', 'failed', 'cancelled', 'interrupted');
const errorCategory = choices('authentication', 'rate_limit', 'network', 'timeout', 'configuration', 'validation', 'action', 'cancelled', 'other');
const purpose = choices('default', 'agent');
const mode = choices('sidepanel', 'fullscreen', 'popup');
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value) ? value : undefined;
const version = (value: unknown) => typeof value === 'string' && /^\d+(\.\d+){1,3}$/.test(value) ? value : undefined;
const schema: Record<string, Record<string, (value: unknown) => unknown>> = {
  '$pageview': { page_name: choices('sidepanel', 'welcome', 'user_guide', 'updates') },
  onboarding_step_viewed: { step: count }, onboarding_completed: {},
  provider_connection_tested: { purpose, provider, model, outcome, error_category: errorCategory, duration_ms: count },
  provider_selected: { provider, model },
  agent_model_selected: { selection: choices('default', 'separate'), provider, model },
  chat_request_started: { provider, model, has_page_context: bool },
  chat_request_finished: { provider, model, outcome, error_category: errorCategory, duration_ms: count },
  chat_message_sent: { provider, message_length: count, has_page_context: bool },
  page_attached: { surface: choices('chat', 'agent') },
  agent_run_started: { run_id: uuid, resumed: bool, has_attachment: bool },
  agent_run_finished: { run_id: uuid, provider, model, outcome, error_category: errorCategory, duration_ms: count, step_count: count },
  agent_control_used: { control: choices('pause', 'resume', 'stop', 'approve', 'step_limit') },
  agent_automation_used: { task_type: choices('navigation', 'search', 'form', 'extraction'), success: bool },
  ai_tool_used: { tool: choices('explain', 'paraphrase', 'improve', 'expand', 'shorten', 'academic', 'professional', 'persuasive', 'casual', 'funny'), provider },
  page_summary_generated: { provider, summary_length: choices('short', 'medium', 'long') },
  mode_switched: { from_mode: mode, to_mode: mode },
  context_menu_action: { action: choices('summarize', 'chat', 'explain', 'rewrite', 'open'), has_selection: bool },
  error_recovery: { error_type: errorCategory, recovery_method: choices('retry', 'fallback'), success: bool },
  provider_fallback: { primary_provider: provider, fallback_provider: provider },
  product_activity: { feature: choices('chat', 'agent', 'attachment', 'ai_tool', 'summary', 'context_menu') },
  extension_installed: { version }, extension_updated: { previous_version: version, current_version: version }
};
const activity: Record<string, string> = { chat_request_started: 'chat', agent_run_started: 'agent', page_attached: 'attachment', ai_tool_used: 'ai_tool', page_summary_generated: 'summary', context_menu_action: 'context_menu' };
export function analyticsError(error: unknown): string {
  const cause = error as { type?: string; message?: string };
  const text = `${cause?.type || ''} ${cause?.message || ''}`;
  if (/abort|cancel|stopped by user/i.test(text)) return 'cancelled';
  if (/429|quota|rate.?limit/i.test(text)) return 'rate_limit';
  if (/401|403|api.?key|authentication|permission/i.test(text)) return 'authentication';
  if (/timeout|timed out/i.test(text)) return 'timeout';
  if (/network|fetch|offline|502|503/i.test(text)) return 'network';
  if (/configur|provider.*not|no.*provider/i.test(text)) return 'configuration';
  if (/validat|JSON|schema/i.test(text)) return 'validation';
  return 'other';
}
function clean(event: string, properties: Properties = {}): Properties | null {
  if (!Object.prototype.hasOwnProperty.call(schema, event)) return null;
  const result: Properties = {};
  for (const [key, validate] of Object.entries(schema[event])) {
    if (properties[key] === undefined) continue;
    const value = validate(properties[key]);
    if (value !== undefined) result[key] = value;
  }
  return result;
}
function browserName(): string {
  const agent = globalThis.navigator?.userAgent || '';
  return /Edg\//.test(agent) ? 'edge' : /OPR\//.test(agent) ? 'opera' : /Firefox\//.test(agent) ? 'firefox' : /Chrome\//.test(agent) ? 'chrome' : /Safari\//.test(agent) ? 'safari' : 'other';
}
class PostHogService {
  private static instance: PostHogService;
  private initialized = false;
  private consented = false;
  private consentResolved = false;
  private loading?: Promise<void>;
  private consentVersion = 0;
  private watching = false;
  private configured = false;
  private sdkReady = false;
  private pending: Array<{ event: string; properties: Properties }> = [];
  private constructor() {}
  static getInstance() { return this.instance ||= new PostHogService(); }
  async setEnabled(enabled: boolean) {
    await chrome.storage.local.set({ analyticsOptIn: enabled });
    this.applyConsent(enabled);
    this.initialize();
  }
  private applyConsent(enabled: boolean) {
    this.consentVersion++;
    this.consentResolved = true;
    this.consented = enabled;
    if (!enabled) {
      this.pending = [];
      if (this.configured) { posthog.opt_out_capturing(); posthog.reset(); }
      this.initialized = false;
    }
  }
  initialize(): void {
    if (!this.watching) {
      this.watching = true;
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.analyticsOptIn) {
          this.applyConsent(changes.analyticsOptIn.newValue === true);
          this.initialize();
        }
      });
    }
    if (this.initialized) return;
    if (!this.consentResolved) {
      if (this.loading) return;
      const serial = this.consentVersion;
      this.loading = chrome.storage.local.get(['analyticsOptIn']).then(result => {
        if (serial !== this.consentVersion) return;
        this.applyConsent(result.analyticsOptIn === true);
        this.initialize();
      }).catch(() => { if (serial === this.consentVersion) this.applyConsent(false); });
      return;
    }
    if (!this.consented) return;
    try {
      if (this.configured) {
        if (!this.sdkReady) return;
        posthog.opt_in_capturing({ captureEventName: false });
      }
      else {
        const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
        const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
        if (!key || !host) { this.pending = []; return; }
        this.configured = true;
        posthog.init(key, {
          api_host: host, person_profiles: 'identified_only', capture_pageview: false, capture_pageleave: false,
          ip: false, opt_out_capturing_by_default: true, autocapture: false, capture_dead_clicks: false,
          disable_session_recording: true, disable_surveys: true, disable_external_dependency_loading: true,
          advanced_disable_flags: true, capture_performance: false, cross_subdomain_cookie: false, persistence: 'localStorage',
          property_denylist: ['$current_url', '$referrer', '$referring_domain', '$pathname', '$initial_current_url', '$initial_referrer'],
          before_send: event => {
            if (!event || !this.consented) return null;
            const safe = clean(event.event, event.properties);
            if (!safe) return null;
            for (const name of ['distinct_id', '$device_id', '$session_id', '$window_id', 'token', '$lib', '$lib_version', '$insert_id']) {
              const value = event.properties[name];
              if (typeof value === 'string' || typeof value === 'number') safe[name] = value;
            }
            return { uuid: event.uuid, event: event.event, timestamp: event.timestamp, properties: { ...safe, ...this.common(), $process_person_profile: false } };
          },
          loaded: sdk => {
            this.sdkReady = true;
            if (this.consented) {
              sdk.opt_in_capturing({ captureEventName: false });
              this.initialized = true;
              for (const item of this.pending.splice(0)) this.capture(item.event, item.properties);
            }
          }
        });
        return; // loaded() makes the SDK ready and flushes bounded pending events.
      }
      this.initialized = true;
      const events = this.pending.splice(0);
      for (const item of events) this.capture(item.event, item.properties);
    } catch { this.initialized = false; if (!this.sdkReady) this.configured = false; this.pending = []; } // Analytics must never break a user action.
  }
  private common() {
    const environment = import.meta.env.VITE_PUBLIC_ANALYTICS_ENVIRONMENT;
    return { extension_version: chrome.runtime.getManifest().version, analytics_schema_version: 2, browser: browserName(),
      environment: ['production', 'development', 'test'].includes(environment) ? environment : import.meta.env.DEV ? 'development' : 'production' };
  }
  private capture(event: string, properties: Properties) {
    if (!this.consented || !this.initialized) return;
    try { posthog.capture(event, { ...properties, ...this.common() }, event === 'onboarding_completed' ? { send_instantly: true, transport: 'sendBeacon' } : undefined); } catch { /* Best effort; do not expose request details. */ }
  }
  track(event: string, properties: Properties = {}): void {
    try {
    const safe = clean(event, properties);
    if (!safe) return;
    this.initialize();
    const events = [{ event, properties: safe }];
    if (activity[event]) events.push({ event: 'product_activity', properties: { feature: activity[event] } });
    for (const item of events) {
      if (this.initialized) this.capture(item.event, item.properties);
      else if ((!this.consentResolved || this.consented) && this.pending.length < 40) this.pending.push(item);
    }
    } catch { /* Consent/storage/SDK failures cannot interrupt product actions. */ }
  }
  trackPage(pageName: string) { this.track('$pageview', { page_name: pageName }); }
  trackProviderSelected(name: string, modelId?: string) { this.track('provider_selected', { provider: this.providerId(name), model: modelId }); }
  providerId(name: string) {
    const aliases: Record<string, string> = { 'google gemini': 'gemini', 'x.ai': 'grok', 'grok (x.ai)': 'grok', 'ollama (local)': 'ollama' };
    return provider(aliases[name.toLowerCase()] || name.toLowerCase()) as string;
  }
  trackChatMessage(name: string, messageLength: number, hasPageContext: boolean) { this.track('chat_message_sent', { provider: this.providerId(name), message_length: messageLength, has_page_context: hasPageContext }); }
  trackAgentAutomation(taskType: string, success: boolean) { this.track('agent_automation_used', { task_type: taskType, success }); }
  trackAIToolUsed(tool: string, name: string) { this.track('ai_tool_used', { tool, provider: this.providerId(name) }); }
  trackPageSummary(name: string, summaryLength: string) { this.track('page_summary_generated', { provider: this.providerId(name), summary_length: summaryLength }); }
  trackModeSwitch(fromMode: string, toMode: string) { this.track('mode_switched', { from_mode: fromMode, to_mode: toMode }); }
  trackContextMenuAction(action: string, hasSelection: boolean) { this.track('context_menu_action', { action, has_selection: hasSelection }); }
  trackProviderFallback(primary: string, fallback: string) { this.track('provider_fallback', { primary_provider: this.providerId(primary), fallback_provider: this.providerId(fallback) }); }
  trackErrorRecovery(errorType: string, method: string, success: boolean) { this.track('error_recovery', { error_type: errorType, recovery_method: method, success }); }
  trackExtensionInstalled() { this.track('extension_installed', { version: chrome.runtime.getManifest().version }); }
  trackExtensionUpdated(previousVersion: string, currentVersion: string) { this.track('extension_updated', { previous_version: previousVersion, current_version: currentVersion }); }
}
export default PostHogService.getInstance();
