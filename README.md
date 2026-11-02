# Thesis Agent

## Release note — 2 Nov 2026 (release candidate, prepared for review, not yet published)
This release candidate includes the corrections and improvements documented below, made after the original submission. It has not yet been published to the public repository or live demo. If approved and released, this documentation will describe the corresponding released version.

**NEAR HACKATHON: Build Beyond Boundaries — Agent Economy track (`agents`)**

A small, honest agent demo: type a thesis or claim, and Thesis Agent breaks it into
checkable sub-claims, each with a way to measure it, the evidence it needs, and a
pass rule. You add the evidence yourself and mark each part. The demo never marks
a claim true or false on its own.

- **Hosted demo, open directly (judges can open this without downloading anything):** https://thesis-agent.netlify.app/
- **Event:** NEAR HACKATHON, 1 Nov 2026 00:00 UTC to 14 Nov 2026 23:59 UTC
- **Track:** Agent Economy (`agents`)
- **Team:** Solo, by Cryptoearn Gives
- **Prize pool (event total, not a claim for this project):** $250,000
- **Judging:** 16–18 Nov 2026, results by 18 Nov 2026
- **Official pages:** https://nearhackathon.com and
  https://www.near.org/blog/near-hackathon-build-beyond-boundaries
- **Official HACKATHON.md:** https://nearhackathon.com/HACKATHON.md

## The problem

Theses and bold claims are easy to write and hard to test. A single sentence
often hides three or four separate claims, different kinds of evidence, and no
stated pass rule. Readers are left to argue about the whole sentence at once.

## What this prototype does

1. You type a thesis or claim.
2. It splits the thesis into up to five checkable parts, classified as
   Comparison, Cause and effect, Prediction, Definition, Check, or General
   claim. A "because" thesis keeps its logic: the effect and the claimed
   cause become separate, testable parts, plus a falsification check.
3. For each part it shows: how to measure it, what evidence it needs, and a
   pass rule ("Pass only if the evidence is named, dated, and openable").
   Where the thesis itself gives numbers, dates, or a group, those details
   are carried into the measure and evidence lines instead of a canned
   sentence.
4. You add an evidence note per part and set its status yourself:
   Not yet tested, Supported by evidence, Not supported by evidence, or
   Inconclusive. A decided status (Supported or Not supported) is blocked
   until the note passes a local format check: it must name a source, give
   a date (a year, or a month and year), and give an openable reference
   (a link or a document name). If it fails, the missing element is shown
   by name and the part stays Not yet tested. Inconclusive means the
   evidence is insufficient and does not count as decided. Progress counts
   only parts decided with a passing evidence note. The check is format
   only: it does not prove the evidence itself is true.
5. You set a spending cap (demo units only). The agent job list — one
   checker job per sub-claim — is shown per job, with a demo quote, a
   do-vs-buy line, exactly one counter-offer when the demo quote is
   above the 10-unit plan, and whether the job is allowed, blocked by
   the cap, walked away from, or cut by you. Demo quotes are fixed
   illustrative values in job order (8, 12, 10, 18, 9 demo units), not
   prices from any real agent, and demo checkers are named demo
   checkers, not accounts. A counter-offer at 10 demo units is
   accepted in this demo only when the quote is at most 4 units over
   plan; above that the demo agent walks away and does it itself.
   Jobs above the cap stay blocked, which is the spending guardrail
   for an agent with a wallet.
6. You can copy the test plan as text or download it as Markdown.
   The download now includes a per-job receipt for every job: demo
   checker, do-vs-buy decision, planned and quoted demo units,
   counter-offer and result, final demo price, cap status, demo units
   spent, and the evidence status and check result for that claim.
7. Your plan is saved in this browser only (localStorage, no server),
   so a refresh restores it, including edits and cuts. Claims can be
   edited (which resets their status and evidence note, so the gate
   cannot be bypassed by editing) or deleted. A cap must be a whole
   number, 0 or more; an invalid cap shows an error and keeps the
   previous cap, never silently replacing it.

## Why this track, and why NEAR

- **Track choice:** Agent Economy was kept over Real-World Money and Open
  Innovation, deliberately. Real-World Money would need real invoicing or
  payment movement to demo honestly, which cannot be done zero-spend
  without faking money. Open Innovation is broader and gives judges less
  to score against. Agent Economy gives the clearest job: a checker agent
  hired per sub-claim, paid only when it records named evidence.
- **Why NEAR, specifically:** a checker agent may live on one chain and be
  paid from another. NEAR Intents are built for cross-chain intents stated
  once and settled where the work happens, without the user bridging
  wallets by hand. The spending cap is the second half: an agent that can
  spend, but only inside user-set limits. That is a design claim for the
  full version, not a live integration in this demo (see below).
- **What makes it competitive:** one-sentence problem, one complete user
  moment (type a thesis, see a plan, mark one part, download it), no
  backend to break, no keys, no fake results, and a clean README and
  HACKATHON.md written for both human and AI judges.
- **Weakest point, stated honestly:** the NEAR payment rail is a dry-run
  design, not a live transaction. A judge who scores only live on-chain
  work will mark this down against entries with real contracts. The
  counterweight is that the demo itself is fully working, reproducible,
  and honest about that limit, and the official HACKATHON.md states that
  no integration is mandatory and testnet-only projects are eligible.

## How to run it (do X, see Y)

No build step, no server, no install, no keys, no account needed.

- **Do X:** Open the hosted demo directly at https://thesis-agent.netlify.app/ in any modern browser, on a phone or a computer.
  **See Y:** The Thesis Agent page, with a text box and three example buttons.
- **Do X (local alternative):** Open `index.html` in any modern browser, on a phone or a computer.
  **See Y:** The Thesis Agent page, with a text box and three example buttons.
- **Do X:** Press "Try example 1", then "Break it down".
  **See Y:** A test plan for "Small businesses lose money because they do not
  track who owes them", broken into checkable parts, all starting as
  "Not yet tested".
- **Do X:** Type an evidence note on one part that names a source, gives a date, and gives a link or document name, then change its status.
  **See Y:** That part's status text changes, and the progress bar moves. Try a note with a missing element first, and see it blocked with the missing element named.
- **Do X:** Press "Copy test plan as text" or "Download test plan (.md)".
  **See Y:** The full plan, including your notes and statuses.
- **Do X:** Change the spending cap to 10, with a 3-part plan on screen.
  **See Y:** A "Blocked by your cap" note, showing only 1 of 3 jobs fits
  (job 1 at 8 demo units; jobs 2 and 3 do not fit).
- **Do X:** In Step 3, read the per-job list for example 1.
  **See Y:** Job 1 buys at 8 demo units; job 2 counters once at 10 and
  is accepted; job 3 buys at 10. At cap 30 the total spent is 28.
  Cut job 2 and see the total fall to 18, with job 2 marked cut.
- **Do X:** Type "abc" as the spending cap.
  **See Y:** An error saying to enter a whole number, and the previous
  cap is kept; the job list does not silently change.
- **Do X:** Edit a claim, then refresh the page.
  **See Y:** The edited claim (or a deleted part's absence) is
  restored from this browser only, and an edited claim starts again
  as "Not yet tested" with no evidence note.
- **Do X:** Press "Copy share link", then open the copied link.
  **See Y:** The same thesis is pre-filled in the text box, with no
  server and no account. Press "Break it down" to build its plan.
- **Do X:** Press "Show the NEAR plug-in point (dry run)".
  **See Y:** A clearly labelled DRY RUN object. No transaction is sent.
- **Do X:** Press "Get a live quote (dry run, no payment)".
  **See Y:** Either a LIVE QUOTE (DRY RUN, NO PAYMENT) box with the
  live in/out amounts and time estimate actually received, or, if
  the live call cannot be reached in that browser, a LOCAL FALLBACK
  box naming the failure and showing the local dry-run object
  instead. No quote value is ever shown as live unless it was
  received from the API.

## What is real, and what is demo only

**Real and working in this repository:**

- The thesis breakdown, classification, test-plan generation, evidence notes,
  status marking, progress tracking, copy, and Markdown download. All of it
  runs locally in the browser with no backend and no paid API.
- The evidence format gate: a decided status requires a note that names a
  source, gives a date, and gives an openable reference, with the missing
  element shown by name when it fails. This is a format check only, not
  proof that the evidence is true.
- The code in `app.js` is deterministic and testable with Node
  (`npm test`, see below).
- The agent loop as a labelled demo: per-job list, do-vs-buy lines,
  one counter-offer per job, per-job receipts in the Markdown export,
  cap validation, local-only persistence, and claim edit/delete, all
  covered by the test suite.
- A real, free, quote-only NEAR Intents dry quote: pressing the live
  quote button in Step 3 calls the public 1Click API with dry: true
  only (see `near-integration.js`: endpoint, exact request body,
  and response parsing). The verified live result on 1 Nov 2026
  was 1.0 USDC in to about 0.9998 USDC out, time estimate 25, HTTP
  201, with no deposit address in the response. Values change with
  the market; the demo always shows the value it actually received,
  and falls back to the local object if the call fails. Live-quote availability may vary: a direct API check on 1 Nov 2026 returned HTTP 403, so the failure fallback is expected behaviour when the live call is unavailable, not a demo defect.

**Demo only, clearly labelled in the app and in code:**

- The "agent payment" step. The app shows a job list and a budget in
  **demo units only**. It does not pay anyone, in NEAR or in any currency.
  Demo quotes are fixed illustrative values, not prices from any real
  agent, and demo checkers are named demo checkers, not accounts.
  A counter-offer accepted in the demo is not a real negotiation, and
  a receipt in the download is a demo receipt, not proof of a purchase.
- The NEAR integration in `near-integration.js`. Its dry-run part builds a
  dry-run, intent-shaped object locally and **never sends it anywhere**.
  It opens no wallet, signs nothing, and produces no transaction hash,
  balance, or result. Separately, its live-quote part does make one
  real network call — a dry: true quote request only, which commits
  nothing, issues no deposit address, and moves no money (see the
  live-quote bullet above). A real payment or signed submission would
  still require the user's own NEAR testnet account and explicit
  approval, is not part of this demo, and nothing in this repository
  should be read as a completed on-chain payment.

**Not claimed:**

- No real NEAR mainnet or testnet transaction, no real balance, no real
  payout, and no use of NEAR AI Cloud or any paid API. A live NEAR
  Intents dry quote (quote-only, no payment) IS now included — see
  above — but it is not a transaction, a balance, or a payout, and
  must not be read as one. The hackathon's own HACKATHON.md states
  that no integration is mandatory and a testnet-only project is
  eligible, and this prototype is presented on that honest basis.

## Files

- `index.html` — the demo page (open this file).
- `app.js` — the breakdown and test-plan logic, no network calls.
- `near-integration.js` — the labelled dry-run NEAR plug-in point, plus the real dry: true live-quote request (never dry: false, never a deposit).
- `contract/` — the testnet escrow contract source (Rust, near-sdk 5); no keys, no credentials in this folder.
- `package.json` — `npm test` runs the test suite, no dependencies.
- `test.js` — the test suite: README example, breakdown failure cases,
  evidence gate, cap logic, agent jobs (quotes, counter-offer,
  do-vs-buy, cut, receipts), cap validation, and claim editing.
- `HACKATHON.md` — this project's HACKATHON.md, following the official
  guidance: what was built, how to try it, and what is still needed.
- `demo-script.md` — outline for a short demo video.
- `LICENSE` — MIT.

## Architecture

Text diagram of the current agent loop, as built:

```
thesis -> break into checkable parts -> measure + evidence plan per part
  -> user adds an evidence note -> local evidence format check
  -> user marks a part decided (only with a passing note) or Inconclusive
  -> progress counts decided-with-evidence parts
  -> per-job agent loop (DEMO only): demo quote -> do-vs-buy line
     -> one counter-offer when above plan -> allowed / blocked / cut
     -> per-job receipt in the Markdown export
  -> spending cap (demo units, validated) -> NEAR plug-in point (dry run only)
  -> live quote button (dry: true only, live value or honest local fallback)
  -> plan saved in this browser only (localStorage, no server)
```

The agent loop above is a labelled demo, not a live payment, hire, or
real quote. The live quote above is real but dry-only: it quotes a
price, it does not pay, hire, or move money. The testnet escrow
contract is Phase 3 work, now complete: contract account
thesis-agent-escrow2.testnet, with the release path and the walk-away
refund path both verified on testnet; see the Phase 3 section below
for the transaction hashes.

Key policy, as currently true: there is no wallet, no key, and no secret
in this repository or in the demo. The dry-run object is built locally
and never sent. The live quote is an unauthenticated, quote-only API
call that needs no key and moves no funds, and no key would ever be
stored by this demo.

## Tests (local, no network)

```sh
npm test
```

Expected output: all 181 tests pass, including the README example with
exactly 3 claims, the breakdown failure cases (short fragments, leading
connectors, leading and multiple "because" clauses, the 5-claim cap
warning, and classification cases), the evidence gate (pass, each missing
element, and Inconclusive/progress semantics), the cap logic, the agent
jobs (demo quotes in job order, one counter-offer accepted at most 4
over plan and rejected above that, do-vs-buy, allowed/blocked/cut, and
per-job receipts in the export), cap validation, claim editing, and
the share-link tests (percent-decoding, `+` decoding, missing/empty/
blank handling, markup payload staying a plain string, and
encode/decode round-trip).

## Phase 3 — live quote and testnet escrow (testnet only)

- **Live quote (dry only):** see step 8 in "What this prototype does"
  and `near-integration.js`. Endpoint POST
  https://1click.chaindefuser.com/v0/quote, dry: true only, never
  dry: false, never a deposit. Verified live 1 Nov 2026: 1.0 USDC in
  to about 0.9998 USDC out, time estimate 25, HTTP 201, no deposit
  address in the response. CORS: the API answers OPTIONS with
  Access-Control-Allow-Origin: * (verified 1 Nov 2026).
- **Testnet escrow contract:** source in `contract/` (Rust, near-sdk 5).
  Contract account (testnet, throwaway, agent-created for this demo
  only, never the mainnet prize payout account):
  thesis-agent-escrow2.testnet. Checker account (testnet, throwaway):
  thesis-agent-checker1.testnet. Deploy + initialise:
  https://testnet.nearblocks.io/txns/guT4svwMB79VAgaMZQbM7hDwhMR9mJmavXWCUMAPVwr
  Job 1 release path: created
  https://testnet.nearblocks.io/txns/GuTHMZfjsVHRkv9EDuWCQocR8H975SfpgVk5tNVmVyXb ,
  evidence recorded
  https://testnet.nearblocks.io/txns/B167T1QemUsEA755MCTG9V1QWC5rqBmpJ8x7aN5Zyug8 ,
  marked passed
  https://testnet.nearblocks.io/txns/4jEjdXjXpacyVEM82oAKywsqVhvBGLNXMz9vrrdqAKLi ,
  released
  https://testnet.nearblocks.io/txns/GQ8Wq1MvMJWbzGrpmCYzHU1nAC17SmBcbff8bVfhPUYr
  (final state: passed true, status "released"). The v1 contract did not restrict release to the payer; payer-only release is a v2 hardening. Job 2 walk-away
  path: created
  https://testnet.nearblocks.io/txns/jvcSJc69FEat5jf6SMf1DSV7Ds13b3GuE4egengkyhF ,
  mark_passed with no evidence FAILED on chain (enforcement works),
  refunded
  https://testnet.nearblocks.io/txns/EfvCGu2oDJzKtWa3PvwTTwFAtWDm71d38St86PdhL5ph
  (final state: passed false, status "refunded"). All amounts were
  0.01 testnet NEAR per job, free testnet tokens only. No private key
  or seed phrase is in this repository.
- **Key policy:** the testnet accounts above are throwaway, testnet
  only, never reused, and their keys live only in the deployment
  tool's local credential store, never in the repo. The mainnet prize
  payout account revival.user.intear.near was not used for any test,
  deployment, or spending in this phase.

## Submission status — read before judging

- Repository: public, at https://github.com/Alamutu1/near-thesis-tested
  (see the repository's commit history). The repository must stay public
  through judging.
- Project: Thesis Agent. Team lead: Cryptoearn Gives. Team size: 1 (solo).
  Track: Agent Economy (`agents`). Contact email: cryptoearngives@gmail.com.
  NEAR account for any prize payout: revival.user.intear.near (spelling as
  provided by the builder; this is the builder's own account, never
  invented by the agent).
- Demo post on X: **published 1 Nov 2026** as a 4-post thread by
  @Cryptogiives, with 3 screenshots of the working demo attached:
  https://x.com/Cryptogiives/status/2116831337407779257
- Demo video: **recorded and published 1 Nov 2026** — YouTube Public
  https://youtu.be/IvkHyNL2vGo (title "Thesis Agent — NEAR Hackathon
  Demo", channel Reel Rush Daily) and X reply
  https://x.com/Cryptogiives/status/2116866025144946780 (reply to the
  demo thread, video attached). No win, payment, or live transaction
  is claimed in the video.
- Final submission: **saved via the official API on 1 Nov 2026
  (HTTP 201)**. The submission form itself cannot be edited after sending,
  and this repository cannot be submitted again. Updates to the repository
  before the deadline do not change the submitted form.
- Hosted demo: live at https://thesis-agent.netlify.app/ — please keep
  this demo up to at least 25 Nov 2026.
- Deadline: development and submission end 14 Nov 2026 23:59 UTC.
  Judging: 16–18 Nov 2026; results by 18 Nov 2026.

## Attribution

Built by Cryptoearn Gives, solo. No other team member is named here, because
none was involved in this prototype.


## Post-submission improvements — release candidate prepared 2 Nov 2026, NOT yet pushed to main or redeployed

Work was done after the original submission, in a separate development copy, and is included in this release candidate. The original submitted version is preserved untouched in the frozen snapshot (near-hackathon-frozen-20261101-b4aeee4) and on main. No mainnet, no real money, no paid services.

### Phase 1 — Three-tier evidence verification (demo only)
- A note now reports one of: Verified reachable (URL in the note returned HTTP 2xx on a live check), Format only (named, dated, openable format passes, but live check was not run, failed, or returned non-2xx, or the note has only a document name), or Failed (format fails).
- Verified reachable proves only that the link opens, NEVER that the claim is true. That wording is in the code, the UI, and the Markdown export.
- A live check is run only when the user presses "Check link live". Editing a note resets its live verification to null, so an old verified label can never stand on a new note. Saved plans do not persist a live verification; it must be re-run.
- Tests: the original 41 tests still pass, plus 8 new Phase 1 tests (49 total).

### Phase 2 — Hardened escrow contract v2, deployed in parallel (testnet only)
- New contract account: v2.thesis-agent-escrow2.testnet, checker v2.thesis-agent-checker1.testnet, version() = "thesis-escrow-v2-hardened".
- Escrow v2 with payer-only release control — changes over v1: release only by the payer; payer must not equal checker; price at most 1 NEAR; evidence must be a URL or a named document; release/refund status is confirmed by a callback after the transfer, restoring the prior status if the transfer fails. Failure-branch behaviour is code-reviewed only and has not been live-tested.
- The v1 contract at thesis-agent-escrow2.testnet was NOT overwritten. Its code hash is unchanged and its job-1 remains released, job-2 refunded. V2 was funded only with testnet NEAR from the v1 testnet accounts.
- Live v2 tests, all testnet, 1 Nov 2026: deploy nopxy8Lz3TsM6pPvdrxzHLvqyVKhckxJWeWzCk6tKq1; job-v2-1 create 7QHYLBJCnJNxokm4r9jkTEHQHsyXsN9AFtqfwhPjPBLo, evidence 929j1acfU3NEGPen9PEGvhC3r4p8KFhJoNY8fW2jiWfS, mark_passed GvQncNGESncRSLD5gMBwpZ5kvMAaEpmPyFoK2jdJ3MZB, release by checker FAILED as required, release by payer 4M6qavVKZjGjBMwKRvxp6carNTN1TZ7BXvcBLQmWxdKj, final job-v2-1 passed true, status released; job-v2-2 create F7JpdXGtFabNHkJ5HkMu4sMjpgqm8uVP5MZz11PnVK9s, invalid evidence FAILED, mark_passed without evidence FAILED, refund 9MwU5X35Cot8ws47Ta2XybACXPNXi6PDv2AL7wi8P3NV, final job-v2-2 passed false, status refunded, evidence null; self-pay create FAILED; price 1.5 NEAR create FAILED (cap 1 NEAR).
- Explorer: release https://testnet.nearblocks.io/txns/4M6qavVKZjGjBMwKRvxp6carNTN1TZ7BXvcBLQmWxdKj , refund https://testnet.nearblocks.io/txns/9MwU5X35Cot8ws47Ta2XybACXPNXi6PDv2AL7wi8P3NV

### Phase 3 — Read-only live testnet proof panel (demo only)
- A "Show live testnet escrow proof" button in the demo queries the testnet RPC, read-only, for v2 jobs job-v2-1 and job-v2-2. It signs nothing, moves no money, needs no wallet.
- If the network or RPC is unavailable, the panel shows that fallback explicitly and the core thesis tool still works, with no network call in its core logic.
- Verified live RPC read, 1 Nov 2026: job-v2-1 passed true, status released, price 0.01 testnet NEAR; job-v2-2 passed false, status refunded, evidence null.


## Stage 1 — Deterministic rule-based workflow, implemented 1 Nov 2026 after the original submission (clarified plan)

This is a deterministic, rule-based workflow: it follows fixed steps, checks evidence format and consistency with fixed rules, runs correction loops, and stops at human approval gates. It does not independently read or verify source documents, and it is not a fully autonomous AI research agent.

This stage is rule-based only, not LLM. No model, key, or paid API is used.

### Clarifications incorporated (user, 1 Nov 2026)
1. Planning decisions (Buy, Counter, Do it yourself) are separate from work submission. A claim marked decided does NOT submit work. Work moves to submitted only by an explicit "Submit work for checking" action per job.
2. State machine, exact: assigned -> submitted -> checked -> ready. Corrections: checked -> correction-requested -> resubmitted -> checked. After two unsuccessful correction rounds, the next correction request escalates to human review, with correctionRound staying at 2.
3. Stage 2 evidence consistency (implemented in Stage 2, see Stage 2 section below): values are categorised as exact, potential-mismatch, missing, or inconclusive. A potential mismatch or inconclusive case is held for human review, never automatically flagged as proven error and never passed as truth.
4. Stage 4 escrow panel (implemented in Stage 4, see Stage 4 section below): demo jobs and the testnet proof are shown as separate sections. A demo job is never presented as having a blockchain escrow record unless that relationship is explicitly established. The testnet proof is labelled "separate demonstration".
5. Architecture is modular: Planner, Skill Registry, State Machine, Evaluator (Stage 2), Recommender (Stage 4), and a Reasoning Provider interface whose only provider in Stages 1-4 is rule-based. A future LLM provider, if ever approved separately, must implement the same input/output shape and label its source as "model", without rebuilding the other modules.

### What Stage 1 added
- Skill registry per claim kind, plus common skills (source-name extractor, date extractor, link reachability checker, duplicate detector). Checker profiles are named tool profiles, demo only, not accounts.
- Job record now carries skills, checkerProfile, planningDecision and planningReason (separate from workState), workState, correctionRound, history with source "rule", checks, and recommendation (null until Stage 4).
- Job board shows skills, planning decision, work state, correction round, and last history entry, plus a Submit work button that is enabled only from assigned.
- Work state persists in localStorage by stable claim UID on save/load. Rebuilding jobs after an edit or delete preserves the complete state of unchanged claims (see Remediation H3 below); only the edited claim's job, or a deleted claim's job, is reset or removed.
- Tests: 59 total pass (original 41 + Phase 1 8 + Stage 1 10). Original and frozen copies are untouched.


## Stage 2 — Rule-based Evaluator, implemented 1 Nov 2026 after the original submission

This evaluator is rule-based only. It is NOT an AI and NOT an intelligent fact-checker. No model, key, or paid API is used.

### Three separate dimensions
- Format: does the note name a source, give a date, and give a link or document name?
- Reachability: does a URL open (HTTP 2xx), is it inaccessible, or is there no URL to check (document name only)? Reachability proves only that a link opens.
- Support-consistency: do numbers, years, and key terms in the claim appear, in a comparable way, in the note? This compares two strings only. It does not read source content and does not judge truth.

### Verdict rules
- Pass (rule-based checks only): format passes and no potential mismatch, missing, or inconclusive support check remains. A pass summary always states it does not prove the claim is true or adequately supported.
- Hold: any potential mismatch, missing value, ambiguous evidence, unrelated document, or inaccessible link. Every hold needs human review, with reasons naming the failing check.
- Reject (evidence note): format check fails, so the submission as written cannot be evaluated. This is not a judgement on the claim itself.
- Number and year checks are categorised as exact, potential-mismatch, missing, or inconclusive. A note containing both a matching number and a different number is ambiguous and holds. A matching number, date, keyword, or phrase never, on its own, establishes that a claim is true or adequately supported.
- evaluateJob runs only from submitted or resubmitted work, and moves the job to checked. It does not move a job to ready; ready remains a separate transition, reserved for Stage 4. Every verdict records checks with findings, reasons, decision source "rule", and needsHumanReview, in the job record, in the job board, in localStorage, and in the Markdown export.

### Tests
70 total pass (original 41 + Phase 1 8 + Stage 1 10 + Stage 2 11), including misleading matching numbers, unrelated documents, inaccessible links, ambiguous evidence, missing numbers, and format failure. Original and frozen copies are untouched.


## Stage 3 — Correction Loop, implemented 1 Nov 2026 after the original submission

Rule-based only, no model, key, paid service, wallet, or automatic payment release.

### Correction requests
- Built from the exact failing evaluation checks, by name: format, numbers, years, keywords, reachability. No vague "improve your evidence" instruction exists in the code.
- Each instruction explains what needs attention from the user's own source, without inventing a source and without telling the user what figure or year to insert. Wording used, for example: "Check your source and update the note so the number it gives matches the source you are citing. Do not insert a figure you have not checked in the source."
- A correction request changes only the job state, round, and correction history. It never changes the claim text or the evidence note. The user edits the note themselves, then presses "Resubmit work (after you edit the note yourself)", then "Evaluate work" again.
- After resubmission, the evaluator runs again from the beginning on the current claim and note. Previous evaluations are kept in evaluationHistory, with their round, verdict, checks, and reasons, clearly distinguished from the current evaluation. Previous correction requests are kept in correctionHistory and in the Markdown export.

### Limits and guards
- Maximum two correction rounds. After round 2, if the job still requires correction, the next correction request escalates the job to human review and stops the automatic loop.
- Held and escalated jobs cannot become ready. The state machine now requires a fresh pass evaluation for a ready transition; a held, rejected, or escalated job, or a job with no evaluation, is rejected from ready.
- A correction request cannot be made for a passing evaluation, and cannot be made from assigned, submitted, correction-requested, ready, or escalated states.
- Editing a claim resets its job to assigned with no evaluation and no correction round, because the edited claim is new work, not a resubmission.
- This remains a rule-based consistency check, not a verification that evidence is truthful. Correction and evaluation text say so.

### Tests
79 total pass (original 41 + Phase 1 8 + Stage 1 10 + Stage 2 11 + Stage 3 9), including correction history, repeated failures, successful corrections, invalid transitions, editing claims, and escalation after two unsuccessful rounds. Original and frozen copies are untouched.


## Stage 4 — Payment Recommender, implemented 1 Nov 2026 after the original submission

Rule-based only. This is a recommendation for human payer approval, not a payment decision. No wallet signing, transfer, private key, or automatic escrow release exists in this module, and no such code was added.

### Recommendation rules
- Approve requires ALL of: job in Ready state, a fresh pass evaluation (evaluation claim text and note match the current claim and note), no unresolved correction or escalation, cap status Allowed, planning decision Buy or an accepted Counter, and a final demo price above zero. Reasons list each satisfied condition.
- Hold is used whenever evidence requires human review, the job is incomplete, or any required condition is uncertain, including: escalated jobs, missing evaluation, stale evaluation, held evaluation, a job not yet in Ready state, an open correction, a cap-blocked price, or an evaluation that needs human review. Hold is also used for uncertain truth: the system never rejects merely because it cannot establish whether a claim is true.
- Reject is used only for clearly disqualified work: a task explicitly cut/abandoned by the user, a planning decision of Do it yourself (no checker payment to be made), or an evidence note that failed the format check. A format reject is explicitly not a judgement on the claim itself.
- Every recommendation records: recommendation, reasons, evaluation checks with findings, full job history, evaluation verdict, source "rule", recommender "rule-based recommender", and the disclaimer: "Rule-based recommendation for human payer approval only. This does not release funds, authorise a payment, or make a payment decision. No payment is made by this demo." The recommendation is shown in the job board, saved in localStorage, and included in the Markdown export, via a "Get payment recommendation" button that only computes and stores the recommendation.
- A pass evaluation now clears the current correction request (history preserved in correctionHistory), so a corrected job that passes can be approved, while its correction history remains visible.

### Separation from testnet proof
- Ordinary demo jobs are completely separate from the NEAR testnet proof. No demo job ID is presented as a chain job ID, and no demo job is described as having an escrow record.
- The testnet proof panel is now labelled "SEPARATE DEMONSTRATION, not a record of the demo jobs above" in its heading text and in both its success and fallback outputs, with the statement "Reading blockchain records does not initiate or authorise a payment." The panel remains read-only, signs nothing, moves no money, and needs no wallet.

### Tests
89 total pass (original 41 + Phase 1 8 + Stage 1 10 + Stage 2 11 + Stage 3 9 + Stage 4 10), including all three recommendation outcomes and edge cases: escalated jobs, correction history resolved and unresolved, abandoned cut tasks, Do it yourself tasks, cap-blocked prices, missing evaluations, and stale evaluations. Original and frozen copies are untouched.


## Stage 4 freshness safeguard — payment recommendation audit, implemented 1 Nov 2026 after the original submission

No payment functionality was added. This safeguard only audits whether a stored recommendation is still valid.

### Fingerprint
Every new recommendation now carries a fingerprint of the exact decision inputs used to produce it: claim text, evidence note, work state, evaluation verdict, planning decision and task decision, demo final price, cap status, price cap value, cut status, correction round, current correction request round, and escalation status.

### Invalidation
isRecommendationFresh compares the stored fingerprint with the current job and claim. Any difference produces a stale reason naming the changed input, and the recommendation is treated as outdated, never as valid. Covered changes, each tested: claim text, evidence note, work state, evaluation verdict, planning decision, demo price, price cap value, cap status, cut status, correction round and correction status, and escalation status. A recommendation made before freshness tracking, with no fingerprint, is also stale by definition.

### Interface and export
- Job board: a fresh recommendation is labelled "CURRENT, inputs unchanged since calculation". An outdated one is labelled "OUTDATED PAYMENT RECOMMENDATION — NOT VALID", with its stale reasons listed, and a recalculation button. The old recommendation text is kept only as history, not as a current recommendation.
- Markdown export: a fresh recommendation is exported as "Payment recommendation (current)". An outdated one is exported as "OUTDATED payment recommendation (do not use as current)", with its stale reasons, and its previous reasons marked "history only". An outdated export never contains a current recommendation line for that job.
- Recalculation: pressing "Get payment recommendation" again computes a fresh recommendation from current inputs. A recalculated recommendation after a note change, for example, is fresh but may change verdict, in the tested case from approve to hold because the evaluation became stale.

### Tests
102 total pass (original 41 + Phase 1 8 + Stage 1 10 + Stage 2 11 + Stage 3 9 + Stage 4 10 + freshness 13), including unchanged inputs staying fresh, each input category invalidating an Approve, a fingerprint-less recommendation being stale, recalculation after a change, and the export outdated test. Original and frozen copies are untouched.


## Final edge cases — Abandoned status and evaluation-record freshness, 1 Nov 2026, after the original submission

No new payment functionality was added.

### 1. Explicit Abandoned status
- Jobs now carry an explicit abandoned flag, separate from cut, default false. The job board has an "Abandon this job / Restore abandoned job" button, distinct from Cut, and shows task status as Abandoned, Cut, or Active.
- recomputeJobs treats an abandoned job like a cut job for planning: cap status "Abandoned by user", spent 0, consuming no cap.
- recommendJob rejects an abandoned job, with reason "Task explicitly abandoned by the user, so no payment is recommended", exactly as a cut job is rejected.
- The recommendation fingerprint now includes abandoned status, so changing a previously approved job to Abandoned invalidates its Approve recommendation, with stale reason "Task abandoned status changed". The job board then shows it as OUTDATED, not valid, and the Markdown export shows it as OUTDATED, not current. Recalculation after abandoning gives Reject, not the old Approve.
- Abandoned status persists in localStorage, is preserved when jobs are rebuilt after an edit or delete, and is included in the export via cap status.

### 2. Evaluation-record freshness
- The previous fingerprint stored only the evaluation verdict, so a change to a check, finding, or reason with verdict still Pass would not have invalidated a recommendation. That gap is now closed.
- The fingerprint now includes the complete relevant evaluation record, as a string: verdict, checks (name, dimension, result, finding), reasons, summary, and needsHumanReview.
- isRecommendationFresh recomputes that record from the current evaluation and compares it exactly. Any change to a check finding, a check result, or a reason invalidates the recommendation, even if the verdict is still Pass or is forced back to Pass, with stale reason "Evaluation record changed (checks, findings, or reasons) since the recommendation was made, even though the verdict may still be Pass."
- A recommendation made before evaluation-record tracking, with no evaluationRecord in its fingerprint, is stale by definition.
- An unchanged evaluation record keeps an Approve recommendation fresh, as tested.

### Tests
108 total pass (original 41 + Phase 1 8 + Stage 1 10 + Stage 2 11 + Stage 3 9 + Stage 4 10 + freshness 13 + edge cases 6), including: Abandoned invalidating Approve like Cut, Abandoned identified as outdated in the export, evaluation check finding change invalidating Approve with verdict still Pass, evaluation reason change invalidating Approve, evaluation check result change invalidating Approve even with verdict forced to Pass, and unchanged evaluation record keeping Approve fresh. Original and frozen copies are untouched.


## Remediation — audit issues H2, H3, H4, M1, M2, M3, M4, M5, M7, M8, implemented 1 Nov 2026 after the original submission

### H2 — Broadened human evidence confirmation (amended, 1 Nov 2026)
A Pass is rule-based consistency only. It does not prove the claim is true, and a reachable link does not prove its contents support the claim, because the system does not read source content. An Approve recommendation now requires explicit human confirmation for BOTH document-only and URL-based evidence, with the exact wording: "I have opened and reviewed this evidence, and it supports the claim." Without confirmation, the recommendation is Hold. Confirmation is recorded in job history and in the recommendation fingerprint. A new evaluation resets confirmation, and changing the claim or evidence, or clearing confirmation, invalidates a previous recommendation. The evaluator may still return Pass, but its summary now states human review is required before any payment recommendation.

### H3 — Stable claim identifiers and state preservation
Claims now carry a stable unique UID, separate from their display number, which changes when a claim is deleted. Rebuilding after an edit or delete preserves the complete state of unchanged claims: work state, correction round, history, evaluation, evaluation history, correction request, correction history, recommendation, and human evidence confirmation. A state is restored only when the UID is unique in both the old and new claim lists AND the claim text and note are unchanged. Ambiguous UID matches (the same UID for more than one claim in either list) are reset safely to assigned, never transferred arbitrarily to the wrong claim. Planning fields (quote, final price, cap status) are recomputed after a rebuild, so a restored recommendation correctly becomes stale if its price changed.

### H4 — Export date, fingerprint, and export-time validity
Every Markdown export now begins with an export date/time and the statement: "Recommendations in this export were current only at export time. Recheck freshness in the demo before any decision." Each job recommendation in the export includes its full fingerprint and its human evidence confirmation status. An outdated export still contains no current recommendation line for that job.

### M1 — Duplicate claim detection (implemented, not removed)
The duplicate detector in the skill registry is now implemented in the evaluator. When a claim list is supplied, a duplicate normalised claim text produces a potential-mismatch check and a Hold, with the reason that a human should merge or distinguish the duplicates. Without a claim list, the check is skipped and recorded as not applicable, so direct evaluator calls are not broken.

### M2 — Comma-formatted numbers
Number extraction now strips thousands commas before comparison, so 1,000 matches 1000 exactly, and 1,000.50 matches 1000.50, while 1,000 versus 1,200 is still a potential mismatch.

### M3 — Network descriptions corrected
The unqualified "sends nothing anywhere" claim in index.html and "no network calls" in package.json are corrected. The core thesis tool (app.js) makes no network calls; live quote, link check, and testnet proof panel send only the requests the user triggers. Remaining "no network calls" lines in these docs refer specifically to app.js core logic or to local tests, and are accurate in that qualified sense.

### M4 — Callback restoration, not live-tested on failure
Callback restore in the v2 escrow contract is implemented in code and code-reviewed, but not live-tested on a failed transfer, because a failure could not be forced on testnet in Phase 2. No contract source was changed in this remediation, so the deployed v2 contract source is unaltered.

### M5 — Stage 1 documentation corrected
Stage 1 clarification lines that described Stage 2 and Stage 4 as still planned are corrected to past tense, pointing to the implemented Stage 2 and Stage 4 sections.

### M7 — Claim decisions versus job work states
Claim decisions and job work states are separate tracks. Marking a claim Supported records the user's evidence decision for that part. Job work state records submission, evaluation, correction, readiness, and recommendation for checker work. Progress counts claim decisions only; the job board counts work states. This explanation appears in the job board intro and here.

### M8 — Dated expected blockchain states
The testnet proof panel no longer presents expected states as timeless. It now says "As recorded 1 Nov 2026: job-v2-1 passed true, status released; job-v2-2 passed false, status refunded, evidence null. If the actual RPC result above differs, the actual result and the explorer links prevail."

### Documented limitations for this judging cycle (not fixed)
- H1 — Demo recommendations do not gate real escrow. A demo recommendation does not authorise, gate, or trigger any blockchain release. A v2 escrow release is a separate, payer-only testnet action, independent of the demo. No integration was attempted in this remediation.
- M6 — Freshness covers the fingerprinted decision inputs, plus the saved-snapshot verification state and the fresh-evaluation-required flag added in the L3 corrections. It still does not cover evaluation history or correction history contents, total cap consumption beyond an individual job's cap status, changes to a linked source's content after it was opened, or any time expiry. Re-open the link and re-evaluate before any real decision.

### UI rendering fix found during remediation
During the remediation, inspection found that the edge-case stage had broken job card rendering in the development copy: the job card element was never appended to the job list, and the Cut button was never appended, so job cards and their buttons would not have shown in a browser, even though the underlying logic passed its automated tests. This was fixed in this remediation by restoring the card append, adding a Cut button append, and adding the missing Abandon button (which sets the existing abandoned field, no new workflow). This is why the UI checklist below must be executed in a real browser, not only by code inspection. See UI-TEST-CHECKLIST.md.

## P0 corrections — 1 Nov 2026
Stale evaluations are invalidated on evidence-note edit, escalation banners and restart keep the correction round at 2, and claim-status gating applies in fingerprints and exports. Suite: 130 tests. Rule-based only, as before.

## Plan9 corrections — 1 Nov 2026
Cleaned-value comparisons throughout recommendation, evaluation matching, freshness, and job preservation; record-only human review of HOLD verdicts; escalation presentation; a primary recommendation button; non-mutating export; and exact history entries for cut, restore, abandon, and restore-abandoned actions. Suite: 145 tests.

## QA corrections — 2 Nov 2026
Fixes for the evidence-verification race, zero-cap export, archived history in exports, mobile overflow, claim-edit readiness, progress after delete, claim splitting, whitespace-only notes, live-check label persistence, and HOLD review drafts. The share-link overwrite and one classification substring issue were left as documented behaviour, not defects. Suite: 157 tests.

## QA2 corrections — 2 Nov 2026
Unchanged-text edits preserve correction rounds, escalation flags, archived histories, cut and abandoned status, and planning decisions, and never reactivate cut or abandoned jobs; changed text invalidates evaluation, confirmation, checks, and open correction requests while keeping the outdated-recommendation display. Also fixed: splitting inside comma-grouped numbers and compound phrases, past-form causal verbs, restored verification shown as a saved snapshot (never as a fresh check, downgraded to format-only on re-evaluation), stacked errors, delete-all restore, clear-saved persistence, cross-format quantities, and duplicated HOLD reviews in exports. Suite: 169 tests.

## Third QA review — M1, M2, and L3 corrections — 2 Nov 2026
M1 (unchanged claim edit): saving an edit that does not change the cleaned claim text no longer clears the note, status, verification, evaluation, confirmation, or job state; whitespace-only changes are covered; genuinely changed text still invalidates as before. M2 (recommendation visibility): the recommendation button now scrolls to a "Payment recommendation result" heading at the beginning of the result, after layout settles, with a position check and retry, and scroll anchoring disabled on the job list; it does not scroll to the top of the job card and does not try to fit the whole result into the viewport. M2 was confirmed working on Android Chrome by the user. L3 (restored snapshot verification): a restored recommendation whose verification is a saved snapshot is shown as OUTDATED; a fresh live check alone does not restore it; only a fresh evaluation after that check, followed by recalculation, restores freshness; document-only recommendations, which have no link verification, are unaffected. Suite: 181 tests. All three corrections are rule-based and demo-only, as before; no payment, wallet, or model code was added.
