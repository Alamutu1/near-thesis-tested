# HACKATHON.md — Thesis Agent (this project)

## Release note — 2 Nov 2026 (release candidate, prepared for review, not yet published)
This release candidate includes the corrections and improvements documented below, made after the original submission. It has not yet been published to the public repository or live demo. If approved and released, this documentation will describe the corresponding released version.

This file follows the guidance in the official NEAR HACKATHON HACKATHON.md
(https://nearhackathon.com/HACKATHON.md, read 1 Nov 2026). It is the project
file for this repository, not a copy of the official file.

## Project

- **Project name:** Thesis Agent
- **Track:** Agent Economy — official track id `agents`
  ("Give AI agents the ability to earn, spend, negotiate and pay for
  services or other agents", with NEAR Intents and Chain Signatures as hints.
  Hints are not requirements, per the official HACKATHON.md.)
- **Team size:** 1 (solo)
- **Builder attribution:** Cryptoearn Gives
- **Event:** NEAR HACKATHON: Build Beyond Boundaries
- **Development window:** 1 Nov 2026 00:00 UTC to 14 Nov 2026 23:59 UTC
- **Judging:** 16–18 Nov 2026; results by 18 Nov 2026 23:59 UTC
- **Prize pool (event total):** $250,000
- **Hosted demo, open directly (judges can open this without downloading anything):** https://thesis-agent.netlify.app/

## What it is

Thesis Agent takes a written thesis or claim, breaks it into checkable
sub-claims, and shows a structured test plan with evidence placeholders for
each part. The user adds evidence and marks each part themselves. The demo
runs entirely as a static web page, with no backend, no paid API, and no keys.

## How to try it — do X, see Y

1. **Do X:** Open the hosted demo directly at https://thesis-agent.netlify.app/ in a browser.
   **See Y:** The Thesis Agent page, with a thesis box and example buttons.
2. **Do X (local alternative):** Open `index.html` in a browser.
   **See Y:** The Thesis Agent page, with a thesis box and example buttons.
3. **Do X:** Press "Try example 1", then "Break it down".
   **See Y:** A test plan for "Small businesses lose money because they do
   not track who owes them", with each part starting as "Not yet tested".
4. **Do X:** Add an evidence note to one part that names a source, gives a date, and gives a link or document name, then change its status.
   **See Y:** The status text changes and the progress bar moves. A note missing an element is blocked, with the missing element named, and the part stays Not yet tested. Progress counts only parts decided with a passing evidence note; Inconclusive does not count as decided.
5. **Do X:** Press "Copy test plan as text" or "Download test plan (.md)".
   **See Y:** The full plan, including your notes and statuses.
6. **Do X:** Change the spending cap to 10, with a 3-part plan on screen.
   **See Y:** A "Blocked by your cap" note, showing only 1 of 3 jobs fits
   (job 1 at 8 demo units; jobs 2 and 3 do not fit).
7. **Do X:** In Step 3, read the per-job list (DEMO ONLY).
   **See Y:** One row per sub-claim with a demo quote, a do-vs-buy
   line, exactly one counter-offer when the quote is above the
   10-unit plan, and allowed / blocked / cut status. Job 2 of
   example 1 counters once at 10 demo units and is accepted. Cut a
   job and see the totals change; the download records that cut in
   its per-job receipt. An invalid cap (for example "abc") shows an
   error and keeps the previous cap.
8. **Do X:** Edit or delete a claim, then refresh the page.
   **See Y:** The change is restored from this browser only
   (localStorage, no server). An edited claim starts again as
   "Not yet tested" with no evidence note.
9. **Do X:** Press "Show the NEAR plug-in point (dry run)".
   **See Y:** A DRY RUN object, clearly labelled as not submitted, not
   signed, and not a transaction.
10. **Do X:** Press "Get a live quote (dry run, no payment)".
    **See Y:** Either a LIVE QUOTE (DRY RUN, NO PAYMENT) box with the
    live in/out amounts actually received, or a LOCAL FALLBACK box
    naming the failure and showing the local dry-run object instead.
    No value is ever shown as live unless it was received from the API.
11. **Do X:** Open the testnet escrow proof below on the explorer.
    **See Y:** Real testnet transactions for a job created, evidence
    recorded, passed, and released, plus a second job refunded on
    walk-away. These are testnet transactions only, in testnet NEAR,
    not a mainnet payment and not a prize payout.

## What is real, and what is not

- **Real:** thesis breakdown, classification, test-plan generation, evidence
  notes, status marking, progress, copy, and Markdown download, plus the
  local evidence format gate (named source, date, openable reference,
  format check only), the per-job agent loop as a labelled demo
  (demo quotes, do-vs-buy, one counter-offer, per-job receipts, cut),
  cap validation, local-only persistence, claim edit/delete, the
  `?thesis=` share link, and a
  real test suite (`npm test`, 181 tests).
- **Real, NEAR, quote-only:** a live NEAR Intents 1Click dry quote
  (dry: true only, POST https://1click.chaindefuser.com/v0/quote, no
  deposit address, no payment). Verified live on 1 Nov 2026: 1.0 USDC
  in to about 0.9998 USDC out, time estimate 25, HTTP 201. Live-quote availability may vary: a direct API check on 1 Nov 2026 returned HTTP 403, so the failure fallback is expected behaviour when the live call is unavailable, not a demo defect.
- **Real, NEAR, testnet only:** the escrow contract in `contract/`
  (Rust, near-sdk), deployed on testnet at thesis-agent-escrow2.testnet
  (see "Phase 3 — testnet escrow proof" below). It holds a job price
  in testnet NEAR, releases it only after the checker records an
  evidence link and marks the job passed, and refunds it on walk-away.
  The v1 contract did not restrict release to the payer; payer-only release is a v2 hardening, described in Phase 2 below.
  Nothing here is mainnet, real money, or a prize payout.
- **Demo only:** the agent payment step in the demo page itself
  (demo units only, no real payment in the page, no wallet in the
  page) and the dry-run object in `near-integration.js` (never sent,
  no wallet, no signature, no transaction hash).
- **Not claimed:** no mainnet transaction, balance, payout, or NEAR AI
  Cloud use. The live quote is a price quote, not a payment; the
  escrow proof is testnet, not mainnet.

## NEAR's role, stated concretely

In the full design, NEAR is the payment rail for the checker agent: one job
per sub-claim, paid only after the checker records a named, dated, openable
evidence link. That is the Agent Economy idea — an agent earns by completing
a verifiable job for another agent or user. In this prototype that rail is
now proven in two real, limited ways, and still labelled honestly
everywhere: a dry-only live Intents quote in the demo page, and a
testnet escrow contract with real testnet transactions (below). The
demo page itself still has no wallet and moves no money. Testnet-only
projects are eligible per the official HACKATHON.md, and no integration
is mandatory.

## Repository, demo post, and submission status

- **Repository:** https://github.com/Alamutu1/near-thesis-tested (public;
  must stay public through judging)
- **Project:** Thesis Agent. **Team lead:** Cryptoearn Gives.
  **Team size:** 1 (solo). **Track:** Agent Economy (`agents`).
  **Contact email:** cryptoearngives@gmail.com.
  **NEAR account for any prize payout:** revival.user.intear.near
  (spelling as provided by the builder; the builder's own account, never
  invented by the agent).
- **Demo post on X:** **Published 1 Nov 2026** as a 4-post thread by
  @Cryptogiives, with 3 screenshots of the working demo attached:
  https://x.com/Cryptogiives/status/2116831337407779257
  It says the project was built at NEAR HACKATHON, tags @NEARProtocol
  and #NEARHackathon, and links this repository.
- **Demo video:** **Recorded and published 1 Nov 2026** — YouTube
  Public https://youtu.be/IvkHyNL2vGo (title "Thesis Agent — NEAR
  Hackathon Demo", channel Reel Rush Daily) and X reply
  https://x.com/Cryptogiives/status/2116866025144946780 (reply to the
  demo thread, video attached). See `demo-script.md` for the outline
  (under 3 minutes, one complete moment: type a thesis, see the plan,
  mark one part, download the plan). No win, payment, or live
  transaction is claimed in the video.
- **Final submission:** **Saved via the official API on 1 Nov 2026
  (HTTP 201).** The submission form itself cannot be edited after
  sending, and this repository cannot be submitted again. Do not create
  a second submission.
- **Hosted demo:** Live at https://thesis-agent.netlify.app/ — please
  keep this demo up to at least 25 Nov 2026.

## Phase 3 — testnet escrow proof (testnet only, no mainnet, no real money)

Contract source: `contract/` in this repository (Rust, near-sdk 5,
`create_job`, `record_evidence`, `mark_passed`, `release`, `refund`,
`get_job`). Contract account (testnet, throwaway, created by the agent
for this demo only, never reused for anything else, never the mainnet
prize payout account revival.user.intear.near): thesis-agent-escrow2.testnet.
Checker account (testnet, also throwaway, created for this demo only):
thesis-agent-checker1.testnet. Both accounts were funded with free
testnet NEAR only. No private key or seed phrase is in this repository,
and none is published here.

Reproducible flow, 1 Nov 2026, all testnet:
- Deploy + initialise contract: https://testnet.nearblocks.io/txns/guT4svwMB79VAgaMZQbM7hDwhMR9mJmavXWCUMAPVwr
- Job 1 (release path): created, 0.01 testnet NEAR attached —
  https://testnet.nearblocks.io/txns/GuTHMZfjsVHRkv9EDuWCQocR8H975SfpgVk5tNVmVyXb ;
  evidence recorded by the checker ("sales-ledger-march-2026.pdf") —
  https://testnet.nearblocks.io/txns/B167T1QemUsEA755MCTG9V1QWC5rqBmpJ8x7aN5Zyug8 ;
  marked passed by the checker —
  https://testnet.nearblocks.io/txns/4jEjdXjXpacyVEM82oAKywsqVhvBGLNXMz9vrrdqAKLi ;
  released to the checker —
  https://testnet.nearblocks.io/txns/GQ8Wq1MvMJWbzGrpmCYzHU1nAC17SmBcbff8bVfhPUYr .
  Final on-chain state for job-1: passed true, status "released".
- Job 2 (walk-away path): created, 0.01 testnet NEAR attached —
  https://testnet.nearblocks.io/txns/jvcSJc69FEat5jf6SMf1DSV7Ds13b3GuE4egengkyhF ;
  mark_passed with NO evidence was attempted by the checker and
  FAILED on chain (the contract enforces evidence before passing);
  refunded to the payer —
  https://testnet.nearblocks.io/txns/EfvCGu2oDJzKtWa3PvwTTwFAtWDm71d38St86PdhL5ph .
  Final on-chain state for job-2: passed false, status "refunded".

Key policy for this contract: the two testnet accounts above are
throwaway demo accounts, testnet only, holding only free testnet NEAR.
Their keys are held only in the deployment tool's local credential
store, are never committed to this repository, and are never shared
in chat. The mainnet prize payout account (revival.user.intear.near)
was not used for any test, deployment, or spending in this phase.
Reproducing this flow needs only a fresh testnet account and the
contract source in `contract/`; it needs no mainnet account, no real
money, and no key from this repository.

## Remaining steps (verification only — submission is already saved)

1. Keep this repository public through judging (results by 18 Nov 2026).
2. Keep the hosted demo at https://thesis-agent.netlify.app/ up to at
   least 25 Nov 2026.
3. Do not edit the submitted form (it cannot be edited), do not create
   a second submission, and do not change the submitted track, project
   name, or demo URL in a new submission.
4. Any organiser contact goes to the submitted email,
   cryptoearngives@gmail.com.

## Licence

MIT. See `LICENSE`.


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
