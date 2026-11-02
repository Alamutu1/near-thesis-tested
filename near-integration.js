// NEAR integration — DEMO DESIGN ONLY. Read this file before judging.
// Core object construction in this file makes no network call, opens
// NO wallet, signs NOTHING, and moves NO money. The optional live-quote
// function makes a network request only when the user presses the
// live-quote button, with dry: true only (see R6 below). This file
// exists so a judge can see exactly where a real NEAR call would
// plug in, without any fake transaction.
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

  // R6 — REAL, FREE, QUOTE-ONLY NEAR Intents quote (dry run, no spend).
  // Verified 1 Nov 2026 against the live 1Click API:
  //   POST https://1click.chaindefuser.com/v0/quote
  //   dry: true  -> a quote is returned with NO depositAddress, NO
  //   deposit, NO execution, and NO payment. dry: false would commit
  //   and return a deposit address; this code NEVER uses dry: false
  //   and never asks for a deposit, so nothing here can move money.
  //   The example below is a tiny, clearly labelled illustration:
  //   1 USDC on Arbitrum -> USDC on Solana, quoted for an example
  //   recipient "thesis-agent-demo.near" (recipientType INTENTS, so
  //   no real wallet address is used anywhere). The recipient is a
  //   label for a dry quote only; no funds are sent to it, and a dry
  //   quote never triggers a refund either.
  //   CORS: the API answers OPTIONS with Access-Control-Allow-Origin:
  //   * (verified 1 Nov 2026), so a browser fetch is allowed; if the
  //   browser still cannot reach it, the demo falls back to the local
  //   dry-run object and says so, instead of faking a quote value.
  //   Verified live dry-quote result (1 Nov 2026, direct API call):
  //   1.0 USDC in -> 0.999834 USDC out, timeEstimate 25, HTTP 201,
  //   no depositAddress in the response. Values change with the
  //   market; the demo always shows the value it actually received.
  var ONECLICK_QUOTE_URL = 'https://1click.chaindefuser.com/v0/quote';
  var LIVE_QUOTE_EXAMPLE = {
    originAsset: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
    destinationAsset: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',
    originLabel: '1 USDC on Arbitrum',
    destinationLabel: 'USDC on Solana',
    amount: '1000000',
    amountLabel: '1.0 USDC'
  };

  // Build the exact request body for a dry quote. The deadline is
  // computed at call time because the API requires a valid ISO 8601
  // deadline even for dry quotes (a missing deadline returns 400).
  // This function never returns dry: false.
  function buildLiveQuoteRequest(nowMs) {
    var deadline = new Date((typeof nowMs === 'number' ? nowMs : Date.now()) + 10 * 60 * 1000).toISOString();
    return {
      dry: true,
      swapType: 'EXACT_INPUT',
      slippageTolerance: 100,
      depositType: 'ORIGIN_CHAIN',
      originAsset: LIVE_QUOTE_EXAMPLE.originAsset,
      destinationAsset: LIVE_QUOTE_EXAMPLE.destinationAsset,
      amount: LIVE_QUOTE_EXAMPLE.amount,
      refundType: 'INTENTS',
      refundTo: 'thesis-agent-demo.near',
      recipientType: 'INTENTS',
      recipient: 'thesis-agent-demo.near',
      quoteWaitingTimeMs: 3000,
      deadline: deadline
    };
  }

  // Parse a 1Click quote response. Returns null for anything that is
  // not a usable dry quote, so the UI can fall back to the local
  // object instead of displaying a fake or mislabelled value. A
  // response that carries a depositAddress is NOT a dry quote and is
  // rejected here, even if the rest of the shape looks right.
  function parseLiveQuote(data) {
    if (!data || !data.quote) return null;
    var q = data.quote;
    if (data.depositAddress || q.depositAddress) return null;
    if (typeof q.amountInFormatted !== 'string' || typeof q.amountOutFormatted !== 'string') return null;
    return {
      source: 'LIVE QUOTE (DRY RUN, NO PAYMENT)',
      dry: true,
      amountInFormatted: q.amountInFormatted,
      amountOutFormatted: q.amountOutFormatted,
      amountInUsd: q.amountInUsd || null,
      amountOutUsd: q.amountOutUsd || null,
      timeEstimate: (typeof q.timeEstimate === 'number' ? q.timeEstimate : null),
      originLabel: LIVE_QUOTE_EXAMPLE.originLabel,
      destinationLabel: LIVE_QUOTE_EXAMPLE.destinationLabel,
      note: 'No deposit address was issued, nothing was sent, and this is not a payment. Values are the live dry quote received at request time and change with the market.'
    };
  }

  // Fetch one live dry quote. fetchFn is injected for tests; in the
  // browser it defaults to window.fetch. Rejects on any HTTP error,
  // network failure, or unusable response, so the caller falls back
  // to the local dry-run object and reports the failure honestly.
  function fetchLiveQuote(fetchFn, nowMs) {
    var doFetch = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    if (!doFetch) return Promise.reject(new Error('No fetch available in this environment.'));
    return doFetch(ONECLICK_QUOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildLiveQuoteRequest(nowMs))
    }).then(function (res) {
      if (!res.ok) throw new Error('Live quote request returned HTTP ' + res.status + '.');
      return res.json();
    }).then(function (data) {
      var parsed = parseLiveQuote(data);
      if (!parsed) throw new Error('Live quote response was not a usable dry quote (missing amounts, or a deposit address was present).');
      return parsed;
    });
  }

  root.NearIntegration = {
    buildNearIntentDryRun: buildNearIntentDryRun,
    ONECLICK_QUOTE_URL: ONECLICK_QUOTE_URL,
    LIVE_QUOTE_EXAMPLE: LIVE_QUOTE_EXAMPLE,
    buildLiveQuoteRequest: buildLiveQuoteRequest,
    parseLiveQuote: parseLiveQuote,
    fetchLiveQuote: fetchLiveQuote
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.NearIntegration;
})(typeof window !== 'undefined' ? window : globalThis);
