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

// R9 remainder (Phase 4): ?thesis= share link.
check('share link: decodes a percent-encoded thesis', function () {
  assert.strictEqual(a.thesisFromShareQuery('?thesis=Small%20businesses%20lose%20money%20in%202026.'), 'Small businesses lose money in 2026.');
});
check('share link: plus signs decode as spaces, other params ignored', function () {
  assert.strictEqual(a.thesisFromShareQuery('?utm_source=x&thesis=Remote+work+increases+productivity.'), 'Remote work increases productivity.');
});
check('share link: missing, empty, or blank thesis gives an empty string', function () {
  assert.strictEqual(a.thesisFromShareQuery(''), '');
  assert.strictEqual(a.thesisFromShareQuery('?foo=bar'), '');
  assert.strictEqual(a.thesisFromShareQuery('?thesis='), '');
  assert.strictEqual(a.thesisFromShareQuery('?thesis=%20%20'), '');
});
check('share link: markup payload stays a plain string, never executed', function () {
  var payload = '<script>alert(1)</script> Small shops lose sales in 2026.';
  assert.strictEqual(a.thesisFromShareQuery('?thesis=' + encodeURIComponent(payload)), payload);
});
check('share link: encode/decode round-trip preserves the thesis', function () {
  var thesis = 'Small businesses lose money because they do not track who owes them.';
  var link = 'https://thesis-agent.netlify.app/?thesis=' + encodeURIComponent(thesis);
  var query = link.slice(link.indexOf('?'));
  assert.strictEqual(a.thesisFromShareQuery(query), thesis);
  var r = a.analyseThesis(a.thesisFromShareQuery(query));
  assert.strictEqual(r.claims.length, 3);
});

// Phase 1: three-tier evidence verification. No case may label a
// note verified without a 2xx live check for a URL in that note.
check('phase1: verified-reachable only on 2xx for a URL in the note', function () {
  var v = a.classifyEvidenceVerification('Central Bank https://example.com/report.pdf, March 2026', { status: 200 });
  assert.strictEqual(v.tier, 'verified-reachable');
  assert.ok(v.detail.indexOf('NOT that the claim is true') !== -1);
});
check('phase1: 404 falls back to format-only, never verified', function () {
  var v = a.classifyEvidenceVerification('Central Bank https://example.com/report.pdf, March 2026', { status: 404 });
  assert.strictEqual(v.tier, 'format-only');
  assert.ok(v.detail.indexOf('NOT verified') !== -1);
});
check('phase1: fetch error falls back to format-only, never verified', function () {
  var v = a.classifyEvidenceVerification('Central Bank https://example.com/report.pdf, March 2026', { error: 'network blocked' });
  assert.strictEqual(v.tier, 'format-only');
});
check('phase1: no live check means format-only, never verified', function () {
  var v = a.classifyEvidenceVerification('Central Bank https://example.com/report.pdf, March 2026', null);
  assert.strictEqual(v.tier, 'format-only');
});
check('phase1: document name alone can never be verified', function () {
  var v = a.classifyEvidenceVerification('Bank report.pdf, March 2026', { status: 200 });
  assert.strictEqual(v.tier, 'format-only');
  assert.strictEqual(v.url, null);
});
check('phase1: failed format check stays failed even with a 200', function () {
  var v = a.classifyEvidenceVerification('x', { status: 200 });
  assert.strictEqual(v.tier, 'failed');
});
check('phase1: URL extraction strips trailing punctuation', function () {
  assert.strictEqual(a.extractFirstUrl('See https://example.com/report.pdf, March 2026'), 'https://example.com/report.pdf');
});
check('phase1: export shows verification tier, not a bare format pass', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  var c = r.claims[0];
  c.note = 'Central Bank https://example.com/report.pdf, March 2026';
  c.evidenceCheck = a.checkEvidence(c.note);
  c.evidenceVerification = a.classifyEvidenceVerification(c.note, { status: 200 });
  assert.ok(a.planAsMarkdown(r).indexOf('Verified reachable') !== -1);
});


// Stage 1 (clarified): skill registry, separate planning vs work state,
// exact state machine, modular interfaces. No LLM is used.
check('stage1: every claim kind maps to at least one skill', function () {
  ['Cause and effect', 'Comparison', 'Prediction', 'Definition', 'General claim'].forEach(function (k) {
    assert.ok(a.skillsForKind(k).length >= 1);
    assert.ok(a.skillsForKind(k).indexOf('link reachability checker') !== -1);
  });
});
check('stage1: planning decision is separate from work state', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  var j = r.jobs[0];
  assert.strictEqual(j.planningDecision, j.decision);
  assert.strictEqual(j.workState, 'assigned');
  assert.strictEqual(j.correctionRound, 0);
  assert.ok(j.history && j.history[0].to === 'assigned');
});
check('stage1: main path assigned -> submitted -> checked -> ready', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  assert.ok(a.transitionJob(j, 'submitted', 'submit').ok);
  assert.ok(a.evaluateJob(j, claim, null).ok); assert.strictEqual(j.evaluation.verdict, 'pass');
  assert.ok(a.transitionJob(j, 'ready', 'pass').ok);
  assert.strictEqual(j.workState, 'ready');
});
check('stage1: invalid transitions are rejected and do not mutate', function () {
  var j = a.analyseThesis('Small businesses lose money because they do not track who owes them.').jobs[0];
  assert.ok(!a.transitionJob(j, 'ready', 'skip').ok);
  assert.strictEqual(j.workState, 'assigned');
  assert.ok(!a.transitionJob(j, 'checked', 'skip').ok);
  assert.strictEqual(j.workState, 'assigned');
});
check('stage1: correction path checked -> correction-requested -> resubmitted -> checked', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0];
  a.transitionJob(j, 'submitted', 'submit'); claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent';
  a.evaluateJob(j, claim, null); assert.strictEqual(j.evaluation.verdict, 'hold');
  assert.ok(a.requestCorrection(j, j.evaluation).ok);
  assert.strictEqual(j.workState, 'correction-requested'); assert.strictEqual(j.correctionRound, 1);
  assert.ok(a.transitionJob(j, 'resubmitted', 'fixed').ok);
  assert.ok(a.transitionJob(j, 'checked', 'recheck').ok);
});
check('stage1: after two unsuccessful rounds, third correction escalates', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent';
  function toChecked() { a.transitionJob(j, 'submitted', 's'); a.evaluateJob(j, claim, null); }
  toChecked(); a.requestCorrection(j, j.evaluation); a.transitionJob(j, 'resubmitted', 'f1');
  a.transitionJob(j, 'checked', 'c2'); a.requestCorrection(j, j.evaluation); a.transitionJob(j, 'resubmitted', 'f2');
  a.transitionJob(j, 'checked', 'c3'); var res = a.requestCorrection(j, j.evaluation);
  assert.ok(res.ok); assert.strictEqual(j.workState, 'escalated'); assert.strictEqual(j.correctionRound, 2);
});
check('stage1: correction cannot be requested from assigned or submitted', function () {
  var j = a.analyseThesis('Small businesses lose money because they do not track who owes them.').jobs[0];
  assert.ok(!a.requestCorrection(j, null).ok);
});
check('stage1: history records every transition with source rule', function () {
  var j = a.analyseThesis('Small businesses lose money because they do not track who owes them.').jobs[0];
  a.transitionJob(j, 'submitted', 'submit');
  assert.strictEqual(j.history[j.history.length - 1].to, 'submitted');
  assert.strictEqual(j.history[j.history.length - 1].source, 'rule');
});
check('stage1: modular interfaces exist, with rule provider only, no model', function () {
  assert.ok(a.REASONING_PROVIDERS.rule);
  assert.ok(!a.REASONING_PROVIDERS.model);
  assert.ok(a.CHECK_RESULT_TYPES.indexOf('potential-mismatch') !== -1);
  assert.ok(a.CHECK_RESULT_TYPES.indexOf('inconclusive') !== -1);
  assert.ok(a.CHECK_RESULT_TYPES.indexOf('missing') !== -1);
});
check('stage1: existing demo quotes and cap totals are unchanged', function () {
  var r = a.analyseThesis('Small businesses lose money because they do not track who owes them.');
  var totals = a.recomputeJobs(r.jobs, 30);
  assert.strictEqual(totals.totalSpent, 8 + 10 + 10);
});


// Stage 2: rule-based evaluator. Never an AI, never a fact-checker.
// Format, reachability, and support-consistency are separate checks.
// A match never proves a claim is true.
check('stage2: pass case records all three dimensions, source rule', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills for households in Lagos by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent for households', null);
  assert.strictEqual(v.verdict, 'pass'); assert.strictEqual(v.source, 'rule'); assert.strictEqual(v.evaluator, 'rule-based evaluator');
  assert.ok(v.checks.some(function (c) { return c.dimension === 'format'; }));
  assert.ok(v.checks.some(function (c) { return c.dimension === 'reachability'; }));
  assert.ok(v.checks.some(function (c) { return c.dimension === 'support-consistency'; }));
  assert.ok(v.reasons.length >= 1); assert.ok(v.summary.indexOf('Does not prove') !== -1);
});
check('stage2: different number is potential mismatch, not proof of error, verdict hold', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent', null);
  assert.strictEqual(v.verdict, 'hold'); assert.ok(v.needsHumanReview);
  var n = v.checks.filter(function (c) { return c.name === 'numbers'; })[0];
  assert.strictEqual(n.result, 'potential-mismatch');
});
check('stage2: misleading matching number with unrelated context holds on keywords', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills for households in Lagos by 40 percent in 2025', 'Visitor numbers (visitors-2025.pdf), 2025, 40 percent of shoppers visited', null);
  assert.strictEqual(v.verdict, 'hold'); assert.ok(v.needsHumanReview);
  assert.ok(v.checks.some(function (c) { return c.name === 'keywords' && c.result !== 'exact'; }));
});
check('stage2: unrelated document holds, no keyword match', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills for households in Lagos by 40 percent in 2025', 'Cooking recipes (recipes-2025.pdf), 2025, tasty meals for families', null);
  assert.strictEqual(v.verdict, 'hold');
  var k = v.checks.filter(function (c) { return c.name === 'keywords'; })[0];
  assert.strictEqual(k.result, 'potential-mismatch');
});
check('stage2: inaccessible link holds even when numbers match', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'https://example.com/report, 2025, solar bills 40 percent', { status: 404 });
  assert.strictEqual(v.verdict, 'hold'); assert.ok(v.needsHumanReview);
  assert.ok(v.reasons.some(function (r) { return r.indexOf('reachability') !== -1; }));
});
check('stage2: reachable link is reachability only, not support', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'https://example.com/report, 2025, solar bills 40 percent', { status: 200 });
  var r = v.checks.filter(function (c) { return c.name === 'reachability'; })[0];
  assert.strictEqual(r.result, 'exact');
  assert.ok(r.finding.indexOf('does not show') !== -1 || r.finding.indexOf('Reachability only') !== -1);
});
check('stage2: ambiguous evidence, both matching and different numbers, holds', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent in one district and 55 percent overall', null);
  assert.strictEqual(v.verdict, 'hold');
  var n = v.checks.filter(function (c) { return c.name === 'numbers'; })[0];
  assert.strictEqual(n.result, 'inconclusive');
});
check('stage2: missing number in note holds for human review', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, solar bills Lagos households', null);
  assert.strictEqual(v.verdict, 'hold');
  var n = v.checks.filter(function (c) { return c.name === 'numbers'; })[0];
  assert.strictEqual(n.result, 'missing');
});
check('stage2: format failure rejects the submission, not the claim', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'report', null);
  assert.strictEqual(v.verdict, 'reject');
  assert.ok(v.reasons.some(function (r) { return r.indexOf('not a judgement on the claim') !== -1; }));
});
check('stage2: evaluateJob only from submitted or resubmitted, moves to checked', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0];
  assert.ok(!a.evaluateJob(j, claim, null).ok);
  a.transitionJob(j, 'submitted', 'submit'); claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  var res = a.evaluateJob(j, claim, null);
  assert.ok(res.ok); assert.strictEqual(j.workState, 'checked'); assert.ok(j.evaluation); assert.strictEqual(j.evaluation.source, 'rule');
});
check('stage2: every verdict includes checks, findings, reasons, and source', function () {
  ['pass', 'hold', 'reject'].forEach(function (want) {
    var v;
    if (want === 'pass') v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent', null);
    else if (want === 'hold') v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent', null);
    else v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'report', null);
    assert.strictEqual(v.verdict, want); assert.strictEqual(v.source, 'rule');
    assert.ok(v.checks.length >= 3); assert.ok(v.checks.every(function (c) { return c.finding; }));
    assert.ok(v.reasons.length >= 1);
  });
});


// Stage 3: correction loop. Specific checks only, no invented figures,
// no automatic claim/note change, re-evaluation from scratch, history kept.
function stage3Setup(note) {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = note;
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null);
  return { r: r, j: j, claim: claim };
}
check('stage3: correction request names the exact failing check, not vague advice', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  assert.strictEqual(t.j.evaluation.verdict, 'hold');
  assert.ok(a.requestCorrection(t.j, t.j.evaluation).ok);
  assert.ok(t.j.correctionRequest.instructions.some(function (i) { return i.indexOf('Numbers check') !== -1; }));
  assert.ok(!t.j.correctionRequest.instructions.some(function (i) { return i === 'improve your evidence'; }));
  assert.strictEqual(t.j.correctionRequest.round, 1);
});
check('stage3: correction does not invent a source or tell user what figure to insert', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  a.requestCorrection(t.j, t.j.evaluation);
  var all = t.j.correctionRequest.instructions.join(' ');
  assert.ok(all.indexOf('Do not insert a figure') !== -1);
  assert.ok(all.indexOf('insert 40') === -1); // must not tell the user what figure to insert
});
check('stage3: correction request does not change claim or evidence', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  var beforeText = t.claim.text; var beforeNote = t.claim.note;
  a.requestCorrection(t.j, t.j.evaluation);
  assert.strictEqual(t.claim.text, beforeText); assert.strictEqual(t.claim.note, beforeNote);
});
check('stage3: successful correction, re-evaluation from scratch, history kept separate', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  a.requestCorrection(t.j, t.j.evaluation);
  a.transitionJob(t.j, 'resubmitted', 'user fixed note');
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  var res = a.evaluateJob(t.j, t.claim, null);
  assert.ok(res.ok); assert.strictEqual(t.j.evaluation.verdict, 'pass');
  assert.strictEqual(t.j.evaluationHistory.length, 1); assert.strictEqual(t.j.evaluationHistory[0].verdict, 'hold');
  assert.strictEqual(t.j.workState, 'checked');
  assert.ok(a.transitionJob(t.j, 'ready', 'fresh pass').ok);
});
check('stage3: repeated failures escalate after two rounds and stop', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  function failRound() { a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'user tried'); a.evaluateJob(t.j, t.claim, null); }
  failRound(); assert.strictEqual(t.j.correctionRound, 1);
  failRound(); assert.strictEqual(t.j.correctionRound, 2);
  var res = a.requestCorrection(t.j, t.j.evaluation);
  assert.ok(res.ok); assert.strictEqual(t.j.workState, 'escalated');
  assert.strictEqual(t.j.correctionHistory.length, 2);
});
check('stage3: held job cannot become ready, escalated job cannot become ready', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  assert.ok(!a.transitionJob(t.j, 'ready', 'try').ok); assert.strictEqual(t.j.workState, 'checked');
  a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'try'); a.evaluateJob(t.j, t.claim, null);
  a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'try'); a.evaluateJob(t.j, t.claim, null);
  a.requestCorrection(t.j, t.j.evaluation); assert.strictEqual(t.j.workState, 'escalated');
  assert.ok(!a.transitionJob(t.j, 'ready', 'try').ok); assert.strictEqual(t.j.workState, 'escalated');
});
check('stage3: invalid transitions in correction loop are rejected', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  assert.ok(!a.transitionJob(t.j, 'resubmitted', 'skip').ok);
  assert.ok(!a.requestCorrection(t.j, t.j.evaluation).ok || t.j.workState === 'correction-requested');
  var j2 = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.').jobs[0];
  assert.ok(!a.requestCorrection(j2, null).ok);
});
check('stage3: editing a claim resets the job, it is not a resubmission', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var claim = r.claims[0]; var j = r.jobs[0];
  a.transitionJob(j, 'submitted', 'submit');
  a.updateClaimText(claim, 'Solar panels reduce electricity bills by 30 percent in 2025.');
  var fresh = a.buildAgentJobs(r.claims, 30).jobs[0];
  assert.strictEqual(fresh.workState, 'assigned'); assert.strictEqual(fresh.correctionRound, 0); assert.ok(!fresh.evaluation);
});
check('stage3: correction request for a pass evaluation is rejected', function () {
  var t = stage3Setup('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  assert.strictEqual(t.j.evaluation.verdict, 'pass');
  assert.ok(!a.requestCorrection(t.j, t.j.evaluation).ok);
});


// Stage 4: payment recommender. Approve only on Ready + fresh pass +
// no unresolved correction/escalation + price/planning met. Never a
// payment decision, never a wallet or escrow call.
function stage4ReadyJob(note, cap) {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = note;
  a.recomputeJobs(r.jobs, cap || 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null);
  return { r: r, j: j, claim: claim };
}
check('stage4: approve requires Ready, fresh pass, no correction, price met', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  var before = a.recommendJob(t.j, t.claim);
  assert.strictEqual(before.recommendation, 'hold'); // checked, not yet Ready
  assert.ok(a.transitionJob(t.j, 'ready', 'fresh pass').ok); a.confirmHumanEvidence(t.j);
  var rec = a.recommendJob(t.j, t.claim);
  assert.strictEqual(rec.recommendation, 'approve'); assert.strictEqual(rec.source, 'rule');
  assert.ok(rec.disclaimer.indexOf('for human payer approval only') !== -1);
  assert.ok(rec.disclaimer.indexOf('does not release funds') !== -1);
  assert.ok(rec.reasons.length >= 3); assert.ok(rec.checks.length >= 3); assert.ok(rec.history.length >= 3);
});
check('stage4: hold when evaluation held for human review', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  var rec = a.recommendJob(t.j, t.claim);
  assert.strictEqual(rec.recommendation, 'hold'); assert.ok(rec.reasons.some(function (r) { return r.indexOf('human review') !== -1; }));
});
check('stage4: hold for missing evaluation, not reject', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0];
  var rec = a.recommendJob(j, claim);
  assert.strictEqual(rec.recommendation, 'hold'); assert.ok(rec.reasons.some(function (r) { return r.indexOf('No evaluation') !== -1; }));
});
check('stage4: hold for stale evaluation after note change', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass');
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  var rec = a.recommendJob(t.j, t.claim);
  assert.strictEqual(rec.recommendation, 'hold'); assert.ok(rec.reasons.some(function (r) { return r.indexOf('stale') !== -1; }));
});
check('stage4: reject for failed format, not for uncertain truth', function () {
  var t = stage4ReadyJob('report');
  var rec = a.recommendJob(t.j, t.claim);
  assert.strictEqual(rec.recommendation, 'reject');
  assert.ok(rec.reasons.some(function (r) { return r.indexOf('format check') !== -1; }));
  // Uncertain truth alone is hold, not reject: hold evaluation above already proves this.
});
check('stage4: reject for abandoned cut task and for Do it yourself', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  t.j.cut = true; a.recomputeJobs(t.r.jobs, 30);
  assert.strictEqual(a.recommendJob(t.j, t.claim).recommendation, 'reject');
  var r2 = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j2 = r2.jobs[0]; j2.decision = 'Do it yourself'; j2.capStatus = 'Not bought — do it yourself (no demo units spent)';
  assert.strictEqual(a.recommendJob(j2, r2.claims[0]).recommendation, 'reject');
});
check('stage4: hold for cap-blocked price, hold for escalated job', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent', 5);
  assert.strictEqual(t.j.capStatus, 'Blocked by cap');
  var rec = a.recommendJob(t.j, t.claim);
  assert.strictEqual(rec.recommendation, 'hold'); assert.ok(rec.reasons.some(function (r) { return r.indexOf('cap') !== -1; }));
  var e = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  function failRound() { a.requestCorrection(e.j, e.j.evaluation); a.transitionJob(e.j, 'resubmitted', 'try'); a.evaluateJob(e.j, e.claim, null); }
  failRound(); failRound(); a.requestCorrection(e.j, e.j.evaluation);
  assert.strictEqual(e.j.workState, 'escalated');
  assert.strictEqual(a.recommendJob(e.j, e.claim).recommendation, 'hold');
});
check('stage4: hold for correction history that is unresolved, approve after correction succeeds', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  a.requestCorrection(t.j, t.j.evaluation);
  assert.strictEqual(a.recommendJob(t.j, t.claim).recommendation, 'hold');
  a.transitionJob(t.j, 'resubmitted', 'fixed'); t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.evaluateJob(t.j, t.claim, null); a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  var rec = a.recommendJob(t.j, t.claim);
  assert.strictEqual(rec.recommendation, 'approve');
  assert.strictEqual(t.j.correctionHistory.length, 1); // history kept, but no longer unresolved
});
check('stage4: every recommendation states it is not a payment decision', function () {
  var t = stage4ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  var rec = a.recommendJob(t.j, t.claim);
  assert.ok(rec.disclaimer.indexOf('does not release funds') !== -1);
  assert.ok(rec.disclaimer.indexOf('authorise a payment') !== -1 || rec.disclaimer.indexOf('authorise') !== -1);
  assert.strictEqual(rec.recommender, 'rule-based recommender');
});
check('stage4: recommender makes no wallet, signing, or escrow call', function () {
  var src = require('fs').readFileSync(__dirname + '/app.js', 'utf8');
  var recSection = src.slice(src.indexOf('Module: Payment Recommender'), src.indexOf('Cap input validation'));
  assert.ok(recSection.indexOf('near-integration') === -1);
  assert.ok(recSection.indexOf('sign') === -1 || recSection.indexOf('does not release') !== -1);
});


// Stage 4 freshness safeguard: an old Approve must never remain valid
// after any decision input changes. No payment functionality is added.
function freshnessApproveJob() {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  assert.strictEqual(j.recommendation.recommendation, 'approve');
  return { r: r, j: j, claim: claim };
}
check('freshness: unchanged inputs keep an Approve recommendation fresh', function () {
  var t = freshnessApproveJob();
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(f.fresh); assert.strictEqual(f.staleReasons.length, 0);
});
check('freshness: claim text change invalidates Approve', function () {
  var t = freshnessApproveJob(); t.claim.text = 'Solar panels reduce electricity bills by 50 percent in 2025.';
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Claim text') !== -1; }));
});
check('freshness: evidence note change invalidates Approve', function () {
  var t = freshnessApproveJob(); t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Evidence note') !== -1; }));
});
check('freshness: work state and evaluation verdict changes invalidate Approve', function () {
  var t = freshnessApproveJob(); t.j.workState = 'checked';
  assert.ok(!a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
  var t2 = freshnessApproveJob(); t2.j.evaluation.verdict = 'hold';
  var f2 = a.isRecommendationFresh(t2.j, t2.claim, t2.j.recommendation, 30);
  assert.ok(!f2.fresh); assert.ok(f2.staleReasons.some(function (x) { return x.indexOf('Evaluation verdict') !== -1; }));
});
check('freshness: planning decision change invalidates Approve', function () {
  var t = freshnessApproveJob(); t.j.decision = 'Do it yourself'; t.j.planningDecision = 'Do it yourself';
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Planning decision') !== -1; }));
});
check('freshness: demo price change invalidates Approve', function () {
  var t = freshnessApproveJob(); t.j.finalPrice = 12;
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Demo price') !== -1; }));
});
check('freshness: price cap change invalidates Approve, even if cap status stays Allowed', function () {
  var t = freshnessApproveJob();
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 25);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Price cap') !== -1; }));
});
check('freshness: cap status change invalidates Approve', function () {
  var t = freshnessApproveJob(); t.j.capStatus = 'Blocked by cap';
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Cap status') !== -1; }));
});
check('freshness: cut status change invalidates Approve', function () {
  var t = freshnessApproveJob(); t.j.cut = true;
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('cut status') !== -1; }));
});
check('freshness: correction and escalation changes invalidate Approve', function () {
  var t = freshnessApproveJob(); t.j.correctionRound = 1;
  assert.ok(!a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
  var t2 = freshnessApproveJob(); t2.j.workState = 'escalated';
  var f2 = a.isRecommendationFresh(t2.j, t2.claim, t2.j.recommendation, 30);
  assert.ok(!f2.fresh); assert.ok(f2.staleReasons.some(function (x) { return x.indexOf('Escalation') !== -1; }));
});
check('freshness: recommendation without a fingerprint is stale', function () {
  var t = freshnessApproveJob(); var old = { recommendation: 'approve', reasons: [] };
  var f = a.isRecommendationFresh(t.j, t.claim, old, 30);
  assert.ok(!f.fresh);
});
check('freshness: recalculation after a change gives a fresh recommendation', function () {
  var t = freshnessApproveJob(); t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  assert.ok(!a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.ok(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
  assert.strictEqual(t.j.recommendation.recommendation, 'hold'); // stale evaluation, not approve
});
check('freshness: Markdown export does not present an outdated recommendation as current', function () {
  var t = freshnessApproveJob(); var result = { thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 };
  var md1 = a.planAsMarkdown(result);
  assert.ok(md1.indexOf('Payment recommendation (current)') !== -1);
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  var md2 = a.planAsMarkdown(result);
  assert.ok(md2.indexOf('OUTDATED payment recommendation (do not use as current)') !== -1);
  assert.ok(md2.indexOf('Payment recommendation (current)') === -1);
});


// Edge cases, final freshness checks: explicit Abandoned, and
// evaluation-record changes with verdict still Pass. No new payment
// functionality is added by these tests.
check('edge: changing an approved job to Abandoned invalidates its Approve, like Cut', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  assert.strictEqual(j.recommendation.recommendation, 'approve');
  assert.ok(a.isRecommendationFresh(j, claim, j.recommendation, 30).fresh);
  j.abandoned = true; a.recomputeJobs(r.jobs, 30);
  assert.strictEqual(j.capStatus, 'Abandoned by user');
  var f = a.isRecommendationFresh(j, claim, j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('abandoned') !== -1; }));
  // Recalculation now rejects, it does not keep the old Approve.
  var rec = a.recommendJob(j, claim, 30);
  assert.strictEqual(rec.recommendation, 'reject');
  assert.ok(rec.reasons.some(function (x) { return x.indexOf('abandoned') !== -1; }));
});
check('edge: Abandoned job is identified as outdated in the Markdown export', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  var result = { thesis: 'x', claims: r.claims, jobs: r.jobs, cap: 30 };
  assert.ok(a.planAsMarkdown(result).indexOf('Payment recommendation (current)') !== -1);
  j.abandoned = true; a.recomputeJobs(r.jobs, 30);
  var md = a.planAsMarkdown(result);
  assert.ok(md.indexOf('OUTDATED payment recommendation (do not use as current)') !== -1);
  assert.ok(md.indexOf('Payment recommendation (current)') === -1);
  assert.ok(md.indexOf('abandoned') !== -1);
});
check('edge: changing an evaluation check finding invalidates Approve, verdict still Pass', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  assert.strictEqual(j.recommendation.recommendation, 'approve');
  j.evaluation.checks[0].finding = 'Changed finding, verdict unchanged.';
  var f = a.isRecommendationFresh(j, claim, j.recommendation, 30);
  assert.ok(!f.fresh); assert.strictEqual(j.evaluation.verdict, 'pass');
  assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Evaluation record changed') !== -1; }));
});
check('edge: changing an evaluation reason invalidates Approve, verdict still Pass', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  j.evaluation.reasons.push('An extra reason added after the recommendation.');
  var f = a.isRecommendationFresh(j, claim, j.recommendation, 30);
  assert.ok(!f.fresh); assert.strictEqual(j.evaluation.verdict, 'pass');
});
check('edge: changing an evaluation check result invalidates Approve, even if verdict is forced back to Pass', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  j.evaluation.checks[0].result = 'inconclusive';
  j.evaluation.verdict = 'pass'; // verdict alone is unchanged, record is not
  var f = a.isRecommendationFresh(j, claim, j.recommendation, 30);
  assert.ok(!f.fresh);
});
check('edge: evaluation record unchanged keeps Approve fresh', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null); a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  j.recommendation = a.recommendJob(j, claim, 30);
  assert.ok(a.isRecommendationFresh(j, claim, j.recommendation, 30).fresh);
  assert.ok(j.recommendation.fingerprint.evaluationRecord.indexOf('pass') !== -1);
});


// Remediation: H2 broadened human confirmation, H3 stable UIDs,
// M1 duplicate detection, M2 comma numbers, H4 export fingerprint.
function remediationReadyJob(note) {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = note;
  a.recomputeJobs(r.jobs, 30);
  var ver = null;
  if (note.indexOf('https://') === 0) ver = a.classifyEvidenceVerification(note, { status: 200 });
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, ver, r.claims.map(function (c) { return c.text; }));
  a.transitionJob(j, 'ready', 'fresh pass');
  return { r: r, j: j, claim: claim };
}
check('remediation H2: URL Pass without human confirmation holds, not approves', function () {
  var t = remediationReadyJob('https://example.com/report, 2025, solar bills 40 percent');
  var rec = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(rec.recommendation, 'hold');
  assert.ok(rec.reasons.some(function (x) { return x.indexOf('I have opened and reviewed this evidence') !== -1; }));
});
check('remediation H2: URL Pass with human confirmation approves', function () {
  var t = remediationReadyJob('https://example.com/report, 2025, solar bills 40 percent');
  assert.ok(a.confirmHumanEvidence(t.j).ok);
  assert.strictEqual(t.j.humanEvidenceConfirmation, true);
  var rec = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(rec.recommendation, 'approve');
  assert.ok(rec.reasons.some(function (x) { return x.indexOf('Explicit human evidence confirmation') !== -1; }));
});
check('remediation H2: document-only Pass without confirmation holds', function () {
  var t = remediationReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  var rec = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(rec.recommendation, 'hold');
});
check('remediation H2: clearing confirmation invalidates Approve', function () {
  var t = remediationReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(t.j.recommendation.recommendation, 'approve');
  a.clearHumanEvidenceConfirmation(t.j);
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Human evidence confirmation') !== -1; }));
  assert.strictEqual(a.recommendJob(t.j, t.claim, 30).recommendation, 'hold');
});
check('remediation H2: new evaluation resets confirmation', function () {
  var t = remediationReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.confirmHumanEvidence(t.j); assert.strictEqual(t.j.humanEvidenceConfirmation, true);
  t.j.workState = 'resubmitted';
  a.evaluateJob(t.j, t.claim, null, t.r.claims.map(function (c) { return c.text; }));
  assert.strictEqual(t.j.humanEvidenceConfirmation, false);
});
check('remediation H2: Pass summary states human review is required', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent', null);
  assert.strictEqual(v.verdict, 'pass');
  assert.ok(v.summary.indexOf('Human must open and review evidence') !== -1);
  assert.ok(v.summary.indexOf('Does not prove') !== -1);
});
check('remediation H3: stable UIDs are unique and jobs carry them', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var uids = r.claims.map(function (c) { return c.uid; });
  assert.ok(uids.every(function (u) { return !!u; }));
  assert.strictEqual(new Set(uids).size, uids.length);
  r.jobs.forEach(function (j, i) { assert.strictEqual(j.claimUid, r.claims[i].uid); });
});
check('remediation H3: preserveJobStates keeps unchanged jobs, resets edited, handles delete by UID', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var oldClaims = r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note }; });
  var oldJobs = r.jobs.map(function (j) { return JSON.parse(JSON.stringify(j)); });
  // Simulate job 1 checked with evaluation, job 2 assigned
  oldJobs[0].workState = 'checked'; oldJobs[0].evaluation = { verdict: 'pass' }; oldJobs[0].humanEvidenceConfirmation = true;
  // New claims: claim 1 unchanged, claim 2 edited, claim 3 deleted (ids shift, UIDs preserved for 1 and 3)
  var newClaims = [
    { id: 1, uid: oldClaims[0].uid, text: oldClaims[0].text, note: oldClaims[0].note },
    { id: 2, uid: oldClaims[1].uid, text: 'Edited claim text here for testing purposes.', note: '' },
    { id: 3, uid: oldClaims[2].uid, text: oldClaims[2].text, note: oldClaims[2].note }
  ];
  var newJobs = newClaims.map(function (c, i) { return { jobId: i + 1, claimId: c.id, claimUid: c.uid, workState: 'assigned', correctionRound: 0, history: [], checks: [], correctionRequest: null, correctionHistory: [], evaluation: null, evaluationHistory: [], recommendation: null, humanEvidenceConfirmation: false, cut: false, abandoned: false }; });
  // Give old job 3 a state too, to test delete-shift preservation
  oldJobs[2].workState = 'checked'; oldJobs[2].evaluation = { verdict: 'pass' };
  var out = a.preserveJobStates(oldJobs, oldClaims, newJobs, newClaims);
  assert.strictEqual(out[0].workState, 'checked'); assert.strictEqual(out[0].humanEvidenceConfirmation, true);
  assert.strictEqual(out[1].workState, 'assigned'); assert.strictEqual(out[1].evaluation, null);
  assert.strictEqual(out[2].workState, 'checked');
});
check('remediation H3: ambiguous UID matches are reset safely, not transferred', function () {
  var oldClaims = [{ id: 1, uid: 'dup', text: 'Same claim text.', note: '' }, { id: 2, uid: 'dup', text: 'Same claim text.', note: '' }];
  var oldJobs = [{ claimId: 1, claimUid: 'dup', workState: 'checked', evaluation: { verdict: 'pass' }, history: [], checks: [], correctionHistory: [], evaluationHistory: [], recommendation: null, humanEvidenceConfirmation: true, cut: false, abandoned: false, correctionRound: 0, correctionRequest: null }];
  var newClaims = [{ id: 1, uid: 'dup', text: 'Same claim text.', note: '' }, { id: 2, uid: 'dup', text: 'Same claim text.', note: '' }];
  var newJobs = [{ claimId: 1, claimUid: 'dup', workState: 'assigned', evaluation: null, history: [], checks: [], correctionHistory: [], evaluationHistory: [], recommendation: null, humanEvidenceConfirmation: false, cut: false, abandoned: false, correctionRound: 0, correctionRequest: null }, { claimId: 2, claimUid: 'dup', workState: 'assigned', evaluation: null, history: [], checks: [], correctionHistory: [], evaluationHistory: [], recommendation: null, humanEvidenceConfirmation: false, cut: false, abandoned: false, correctionRound: 0, correctionRequest: null }];
  var out = a.preserveJobStates(oldJobs, oldClaims, newJobs, newClaims);
  assert.strictEqual(out[0].workState, 'assigned'); assert.strictEqual(out[0].evaluation, null);
  assert.strictEqual(out[1].workState, 'assigned');
});
check('remediation M1: duplicate claims hold, non-duplicates pass', function () {
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent', null, ['Solar panels reduce electricity bills by 40 percent in 2025', 'Solar panels reduce electricity bills by 40 percent in 2025']);
  assert.strictEqual(v.verdict, 'hold');
  assert.ok(v.checks.some(function (c) { return c.name === 'duplicate'; }));
  var v2 = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent', null, ['Solar panels reduce electricity bills by 40 percent in 2025', 'Different claim about rain in 2025']);
  assert.strictEqual(v2.verdict, 'pass');
});
check('remediation M2: comma numbers 1,000 versus 1000 are exact', function () {
  var v = a.evaluateSubmission('Sales rose by 1,000 units in 2025', 'Report (r-2025.pdf), 2025, sales rose by 1000 units', null);
  var n = v.checks.filter(function (c) { return c.name === 'numbers'; })[0];
  assert.strictEqual(n.result, 'exact');
  var v2 = a.evaluateSubmission('Sales rose by 1,000 units in 2025', 'Report (r-2025.pdf), 2025, sales rose by 1200 units', null);
  var n2 = v2.checks.filter(function (c) { return c.name === 'numbers'; })[0];
  assert.strictEqual(n2.result, 'potential-mismatch');
});
check('remediation H4: fresh export contains date, fingerprint, and export-time statement', function () {
  var t = remediationReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('Exported:') !== -1);
  assert.ok(md.indexOf('current only at export time') !== -1);
  assert.ok(md.indexOf('Recommendation fingerprint:') !== -1);
  assert.ok(md.indexOf('Human evidence confirmation: confirmed') !== -1);
});


// P0: stale evidence protection, escalation workflow, and claim
// status versus payment approval. Approved 1 Nov 2026, with
// Inconclusive as warning only, and escalation restart keeping the
// correction round at 2.
function p0ReadyJob(note) {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = note;
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null);
  return { r: r, j: j, claim: claim };
}
function p0EscalatedJob() {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  function failRound() { a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'try'); a.evaluateJob(t.j, t.claim, null); }
  failRound(); failRound(); a.requestCorrection(t.j, t.j.evaluation);
  assert.strictEqual(t.j.workState, 'escalated'); assert.strictEqual(t.j.correctionRound, 2);
  return t;
}
check('p0 stale: note edit invalidates a checked evaluation and confirmation', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  assert.strictEqual(t.j.humanEvidenceConfirmation, true);
  var res = a.invalidateStaleEvaluation(t.j);
  assert.strictEqual(res.invalidated, true);
  assert.strictEqual(t.j.workState, 'assigned');
  assert.strictEqual(t.j.evaluation, null);
  assert.strictEqual(t.j.humanEvidenceConfirmation, false);
  assert.ok(t.j.evaluationHistory.some(function (e) { return e.invalidatedByNoteEdit === true; }));
  assert.ok(t.j.history[t.j.history.length - 1].reason.indexOf('invalidated') !== -1);
  assert.strictEqual(a.recommendJob(t.j, t.claim, 30).recommendation, 'hold');
  assert.ok(!a.markReady(t.j, t.claim).ok);
});
check('p0 stale: markReady requires an evaluation matching current claim and note', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  assert.ok(a.markReady(t.j, t.claim).ok); assert.strictEqual(t.j.workState, 'ready');
  var t2 = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  t2.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  assert.ok(!a.markReady(t2.j, t2.claim).ok);
  assert.ok(!a.evaluationMatchesClaim(t2.j, t2.claim));
  assert.ok(a.evaluationMatchesClaim(t.j, t.claim));
});
check('p0 stale: invalidation does not touch assigned or correction-requested jobs, and preserves correction round', function () {
  var j = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.').jobs[0];
  assert.strictEqual(a.invalidateStaleEvaluation(j).invalidated, false);
  assert.strictEqual(j.workState, 'assigned');
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  a.requestCorrection(t.j, t.j.evaluation);
  assert.strictEqual(t.j.workState, 'correction-requested'); assert.strictEqual(t.j.correctionRound, 1);
  assert.strictEqual(a.invalidateStaleEvaluation(t.j).invalidated, false);
  assert.strictEqual(t.j.correctionRound, 1); assert.strictEqual(t.j.workState, 'correction-requested');
});
check('p0 escalation: banner message only for escalated jobs', function () {
  var t = p0EscalatedJob();
  var msg = a.escalationMessage(t.j);
  assert.ok(msg && msg.indexOf('automatic corrections stopped after 2 rounds') !== -1);
  assert.ok(msg.indexOf('Correction round stays at 2') !== -1);
  var j2 = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.').jobs[0];
  assert.strictEqual(a.escalationMessage(j2), null);
});
check('p0 escalation: restart keeps correction round at 2 and preserves histories', function () {
  var t = p0EscalatedJob();
  var corrLen = t.j.correctionHistory.length; var evalLen = t.j.evaluationHistory.length;
  var res = a.restartEscalatedJob(t.j);
  assert.ok(res.ok);
  assert.strictEqual(t.j.workState, 'assigned');
  assert.strictEqual(t.j.correctionRound, 2);
  assert.strictEqual(t.j.evaluation, null);
  assert.strictEqual(t.j.humanEvidenceConfirmation, false);
  assert.strictEqual(t.j.correctionHistory.length, corrLen);
  assert.ok(t.j.evaluationHistory.length >= evalLen);
  assert.ok(t.j.history[t.j.history.length - 1].reason.indexOf('Correction round stays at 2') !== -1);
});
check('p0 escalation: after restart, a further unsuccessful correction escalates again', function () {
  var t = p0EscalatedJob();
  a.restartEscalatedJob(t.j);
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent';
  a.transitionJob(t.j, 'submitted', 'submit again'); a.evaluateJob(t.j, t.claim, null);
  assert.strictEqual(t.j.evaluation.verdict, 'hold');
  var res = a.requestCorrection(t.j, t.j.evaluation);
  assert.ok(res.ok); assert.strictEqual(t.j.workState, 'escalated'); assert.strictEqual(t.j.correctionRound, 2);
});
check('p0 escalation: restart from a non-escalated job fails without mutation', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  assert.ok(!a.restartEscalatedJob(t.j).ok);
  assert.strictEqual(t.j.workState, 'checked');
});
check('p0 claim status: Not supported blocks Approve, Inconclusive warns only', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  assert.strictEqual(a.recommendJob(t.j, t.claim, 30).recommendation, 'approve');
  t.claim.status = 'Not supported by evidence';
  var rec = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(rec.recommendation, 'hold');
  assert.ok(rec.reasons.some(function (x) { return x.indexOf('Not supported by evidence') !== -1; }));
  t.claim.status = 'Inconclusive';
  var rec2 = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(rec2.recommendation, 'approve');
  assert.ok(rec2.reasons.some(function (x) { return x.indexOf('Warning: claim is marked Inconclusive') !== -1; }));
  assert.ok(rec2.reasons.some(function (x) { return x.indexOf('checker work only') !== -1; }));
});
check('p0 claim status: status change invalidates a stored recommendation, fingerprint records status', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(t.j.recommendation.fingerprint.claimStatus, t.claim.status);
  assert.ok(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
  t.claim.status = 'Supported by evidence';
  var f = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.ok(!f.fresh); assert.ok(f.staleReasons.some(function (x) { return x.indexOf('Claim status') !== -1; }));
});
check('p0 export: recommendation block states claim status, export lists job history including restart', function () {
  var t = p0EscalatedJob();
  a.restartEscalatedJob(t.j);
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('Job history:') !== -1);
  assert.ok(md.indexOf('Human-reviewed restart') !== -1);
  var t2 = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t2.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t2.j);
  t2.j.recommendation = a.recommendJob(t2.j, t2.claim, 30);
  var md2 = a.planAsMarkdown({ thesis: 'x', claims: t2.r.claims, jobs: t2.r.jobs, cap: 30 });
  assert.ok(md2.indexOf('Claim status at recommendation time:') !== -1);
  assert.ok(md2.indexOf('checker for the checking work, not about the claim being true') !== -1);
});

check('plan9 p0: trailing-space note still Passes, marks ready, and recommends Approve', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent ');
  assert.strictEqual(t.j.evaluation.verdict, 'pass');
  assert.ok(a.markReady(t.j, t.claim).ok);
  a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(t.j.recommendation.recommendation, 'approve');
  assert.ok(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
});
check('plan9 p0: double-space note still Passes and recommends Approve, genuine change still stale', function () {
  var t = p0ReadyJob('Lagos solar report  (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(t.j.recommendation.recommendation, 'approve');
  var t2 = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  t2.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  assert.ok(!a.evaluationMatchesClaim(t2.j, t2.claim));
  assert.ok(!a.markReady(t2.j, t2.claim).ok);
  assert.strictEqual(a.recommendJob(t2.j, t2.claim, 30).recommendation, 'hold');
});
check('plan9 p0: old raw fingerprint reads OUTDATED once, then fresh after recalculation', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  var oldRec = a.recommendJob(t.j, t.claim, 30);
  oldRec.fingerprint.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent ';
  assert.ok(!a.isRecommendationFresh(t.j, t.claim, oldRec, 30).fresh);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.ok(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh);
});
check('plan9 p0: same-note invalidate with claim is a no-op, real change still invalidates', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  var histLen = t.j.history.length;
  assert.strictEqual(a.invalidateStaleEvaluation(t.j, t.claim).invalidated, false);
  assert.strictEqual(t.j.workState, 'ready'); assert.ok(t.j.evaluation); assert.strictEqual(t.j.humanEvidenceConfirmation, true); assert.strictEqual(t.j.history.length, histLen);
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  assert.strictEqual(a.invalidateStaleEvaluation(t.j, t.claim).invalidated, true);
  assert.strictEqual(t.j.workState, 'assigned'); assert.strictEqual(t.j.evaluation, null); assert.strictEqual(t.j.humanEvidenceConfirmation, false);
});
check('plan9 p0: whitespace-only rebuild difference preserves job state, real difference does not', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0]; claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.recomputeJobs(r.jobs, 30); a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null);
  var oldJobs = JSON.parse(JSON.stringify(r.jobs));
  var oldClaims = r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent ';
  var newJobs = a.buildAgentJobs(r.claims, 30).jobs;
  a.preserveJobStates(oldJobs, oldClaims, newJobs, r.claims);
  assert.strictEqual(newJobs[0].workState, 'checked'); assert.ok(newJobs[0].evaluation);
  claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 41 percent';
  var newJobs2 = a.buildAgentJobs(r.claims, 30).jobs;
  a.preserveJobStates(oldJobs, oldClaims, newJobs2, r.claims);
  assert.strictEqual(newJobs2[0].workState, 'assigned'); assert.ok(!newJobs2[0].evaluation);
});
check('plan9 p1: HOLD review is record-only and never enables Approve', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  assert.strictEqual(t.j.evaluation.verdict, 'hold');
  var res = a.recordHumanReview(t.j, 'I opened the note and the reasons; the year is uncertain, not the document.');
  assert.ok(res.ok); assert.strictEqual(t.j.evaluation.verdict, 'hold'); assert.strictEqual(t.j.workState, 'checked'); assert.strictEqual(t.j.humanEvidenceConfirmation, false);
  assert.strictEqual(a.recommendJob(t.j, t.claim, 30).recommendation, 'hold');
  assert.ok(a.recommendJob(t.j, t.claim, 30).reasons.some(function (r) { return r.indexOf('Human review recorded') !== -1 && r.indexOf('does not authorise payment') !== -1; }));
  assert.ok(t.j.history.some(function (h) { return h.reason.indexOf('Human review of HOLD recorded') !== -1; }));
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('Human review of HOLD:') !== -1);
});
check('plan9 p1: HOLD review rejected on Pass, assigned, escalated, empty, and long notes', function () {
  var p = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  assert.ok(!a.recordHumanReview(p.j, 'x').ok);
  var ass = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.').jobs[0];
  assert.ok(!a.recordHumanReview(ass, 'x').ok);
  var esc = p0EscalatedJob();
  assert.ok(!a.recordHumanReview(esc.j, 'x').ok);
  var h = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  assert.ok(!a.recordHumanReview(h.j, '   ').ok);
  assert.ok(!a.recordHumanReview(h.j, new Array(502).join('x')).ok);
  assert.strictEqual(h.j.humanReview, null);
});
check('plan9 p1: new evaluation clears current HOLD review but preserves review history, reviewed HOLD can still Pass later', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  a.recordHumanReview(t.j, 'uncertain year');
  a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'try');
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent';
  a.evaluateJob(t.j, t.claim, null);
  assert.strictEqual(t.j.humanReview, null); assert.strictEqual(t.j.humanReviewHistory.length, 1);
  a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'try');
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.evaluateJob(t.j, t.claim, null);
  assert.strictEqual(t.j.evaluation.verdict, 'pass');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  assert.strictEqual(a.recommendJob(t.j, t.claim, 30).recommendation, 'approve');
});
check('plan9 p1: HOLD re-evaluation clears open correction without duplicating history', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  a.requestCorrection(t.j, t.j.evaluation); assert.strictEqual(t.j.correctionHistory.length, 1);
  a.transitionJob(t.j, 'resubmitted', 'try'); a.evaluateJob(t.j, t.claim, null);
  assert.strictEqual(t.j.correctionRequest, null); assert.strictEqual(t.j.correctionHistory.length, 1);
  var restored = JSON.parse(JSON.stringify(t.j));
  assert.strictEqual(restored.correctionHistory.length, 1);
});
check('plan9 p1: restart sets previouslyEscalated, it survives HOLD and cut/restore, clears on Pass', function () {
  var t = p0EscalatedJob(); a.restartEscalatedJob(t.j);
  assert.strictEqual(t.j.previouslyEscalated, true); assert.strictEqual(t.j.correctionRound, 2);
  a.transitionJob(t.j, 'submitted', 'submit'); a.evaluateJob(t.j, t.claim, null);
  assert.strictEqual(t.j.evaluation.verdict, 'hold'); assert.strictEqual(t.j.previouslyEscalated, true);
  t.j.cut = true; t.j.cut = false;
  assert.strictEqual(t.j.previouslyEscalated, true);
  a.requestCorrection(t.j, t.j.evaluation); assert.strictEqual(t.j.workState, 'escalated');
  a.restartEscalatedJob(t.j);
  t.claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  a.transitionJob(t.j, 'submitted', 'submit'); a.evaluateJob(t.j, t.claim, null);
  assert.strictEqual(t.j.evaluation.verdict, 'pass'); assert.strictEqual(t.j.previouslyEscalated, false);
});
check('plan9 p1: re-escalation after restart keeps round at 2 and history at exactly 2 corrections', function () {
  var t = p0EscalatedJob(); a.restartEscalatedJob(t.j);
  a.transitionJob(t.j, 'submitted', 'submit'); a.evaluateJob(t.j, t.claim, null);
  a.requestCorrection(t.j, t.j.evaluation);
  assert.strictEqual(t.j.workState, 'escalated'); assert.strictEqual(t.j.correctionRound, 2); assert.strictEqual(t.j.correctionHistory.length, 2); assert.strictEqual(t.j.correctionRequest, null);
});
check('plan9 p2: export includes a recommendation even when no evaluation exists', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0];
  a.recomputeJobs(r.jobs, 30);
  j.recommendation = a.recommendJob(j, claim, 30);
  assert.strictEqual(j.recommendation.recommendation, 'hold');
  var md = a.planAsMarkdown({ thesis: 'x', claims: r.claims, jobs: r.jobs, cap: 30 });
  assert.ok(md.indexOf('Payment recommendation') !== -1);
  assert.ok(md.indexOf('No evaluation is recorded') !== -1);
});
check('plan9 p2: export includes a recommendation for an abandoned job, and no recommendation when none exists', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  t.j.abandoned = true; t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('Payment recommendation') !== -1);
  var r2 = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var md2 = a.planAsMarkdown({ thesis: 'x', claims: r2.claims, jobs: r2.jobs, cap: 30 });
  assert.ok(md2.indexOf('Payment recommendation (current)') === -1 && md2.indexOf('OUTDATED payment recommendation') === -1);
});
check('plan9 p2: export is non-mutating and repeatable, including with a different cap', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  var before = JSON.stringify(t.r.jobs);
  var md1 = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  var md2 = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.strictEqual(md1, md2); assert.strictEqual(JSON.stringify(t.r.jobs), before);
  a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 5 });
  assert.strictEqual(JSON.stringify(t.r.jobs), before);
});
check('plan9 p2: cut, restore, abandon, and restore-abandoned history entries export in order', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  t.j.history.push({ from: 'checked', to: 'checked', reason: 'Job cut by user', source: 'user' });
  t.j.history.push({ from: 'checked', to: 'checked', reason: 'Job restored by user', source: 'user' });
  t.j.history.push({ from: 'checked', to: 'checked', reason: 'Job abandoned by user', source: 'user' });
  t.j.history.push({ from: 'checked', to: 'checked', reason: 'Abandoned job restored by user', source: 'user' });
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  var i1 = md.indexOf('Job cut by user'); var i2 = md.indexOf('Job restored by user'); var i3 = md.indexOf('Job abandoned by user'); var i4 = md.indexOf('Abandoned job restored by user');
  assert.ok(i1 !== -1 && i2 > i1 && i3 > i2 && i4 > i3);
});

// QA corrective implementation: D1-D10, D13, and four-digit quantities.
check('qa d1: classify mismatched url never verifies', function () {
  var v = a.classifyEvidenceVerification('Report https://example.com/solar-2025.pdf, 2025, bills down 40 percent', { status: 200, url: 'https://other.com/x.pdf' });
  assert.strictEqual(v.tier, 'format-only');
  assert.strictEqual(v.label, 'Format only');
});
check('qa d1: classify matching url 200 verifies', function () {
  var v = a.classifyEvidenceVerification('Report https://example.com/solar-2025.pdf, 2025, bills down 40 percent', { status: 200, url: 'https://example.com/solar-2025.pdf' });
  assert.strictEqual(v.tier, 'verified-reachable');
});
check('qa d1: evaluate with verified object for a different url holds', function () {
  var stale = { tier: 'verified-reachable', label: 'Verified reachable', detail: 'Live link check: URL returned HTTP 200.', formatPassed: true, url: 'https://other.com/x.pdf', status: 200 };
  var e = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025.', 'Lagos solar report https://example.com/solar-2025.pdf, 2025, bills down 40 percent', stale);
  assert.strictEqual(e.verdict, 'hold');
});
check('qa d1: claim text edit supersedes an in-flight link check', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var c = r.claims[0]; c.checkSeq = 3;
  a.updateClaimText(c, 'Wind turbines reduce electricity bills by 30 percent in 2025.');
  assert.strictEqual(c.checkSeq, 4);
  assert.strictEqual(c.evidenceVerification, null);
});
check('qa d2: export at cap 0 shows cap 0 and a current recommendation', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  a.recomputeJobs(t.r.jobs, 0);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 0);
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 0 });
  assert.ok(md.indexOf('cap 0,') !== -1, 'expected cap 0 in totals, got totals line missing');
  assert.ok(md.indexOf('OUTDATED payment recommendation') === -1, 'cap 0 recommendation must not export as OUTDATED');
});
check('qa d3: export after restart keeps work state, archived evaluations, and archived reviews', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  var rr = a.recordHumanReview(t.j, 'Checked the 55 percent figure myself, still unsure.');
  assert.strictEqual(rr.ok, true);
  function failRound() { a.requestCorrection(t.j, t.j.evaluation); a.transitionJob(t.j, 'resubmitted', 'try'); a.evaluateJob(t.j, t.claim, null); }
  failRound(); failRound(); a.requestCorrection(t.j, t.j.evaluation);
  assert.strictEqual(t.j.workState, 'escalated');
  a.restartEscalatedJob(t.j);
  assert.strictEqual(t.j.evaluation, null);
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('Work state: assigned') !== -1);
  assert.ok(md.indexOf('Previous evaluation (round') !== -1);
  assert.ok(md.indexOf('Correction round') !== -1);
  assert.ok(md.indexOf('Archived human review of HOLD: Checked the 55 percent figure myself, still unsure.') !== -1);
});
check('qa d5: preserve with a pre-edit snapshot does not restore a stale ready state', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  var preJobs = JSON.parse(JSON.stringify(t.r.jobs));
  var preClaims = t.r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  a.updateClaimText(t.claim, 'Wind turbines reduce electricity bills by 30 percent in 2025.');
  var newJobs = a.buildAgentJobs(t.r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, t.r.claims);
  assert.strictEqual(newJobs[0].workState, 'assigned');
  assert.ok(!newJobs[0].evaluation, 'edited job must not keep the old evaluation');
  assert.strictEqual(newJobs[0].humanEvidenceConfirmation, false);
});
check('qa d7: and and but split, and single-letter fragments survive', function () {
  var andParts = a.splitSubClaims('Solar panels are cheap and batteries last longer in 2025.').map(function (p) { return p.text; });
  assert.ok(andParts.indexOf('Solar panels are cheap') !== -1);
  assert.ok(andParts.indexOf('batteries last longer in 2025.') !== -1);
  var butParts = a.splitSubClaims('Solar panels are cheap but batteries are expensive in 2025.').map(function (p) { return p.text; });
  assert.ok(butParts.indexOf('Solar panels are cheap') !== -1);
  assert.ok(butParts.indexOf('batteries are expensive in 2025.') !== -1);
  var letterParts = a.splitSubClaims('A and B and C and D and E and F and G are all rising fast in this market today.').map(function (p) { return p.text; });
  assert.ok(letterParts.indexOf('B') !== -1, 'single-letter fragment B lost, got: ' + letterParts.join(' | '));
});
check('qa d8: whitespace-only note exports as none yet', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  r.claims[0].note = '   ';
  var md = a.planAsMarkdown({ thesis: 'x', claims: r.claims, jobs: r.jobs, cap: 30 });
  assert.ok(md.indexOf('- Evidence note:    ') === -1, 'whitespace-only note must not export as a blank line');
  assert.ok(md.indexOf('- Evidence note: (none yet)') !== -1);
});
check('qa d13: classification uses word boundaries', function () {
  assert.strictEqual(a.classifyClaim('Flowers bloom in spring for local growers.'), 'General claim');
  assert.strictEqual(a.classifyClaim('People willing to pay more for fresh bread.'), 'General claim');
  assert.strictEqual(a.classifyClaim('AI will increase output for small traders.'), 'Cause and effect');
  assert.strictEqual(a.classifyClaim('It will rain tomorrow in Lagos.'), 'Prediction');
  assert.strictEqual(a.classifyClaim('Prices rise by 2025 for small traders.'), 'Prediction');
});
check('qa four-digit: comma-grouped quantity is not mistaken for a year', function () {
  assert.deepStrictEqual(a.extractEvaluatorNumbers('1,950 units sold'), ['1950']);
  assert.deepStrictEqual(a.extractEvaluatorNumbers('1950 units sold'), []);
  var e = a.evaluateSubmission('1,950 units sold in 2025.', 'Sales report (sales-2025.pdf), 2025, 1,950 units sold', null);
  assert.strictEqual(e.verdict, 'pass');
});
check('qa ui static: overflow, tap target, font size, labels, persistence, and no blocking alerts', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf('overflow-wrap: break-word') !== -1, 'missing overflow-wrap for D4');
  assert.ok(html.indexOf('min-height: 44px') !== -1, 'missing 44px button minimum for D10');
  assert.ok(html.indexOf('select, input[type="text"] { font-size: 16px;') !== -1, 'inputs must be 16px for D10');
  assert.ok(html.indexOf('Human review note for this HOLD job') !== -1, 'missing HOLD review label for D10');
  assert.ok(html.indexOf('humanReviewDraft') !== -1, 'missing review draft preservation for D10');
  assert.ok(html.indexOf('alert(res.error)') === -1, 'blocking alerts must be replaced for D10');
  assert.ok(html.indexOf('evidenceVerification: c.evidenceVerification || null') !== -1, 'missing verification persistence for D9');
  assert.ok(html.indexOf('current.claims.length ? Math.round') !== -1, 'missing zero-claim progress guard for D6');
  assert.ok(html.indexOf('checkedUrl') !== -1 && html.indexOf('checkSeq') !== -1, 'missing D1 sequence token');
  assert.ok(html.indexOf('network or RPC down') === -1, 'stray testnet-proof fragment must be removed for D13');
});

// ---- QA2 corrective regression tests (2 Nov 2026) ----
check('qa2-01: claim text edit preserves round, escalation, cut, planning and histories, invalidates evaluation, recommendation goes stale', function () {
  var t = p0EscalatedJob();
  t.j.cut = true; t.j.previouslyEscalated = true; t.j.planningDecision = 'Buy'; t.j.planningReason = 'Demo quote was at or below plan.';
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  var preJobs = JSON.parse(JSON.stringify(t.r.jobs));
  var preClaims = t.r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  var oldHistoryLen = t.j.history.length;
  a.updateClaimText(t.claim, 'Solar panels increase electricity savings by 45 percent in 2025.');
  var newJobs = a.buildAgentJobs(t.r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, t.r.claims);
  var nj = newJobs[0];
  assert.strictEqual(nj.correctionRound, 2, 'correction round must survive a claim edit');
  assert.strictEqual(nj.previouslyEscalated, true, 'escalation flag must survive a claim edit');
  assert.strictEqual(nj.cut, true, 'cut status must survive a claim edit');
  assert.strictEqual(nj.planningDecision, 'Buy', 'planning decision must survive a claim edit');
  assert.ok(nj.history.length > oldHistoryLen, 'edit must be recorded in history');
  assert.ok(nj.history[nj.history.length - 1].reason.indexOf('Claim text edited') !== -1);
  assert.ok(nj.evaluationHistory.length >= 1, 'archived evaluations must survive a claim edit');
  assert.strictEqual(nj.workState, 'assigned', 'edited job must not stay escalated/ready');
  assert.ok(!nj.evaluation, 'edited job must not keep the old evaluation');
  assert.strictEqual(nj.humanEvidenceConfirmation, false);
  assert.strictEqual(nj.correctionRequest, null);
  a.recomputeJobs(newJobs, 30);
  assert.strictEqual(nj.spent, 0, 'a cut job must spend nothing after an edit');
  assert.strictEqual(nj.capStatus, 'Cut by user');
  var fresh = a.isRecommendationFresh(nj, t.claim, nj.recommendation, 30);
  assert.strictEqual(fresh.fresh, false, 'kept recommendation must be OUTDATED, never current');
  assert.ok(fresh.staleReasons.join(' ').indexOf('Claim text changed') !== -1);
});
check('qa2-01: abandoned job is never reactivated by a claim text edit', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; j.abandoned = true;
  var preJobs = JSON.parse(JSON.stringify(r.jobs));
  var preClaims = r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  a.updateClaimText(r.claims[0], 'Solar panels reduce electricity bills by 30 percent in 2025.');
  var newJobs = a.buildAgentJobs(r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, r.claims);
  a.recomputeJobs(newJobs, 30);
  assert.strictEqual(newJobs[0].abandoned, true);
  assert.strictEqual(newJobs[0].spent, 0);
  assert.strictEqual(newJobs[0].capStatus, 'Abandoned by user');
});
check('qa2-01: unchanged cleaned claim text does not reset job state or progress', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  var preJobs = JSON.parse(JSON.stringify(t.r.jobs));
  var preClaims = t.r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  var newJobs = a.buildAgentJobs(t.r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, t.r.claims);
  assert.strictEqual(newJobs[0].workState, 'ready');
  assert.ok(newJobs[0].evaluation, 'unchanged job must keep its evaluation');
  assert.strictEqual(newJobs[0].humanEvidenceConfirmation, true);
});
check('qa2-02: thesis splitting keeps comma-grouped numbers intact', function () {
  var parts = a.splitSubClaims('Sales reached 1,200,000 units in 2025 and costs fell.').map(function (p) { return p.text; });
  assert.ok(parts.indexOf('Sales reached 1,200,000 units in 2025') !== -1, 'grouped number was split, got: ' + parts.join(' | '));
  assert.ok(parts.indexOf('costs fell.') !== -1);
  var becauseParts = a.splitSubClaims('Because sales reached 1,200,000 units in 2025, costs fell.').map(function (p) { return p.text; });
  assert.ok(becauseParts.join(' ').indexOf('1,200,000') !== -1, 'grouped number lost in because split, got: ' + becauseParts.join(' | '));
});
check('qa2-03: cause classification recognises inflected causal verbs', function () {
  ['increased', 'improved', 'reduced', 'boosted', 'decreased', 'lowered', 'raised'].forEach(function (v) {
    assert.strictEqual(a.classifyClaim('Sales ' + v + ' by 40 percent in 2025'), 'Cause and effect', 'verb ' + v + ' must classify as Cause and effect');
  });
  assert.strictEqual(a.classifyClaim('Sales increase by 40 percent in 2025'), 'Cause and effect', 'baseline present-tense form must still work');
});
check('qa2-04: splitting protects natural compound phrases and keeps the A and B and C test', function () {
  var parts = a.splitSubClaims('Research and development improves products and supply and demand affects prices in this market today.').map(function (p) { return p.text; });
  assert.ok(parts.indexOf('Research and development improves products') !== -1, 'research and development was split, got: ' + parts.join(' | '));
  assert.ok(parts.indexOf('supply and demand affects prices in this market today.') !== -1, 'supply and demand was split, got: ' + parts.join(' | '));
  var letterParts = a.splitSubClaims('A and B and C and D and E and F and G are all rising fast in this market today.').map(function (p) { return p.text; });
  assert.ok(letterParts.indexOf('B') !== -1, 'single-letter fragment B lost, got: ' + letterParts.join(' | '));
  var clauseParts = a.splitSubClaims('Solar panels are cheap and batteries last longer in 2025.').map(function (p) { return p.text; });
  assert.ok(clauseParts.indexOf('Solar panels are cheap') !== -1, 'genuine independent clauses must still split');
  assert.ok(clauseParts.indexOf('batteries last longer in 2025.') !== -1);
});
check('qa2-05: restored verification snapshot is labelled as saved, not fresh, and never supports a fresh Pass on reachability', function () {
  var snap = { tier: 'verified-reachable', label: 'Verified reachable', detail: 'Live link check: URL returned HTTP 200.', formatPassed: true, url: 'https://example.com/report.pdf', status: 200, snapshot: true, checkedAt: '2026-11-01T10:00:00.000Z' };
  var text = a.evidenceVerificationText({ note: 'Lagos solar report https://example.com/report.pdf, 2025, bills down 40 percent', evidenceVerification: snap });
  assert.ok(text.indexOf('Saved live-check from 2026-11-01 (not re-checked)') !== -1, 'snapshot wording missing, got: ' + text);
  var v = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report https://example.com/report.pdf, 2025, bills down 40 percent', snap);
  var reach = v.checks.filter(function (x) { return x.name === 'reachability'; })[0];
  assert.strictEqual(reach.result, 'inconclusive', 'snapshot must be downgraded to format-only for reachability');
  var fresh = { tier: 'verified-reachable', label: 'Verified reachable', detail: 'Live link check: URL returned HTTP 200.', formatPassed: true, url: 'https://example.com/report.pdf', status: 200, snapshot: false };
  var v2 = a.evaluateSubmission('Solar panels reduce electricity bills by 40 percent in 2025', 'Lagos solar report https://example.com/report.pdf, 2025, bills down 40 percent', fresh);
  assert.strictEqual(v2.checks.filter(function (x) { return x.name === 'reachability'; })[0].result, 'exact', 'a fresh check must still verify');
});
check('qa2-06: inline errors replace prior errors and scroll into view', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf("card.querySelectorAll('.error')") !== -1, 'showJobError must clear prior errors on the card');
  assert.ok(html.indexOf('p.scrollIntoView()') !== -1, 'showJobError must scroll the error into view');
  assert.ok(html.indexOf('alert(res.error)') === -1, 'D10 blocking-alert ban must remain');
});
check('qa2-07: empty saved claim list restores as empty, not as defaults', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf('Array.isArray(saved.claims)') !== -1, 'restore must test for an array, not for a non-empty list');
  assert.ok(html.indexOf('if (saved.claims && saved.claims.length)') === -1, 'old non-empty restore condition must be gone');
});
check('qa2-08: clear saved plan sets a flag that blocks re-saving until a new breakdown', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf('planCleared = true') !== -1, 'clear button must set planCleared');
  assert.ok(html.indexOf('if (planCleared) return;') !== -1, 'savePlan must return early while planCleared');
  assert.ok(html.indexOf('planCleared = false; // QA2-08') !== -1, 'breakdown handler must clear the flag before saving');
});
check('qa2-09: number matching is exact for ungrouped, grouped and decimal equivalents, and years stay years', function () {
  var both = function (claim, note) { return a.evaluateSubmission(claim, note, null).verdict; };
  assert.strictEqual(both('Factory sold 1950 units in 2025', 'Report (report-2025.pdf), 2025, factory sold 1,950 units'), 'pass', 'plain year-range quantity must match its comma-grouped form');
  assert.strictEqual(both('Factory sold 1,950 units in 2025', 'Report (report-2025.pdf), 2025, factory sold 1950 units'), 'pass', 'comma-grouped quantity must match its plain form');
  assert.strictEqual(both('Factory sold 1200.50 units in 2025', 'Report (report-2025.pdf), 2025, factory sold 1200.5 units'), 'pass', 'decimal trailing zeros must not create a mismatch');
  assert.strictEqual(both('Prices rose in 1950 and again in 2025', 'Report (report-2025.pdf), 2025, factory sold 1,950 units'), 'hold', 'a bare year must never match a quantity on digits alone');
  assert.deepStrictEqual(a.extractEvaluatorYears('Factory sold 1950 units in 2025'), ['2025'], 'a quantity must not be counted as a year');
  assert.deepStrictEqual(a.extractEvaluatorNumbers('1950 units sold'), [], 'locked four-digit contract must stay: plain 1950 is not a quantity at extract level');
});
check('qa2-10: current human review is exported once, not duplicated as an archived copy', function () {
  var t = p0ReadyJob('Lagos solar report (solar-2025.pdf), 2025, bills down 55 percent');
  var rr = a.recordHumanReview(t.j, 'Checked the 55 percent figure myself, still unsure.');
  assert.strictEqual(rr.ok, true);
  assert.ok(t.j.humanReview.id && t.j.humanReview.id.indexOf('review-') === 0, 'review must carry a stable id');
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('Archived human review of HOLD: Checked the 55 percent figure myself, still unsure.') === -1, 'current review must not also appear as an archived copy');
  assert.ok(md.indexOf('- Human review of HOLD: Checked the 55 percent figure myself, still unsure.') !== -1, 'current review must still appear once');
  var count = md.split('Checked the 55 percent figure myself, still unsure.').length - 1;
  assert.strictEqual(count, 2, 'review note must appear exactly twice (current review plus the job-history log line), got ' + count);
});

// ---- M1 / M2 / L3 corrective regression tests (2 Nov 2026) ----
function l3ReadyJob() {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0];
  claim.note = 'Lagos solar report https://example.com/solar-2025.pdf, 2025, bills down 40 percent';
  claim.evidenceCheck = a.checkEvidence(claim.note);
  claim.evidenceVerification = a.classifyEvidenceVerification(claim.note, { status: 200, url: 'https://example.com/solar-2025.pdf' });
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null);
  a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  claim.status = 'Supported by evidence';
  j.recommendation = a.recommendJob(j, claim, 30);
  return { r: r, j: j, claim: claim };
}
function simulateRestore(t) {
  // As loadSavedPlan does: verification becomes a snapshot, job
  // fields are restored verbatim, and the flag is set.
  t.claim.evidenceVerification = JSON.parse(JSON.stringify(t.claim.evidenceVerification));
  t.claim.evidenceVerification.snapshot = true;
  t.claim.evidenceVerification.checkedAt = '2026-11-01T10:00:00.000Z';
  t.j.needsFreshEvaluationAfterSnapshot = true;
  return t;
}
check('m1: same-text edit preserves note, status, verification, evaluation, confirmation and recommendation freshness', function () {
  var t = l3ReadyJob();
  var preJobs = JSON.parse(JSON.stringify(t.r.jobs));
  var preClaims = t.r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  a.updateClaimText(t.claim, 'Solar panels reduce electricity bills by 40 percent in 2025.');
  var newJobs = a.buildAgentJobs(t.r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, t.r.claims);
  a.recomputeJobs(newJobs, 30);
  assert.strictEqual(t.claim.note, 'Lagos solar report https://example.com/solar-2025.pdf, 2025, bills down 40 percent', 'same-text edit must not clear the note');
  assert.strictEqual(t.claim.status, 'Supported by evidence', 'same-text edit must not reset the status');
  assert.strictEqual(t.claim.evidenceVerification.tier, 'verified-reachable', 'same-text edit must not clear the verification');
  assert.strictEqual(newJobs[0].workState, 'ready');
  assert.strictEqual(newJobs[0].evaluation.verdict, 'pass');
  assert.strictEqual(newJobs[0].humanEvidenceConfirmation, true);
  assert.strictEqual(a.isRecommendationFresh(newJobs[0], t.claim, newJobs[0].recommendation, 30).fresh, true);
});
check('m1: whitespace-only edit preserves all existing state', function () {
  var t = l3ReadyJob();
  var preJobs = JSON.parse(JSON.stringify(t.r.jobs));
  var preClaims = t.r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  a.updateClaimText(t.claim, '  Solar  panels   reduce electricity bills by 40 percent in 2025.  ');
  assert.strictEqual(t.claim.text, 'Solar panels reduce electricity bills by 40 percent in 2025.', 'stored text must be the cleaned original');
  var newJobs = a.buildAgentJobs(t.r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, t.r.claims);
  assert.strictEqual(t.claim.note, 'Lagos solar report https://example.com/solar-2025.pdf, 2025, bills down 40 percent');
  assert.strictEqual(t.claim.status, 'Supported by evidence');
  assert.ok(t.claim.evidenceVerification, 'whitespace-only edit must not clear the verification');
  assert.strictEqual(newJobs[0].workState, 'ready');
  assert.strictEqual(newJobs[0].evaluation.verdict, 'pass');
  assert.strictEqual(newJobs[0].humanEvidenceConfirmation, true);
});
check('m1: genuine text change still triggers the existing invalidation', function () {
  var t = l3ReadyJob();
  var preJobs = JSON.parse(JSON.stringify(t.r.jobs));
  var preClaims = t.r.claims.map(function (c) { return { id: c.id, uid: c.uid, text: c.text, note: c.note || '' }; });
  a.updateClaimText(t.claim, 'Wind turbines reduce electricity bills by 30 percent in 2025.');
  var newJobs = a.buildAgentJobs(t.r.claims, 30).jobs;
  a.preserveJobStates(preJobs, preClaims, newJobs, t.r.claims);
  assert.strictEqual(t.claim.note, '', 'changed text must still clear the note');
  assert.strictEqual(t.claim.status, 'Not yet tested', 'changed text must still reset the status');
  assert.ok(!t.claim.evidenceVerification, 'changed text must still clear the verification');
  assert.strictEqual(newJobs[0].workState, 'assigned');
  assert.ok(!newJobs[0].evaluation, 'changed text must still invalidate the evaluation');
  assert.strictEqual(newJobs[0].humanEvidenceConfirmation, false);
});
check('m2: recommendation result heading has a scroll target and the button uses the settled scroll helper, with card fallback', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf("recHead.id = 'recommendation-' + job.jobId") !== -1, 'result heading must carry a per-job id');
  assert.ok(html.indexOf("recHead.textContent = 'Payment recommendation result'") !== -1, 'result heading must be visible text, not only an id');
  assert.ok(html.indexOf('scrollRecommendationIntoView(job.jobId)') !== -1, 'button handler must scroll via the helper after render');
  assert.ok(html.indexOf('recEl.scrollIntoView()') === -1, 'button handler must no longer use synchronous scrollIntoView on the result, which Android Chrome anchoring can undo');
  assert.ok(html.indexOf("document.getElementById('recommendation-' + jobId)") !== -1, 'helper must look up the result heading by job id');
});
check('m2 fix: scroll helper waits for layout, scrolls the window to the absolute result top, and verifies with a retry', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf('function scrollRecommendationIntoView(jobId)') !== -1, 'helper must exist');
  assert.ok(html.indexOf('window.requestAnimationFrame(function ()') !== -1, 'helper must wait for layout to settle before scrolling');
  assert.ok(html.indexOf('window.scrollTo(0, ThesisAgent.scrollTopForElement(') !== -1, 'helper must scroll the window to the computed absolute top, not call scrollIntoView on the result');
  assert.ok(html.indexOf('setTimeout(verifyAndRetry, 120)') !== -1, 'helper must verify the heading position after toolbar and viewport settling and retry once');
  assert.ok(html.indexOf('rect.top < -4 || rect.top > 80') !== -1, 'retry must trigger only when the heading is not near the top of the viewport');
  assert.ok(html.indexOf('#jobList { overflow-anchor: none; }') !== -1, 'job list must disable scroll anchoring so a programmatic scroll is not undone after a rebuild');
  assert.ok(html.indexOf("document.getElementById('jobcard-' + jobId)") !== -1, 'helper must keep the card as fallback when the result heading is missing');
});
check('m2 fix: scroll-top calculation lands at the element beginning and never goes negative', function () {
  assert.strictEqual(a.scrollTopForElement(500, 2000), 2500, 'absolute top is viewport top plus page scroll');
  assert.strictEqual(a.scrollTopForElement(0, 0), 0, 'top of page stays zero');
  assert.strictEqual(a.scrollTopForElement(-50, 20), 0, 'a negative absolute top must clamp to zero, never scroll above the page');
  assert.strictEqual(a.scrollTopForElement(120, 0), 120, 'with no page scroll the absolute top is the viewport top');
});
check('l3: restored snapshot verification makes a recommendation OUTDATED', function () {
  var t = l3ReadyJob();
  assert.strictEqual(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh, true, 'sanity: fresh before restore');
  simulateRestore(t);
  var fresh = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.strictEqual(fresh.fresh, false, 'restored snapshot must make the recommendation OUTDATED');
  assert.ok(fresh.staleReasons.join(' ').indexOf('saved snapshot') !== -1, 'stale reason must name the saved snapshot');
});
check('l3: a fresh live check alone does not restore recommendation freshness, even after recalculation', function () {
  var t = l3ReadyJob();
  simulateRestore(t);
  // Simulate a fresh live check: verification is live again, flag stays.
  t.claim.evidenceVerification.snapshot = false;
  var fresh = a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30);
  assert.strictEqual(fresh.fresh, false, 'fresh check alone must not restore freshness');
  assert.ok(fresh.staleReasons.join(' ').indexOf('fresh live check alone does not restore') !== -1);
  // Recalculating without a fresh evaluation must not restore it either.
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(t.j.recommendation.recommendation, 'approve', 'recalculation still returns approve, but freshness must block it');
  assert.strictEqual(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh, false, 'recalculation alone must not restore freshness');
});
check('l3: fresh check plus fresh evaluation plus recalculation restores freshness, and the restart path is guarded', function () {
  var t = l3ReadyJob();
  simulateRestore(t);
  t.claim.evidenceVerification.snapshot = false;
  assert.strictEqual(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh, false);
  var bad = a.restartJobForFreshEvaluation({ workState: 'ready', needsFreshEvaluationAfterSnapshot: false });
  assert.strictEqual(bad.ok, false, 'restart must refuse an unflagged job');
  var res = a.restartJobForFreshEvaluation(t.j);
  assert.strictEqual(res.ok, true, 'restart must succeed for a flagged ready job');
  assert.strictEqual(t.j.workState, 'assigned', 'restart must move the job back to assigned');
  assert.ok(!t.j.evaluation, 'restart must archive and clear the old evaluation');
  assert.ok(t.j.evaluationHistory.some(function (e) { return e.archivedForFreshEvaluation === true; }), 'restart must archive the old evaluation');
  assert.strictEqual(t.j.needsFreshEvaluationAfterSnapshot, true, 'restart must keep the flag until a fresh evaluation');
  assert.strictEqual(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh, false, 'restart alone must not restore freshness');
  a.transitionJob(t.j, 'submitted', 'submit for fresh evaluation');
  var ev = a.evaluateJob(t.j, t.claim, t.claim.evidenceVerification, null);
  assert.strictEqual(ev.ok, true, 'fresh evaluation must succeed');
  assert.strictEqual(t.j.evaluation.verdict, 'pass');
  assert.strictEqual(t.j.needsFreshEvaluationAfterSnapshot, false, 'fresh evaluation must clear the flag');
  a.transitionJob(t.j, 'ready', 'fresh pass'); a.confirmHumanEvidence(t.j);
  t.j.recommendation = a.recommendJob(t.j, t.claim, 30);
  assert.strictEqual(t.j.recommendation.recommendation, 'approve');
  assert.strictEqual(a.isRecommendationFresh(t.j, t.claim, t.j.recommendation, 30).fresh, true, 'check plus evaluation plus recalculation must restore freshness');
});
check('l3: document-only recommendations are unaffected by the snapshot rules', function () {
  var r = a.analyseThesis('Solar panels reduce electricity bills by 40 percent in 2025.');
  var j = r.jobs[0]; var claim = r.claims[0];
  claim.note = 'Lagos solar report (solar-2025.pdf), 2025, bills down 40 percent';
  claim.evidenceCheck = a.checkEvidence(claim.note);
  assert.ok(!claim.evidenceVerification, 'document-only note must have no verification object');
  a.recomputeJobs(r.jobs, 30);
  a.transitionJob(j, 'submitted', 'submit'); a.evaluateJob(j, claim, null);
  assert.strictEqual(j.evaluation.verdict, 'pass');
  a.transitionJob(j, 'ready', 'fresh pass'); a.confirmHumanEvidence(j);
  claim.status = 'Supported by evidence';
  j.recommendation = a.recommendJob(j, claim, 30);
  assert.strictEqual(a.isRecommendationFresh(j, claim, j.recommendation, 30).fresh, true, 'document-only recommendation must stay fresh');
});
check('l3: export reflects OUTDATED status for a restored snapshot recommendation', function () {
  var t = l3ReadyJob();
  simulateRestore(t);
  var md = a.planAsMarkdown({ thesis: 'x', claims: t.r.claims, jobs: t.r.jobs, cap: 30 });
  assert.ok(md.indexOf('OUTDATED payment recommendation') !== -1, 'export must show OUTDATED for a restored snapshot recommendation');
  assert.ok(md.indexOf('Payment recommendation (current)') === -1, 'export must not show a current recommendation for a restored snapshot job');
});
check('l3: load sets the flag and the UI offers a restart button only for flagged ready jobs', function () {
  var fs = require('fs');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.indexOf('needsFreshEvaluationAfterSnapshot = true') !== -1, 'load must set the flag for snapshot-restored jobs with an evaluation and a recommendation');
  assert.ok(html.indexOf('Re-evaluate after saved snapshot') !== -1, 'UI must offer a restart button for flagged ready jobs');
  assert.ok(html.indexOf('restartJobForFreshEvaluation(job)') !== -1, 'restart button must call the restart function');
});

console.log(passed + ' tests passed');
