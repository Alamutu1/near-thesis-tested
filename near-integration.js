// NEAR integration — DEMO DESIGN ONLY. Read this file before judging.
// This file makes NO network call, opens NO wallet, signs NOTHING,
// and moves NO money. It exists so a judge can see exactly where a
// real NEAR call would plug in, without any fake transaction.
//
// Where a real call would go (future work, needs the user's own
// NEAR account and approval, and is NOT part of this demo):
//   1. The user connects their own NEAR wallet (testnet first).
//   2. This payload is shown to the user for approval BEFORE sending.
//   3. A real NEAR Intents quote is requested with dry-run / quote-only
//      mode, and only a user-approved, signed intent is submitted.
//   4. The returned transaction hash is shown from the network
//      response, never invented here.
//
// Until those steps exist, every value below is labelled DRY RUN.
(function (root) {
  'use strict';

  function buildNearIntentDryRun(result) {
    if (!result || result.error || !result.claims) return null;
    return {
      mode: 'DRY RUN — NOT SUBMITTED, NOT SIGNED, NO TRANSACTION',
      purpose: 'Pay a checker agent for one completed test-plan job, once the user approves it',
      agentJob: {
        job: 'Check one thesis sub-claim against its named evidence',
        claimCount: result.claims.length,
        thesis: result.thesis,
        // Demo units only. This is not NEAR, not a stablecoin, not money.
        // Total of the per-job demo quotes (8, 12, 10, 18, 9 in job
        // order) when jobs are present, otherwise the old flat total.
        budgetDemoUnits: result.jobs
          ? result.jobs.reduce(function (sum, j) { return sum + j.quote; }, 0)
          : result.claims.length * 10,
        currency: 'DEMO UNITS ONLY — not NEAR, not USD'
      },
      // This is the shape a real NEAR Intents request would take.
      // It is built locally and never sent anywhere by this demo.
      nearIntentsShape: {
        intent: 'transfer',
        asset: '(to be set by the user at approval time, testnet first)',
        amount: '(to be set by the user at approval time)',
        recipient: '(checker agent account, to be set by the user)',
        condition: 'Release only after the checker records a named, dated, openable evidence link'
      },
      nextStepForRealIntegration: [
        'User creates their own NEAR testnet account (never shared here).',
        'User approves a quote-only NEAR Intents request in their own wallet.',
        'Only then is a signed intent submitted, and the real hash is displayed.'
      ]
    };
  }

  root.NearIntegration = { buildNearIntentDryRun: buildNearIntentDryRun };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.NearIntegration;
})(typeof window !== 'undefined' ? window : globalThis);
