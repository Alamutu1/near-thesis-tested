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
   **See Y:** A "Blocked by your cap" note, showing only 1 of 3 jobs fits.
7. **Do X:** Press "Show the NEAR plug-in point (dry run)".
   **See Y:** A DRY RUN object, clearly labelled as not submitted, not
   signed, and not a transaction.

## What is real, and what is not

- **Real:** thesis breakdown, classification, test-plan generation, evidence
  notes, status marking, progress, copy, and Markdown download, plus the
  local evidence format gate (named source, date, openable reference,
  format check only) and a real test suite (`npm test`). All local.
- **Demo only:** the agent payment step (demo units only, no real payment)
  and the NEAR integration in `near-integration.js` (a dry-run object,
  never sent, no wallet, no signature, no transaction hash).
- **Not claimed:** no live NEAR transaction, balance, payout, Intents quote,
  or NEAR AI Cloud use. A real NEAR call would plug in at
  `NearIntegration.buildNearIntentDryRun()` and would need the user's own
  NEAR testnet account and approval first.

## NEAR's role, stated concretely

In the full design, NEAR is the payment rail for the checker agent: one job
per sub-claim, paid only after the checker records a named, dated, openable
evidence link. That is the Agent Economy idea — an agent earns by completing
a verifiable job for another agent or user. In this prototype that rail is
shown as a dry-run design only, so judges can see the intended path without
any faked on-chain result. Testnet-only projects are eligible per the
official HACKATHON.md, and no integration is mandatory.

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
