# Privacy Policy for Delight Chrome Extension

Last updated: 2026-11-21

## Local records and direct AI requests

Delight stores provider credentials, conversation records, agent preferences, task summaries, and recovery checkpoints in this browser profile on this machine. Default provider credentials use local extension storage, not browser sync. An optional separate agent connection is also stored locally. Theme preferences may use browser sync.

Messages, custom instructions, selected text, requested page context, and agent observations are sent directly to the AI provider selected for that feature, using your key for authentication. Agent observations may include tab titles and URLs, visible text, frame content, control values, and recent action outcomes. This information may contain personal or sensitive data. Only use pages and instructions you intend to share with that provider. The provider's own terms and retention policies apply. Delight does not route these AI requests through a Delight server.

Chat uses the default model. Agents use that model unless you configure a separate provider/model in onboarding or Settings > Agent. Choosing a separate connection does not switch the chat provider.

## Task history and settings

Agent settings include custom instructions (up to 1,500 characters), maximum turns, confirmation preferences, tab access, and history retention. The agent has no tool for editing these settings or credentials.

By default, Delight retains 20 inactive task records; you may choose 0, 10, 20, 50, or 100 under Settings > Agent. Active and paused tasks retain local write-ahead checkpoints while the panel is open. Reducing retention removes older inactive records. With retention off, interrupted tasks are removed after restart as well.

Saved task records include instructions, action/event summaries, outcomes, and checkpoint metadata such as tab URL/identity and uncertainty flags. They do not intentionally checkpoint typed action payloads, full DOM snapshots, or provider keys. Instructions and generated summaries can still contain sensitive information.

Delete individual inactive tasks in Agent mode, or use Clear saved task history in Settings > Agent. Clearing history preserves running and paused tasks. Stop those tasks first if you also want their records removed. Use the chat history controls to delete saved conversations. Uninstalling the extension removes its local extension storage.

## Permissions and browser access

Delight uses activeTab, tabs, scripting, sidePanel, storage, contextMenus, and debugger permissions for its interface, page context, automation, and optional native keyboard/pointer input. HTTP(S) host access supports page interactions across websites and accessible frames. Browser restrictions and other tools using debugger access can prevent actions.

Starting-tab mode limits the agent's explicit opening, switching, and following of other tabs; navigation within its starting tab is allowed. Websites may still open their own popups. Sensitive-action confirmation uses recognized controls, labels, and model classifications; it does not guarantee detection of every consequential action or guarantee transaction delivery.

## Optional usage analytics

Usage analytics is disabled by default. You may opt in during onboarding or under Settings > Appearance. Events collected after opting in measure setup progress, feature use, and task outcomes; earlier activity is not replayed. We use PostHog for usage analytics thus our PostHog dashboard receives feature events, recognized provider/model categories, extension version, a pseudonymous identifier, browser family, bounded counters and durations, and error categories. It does not receive prompts, page contents, task text, page URLs, API keys, or session recordings. Analytics consent stays in this browser profile. You may disable analytics at any time; this stops future captures but does not delete events already received by PostHog.

AI providers and PostHog (through usage analytics) if enabled, receive network requests and may observe your IP address. Their policies apply to those requests.

## Storage limitations and contact

Local extension storage is not a dedicated encrypted secrets vault. Other software or people with access to your browser profile or machine may be able to access its data. Delight does not promise that Chrome encrypts extension storage values. Protect your machine and provider accounts, and revoke keys with the provider if needed.

Questions or reports: [Delight GitHub Issues](https://github.com/kwesinavilot/delight/issues).
