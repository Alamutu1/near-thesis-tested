# Thesis Agent

**NEAR HACKATHON: Build Beyond Boundaries — Agent Economy track (`agents`)**

A small, honest agent demo: type a thesis or claim, and Thesis Agent breaks it into
checkable sub-claims, each with a way to measure it, the evidence it needs, and a
pass rule. You add the evidence yourself and mark each part. The demo never marks
a claim true or false on its own.

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
4. You add an evidence note per part and set its status yourself:
   Not yet tested, Supported by evidence, Not supported by evidence, or
   Inconclusive. A progress bar tracks how many parts you have marked.
5. You set a spending cap (demo units only). The agent job list — one
   checker job per sub-claim — is blocked above that cap, which is the
   spending guardrail for an agent with a wallet.
6. You can copy the test plan as text or download it as Markdown.

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

- **Do X:** Open `index.html` in any modern browser, on a phone or a computer.
  **See Y:** The Thesis Agent page, with a text box and three example buttons.
- **Do X:** Press "Try example 1", then "Break it down".
  **See Y:** A test plan for "Small businesses lose money because they do not
  track who owes them", broken into checkable parts, all starting as
  "Not yet tested".
- **Do X:** Type an evidence note on one part and change its status.
  **See Y:** That part's status text changes, and the progress bar moves.
- **Do X:** Press "Copy test plan as text" or "Download test plan (.md)".
  **See Y:** The full plan, including your notes and statuses.
- **Do X:** Change the spending cap to 10, with a 3-part plan on screen.
  **See Y:** A "Blocked by your cap" note, showing only 1 of 3 jobs fits.
- **Do X:** Press "Show the NEAR plug-in point (dry run)".
  **See Y:** A clearly labelled DRY RUN object. No transaction is sent.

## What is real, and what is demo only

**Real and working in this repository:**

- The thesis breakdown, classification, test-plan generation, evidence notes,
  status marking, progress tracking, copy, and Markdown download. All of it
  runs locally in the browser with no backend and no paid API.
- The code in `app.js` is deterministic and testable with Node (see below).

**Demo only, clearly labelled in the app and in code:**

- The "agent payment" step. The app shows a job list and a budget in
  **demo units only**. It does not pay anyone, in NEAR or in any currency.
- The NEAR integration in `near-integration.js`. It builds a dry-run,
  intent-shaped object locally and **never sends it anywhere**. It opens no
  wallet, signs nothing, and produces no transaction hash, balance, or result.
  A real NEAR Intents call would plug in at
  `NearIntegration.buildNearIntentDryRun()` in `near-integration.js`, and
  would require the user's own NEAR testnet account and explicit approval
  before any quote or submission. That step is future work, not part of
  this demo, and nothing in this repository should be read as a completed
  on-chain payment.

**Not claimed:**

- No real NEAR mainnet or testnet transaction, no real balance, no real
  payout, no live NEAR Intents quote, and no use of NEAR AI Cloud or any
  paid API. The hackathon's own HACKATHON.md states that no integration is
  mandatory and a testnet-only project is eligible, and this prototype is
  presented on that honest basis.

## Files

- `index.html` — the demo page (open this file).
- `app.js` — the breakdown and test-plan logic, no network calls.
- `near-integration.js` — the labelled dry-run NEAR plug-in point.
- `HACKATHON.md` — this project's HACKATHON.md, following the official
  guidance: what was built, how to try it, and what is still needed.
- `demo-script.md` — outline for a short demo video (not recorded yet).
- `LICENSE` — MIT.

## Tests (local, no network)

```sh
node -e "
const a = require('./app.js');
const r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
console.log(r.claims.length, 'claims');
console.log(r.claims.every(c => c.status === 'Not yet tested'));
console.log(a.analyseThesis('').error ? 'empty input rejected' : 'FAIL');
console.log(a.planAsMarkdown(r).includes('Pass only if'));
"
```

Expected output: a claim count of 2 or more, `true`, `empty input rejected`,
`true`.

## Submission status — read before judging or submitting

- Repository: public, at https://github.com/Alamutu1/near-thesis-tested
  (pushed after the build; see the repository's commit history).
- Demo post on X: **not yet published**. It needs the builder's separate
  approval for the exact post text, and it is not part of this push.
- Final submission form: **not yet submitted**. It needs the team lead's
  name, contact email, team size, preferred track, and a NEAR account for
  any prize payout. Those are the builder's own details and were not filled
  in by the agent. See `HACKATHON.md` for the exact remaining steps.
- Deadline: development and submission end 14 Nov 2026 23:59 UTC.

## Attribution

Built by Cryptoearn Gives, solo. No other team member is named here, because
none was involved in this prototype.
