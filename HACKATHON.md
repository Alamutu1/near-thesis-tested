# HACKATHON.md — Thesis Agent (this project)

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
  cap validation, local-only persistence, claim edit/delete, and a
  real test suite (`npm test`, 36 tests).
- **Real, NEAR, quote-only:** a live NEAR Intents 1Click dry quote
  (dry: true only, POST https://1click.chaindefuser.com/v0/quote, no
  deposit address, no payment). Verified live on 1 Nov 2026: 1.0 USDC
  in to about 0.9998 USDC out, time estimate 25, HTTP 201.
- **Real, NEAR, testnet only:** the escrow contract in `contract/`
  (Rust, near-sdk), deployed on testnet at thesis-agent-escrow2.testnet
  (see "Phase 3 — testnet escrow proof" below). It holds a job price
  in testnet NEAR, releases it only after the checker records an
  evidence link and marks the job passed, and refunds it on walk-away.
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
- **Demo video:** Prepared for private review in Phase 0 (see
  `demo-video/` in the working copy; not published). See `demo-script.md`
  for the outline (under 3 minutes, one complete moment: type a thesis,
  see the plan, mark one part, download the plan). No video has been
  published on the builder's behalf.
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
