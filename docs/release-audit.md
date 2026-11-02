# Delight 1.4.9 release audit

Scope: local source, packaged extension, and regression fixtures. This is a technical preflight, not store approval or proof of live-service delivery. No listing or external policy document was edited.

The audit follows Chrome's [minimum-permission policy](https://developer.chrome.com/docs/webstore/program-policies/permissions), [disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements), [user-data handling guidance](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), and [Manifest V3 code requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements). Narrow permissions, accurate disclosures and reviewable functionality are required; passing local checks does not guarantee approval.

## Permission justifications

| Permission | Implemented purpose |
| --- | --- |
| `sidePanel` | Open/configure the panel from toolbar and context menus in `src/background/index.ts`. |
| `activeTab` | User-invoked page scripting from toolbar/popup, including temporary access when persistent site access is withheld. Not ongoing access to every destination. |
| `scripting` | Packaged observations, actions, site checks and frame geometry in `ObservedBrowser.ts` / `FramePointer.ts`. |
| `storage` | Local provider keys, chats, bounded history/checkpoints. Non-secret preferences such as theme can use sync. |
| `tabs` | Read URLs/titles; scope navigation/open/switch to the task window. |
| `debugger` | Native keyboard/pointer `Input` events in `TrustedInput.ts`; short-lived owned attachment, detached afterward. Chrome can show a debugging banner. |
| `contextMenus` | Installed right-click assistance commands. |
| HTTP(S) hosts | Observe user-chosen destinations/embedded frames and contact configured AI endpoints. Arbitrary-site automation needs broad web access; explain this in the listing. Chrome can still deny site/frame access. |

Removed unlimited storage (no demonstrated requirement), redundant PostHog host access, unnecessary web-accessible extension pages/helpers and non-HTTP(S) host patterns. `webNavigation` remains absent. Large chat histories can hit normal storage quota; checkpoint failures stop further dispatch rather than operate without recovery protection.

## Data handling

- Keys remain in `chrome.storage.local`, not browser sync or Delight servers. They authenticate directly with the selected provider. This is browser-profile storage, not a separately encrypted vault.
- AI requests include prompts/context, URLs/titles of tabs in the task window, visible page/frame text, control values excluding password fields, and recent outcomes. Signed-in pages can contain sensitive information. A disclosure appears beside Agent Run/Resume controls.
- The last 20 local task records contain user instructions, generated summaries/events, outcomes and checkpoint URL/tab identity. Descriptions/URLs may contain personal information. Full DOM snapshots and typed action payloads are not checkpointed. Delete saved tasks in Agent mode or remove the extension to remove local data.
- Checkpoints are written before dispatch and after outcomes. Restart converts live runs to interrupted; only explicit Resume reopens them. Matching uses the saved URL, not a recycled tab ID. Missing/ambiguous pages require user action; recovery does not automatically reopen/navigate pages. Pending/uncertain input is not blindly replayed. This is recovery, not continuous background execution or exactly-once delivery.
- PostHog analytics is off by default. Explicit Settings opt-in can send feature events, provider/model choices, extension version, a pseudonymous identifier and browser/device metadata. Recording, autocapture, page-leave capture, external dependency loading and feature flags are disabled; URL/referrer properties are denied. PostHog can still observe the network source IP. Opt-out stops subsequent captures in loaded contexts but cannot retract received/in-transit events. Public build analytics keys are not user provider secrets.
- Ollama uses local HTTP loopback; cloud provider endpoints use HTTPS. Local service trust, availability and CORS are environment responsibilities.

## Stronger confirmation, with limits

Packaged `SiteVerification.ts` adapters accept finite fields, never model-generated selectors/code:

- Google: exact `/search` query plus rendered result links, not a URL alone.
- Gmail: Sent route, exact subject and recipient, unique matching row and thread identity. This proves a matching Sent record exists, not that it is new or that a recipient received it. Old matching threads remain a limitation; use unique subjects for controlled tests. Missing/ambiguous markup fails closed.
- YouTube: watch identity, no active ad indicator, playable media and advancing time across two observations. Not proof of audible output or indefinite playback.

Inaccessible ancestors, overlays, out-of-viewport targets and transformed frame geometry fail explicitly rather than guessing a native click. Closed shadow roots, uploads/downloads and arbitrary drag-and-drop remain outside this increment. Live sites can change markup.

## Package workflow

Run `node --test tests/*.test.cjs`, browser fixtures, then `npm run package:release`. It builds, audits and creates `releases/delight-1.4.9.zip` from `dist` only, with `manifest.json` at the root. Existing ZIPs are not overwritten. The command prints SHA-256 for artifact identification.

`scripts/audit-release.cjs` checks package/lock/source/built manifest versions, changelog, permission allowlist, CSP, packaged entry files, accidental source/maps/private artifacts, remote HTML script tags and limited credential patterns. This is not comprehensive secret scanning, dependency security auditing or a complete interpretation of MV3 remote-code policy. Review final bundles and give reviewers a clear description of the finite action schema.

## Manual requirements before resubmission

1. Publish the corrected Privacy page text at the public policy URL in the developer dashboard. Confirm public access without login. The bundled page does not update that separate document.
2. Update store data categories and disclosures for website content, browsing context, user-generated/personal communications, authentication handling, AI providers and optional analytics as applicable.
3. Explain every permission, particularly debugger and broad HTTP(S) access. Do not add `webNavigation` for hypothetical future features.
4. Provide reviewer setup instructions for their own supported provider/model; there is no shared trial key. Never publish a personal key in reviewer notes.
5. Test a loaded extension: onboarding, denied site access, native input/debugger conflict, Pause/Stop, full close/reopen recovery, missing/duplicate recovery tabs and analytics opt-in/out. Adapted browser fixtures do not prove extension permission-boundary behavior.
6. Test controlled live Google/YouTube tasks. Send only a harmless uniquely identified email to an account you control; check its Sent record and recipient receipt yourself. Never use customer/production email for testing.
7. Upload only the final tested version/hash. The developer performs resubmission and confirms the store decision.

## Implementation and maintenance

Executed for this release: 65 regressions passed; native-input, nested-frame/custom-control/overlay and history/restart UI Chromium fixtures passed with adapted extension APIs/orchestrator. Production build and package audit passed. The ZIP opened in .NET and all 43 entries matched `dist` by SHA-256. The actual headless extension diagnostic timed out waiting for the service worker; this boundary and live account behavior remain unverified.

Artifact SHA-256: `711c45731d69710d78de95f1f2727230921e964bc677bc64c98ebe0a3ae90b6f`.

- [History/checkpoints](../src/services/agents/AgentHistory.ts), [execution/recovery](../src/services/agents/AgentOrchestrator.ts), [Agent disclosure/controls](../src/components/Agent/AgentPage.tsx).
- [Frame geometry](../src/services/automation/FramePointer.ts), [native input](../src/services/automation/TrustedInput.ts), [site checks](../src/services/automation/SiteVerification.ts).
- [Privacy UI](../src/pages/privacy/PrivacyPage.tsx), [analytics consent](../src/services/PostHogService.ts), [manifest](../public/manifest.json), [package audit](../scripts/audit-release.cjs).

Re-run fixtures when changing frame routing, task state transitions, provider cancellation, site selectors or packaging. Keep public disclosures synchronized with changes to what is stored or transmitted.
