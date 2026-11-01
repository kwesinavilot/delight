# Automation implementation status

Comparison source: local Nanobrowser executor, navigator action registry,
browser context, and DOM service in chrome-extension/src/background.

| Area | Delight implementation | Remaining work |
| --- | --- | --- |
| Execution | Observe before each decision; one validated action; recent outcomes | Durable background execution across restarts |
| Observation | Packaged helper across accessible same-origin/cross-origin/nested frames; global indexes, document routing, open shadow roots, media | Closed shadow roots, screenshots, ancestor clipping/occlusion for cross-origin frames |
| Actions | Navigate, open/switch same-window tabs, follow new-tab links, click, fill, select, extract, scroll, wait | Tab closing/reordering, uploads/downloads, trusted keyboard input |
| Validation | Snapshot revision, live targets, obscured/disabled checks | Target identity changes during model latency |
| Completion | Explicit evidence; YouTube playback check; limits fail rather than succeed | Broader deterministic outcome checks |
| Cancellation | Per-run signal; interruptible waits; late decisions ignored | Abort underlying provider HTTP requests; cannot undo a dispatched click |
| UI | Local history of the latest 20 tasks restores on remount; leaving Agent mode cancels the run; terminal records ignore late updates | Durable pause/resume and background execution |
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
remain limitations.

This is a replacement core inspired by Nanobrowser's architecture, not a full
Nanobrowser port. No Nanobrowser source is copied into the new runtime.
A passing build or DOM test is not live-site verification.

Post-click handling now polls for navigation, page settling, or active media for
up to eight seconds. An unchanged link is explicitly unverified. Planner prompts
bound body text and history excerpts, preserve all observed indexes, and omit
internal revisions. Groq agent decisions disable SDK retries and receive an
abort signal; rate-limit errors produce an explicit progress message and end the
run without replaying browser actions. Other providers may still retry internally.

Verification on 2026-11-01: five DOM/execution regressions pass, including
cancellation during planning and restarting without a stale lock. Production
build passes. The isolated branded Chrome extension test timed out waiting for
the extension service worker; extension-boundary and live-site tests remain
unverified. `node tests/automation-extension.cjs` retains that reproducible check.

Real Chromium fixture test passes: `node tests/automation-browser.cjs` verifies
observation, native input filling, clicking, and re-observation. It uses an
intercepted fixture URL with no external network or AI quota consumption.
