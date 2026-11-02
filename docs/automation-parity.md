# Automation implementation status

Comparison source: local Nanobrowser executor, navigator action registry,
browser context, and DOM service in chrome-extension/src/background.

| Area | Delight implementation | Remaining work |
| --- | --- | --- |
| Execution | Observe before each decision; one validated action; recent outcomes; explicit restart recovery | Continuous background execution and exactly-once remote effects |
| Observation | Packaged helper across accessible same-origin/cross-origin/nested frames; global indexes, document routing, open shadow roots, media | Closed shadow roots, screenshots, inaccessible frames |
| Actions | Navigate/open/switch tabs, follow new-tab links, click/fill/select/extract/scroll/wait, native keyboard and cross-frame pointer input, custom-control ARIA state | Uploads/downloads, arbitrary drag-and-drop, complex transformed geometry |
| Validation | Snapshot revision, semantic target identity, live targets and obscured/disabled checks; ancestor frame hit-testing | Inaccessible/closed roots and transforms fail rather than guessing |
| Completion | Text/URL/field/control checks, rendered Google results, matching Gmail Sent thread, advancing non-ad YouTube playback | Other site adapters, markup changes, proof of recipient delivery |
| Cancellation | Per-run signal; interruptible waits; late decisions ignored | Abort underlying provider HTTP requests; cannot undo a dispatched click |
| UI | Local history, mode-switch pause/resume, explicit restart recovery with checkpoints and uncertainty protection | Automatic background execution is intentionally unsupported |
| Providers | Planner captures selected provider without cross-provider fallback | Audit other app AI paths and legacy trial UI |
| Tests | DOM regressions for shadow roots, inputs, stale targets, overlays | Real Chrome extension flow and live-site validation |

Iframe observations use `chrome.scripting` with `allFrames` under existing host
permissions; `webNavigation` is not requested. Element actions route to the
observed document ID (or frame ID fallback) and local snapshot revision. Frames
denied by Chrome or missing during navigation are reported as partial access;
they are never replaced with fabricated controls. Scrolling accepts an observed
frame ID. Browser fixtures exercise real cross-origin boundaries with a mocked
scripting API adapter; this does not establish permission behavior on every live
site. Cross-origin ancestor visibility/occlusion and Chrome-restricted frames
remain reasons to fail clearly rather than infer success. Native pointer routing now uses source-window-matched geometry propagation and ancestor hit-testing across accessible cross-origin/nested frames; inaccessible or transformed frame ancestry remains unsupported.

This is a replacement core inspired by Nanobrowser's architecture, not a full
Nanobrowser port. No Nanobrowser source is copied into the new runtime.
A passing build or DOM test is not live-site verification.

Pause/resume is supported while the assistant runtime remains loaded: navigating
from Agent mode to Chat pauses the same task, and returning exposes Resume.
Planning requests are interrupted and their decisions discarded. A browser action
already dispatched may finish, but no next action starts until resume. Resume
retains action history and the controlled tab and observes it again; Stop cancels
paused or running tasks. Closing/reloading the assistant runtime or restarting the
extension marks unfinished tasks interrupted. Checkpointed tasks now expose explicit Resume saved task. Recovery matches a current-window page by saved URL (not recycled tab ID), retains summaries, re-observes and blocks uncertain click/key replay. Legacy records without checkpoints are history-only. This is not automatic background execution.

Post-click handling now polls for navigation, page settling, or active media for
up to eight seconds. An unchanged link is explicitly unverified. Planner prompts
bound body text and history excerpts, preserve all observed indexes, and omit
internal revisions. Groq agent decisions disable SDK retries and receive an
abort signal; rate-limit errors show bounded cooldowns before re-observation without replaying browser actions. Pause/Stop gate retries. Other providers may still retry internally.

Historical extension-boundary check: the isolated branded Chrome test timed out waiting for
the extension service worker; extension-boundary and live-site tests remain
unverified. `node tests/automation-extension.cjs` retains that reproducible check.

Real Chromium fixture test passes: `node tests/automation-browser.cjs` verifies
observation, native input filling, clicking, and re-observation. It uses an
intercepted fixture URL with no external network or AI quota consumption.

## Current checks and release boundary

`node --test tests/*.test.cjs` covers history/checkpoints, explicit restart recovery, pending-action replay protection, cancellation, provider cooldowns, frame routing and deterministic site adapters. `node tests/automation-frames-browser.cjs` exercises real nested cross-origin native pointer input, custom switches and ancestor overlays using adapted Chrome scripting/debugger APIs. `node tests/automation-native-browser.cjs` checks native Enter, required-field validation, Ctrl+A and trusted-only clicks. `node tests/agent-history-browser.cjs` checks React history/pause/resume with a mocked orchestrator.

Gmail checks show a unique matching Sent thread, not proof of a new message or recipient receipt. YouTube time must advance with no active ad indicator. All live-site markup remains subject to change. See [release audit](release-audit.md) for permission justifications, data handling, packaging commands and manual requirements; a passing build/fixture does not imply store approval.
