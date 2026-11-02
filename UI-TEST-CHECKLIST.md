# UI Testing Checklist — Thesis Agent, dev copy only

## Testing log — 1 Nov 2026, 19:29 WAT, real-browser attempt

- Browser task route: attempted desktop test at http://127.0.0.1:8765/index.html (local VM server, verified 200 from the VM itself). The managed browser rejected every navigation to 127.0.0.1 and localhost as invalid_request, while http://example.com/ loaded normally. The browser task asked for manual takeover or a publicly reachable URL. No public URL was authorised, and manual takeover is not practical for a VM-local server, so that task was stopped with no files modified, nothing signed, nothing paid.
- VM-local Chromium route: /opt/meta-chromium/chrome failed to start with "Hatch WebGL domain policy is required for browser startup". Normal startup requires the browser-daemon policy, which is not available to a direct launch in this environment.
- Result: visual items below are **Unable to Test** via the authorised routes in this stage, not Passed. This is a test-route blocker, not a code defect found in the dev copy, and no code was changed during testing. The local test server was stopped after the attempt.
- No screenshots are available from this stage, because no browser window ever loaded the dev copy. Screenshots must not be claimed from code inspection.


## How to report results honestly

Every item must be classified as one of:
- Passed
- Failed
- Not Tested
- Unable to Test

Do NOT report mobile or desktop visual testing as completed unless it was
actually performed in a browser. Code inspection alone is NOT a pass for a
visual item. Automated npm tests alone are NOT a pass for a visual item.

At the time this checklist was written (1 Nov 2026, remediation stage),
visual items are marked **Not Tested**, because no browser visual test of
the remediated dev copy was performed in that stage. Logic items covered
by the automated test suite are marked Passed (automated), with that
qualification stated, not as a visual pass.

## Mobile

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| M1 Phone layout, breakdown page | Open dev demo on a phone-width browser, break down an example thesis | Single column, no horizontal overflow, readable text, buttons reachable | Unable to Test | |
| M2 Phone layout, job card | Open a job card on phone width | Card readable, grouped buttons visible, Next step line visible, no overflow | Unable to Test | Job card rendering was broken before remediation and restored; this item must be checked in a browser before any freeze decision |
| M3 Phone, claim edit and delete | Edit one claim, then delete another, on phone | Unchanged claims keep their job state, edited claim resets, no crash | Unable to Test | Logic covered by automated tests, visual check not done |
| M4 Phone, proof panel | Press Show live testnet escrow proof on phone | Panel readable, actual RPC result first, dated expected states, explorer links | Unable to Test | |
| M5 Phone, export | Download or copy Markdown export on phone | Export opens, contains export date, fingerprint, export-time statement | Unable to Test | |

## Desktop

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| D1 Desktop layout, 760px page | Open dev demo on desktop | Layout centred, readable, no overflow | Unable to Test | |
| D2 Desktop, job card buttons | View a job in each work state | Only applicable buttons visible, grouped by stage, Next step matches visible action | Unable to Test | |
| D3 Desktop, correction loop | Submit, evaluate Hold, request correction, edit note, resubmit, evaluate Pass, confirm evidence, mark ready, recommend | Each step shows the correct next button, no disabled-button confusion | Unable to Test | Logic covered by automated tests, visual check not done |
| D4 Desktop, outdated recommendation | Get Approve, then change cap, price, or note | Banner reads OUTDATED PAYMENT RECOMMENDATION, with stale reasons, old text kept only as history | Unable to Test | Logic covered by automated tests, visual check not done |
| D5 Desktop, export | Export a fresh plan and an outdated plan | Fresh export shows current recommendation with date and fingerprint; outdated export shows OUTDATED and no current line | Unable to Test | Logic covered by automated tests, visual check not done |

## Complete workflow

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| W1 Breakdown, all three examples | Break down each example thesis in turn | Claims, measures, evidence needs shown, no crash | Unable to Test | |
| W2 Submit and evaluate | Submit a job, evaluate it | Evaluation shows verdict, source rule, reasons, checks, dimensions | Passed (automated) | npm tests cover evaluator logic, not visual rendering |
| W3 Correction loop | Hold, request correction, edit note yourself, resubmit, re-evaluate | Previous evaluation kept in history, distinguished from new, correction instructions name the failing check | Passed (automated) | npm tests cover correction logic, not visual rendering |
| W4 Ready and recommendation | Pass, confirm evidence, mark ready, recommend | Approve only with confirmation; without confirmation, Hold | Passed (automated) | npm tests cover recommender logic, not visual rendering |
| W5 Cut and abandon | Cut a job, restore it; abandon a job, restore it | Task status updates, cap spend updates, Approve becomes stale or Reject on recalculation | Passed (automated) | npm tests cover cut/abandon logic; Abandon button itself was added in remediation and is Not Tested visually |
| W6 Cap change | Change cap from 30 to a lower value | Blocked jobs update, previous Approve becomes stale | Passed (automated) | |
| W7 Edit and delete claims | Edit claim 2, delete claim 1 | Unchanged claims keep work state, evaluation, correction history, recommendation; edited claim resets; ambiguous duplicates reset safely | Passed (automated) | npm tests cover preserveJobStates logic, not visual rendering |
| W8 Duplicate claims | Break down or enter duplicate claims, evaluate | Duplicate check present, verdict Hold with duplicate reason | Passed (automated) | |
| W9 Comma numbers | Claim 1,000, note 1000 | Numbers check exact, not potential-mismatch | Passed (automated) | |

## Persistence

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| P1 Refresh keeps plan | Break down, submit, evaluate, refresh | Plan, claims, notes, job states restored | Unable to Test | Save/load by UID implemented in remediation, browser check not done |
| P2 Share link | Copy share link, open in a fresh tab | Thesis pre-filled, user still presses Break it down | Unable to Test | |
| P3 Clear saved plan | Press Clear saved plan, refresh | Saved plan not restored | Unable to Test | |
| P4 localStorage unavailable | Block localStorage if possible, use core tool | Core tool still works, no crash | Unable to Test | Code has try/catch, browser check not done |

## Network failures

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| N1 RPC down, proof panel | Block testnet RPC or go offline, press proof panel | Fallback text, explorer links, core tool still works | Unable to Test | |
| N2 Live quote fails | Press live quote with network off | Local fallback shown, no fake live value | Unable to Test | |
| N3 Link check blocked or dead | Use a link that returns 404 or is blocked, press Check link live | Format only fallback, honest label, no crash | Unable to Test | |
| N4 Page loaded, then offline | Load page, go offline, use core tool | Breakdown, evaluator, correction, recommender still work locally | Unable to Test | Core logic is local in app.js, browser check not done |

## Proof panel

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| T1 Proof panel success | Press proof panel with network on | Actual RPC result for job-v2-1 and job-v2-2 first, dated expected states second, actual prevails if different | Unable to Test | |
| T2 Proof panel fallback | Press proof panel with RPC down | Fallback text, explorer links, separate demonstration label | Unable to Test | |
| T3 Proof panel separation | Read proof panel text | States it is a separate demonstration, not a record of demo jobs, and reading it does not initiate or authorise a payment | Unable to Test | Text is in code, visual check not done |

## Error handling

| Item | Steps | Expected | Result | Notes |
|---|---|---|---|---|
| E1 Empty thesis | Press Break it down with empty box | Clear error message, no crash | Unable to Test | |
| E2 Invalid cap | Enter a non-numeric or out-of-range cap | Previous valid cap kept, error shown | Unable to Test | |
| E3 Format failure | Enter a note with no source, date, or link/document | Format check fails, evaluation rejects, reason says not a judgement on the claim itself | Passed (automated) | npm tests cover format logic, not visual rendering |
| E4 Invalid transition | Try to mark ready from assigned, or evaluate from assigned | Transition rejected, state unchanged, error shown | Passed (automated) | npm tests cover state machine, not visual rendering |
| E5 Document-only warning | Evaluate a document-only note to Pass | Warning visible: system did not open the document, human must review | Unable to Test | Warning is in code, visual check not done |
| E6 URL warning | Evaluate a URL note to Pass | Warning visible: reachable link does not prove contents support the claim | Unable to Test | Warning is in code, visual check not done |

## Summary of honest status at checklist creation and after 1 Nov 2026 browser attempt

- Visual items (mobile, desktop, persistence, network, proof panel, error handling visuals): **Unable to Test** in a browser for the remediated dev copy, for the reasons in the Testing log above. They were Not Tested at checklist creation, and remain untested after the blocked browser attempt.
- Logic items covered by automated tests: **Passed (automated)** as qualified above, with 120 npm tests passing at checklist creation.
- No visual item is reported as Passed in this checklist.
- This checklist must be completed in a real browser, with each item reclassified, before any decision to push or redeploy the dev copy.

## Testing log — 1 Nov 2026, 19:38 WAT, second browser attempt (temporary route)

- Temporary route used: an unlisted, expiring Muse storage link for the test-only single-file bundle, expiring 21:36 WAT, to be deleted after testing.
- Managed browser result: blocked at entry. On first navigation and on one retry, the browser showed "This page is blocked" / "Your organization doesn't allow you to view this site". No download prompt, no demo page content, no demo button, heading, banner, job card, recommendation, export, or proof panel was ever seen or clicked.
- Passed: none. Failed: none of the demo's own features were shown to fail. Could not test: all 14 desktop workflow steps, and all mobile steps.
- Screenshots: the browser task reported screenshots were captured at both blocked attempts, but no screenshot files were delivered to Muse in the handoff, so no screenshots can be attached from this attempt.
- No files were modified, pushed, deployed, signed, paid, or wallet-connected in this attempt. The temporary route was NOT deleted yet, because testing is incomplete and the user may want to use it on his phone; deletion and inaccessibility verification are still outstanding and need the user's decision below.

## Testing log — 1 Nov 2026, 19:40 WAT, temporary route deleted

- Temporary route deleted at the user's instruction, no other public host tried.
- Delete result: {"action":"delete","deleted":true,"ok":true}
- Verification after deletion: HTTP 404, body "Not found", for the former bundle URL.
- Local test server stopped after deletion: local http://127.0.0.1:8765/index.html now returns no response (code 000).
- Temporary bundle file, downloaded cloudflared binary, and tunnel/server logs were removed. No temporary hosting resource remains from this test route.
- Visual checklist items remain Unable to Test. The demo was never reached by a browser, so it is not described as having failed.

## Testing log — 1 Nov 2026, 19:45-19:46 WAT, one file-grant browser trial (approved, single trial only)

- Trial stopped at the critical first step, exactly as instructed. No workaround was attempted.
- The browser opened a blank tab, then opened example.com as a sanity check, which loaded normally, proving the browser itself works. No local file path was provided for the granted bundle, and browser navigation in this environment accepts only http(s) URLs, not a local file URL.
- The only file mechanism available was uploading the granted file to a file-input on a web page. That would have uploaded the file to a website, which the trial expressly forbade, along with any other host, URL, tunnel, or workaround, so the browser did not upload it.
- Passed: nothing about the demo itself, because it never rendered. Could not test: steps 1-15 in full, including job-card rendering, human confirmation, freshness, Cut, Abandon, export, persistence, proof panel, and network failures.
- Viewport: no demo viewport was observed, desktop or mobile. No mobile viewport is claimed.
- Screenshots: the browser reported one screenshot of the Example Domain placeholder page, but no screenshot file was delivered to Muse, and no demo screenshots exist, because the demo never rendered.
- After the trial, the temporary bundle artifact was removed, no public URL, tunnel, or hosting resource was created, and no file was uploaded, shared, signed, paid, pushed, or deployed.
- This is a blocker in the browser route, not a defect proven in the demo code itself, which was never seen in a browser.
