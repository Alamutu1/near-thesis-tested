# Thesis Agent

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
  and falls back to the local object if the call fails.

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

Expected output: all 41 tests pass, including the README example with
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
  (final state: passed true, status "released"). Job 2 walk-away
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
