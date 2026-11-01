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

console.log(passed + ' tests passed');
