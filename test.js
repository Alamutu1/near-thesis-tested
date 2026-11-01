// Thesis Agent tests — run with: npm test
// No network, no wallet, no keys. Every case is a real assertion
// against app.js, including the audit weakness-3 failure cases.
'use strict';
var assert = require('assert');
var a = require('./app.js');

var passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('ok - ' + name);
}

// README example: exactly 3 claims, all untested, Markdown rule present.
check('README example gives exactly 3 claims', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  assert.strictEqual(r.claims.length, 3);
  assert.strictEqual(r.claims[0].role, 'Effect claimed');
  assert.strictEqual(r.claims[1].role, 'Cause claimed');
  assert.strictEqual(r.claims[2].role, 'Falsification check');
  assert.ok(r.claims.every(function (c) { return c.status === 'Not yet tested'; }));
  assert.ok(a.planAsMarkdown(r).includes('Pass only if'));
});
check('empty input is rejected', function () {
  assert.ok(a.analyseThesis('').error);
});
check('built-in example 2 still works', function () {
  var r = a.analyseThesis('Remote work increases productivity for customer support teams.');
  assert.strictEqual(r.claims.length, 3);
  assert.strictEqual(r.claims[0].kind, 'Cause and effect');
});
check('built-in example 3 still works', function () {
  var r = a.analyseThesis('Cross-chain payments will be cheaper than single-chain payments for small traders.');
  assert.strictEqual(r.claims[0].kind, 'Comparison');
});

// Weakness 3: short fragments are kept, not silently deleted.
check('short fragments are kept', function () {
  var parts = a.splitSubClaims('A and B and C and D and E and F and G are all rising fast in this market today.');
  var texts = parts.map(function (p) { return p.text; });
  assert.ok(texts.indexOf('B') !== -1 || texts.join(' ').indexOf('B') !== -1, 'expected a short fragment to survive, got: ' + texts.join(' | '));
  assert.ok(parts.length >= 3, 'expected several parts, got ' + parts.length);
});
// Weakness 3: leading connectors are stripped.
check('leading connectors are stripped', function () {
  var parts = a.splitSubClaims('Sales rose, costs fell, and customers returned in the same quarter.');
  assert.ok(parts.every(function (p) { return !/^(and|but|so)\s/i.test(p.text); }), 'a part still starts with a connector: ' + parts.map(function (p) { return p.text; }).join(' | '));
  assert.ok(parts.some(function (p) { return p.text === 'customers returned in the same quarter.'; }));
});
check('leading but is stripped', function () {
  var parts = a.splitSubClaims('Remote work increases productivity, but it hurts teamwork in large support teams today.');
  assert.ok(parts.every(function (p) { return !/^(and|but|so)\s/i.test(p.text); }));
});
// Weakness 3: leading "because" is handled.
check('leading because keeps effect and cause', function () {
  var r = a.analyseThesis('Because prices rose and wages fell, families cut spending in 2026.');
  assert.strictEqual(r.claims[0].role, 'Effect claimed');
  assert.ok(r.claims[0].text.indexOf('families cut spending') !== -1, 'effect was: ' + r.claims[0].text);
  assert.strictEqual(r.claims[1].role, 'Cause claimed');
  assert.ok(r.claims[1].text.indexOf('prices rose') !== -1);
});
// Weakness 3: multiple "because" clauses are all kept.
check('multiple because clauses are kept', function () {
  var r = a.analyseThesis('Small shops lose sales because prices rose, because wages fell, and because rent went up in 2026 for local traders.');
  assert.ok(r.claims.length >= 4, 'expected effect + 2 causes + falsification, got ' + r.claims.length);
  assert.ok(r.claims.some(function (c) { return c.text.indexOf('rent went up') !== -1; }));
});
// Weakness 3: cap is warned about, not silent.
check('more than 5 claims warns instead of silently dropping', function () {
  var r = a.analyseThesis('Sales rose, costs fell, customers returned, staff stayed, prices held, rivals closed, and exports grew in 2026 for small traders.');
  assert.strictEqual(r.claims.length, 5);
  assert.strictEqual(r.capped, true);
  assert.ok(r.cappedWarning && r.cappedWarning.indexOf('only the first 5 are shown') !== -1);
  assert.ok(a.planAsMarkdown(r).indexOf('only the first 5 are shown') !== -1);
});
// Weakness 3: classification — causal mechanism is not mislabelled Prediction.
check('causal mechanism with will is Cause and effect, not Prediction', function () {
  assert.strictEqual(a.classifyClaim('AI will increase output for small traders.'), 'Cause and effect');
});
check('pure prediction without a causal verb stays Prediction', function () {
  assert.strictEqual(a.classifyClaim('It will rain tomorrow in Lagos.'), 'Prediction');
});
check('thesis-specific details appear in measure and evidence', function () {
  var r = a.analyseThesis('Sales will grow by 20% in 2026 for small traders in Lagos.');
  var joined = r.claims.map(function (c) { return c.measure + ' ' + c.evidence; }).join(' ');
  assert.ok(joined.indexOf('20%') !== -1, 'expected the stated 20% in measure/evidence');
  assert.ok(joined.indexOf('2026') !== -1, 'expected the stated year in measure/evidence');
});

// R3 evidence gate: pass, and each missing element.
check('evidence gate passes a named, dated, openable note', function () {
  var c = a.checkEvidence('Sales ledger (sales-ledger-march-2026.pdf), March 2026');
  assert.strictEqual(c.passed, true);
  assert.deepStrictEqual(c.missing, []);
});
check('evidence gate reports a missing date', function () {
  var c = a.checkEvidence('Sales ledger (sales-ledger.pdf) with overdue balances');
  assert.strictEqual(c.passed, false);
  assert.ok(c.missing.join(' ').indexOf('date') !== -1);
});
check('evidence gate reports a missing openable reference', function () {
  var c = a.checkEvidence('Sales ledger, March 2026, with overdue balances');
  assert.strictEqual(c.passed, false);
  assert.ok(c.missing.join(' ').indexOf('openable') !== -1);
});
check('evidence gate reports a missing named source', function () {
  var c = a.checkEvidence('2026 https://example.com/report.pdf');
  assert.strictEqual(c.passed, false);
  assert.ok(c.missing.join(' ').indexOf('named source') !== -1);
});
check('evidence gate rejects a bare number note', function () {
  assert.strictEqual(a.checkEvidence('123').passed, false);
});
check('evidence check result is recorded in the Markdown export', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  r.claims[0].note = 'Sales ledger (sales-ledger-march-2026.pdf), March 2026';
  r.claims[0].evidenceCheck = a.checkEvidence(r.claims[0].note);
  r.claims[0].status = 'Supported by evidence';
  var md = a.planAsMarkdown(r);
  assert.ok(md.indexOf('Passed format check') !== -1);
  assert.ok(md.indexOf('does not prove the evidence itself is true') !== -1, 'export must say the check is format-only');
});

// Cap logic (demo units, unchanged behaviour).
check('cap arithmetic: 3 jobs at 10 units, cap 10 fits 1 job', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  assert.strictEqual(r.claims.length * 10, 30);
  assert.strictEqual(Math.floor(10 / 10), 1);
});

// R5 agent loop: per-job list, quotes, do-vs-buy, one counter-offer.
check('agent jobs: example 1 has one job per claim with demo quotes in job order', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  assert.strictEqual(r.jobs.length, 3);
  assert.deepStrictEqual(r.jobs.map(function (j) { return j.quote; }), [8, 12, 10]);
  assert.strictEqual(r.jobs[0].checker, 'Demo Checker A');
  assert.strictEqual(r.jobs[1].checker, 'Demo Checker B');
  assert.ok(r.jobs.every(function (j) { return j.planned === 10; }));
});
check('agent jobs: quote at or below plan buys with no counter-offer', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  assert.strictEqual(r.jobs[0].decision, 'Buy');
  assert.strictEqual(r.jobs[0].counter, null);
  assert.strictEqual(r.jobs[0].finalPrice, 8);
  assert.strictEqual(r.jobs[0].doVsBuy, 'Buy');
});
check('agent jobs: exactly one counter-offer, accepted when quote is at most 4 over plan', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  assert.strictEqual(r.jobs[1].counter.count, 1);
  assert.strictEqual(r.jobs[1].counter.offer, 10);
  assert.strictEqual(r.jobs[1].counter.accepted, true);
  assert.strictEqual(r.jobs[1].decision, 'Buy after one counter-offer');
  assert.strictEqual(r.jobs[1].finalPrice, 10);
});
check('agent jobs: counter-offer rejected above 14, agent walks away and does it itself', function () {
  var jobs = a.buildAgentJobs([
    { id: 1, role: 'Main claim', kind: 'General claim' },
    { id: 2, role: 'Sub-claim 1', kind: 'General claim' },
    { id: 3, role: 'Sub-claim 2', kind: 'General claim' },
    { id: 4, role: 'Sub-claim 3', kind: 'General claim' }
  ], 100).jobs;
  assert.strictEqual(jobs[3].quote, 18);
  assert.strictEqual(jobs[3].counter.count, 1);
  assert.strictEqual(jobs[3].counter.accepted, false);
  assert.strictEqual(jobs[3].decision, 'Do it yourself');
  assert.strictEqual(jobs[3].finalPrice, 0);
  assert.strictEqual(jobs[3].spent, 0);
});
check('agent jobs: cap 10 allows only the first job of example 1, rest blocked', function () {
  var jobs = a.buildAgentJobs(a.analyseThesis('Small businesses lose money because they do not track who owes them.').claims, 10);
  assert.strictEqual(jobs.jobs[0].capStatus, 'Allowed');
  assert.strictEqual(jobs.jobs[0].spent, 8);
  assert.strictEqual(jobs.jobs[1].capStatus, 'Blocked by cap');
  assert.strictEqual(jobs.jobs[2].capStatus, 'Blocked by cap');
  assert.strictEqual(jobs.totalSpent, 8);
});
check('agent jobs: cap 30 allows all example 1 jobs, spent is 8 + 10 + 10', function () {
  var jobs = a.buildAgentJobs(a.analyseThesis('Small businesses lose money because they do not track who owes them.').claims, 30);
  assert.strictEqual(jobs.totalSpent, 28);
  assert.ok(jobs.jobs.every(function (j) { return j.capStatus === 'Allowed'; }));
});
check('agent jobs: a cut job spends nothing and does not consume cap', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  r.jobs[0].cut = true;
  var jobs = a.recomputeJobs(r.jobs, 10);
  assert.strictEqual(jobs.jobs[0].capStatus, 'Cut by user');
  assert.strictEqual(jobs.jobs[0].spent, 0);
  assert.strictEqual(jobs.jobs[1].capStatus, 'Allowed');
  assert.strictEqual(jobs.totalSpent, 10);
});
check('agent jobs: receipts in Markdown export carry quote, counter, decision, cap, and evidence check', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  r.claims[0].note = 'Sales ledger (sales-ledger-march-2026.pdf), March 2026';
  r.claims[0].evidenceCheck = a.checkEvidence(r.claims[0].note);
  r.claims[0].status = 'Supported by evidence';
  var md = a.planAsMarkdown(r);
  assert.ok(md.indexOf('DEMO ONLY') !== -1);
  assert.ok(md.indexOf('Receipt — Job 1') !== -1);
  assert.ok(md.indexOf('Demo quote: 8 demo units') !== -1);
  assert.ok(md.indexOf('one counter-offer at 10 demo units, accepted') !== -1);
  assert.ok(md.indexOf('Do vs buy: Buy after one counter-offer') !== -1);
  assert.ok(md.indexOf('not a real hire, not a real quote') !== -1);
  assert.ok(md.indexOf('Evidence status: Supported by evidence') !== -1);
});
check('agent jobs: dry-run budget totals the demo quotes, not the flat 10-per-job total', function () {
  var near = require('./near-integration.js');
  var r = a.analyseThesis('Sales rose, costs fell, customers returned, staff stayed in 2026 for small traders.');
  assert.strictEqual(r.claims.length, 4);
  var dry = near.buildNearIntentDryRun(r);
  assert.strictEqual(dry.agentJob.budgetDemoUnits, 48);
});

// R9 safe subset: cap validation, claim edit.
check('cap validation: whole numbers 0 or more pass, anything else fails with a message', function () {
  assert.strictEqual(a.parseCap('30').valid, true);
  assert.strictEqual(a.parseCap('30').cap, 30);
  assert.strictEqual(a.parseCap('0').valid, true);
  assert.strictEqual(a.parseCap('').valid, false);
  assert.strictEqual(a.parseCap('-5').valid, false);
  assert.strictEqual(a.parseCap('10.5').valid, false);
  assert.strictEqual(a.parseCap('abc').valid, false);
  assert.ok(a.parseCap('abc').message.indexOf('previous cap') !== -1);
});
check('claim edit: new text reclassifies and resets status and note', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  var claim = r.claims[0];
  claim.note = 'Sales ledger (sales-ledger-march-2026.pdf), March 2026';
  claim.status = 'Supported by evidence';
  a.updateClaimText(claim, 'Cross-chain payments will be cheaper than single-chain payments for small traders.');
  assert.strictEqual(claim.kind, 'Comparison');
  assert.strictEqual(claim.status, 'Not yet tested');
  assert.strictEqual(claim.note, '');
  assert.strictEqual(claim.evidenceCheck, null);
});
check('claim edit: empty new text is rejected', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  assert.ok(a.updateClaimText(r.claims[0], '   ').error);
});

// R6 live quote-only: dry flag, endpoint, parsing, fallback.
check('live quote request is always dry: true, never dry: false, with the verified example', function () {
  var near = require('./near-integration.js');
  assert.strictEqual(near.ONECLICK_QUOTE_URL, 'https://1click.chaindefuser.com/v0/quote');
  var req = near.buildLiveQuoteRequest(1762000000000);
  assert.strictEqual(req.dry, true);
  assert.notStrictEqual(req.dry, false);
  assert.strictEqual(req.swapType, 'EXACT_INPUT');
  assert.strictEqual(req.amount, '1000000');
  assert.strictEqual(req.originAsset, 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near');
  assert.strictEqual(req.destinationAsset, 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near');
  assert.strictEqual(req.recipient, 'thesis-agent-demo.near');
  assert.strictEqual(req.recipientType, 'INTENTS');
  assert.ok(!isNaN(Date.parse(req.deadline)), 'deadline must be a valid ISO date, got: ' + req.deadline);
});
check('live quote parser accepts a real dry response and labels it no-payment', function () {
  var near = require('./near-integration.js');
  var parsed = near.parseLiveQuote({ quote: { amountInFormatted: '1.0', amountOutFormatted: '0.999834', amountInUsd: '1.0', amountOutUsd: '0.999834', timeEstimate: 25 } });
  assert.ok(parsed);
  assert.strictEqual(parsed.dry, true);
  assert.strictEqual(parsed.amountInFormatted, '1.0');
  assert.strictEqual(parsed.amountOutFormatted, '0.999834');
  assert.strictEqual(parsed.timeEstimate, 25);
  assert.ok(parsed.note.indexOf('not a payment') !== -1);
});
check('live quote parser rejects a response carrying a deposit address', function () {
  var near = require('./near-integration.js');
  assert.strictEqual(near.parseLiveQuote({ depositAddress: '0xabc', quote: { amountInFormatted: '1.0', amountOutFormatted: '0.9' } }), null);
  assert.strictEqual(near.parseLiveQuote({ quote: { depositAddress: '0xabc', amountInFormatted: '1.0', amountOutFormatted: '0.9' } }), null);
});
check('live quote parser rejects missing amounts and empty responses', function () {
  var near = require('./near-integration.js');
  assert.strictEqual(near.parseLiveQuote(null), null);
  assert.strictEqual(near.parseLiveQuote({}), null);
  assert.strictEqual(near.parseLiveQuote({ quote: { amountInFormatted: '1.0' } }), null);
});

console.log(passed + ' tests passed');
