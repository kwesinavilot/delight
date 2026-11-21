# Delight product analytics

Updated: 2026-11-21. PostHog is the sole product analytics integration; no Clarity or session replay is used.

## Consent and data boundaries

Analytics is off by default. Users can opt in under Settings > Appearance and opt out at any time. Setup never depends on opting in. Reports describe **consenting browser profiles**, not all installs or identified people. If a user opts in later, earlier activity is not replayed. Onboarding events only represent profiles that had already opted in when onboarding occurred, so onboarding conversion cannot be used as an install-wide conversion rate.

`PostHogService` waits for saved consent and SDK readiness before sending initial events. A bounded in-memory queue contains only sanitized properties and is discarded when consent is off or revoked. Consent changes propagate through extension storage events. Analytics failures must not block app actions.

Both the application capture path and the SDK's `before_send` hook use an explicit event/property allowlist. Unrecognized provider/model values become `other`; unknown events are dropped. Payloads retain only anonymous SDK identifiers needed for unique profiles/sessions, approved event properties, extension version, schema version, environment, and browser family. Profile setters, URLs/referrers, prompts, page/task content, custom instructions, provider keys, and raw errors are excluded. SDK page autocapture, session recordings, surveys, feature flags, performance capture, and external dependency loading are disabled.

The ingestion service still receives a network connection and can observe its source IP. `ip: false` disables SDK IP-based enrichment, not the network connection itself. Opting out does not retract events already sent. Anonymous IDs persist in the browser profile; clearing storage, opting out, or reinstalling can reset identity. Browser families derived from user-agent strings may not distinguish every Chromium derivative.

Model discovery is separate from analytics consent. When a user explicitly loads the public model list, the browser fetches `https://ai-gateway.vercel.sh/v1/models` without credentials, then filters the catalog locally by provider and supported text modalities. The request contains no provider key, prompt, or page content, though Vercel may observe the connection and IP address. This cross-provider catalog is informational and does not guarantee access through the user's own provider account. SambaNova suggestions remain manually maintained; Ollama models are local.

## Event audit and definitions

| Event | Actual caller / meaning | Approved properties |
| --- | --- | --- |
| `$pageview` | Welcome, sidepanel, guide, updates entrypoints | Fixed page name |
| `onboarding_step_viewed` | Welcome step change for profiles already opted in before onboarding | Step number |
| `onboarding_completed` | Welcome completion after saving local completion state | None; immediate beacon capture to reduce loss on close |
| `provider_connection_tested` | Shared connection tester used by onboarding and settings | Default/agent purpose, recognized provider/model, success/failure, bounded category and duration |
| `agent_model_selected` | Saving a separate agent connection or returning to the default | Selection, recognized provider/model |
| `provider_selected` | Chat provider switch | Recognized provider/model; fixed the previous caller sending the provider name as the model |
| `chat_request_started` / `chat_request_finished` | Conversation API around generation and recovery | Recognized provider/model, page-context boolean, terminal outcome/category, duration |
| `chat_message_sent` | Existing successful-reply metric | Provider, message length, page-context boolean; retained for compatibility |
| `page_attached` | Successful chat/agent attachment | Chat/agent surface only |
| `agent_run_started` / `agent_run_finished` | Runtime start and finally block | Random analytics run ID (not task ID), resume/attachment booleans; recognized provider/model, outcome, attempted steps, wall duration |
| `agent_control_used` | Runtime pause/resume/stop/approve and turn-limit wait | Fixed control name |
| `ai_tool_used` | Sending with a selected writing tool | Fixed tool ID and provider |
| `page_summary_generated` | Existing page-summary service | Provider, bounded summary length |
| `context_menu_action` | Handling a pending context-menu command | Fixed action and selection boolean |
| `mode_switched` | Maximize/minimize flow | Fixed source/destination mode |
| `provider_fallback` | Existing successful chat/summary fallback | Provider IDs |
| `product_activity` | Derived once from chat start, agent start, successful attachment, writing-tool use, summary, or context action | Fixed feature name |

Legacy helpers for `extension_installed`, `extension_updated`, `agent_automation_used`, and `error_recovery` remain for compatibility but are not used by the current flow. Do not treat their absence as an installation count or wire browser background analytics merely to collect unconsented installs.

Agent duration is wall time including user pauses/approval waits. A resumed saved task is a new run segment with a fresh analytics run ID. Closing a panel can prevent a terminal event: the dashboard lists starts without an outcome after 24 hours separately. Those can include long-paused tasks, abrupt closes, revoked consent, or network loss; they are not automatically classified as failures.

## Configuration

The build uses the existing public capture settings:

```text
VITE_PUBLIC_POSTHOG_KEY=<project capture token>
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
VITE_PUBLIC_ANALYTICS_ENVIRONMENT=production
```

The third value is optional. Development defaults to `development`; built production defaults to `production`. Use `test` for a controlled QA build. All dashboard queries require `environment = 'production'` and `analytics_schema_version = 2`, so fixture/legacy events do not contaminate the baseline. The current extension CSP allows the US capture host; another host needs an explicit CSP and privacy review.

Never put a personal/admin API key in a `VITE_*` variable, source, frontend config, or committed file. Public capture tokens cannot create dashboards or query events.

## Dashboard artifact and provisioning

[scripts/posthog-dashboard-definition.cjs](../scripts/posthog-dashboard-definition.cjs) defines 14 aggregate-only insights: daily/weekly active profiles, returning profiles, day-1/day-7 observed-first-use retention, setup reach/conversion, feature use, agent outcomes/success/duration, unfinished runs, chat/agent models, connection errors, and runtime errors.

Retention cohorts use first observed meaningful product activity, not installation. Day-1/day-7 eligible and returning counts are separate so immature cohorts are visible. Onboarding reach is a stage count, not an ordered funnel; the separate conversion panel measures completion within seven days after an observed first step. Agent success percentage uses recorded terminal outcomes as its denominator; unfinished starts are shown separately.

Preview without credentials or network:

```powershell
npm run analytics:dashboard
```

To provision or verify, use the connected PostHog integration, or set these **operator-only environment variables** in your shell/secret manager:

- `POSTHOG_API_HOST`: private API origin, e.g. `https://us.posthog.com` (different from the public capture host).
- `POSTHOG_PROJECT_ID`: intended numeric project ID.
- `POSTHOG_PERSONAL_API_KEY`: scoped key with `dashboard:write`, `insight:write`, and `query:read` for provisioning; verification needs `query:read`.

```powershell
npm run analytics:dashboard -- --apply
npm run analytics:verify
```

Apply validates all queries against the selected project before making changes, then creates the managed dashboard and missing insights. It only reuses the dashboard with its exact name/tag and skips insights with matching managed markers; reruns do not duplicate them. Concurrent applies are not supported. Existing managed queries are not silently overwritten: version the definition/tag when changing the dashboard contract. The script suppresses API response bodies and does not print credentials. This command creates external resources; preview is the default.

Verification returns only event names, aggregate counts, and latest timestamps from the last 24 hours. An empty result exits with code 2; capture acceptance alone does not prove event ingestion. The script does not send synthetic production events.

Official references: [PostHog API authentication](https://posthog.com/docs/api), [dashboards](https://posthog.com/docs/api/dashboards), [insights](https://posthog.com/docs/api/insights), [query API](https://posthog.com/docs/api/query).

## Verification and remaining live work

Automated checks cover off-by-default behavior, consent-loading and revocation races, property filtering, SDK failures, runtime outcome counts, and dashboard provisioning with a fake API. The browser transport fixture uses the real bundled SDK with an intercepted capture endpoint and fixture token, not production ingestion.

Live acceptance requires a PostHog project connection or operator credentials: enable optional analytics in a controlled build, complete onboarding, send a chat, attach a page, run/cancel an agent, verify the new events in PostHog, apply the dashboard, and confirm opt-out stops new captures. Query syntax and insight rendering are only confirmed live after the project validates the dashboard definition. Default-off tracking means no report can represent users who did not consent.
