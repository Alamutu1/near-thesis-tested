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

## What it is

Thesis Agent takes a written thesis or claim, breaks it into checkable
sub-claims, and shows a structured test plan with evidence placeholders for
each part. The user adds evidence and marks each part themselves. The demo
runs entirely as a static web page, with no backend, no paid API, and no keys.

## How to try it — do X, see Y

1. **Do X:** Open `index.html` in a browser.
   **See Y:** The Thesis Agent page, with a thesis box and example buttons.
2. **Do X:** Press "Try example 1", then "Break it down".
   **See Y:** A test plan for "Small businesses lose money because they do
   not track who owes them", with each part starting as "Not yet tested".
3. **Do X:** Add an evidence note to one part and change its status.
   **See Y:** The status text changes and the progress bar moves.
4. **Do X:** Press "Copy test plan as text" or "Download test plan (.md)".
   **See Y:** The full plan, including your notes and statuses.
5. **Do X:** Change the spending cap to 10, with a 3-part plan on screen.
   **See Y:** A "Blocked by your cap" note, showing only 1 of 3 jobs fits.
6. **Do X:** Press "Show the NEAR plug-in point (dry run)".
   **See Y:** A DRY RUN object, clearly labelled as not submitted, not
   signed, and not a transaction.

## What is real, and what is not

- **Real:** thesis breakdown, classification, test-plan generation, evidence
  notes, status marking, progress, copy, and Markdown download. All local.
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

## Repository and demo post

- **Repository:** https://github.com/Alamutu1/near-thesis-tested (public)
- **Demo post on X:** Not yet published. The builder must approve the exact
  post text first. When published, it must say the project was built at
  NEAR HACKATHON, tag @NEARProtocol and #NEARHackathon, and include the
  demo video or screenshots.
- **Demo video:** Not yet recorded. See `demo-script.md` for the outline
  (under 3 minutes, one complete moment: type a thesis, see the plan,
  mark one part, download the plan).

## Remaining steps before submission (all need the builder)

1. Builder approves the exact X demo post text, publishes it, and shares
   the post link.
2. Builder provides, for the submission form: team lead name, contact email,
   team size (1), track (`agents`), and a NEAR account address for any
   prize payout (created by the builder in their own wallet; never invented
   by the agent).
3. Builder confirms the 20–2,000 character project description and the
   consent notice, verbatim: "I agree that the organizers may use these
   details to review our submission and contact us about this hackathon."
4. Only then is the submission sent, once, before 14 Nov 2026 23:59 UTC.
   A submission cannot be edited after sending, and this repository must
   stay public through judging.

## Licence

MIT. See `LICENSE`.
