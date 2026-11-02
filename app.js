// Thesis Agent — pure, dependency-free logic.
// Core logic makes no network calls and uses no wallet or keys; the optional live quote, RPC proof panel, and link check make network calls only when the user presses them. Every verdict starts as
// "Not yet tested". Nothing here sends a transaction or moves money.
// The evidence check below is a local FORMAT check only: it checks
// that a note names a source, gives a date, and gives an openable
// reference. It does not prove the evidence itself is true.
(function (root) {
  'use strict';

  var claimUidCounter = 0;
  function newClaimUid() { claimUidCounter += 1; return 'claim-' + claimUidCounter; }
  // QA2-10: every human review gets a stable id so the export can
  // tell a current review apart from an archived copy of it, even
  // when the note text is identical. Ids survive JSON save/restore.
  var reviewSeq = 0;
  function newReviewId() { reviewSeq += 1; return 'review-' + reviewSeq + '-' + Date.now(); }
  function ensureClaimUid(claim) {
    if (!claim.uid) claim.uid = newClaimUid();
    return claim.uid;
  }
  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function stripLeadingConnectors(text) {
    var t = clean(text);
    var before;
    do {
      before = t;
      t = t.replace(/^(and|but|so|then|also)\s+/i, '').trim();
      t = t.replace(/^[,;]\s*/, '').trim();
    } while (t !== before);
    return t;
  }

  function classifyClaim(text) {
    var lower = text.toLowerCase();
    if (/\?$/.test(text.trim())) return 'Check';
    if (/(better than|outperform|more than|higher than|cheaper than|faster than)/.test(lower)) return 'Comparison';
    // Cause and effect is checked BEFORE Prediction on purpose: a causal
    // mechanism must not be mislabelled Prediction merely because it
    // contains "will" (for example, "AI will increase output").
    // QA D13: word boundaries, so "flowers" does not match "lower"
    // and "willing" does not match "will". "by 20" keeps no trailing
    // boundary, so "by 2025" still counts as a future marker.
    if (/\b(because|causes|leads to|increase|increases|increased|decrease|decreases|decreased|reduce|reduces|reduced|improve|improves|improved|lower|lowers|lowered|raise|raises|raised|lose|loses|lost|gain|gains|gained|hurt|hurts|help|helps|helped|affect|affects|affected|impact|impacts|impacted|drive|drives|driven|boost|boosts|boosted|cut|cuts|save|saves|saved)\b/.test(lower)) return 'Cause and effect';
    if (/(\bwill\b|\bfuture\b|\bby 20|\bnext year\b|\bgrowth\b)/.test(lower)) return 'Prediction';
    if (/\b(is|are|means|defined as)\b/.test(lower)) return 'Definition';
    return 'General claim';
  }

  function extractDetails(text) {
    var t = clean(text);
    var numbers = [];
    var years = [];
    var populations = [];
    var m;
    var numRe = /\b\d+(?:\.\d+)?\s?%/g;
    while ((m = numRe.exec(t)) !== null) {
      var n = m[0].trim();
      if (numbers.indexOf(n) === -1) numbers.push(n);
    }
    var yearRe = /\b(?:19|20)\d{2}\b/g;
    while ((m = yearRe.exec(t)) !== null) {
      if (years.indexOf(m[0]) === -1) years.push(m[0]);
    }
    var popRe = /\b(?:for|among|in)\s+([a-z]+(?:\s+[a-z]+){0,2}\s+(?:teams|workers|traders|businesses|students|customers|families|users|patients|employees))\b/i;
    var pop = popRe.exec(t);
    if (pop) populations.push(pop[1].trim());
    return { numbers: numbers, years: years, populations: populations };
  }

  function tailor(sentence, details) {
    var parts = [sentence];
    if (details.numbers.length) parts.push('Use the stated number(s) as the target to check: ' + details.numbers.join(', ') + '.');
    if (details.years.length) parts.push('Check against the stated year(s): ' + details.years.join(', ') + '.');
    if (details.populations.length) parts.push('Focus on this group specifically, not a different group: ' + details.populations.join(', ') + '.');
    return parts.join(' ');
  }

  function evidenceFor(kind, details) {
    var base;
    if (kind === 'Check') base = 'The answer to the question, with its source named';
    else if (kind === 'Comparison') base = 'Side-by-side data for both options, measured the same way';
    else if (kind === 'Prediction') base = 'A dated forecast plus the actual result when the date arrives';
    else if (kind === 'Cause and effect') base = 'Before-and-after data, or a comparison group without the change';
    else if (kind === 'Definition') base = 'The source definition and one clear example';
    else base = 'A named source, a number, or a document you can open and check';
    return details ? tailor(base, details) : base;
  }

  function measureFor(kind, details) {
    var base;
    if (kind === 'Check') base = 'Answer the question directly, then note what would prove the answer wrong';
    else if (kind === 'Comparison') base = 'Record the same measure for both sides and note the difference';
    else if (kind === 'Prediction') base = 'Write the expected number and date now, then compare later';
    else if (kind === 'Cause and effect') base = 'Measure before the change, then again after, on the same group';
    else if (kind === 'Definition') base = 'Check whether the example fits every part of the definition';
    else base = 'Write down what would count as passing, before you look for proof';
    return details ? tailor(base, details) : base;
  }

  // Local format check only. Returns which of the three required
  // elements are missing, so the UI can show them by name.
  function checkEvidence(note) {
    var t = clean(note);
    var missing = [];
    // Named source: at least one alphabetic word of 3+ letters, ignoring
    // bare numbers, years, and month names on their own — and ignoring
    // words that only appear inside a link or file name, so a bare URL
    // does not count as naming a source.
    var words = t.replace(/https?:\/\/\S+|www\.\S+|[A-Za-z0-9_-]+\.(?:pdf|docx?|xlsx?|csv|md|txt|png|jpe?g)\b/gi, ' ')
      .replace(/\b(?:19|20)\d{2}\b/g, ' ')
      .replace(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi, ' ')
      .match(/[A-Za-z]{3,}/g) || [];
    if (!words.length) missing.push('a named source');
    // Date: a year, or a month and a year (the year is what is checked).
    if (!/\b(?:19|20)\d{2}\b/.test(t)) missing.push('a date (a year, or a month and year)');
    // Openable reference: a link, or a document/file name with an
    // extension (for example, sales-ledger.pdf or ledger.xlsx).
    if (!/(https?:\/\/|www\.|[A-Za-z0-9_-]+\.(?:pdf|docx?|xlsx?|csv|md|txt|png|jpe?g))\b/i.test(t)) {
      missing.push('an openable reference (a link or a document name)');
    }
    return { passed: missing.length === 0, missing: missing };
  }

  // Phase 1, three-tier evidence verification. Pure logic, no network
  // call here: the caller supplies a fetch result (or null when no
  // live check was run), so tests can inject it and the UI can pass
  // a real browser fetch result. NEVER label anything verified unless
  // the live check returned a 2xx status for a URL in the note.
  // Reachable proves only that the link opens, never that the claim
  // itself is true.
  function extractFirstUrl(note) {
    var t = clean(note);
    var m = t.match(/https?:\/\/[^\s<>"']+/i) || t.match(/www\.[^\s<>"']+/i);
    if (!m) return null;
    return m[0].replace(/[.,;\)\]]+$/, '');
  }

  function classifyEvidenceVerification(note, fetchResult) {
    var format = checkEvidence(note);
    if (!format.passed) {
      return { tier: 'failed', label: 'Failed', detail: 'Failed format check: missing ' + format.missing.join(', ') + '.', formatPassed: false, url: extractFirstUrl(note) };
    }
    var url = extractFirstUrl(note);
    if (!url) {
      return { tier: 'format-only', label: 'Format only', detail: 'Passed format check: named source, date, and document name present. No URL to check live, so this is NOT verified as reachable.', formatPassed: true, url: null };
    }
    // QA D1 defence in depth: a fetch result for a different URL must
    // never label this note verified. The UI sequence token is the
    // primary guard; this check covers a stale verification object
    // reaching evaluation after the note changed.
    if (fetchResult && fetchResult.url && fetchResult.url !== url) {
      return { tier: 'format-only', label: 'Format only', detail: 'Passed format check. Live link check result was for a different URL, so this is NOT verified as reachable.', formatPassed: true, url: url };
    }
    if (!fetchResult) {
      return { tier: 'format-only', label: 'Format only', detail: 'Passed format check. Live link check not run, so this is NOT verified as reachable.', formatPassed: true, url: url };
    }
    if (fetchResult.error) {
      return { tier: 'format-only', label: 'Format only', detail: 'Passed format check. Live link check failed (' + String(fetchResult.error) + '), so this is NOT verified as reachable. The format check is kept as fallback.', formatPassed: true, url: url };
    }
    var status = fetchResult.status;
    if (typeof status === 'number' && status >= 200 && status < 300) {
      return { tier: 'verified-reachable', label: 'Verified reachable', detail: 'Live link check: URL returned HTTP ' + status + '. This proves only that the link opens, NOT that the claim is true.', formatPassed: true, url: url, status: status };
    }
    return { tier: 'format-only', label: 'Format only', detail: 'Passed format check. Live link check returned HTTP ' + String(status) + ', so this is NOT verified as reachable. The format check is kept as fallback.', formatPassed: true, url: url, status: status };
  }

  // QA2-05: a restored verification is a saved historical snapshot,
  // never a fresh live check. It is labelled with its saved date
  // (when one was recorded) and the words "not re-checked".
  function snapshotPrefix(v) {
    if (!v || !v.snapshot) return '';
    var datePart = (v.checkedAt && String(v.checkedAt).slice(0, 10)) ? ' from ' + String(v.checkedAt).slice(0, 10) : '';
    return 'Saved live-check' + datePart + ' (not re-checked): ';
  }
  function evidenceVerificationText(c) {
    if (!c.note) return 'Not checked (no evidence note yet)';
    if (c.evidenceVerification) {
      return snapshotPrefix(c.evidenceVerification) + c.evidenceVerification.label + ': ' + c.evidenceVerification.detail;
    }
    // Backwards compatible: claims created before Phase 1 have no
    // verification object, so they report the format check only.
    return evidenceCheckText(c);
  }

  // QA2-02/QA2-04: compound noun phrases and comma-grouped numbers that
  // must survive splitting. The list is deliberately closed and
  // test-covered: adding a phrase is a one-line, one-test change, not
  // a broad splitting rule. Single letters (the A and B and C test)
  // are not in this list, so they still split as before.
  var QA2_COMPOUND_PHRASES = ['research and development', 'supply and demand', 'trial and error', 'checks and balances', 'pros and cons', 'cost and benefit'];

  function splitSubClaims(thesis) {
    var thesisClean = clean(thesis);
    var claims = [];
    var capped = false;
    var totalFound = 0;
    // Protect grouped numbers (1,200,000) and listed compound phrases
    // with control-character placeholders before any comma/and/but
    // split, then restore the exact original text afterwards.
    var protectedTokens = [];
    function protectText(text) {
      var out = String(text);
      out = out.replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, function (m) {
        protectedTokens.push(m);
        return '\u0001' + (protectedTokens.length - 1) + '\u0001';
      });
      QA2_COMPOUND_PHRASES.forEach(function (phrase) {
        var re = new RegExp('\\b' + phrase.replace(/ /g, '\\s+') + '\\b', 'gi');
        out = out.replace(re, function (m) {
          protectedTokens.push(m);
          return '\u0001' + (protectedTokens.length - 1) + '\u0001';
        });
      });
      out = out.replace(/\bsupply\s*&\s*demand\b/gi, function (m) {
        protectedTokens.push(m);
        return '\u0001' + (protectedTokens.length - 1) + '\u0001';
      });
      return out;
    }
    function restoreText(text) {
      return String(text).replace(/\u0001(\d+)\u0001/g, function (m, i) {
        return protectedTokens[parseInt(i, 10)] || m;
      });
    }
    thesisClean = protectText(thesisClean);

    function finish(list) {
      list.forEach(function (item) { if (item && item.text) item.text = restoreText(item.text); });
      totalFound = list.length;
      if (list.length > 5) {
        capped = true;
        list = list.slice(0, 5);
      }
      var out = list;
      out.totalFound = totalFound;
      out.capped = capped;
      return out;
    }

    // Leading "because": "Because <cause>, <effect>".
    var leadingBecause = thesisClean.match(/^because\s+(.+)$/i);
    if (leadingBecause) {
      var rest = leadingBecause[1];
      var commaAt = rest.indexOf(',');
      if (commaAt > 0) {
        var cause = stripLeadingConnectors(rest.slice(0, commaAt));
        var effect = stripLeadingConnectors(rest.slice(commaAt + 1));
        if (cause.length >= 2 && effect.length >= 2) {
          return finish([
            { text: effect, role: 'Effect claimed' },
            { text: cause, role: 'Cause claimed' },
            { text: 'What evidence would show this cause does NOT produce this effect?', role: 'Falsification check' }
          ]);
        }
      }
    }

    // Any "because": first part is the effect, every following part is
    // a claimed cause, plus one falsification check.
    var becauseParts = thesisClean.split(/\s+because\s+/i);
    if (becauseParts.length >= 2) {
      var effectPart = stripLeadingConnectors(becauseParts[0]);
      var causes = becauseParts.slice(1).map(stripLeadingConnectors).filter(function (p) { return p.length >= 2; });
      if (effectPart.length >= 2 && causes.length) {
        claims.push({ text: effectPart, role: 'Effect claimed' });
        causes.forEach(function (c, i) {
          claims.push({ text: c, role: causes.length === 1 ? 'Cause claimed' : 'Cause claimed ' + (i + 1) });
        });
        claims.push({ text: 'What evidence would show this cause does NOT produce this effect?', role: 'Falsification check' });
        return finish(claims);
      }
    }

    var parts = thesisClean
      .split(/\s+(?:so that|in order to)\s+/i)
      .join(' | ')
      .split(/\s*[,;]\s*|\s+and\s+|\s+but\s+|\s*\|\s*/)
      .map(stripLeadingConnectors)
      // QA D7: single-letter fragments must survive splitting, or
      // an "A and B and C" thesis loses every fragment but the last.
      .filter(function (p) { return p.length >= 1; });
    // Keep the whole thesis as claim 1 if splitting produced nothing useful.
    if (parts.length === 0) parts = [thesisClean];
    if (parts.length === 1) {
      return finish([
        { text: parts[0], role: 'Main claim' },
        { text: 'What evidence would change your mind about this claim?', role: 'Falsification check' },
        { text: 'Who is affected by this claim, and in what situation?', role: 'Scope check' }
      ]);
    }
    return finish(parts.map(function (p, i) {
      return { text: p, role: i === 0 ? 'Main claim' : 'Sub-claim ' + i };
    }));
  }

  function analyseThesis(raw) {
    var thesis = clean(raw);
    if (!thesis) return { error: 'Type a thesis or claim first, then press Break it down.' };
    if (thesis.length < 10) return { error: 'That is a bit short to test. Add a few more words, for example who it affects and what changes.' };
    var split = splitSubClaims(thesis);
    var claims = split.map(function (c, i) {
      var kind = classifyClaim(c.text);
      var details = extractDetails(c.text);
      return {
        id: i + 1,
        uid: newClaimUid(),
        role: c.role,
        text: c.text,
        kind: kind,
        measure: measureFor(kind, details),
        evidence: evidenceFor(kind, details),
        passRule: 'Pass only if the evidence is named, dated, and openable. Otherwise it stays untested.',
        status: 'Not yet tested',
        note: '',
        evidenceCheck: null,
        evidenceVerification: null
      };
    });
    var result = {
      thesis: thesis,
      claimCount: claims.length,
      claims: claims,
      summary: 'This thesis breaks into ' + claims.length + ' checkable parts. None of them is marked true or false yet. Add evidence for each part, then mark it yourself.'
    };
    // Default cap 30 demo units; the page rebuilds jobs whenever the
    // user changes the cap or cuts a job.
    result.cap = 30;
    result.jobs = buildAgentJobs(claims, 30).jobs;
    result.agentTotals = recomputeJobs(result.jobs, 30);
    if (split.capped) {
      result.capped = true;
      result.totalFound = split.totalFound;
      result.cappedWarning = 'Note: ' + split.totalFound + ' checkable parts were found, but only the first 5 are shown, so the plan stays readable on a phone screen. The parts beyond 5 are not in this plan.';
      result.summary += ' ' + result.cappedWarning;
    }
    return result;
  }

  // R5 agent loop, DEMO ONLY. Demo quotes are fixed illustrative
  // values assigned in job order, not prices from any real agent, and
  // the checkers are named demo checkers, not accounts. No live
  // payment, no hire, no real quote, no wallet, no key.
  var DEMO_QUOTES = [8, 12, 10, 18, 9];
  var DEMO_CHECKERS = ['Demo Checker A', 'Demo Checker B', 'Demo Checker C'];
  var DEMO_PLANNED = 10;

  function demoQuoteFor(index) { return DEMO_QUOTES[index % DEMO_QUOTES.length]; }
  function demoCheckerFor(index) { return DEMO_CHECKERS[index % DEMO_CHECKERS.length]; }

  // Module: Skill Registry (Stage 1, rule-based only).
  // A skill is a check a job needs, not a person. A checker profile
  // is a named tool profile, not an account. No LLM is used here;
  // see Reasoning Provider below for the future, disabled slot.
  var COMMON_SKILLS = ['source-name extractor', 'date extractor', 'link reachability checker', 'duplicate detector'];
  var SKILL_REGISTRY = {
    'Cause and effect': ['before-and-after data checker', 'comparison-group checker'],
    'Comparison': ['side-by-side measure checker', 'same-unit checker'],
    'Prediction': ['forecast date checker', 'actual-result checker'],
    'Definition': ['example-fit checker', 'source-definition checker'],
    'General claim': ['source checker'],
    'Check': ['source checker']
  };
  function skillsForKind(kind) {
    var specific = SKILL_REGISTRY[kind] || SKILL_REGISTRY['General claim'];
    return specific.concat(COMMON_SKILLS);
  }
  function checkerProfileFor(kind, index) {
    var names = ['Demo Checker A', 'Demo Checker B', 'Demo Checker C'];
    var name = names[index % names.length];
    return { name: name, description: 'Demo checker profile (demo only, not an account). Runs the job skills as local checks; it does not judge truth.', skills: skillsForKind(kind) };
  }

  // Module: Reasoning Provider interface (Stage 1, modular only).
  // Default provider is rule-based. A future genuine LLM provider, if
  // ever approved in a separate Stage 5 plan, must implement the same
  // input and output shape and must label its source as "model".
  // No LLM code, key, or API call exists in Stages 1-4. This interface
  // exists so that layer can be added later without rebuilding the
  // planner, state machine, evaluator, or recommender.
  var REASONING_PROVIDERS = {
    rule: { name: 'rule-based planner', source: 'rule' }
  };
  // Stage 2 check-result types, defined here so the evaluator interface
  // is stable: exact = value present exactly; potential-mismatch =
  // a different value is present and needs human review, not proof of
  // error; missing = claim has a value and the note has none to compare;
  // inconclusive = no comparable value, blocked fetch, or local document
  // only, so the check cannot decide and must be held for human review.
  var CHECK_RESULT_TYPES = ['exact', 'potential-mismatch', 'missing', 'inconclusive'];

  // Module: Job State Machine (Stage 1, clarified states).
  // Planning decision (Buy / Counter / Do it yourself) is SEPARATE
  // from work submission. Marking a claim decided does NOT move a job
  // to submitted, and a planning decision does NOT imply work was
  // submitted. Work moves only by an explicit submit action, and by
  // the evaluator / correction logic in later stages.
  // Main path: assigned -> submitted -> checked -> ready.
  // Correction path: checked -> correction-requested -> resubmitted -> checked.
  // After two unsuccessful correction rounds, checked -> escalated.
  var ALLOWED_TRANSITIONS = {
    'assigned': ['submitted'],
    'submitted': ['checked'],
    'checked': ['ready', 'correction-requested', 'escalated'],
    'correction-requested': ['resubmitted', 'escalated'],
    'resubmitted': ['checked'],
    'ready': [],
    'escalated': []
  };
  function transitionJob(job, toState, reason) {
    var from = job.workState;
    var allowed = ALLOWED_TRANSITIONS[from] || [];
    if (allowed.indexOf(toState) === -1) {
      return { ok: false, error: 'Invalid transition: ' + from + ' -> ' + toState + '. Allowed from ' + from + ': ' + (allowed.length ? allowed.join(', ') : 'none') + '.' };
    }
    // Stage 3 guard: a held or escalated job can never become ready.
    // Only a fresh pass evaluation can move a job forward to ready.
    if (toState === 'ready' && (!job.evaluation || job.evaluation.verdict !== 'pass')) {
      return { ok: false, error: 'Cannot move to ready: job has no fresh pass evaluation. Held, rejected, and escalated jobs cannot become ready.' };
    }
    job.workState = toState;
    job.history = job.history || [];
    job.history.push({ from: from, to: toState, reason: reason || '', source: 'rule' });
    return { ok: true, job: job };
  }
  // Module: Correction Loop (Stage 3). A correction request identifies
  // the exact check that failed or needs clarification, and explains
  // what needs attention, without inventing information, suggesting a
  // fabricated source, or telling the user what figure to insert.
  // It never changes the claim or the evidence note; only the user
  // edits those and resubmits. This is a rule-based consistency check,
  // not a verification that evidence is truthful.
  function buildCorrectionRequest(evaluation, round) {
    var instructions = [];
    var failing = (evaluation.checks || []).filter(function (c) { return (c.result === 'potential-mismatch' || c.result === 'missing' || c.result === 'inconclusive') && !(c.name === 'reachability' && c.finding.indexOf('No URL') === 0); });
    failing.forEach(function (c) {
      if (c.name === 'format') instructions.push('Format check: ' + c.finding + ' Add those elements from your own source. Do not invent a source.');
      else if (c.name === 'numbers' && c.result === 'potential-mismatch') instructions.push('Numbers check: ' + c.finding + ' Check your source and update the note so the number it gives matches the source you are citing. Do not insert a figure you have not checked in the source.');
      else if (c.name === 'numbers' && c.result === 'missing') instructions.push('Numbers check: ' + c.finding + ' Add the number from your source, if your source gives one, or note in the evidence that the source gives no number.');
      else if (c.name === 'numbers') instructions.push('Numbers check: ' + c.finding + ' Clarify in the note which figure relates to this claim, based on your source.');
      else if (c.name === 'years' && c.result === 'potential-mismatch') instructions.push('Years check: ' + c.finding + ' Check your source and update the note so the year it gives matches the source you are citing. Do not insert a year you have not checked in the source.');
      else if (c.name === 'years' && c.result === 'missing') instructions.push('Years check: ' + c.finding + ' Add the year from your source, if your source gives one.');
      else if (c.name === 'years') instructions.push('Years check: ' + c.finding + ' Clarify which year your source covers for this claim.');
      else if (c.name === 'keywords' && c.result === 'potential-mismatch') instructions.push('Keywords check: ' + c.finding + ' Check whether this note is for the right document, and update it to the correct source if it is not. Do not invent a source.');
      else if (c.name === 'keywords') instructions.push('Keywords check: ' + c.finding + ' Clarify which part of your source covers this claim.');
      else if (c.name === 'reachability') instructions.push('Reachability check: ' + c.finding + ' Open the link yourself and confirm it opens; if it does not, replace it with a link or document name you can open.');
      else instructions.push(c.name + ' check: ' + c.finding);
    });
    if (evaluation.verdict === 'reject') instructions.unshift('Evidence note check: the note failed the format check, so it cannot be evaluated as written. Fix the note format first, using your own source.');
    return { round: round, verdict: evaluation.verdict, checks: failing.map(function (c) { return c.name + ': ' + c.result + ' — ' + c.finding; }), instructions: instructions, source: 'rule', summary: 'Correction requested for the exact checks listed above. This is a rule-based consistency check, not a verification that evidence is truthful.' };
  }
  function requestCorrection(job, evaluation) {
    if (job.workState !== 'checked') {
      return { ok: false, error: 'Correction can only be requested from checked, not from ' + job.workState + '.' };
    }
    var ev = evaluation || job.evaluation;
    if (!ev) return { ok: false, error: 'Correction needs an evaluation to base it on; no evaluation is recorded for this job.' };
    if (ev.verdict === 'pass') return { ok: false, error: 'Correction cannot be requested for a passing evaluation.' };
    if (job.correctionRound >= 2) {
      return transitionJob(job, 'escalated', 'Two correction rounds failed; escalated for human review. Automatic correction loop stopped.');
    }
    job.correctionRound += 1;
    var req = buildCorrectionRequest(ev, job.correctionRound);
    job.correctionRequest = req; job.correctionHistory = job.correctionHistory || []; job.correctionHistory.push(req);
    return transitionJob(job, 'correction-requested', 'Correction round ' + job.correctionRound + ': ' + req.instructions.join(' '));
  }
  // P0 escalation workflow: a pure, unit-testable banner message, and
  // an explicit human-reviewed restart. Restart moves an escalated
  // job back to assigned so fresh evidence can be submitted and
  // evaluated again, but it deliberately does NOT reset the
  // correction round: it stays at 2, so a further unsuccessful
  // correction request escalates again instead of opening a new
  // two-round loop. Correction and evaluation histories are
  // preserved, and the previous evaluation is archived before it is
  // cleared, so repeated restarts remain visible in history.
  function escalationMessage(job) {
    if (!job || job.workState !== 'escalated') return null;
    return 'Escalated: automatic corrections stopped after 2 rounds. The rule-based evaluator could not reach a confident result in two correction attempts. No further automatic correction will be created for this job. A human must review the claim, the evidence note, the evaluation checks, and the correction instructions, then choose Restart this job below. If you resolve the evidence outside this demo, restart here with the corrected note and go through Submit and Evaluate again. Get payment recommendation will remain Hold while this job is escalated. Correction round stays at 2 after a restart, so a further unsuccessful correction request will escalate again.';
  }
  function restartEscalatedJob(job) {
    if (!job || job.workState !== 'escalated') {
      return { ok: false, error: 'Only an escalated job can be restarted, not a job in state ' + (job ? job.workState : 'unknown') + '.' };
    }
    if (job.evaluation) {
      job.evaluationHistory = job.evaluationHistory || [];
      job.evaluationHistory.push({ round: job.correctionRound, verdict: job.evaluation.verdict, summary: job.evaluation.summary, checks: job.evaluation.checks, reasons: job.evaluation.reasons, source: 'rule' });
    }
    job.evaluation = null;
    job.checks = [];
    job.correctionRequest = null;
    job.humanEvidenceConfirmation = false;
    job.humanReview = null;
    job.previouslyEscalated = true;
    // Correction round is intentionally NOT reset: it stays at 2.
    job.history = job.history || [];
    job.history.push({ from: 'escalated', to: 'assigned', reason: 'Human-reviewed restart after escalation. Correction round stays at 2; a further unsuccessful correction request will escalate again. Previous evaluation and confirmation cleared; correction and evaluation histories preserved.', source: 'user' });
    job.workState = 'assigned';
    return { ok: true, job: job };
  }


  // Module: Rule-based Evaluator (Stage 2). This is NOT an AI and NOT
  // an intelligent fact-checker. It runs fixed rules only, it does not
  // read source content, and it never judges whether a claim is true.
  // It separates three dimensions, which are different things:
  //   format: does the note name a source, give a date, and give a
  //     link or document name? (existing checkEvidence)
  //   reachability: does a URL in the note open (HTTP 2xx), or is it
  //     inaccessible, or is there no URL to check (document only)?
  //   support-consistency: do numbers, years, and key terms in the
  //     claim appear, in a comparable way, in the note? This checks
  //     consistency between two strings only. A match never proves
  //     the claim is true or adequately supported, because the rule
  //     cannot check context, meaning, or source content.
  // Verdicts: pass (rule-based checks only), hold (human review
  // needed), reject (evidence note fails format, so the submission
  // itself is not acceptable; this is not a judgement on the claim).
  // Uncertain cases always return hold, never pass and never reject.
  var EVALUATOR_STOPWORDS = ['about', 'after', 'against', 'among', 'because', 'before', 'between', 'during', 'every', 'their', 'these', 'those', 'through', 'under', 'using', 'which', 'while', 'with', 'without', 'would', 'could', 'should'];
  function extractEvaluatorNumbers(text) {
    var t = clean(text);
    // QA four-digit fix: record comma-grouped quantities first, so
    // "1,950" is kept as a quantity and is not mistaken for a year
    // after its comma is collapsed to "1950".
    var commaGrouped = {};
    var cgRe = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g;
    var cm;
    while ((cm = cgRe.exec(t)) !== null) { commaGrouped[cm[0].replace(/,/g, '')] = true; }
    while (/(\d),(\d)/.test(t)) t = t.replace(/(\d),(\d)/g, '$1$2');
    var out = []; var m;
    var re = /\b\d+(?:\.\d+)?\s?(?:%|percent)?\b/g;
    while ((m = re.exec(t)) !== null) {
      var v = m[0].replace(/\s*(%|percent)\s*$/i, '').trim();
      if (/\b(?:19|20)\d{2}\b/.test(m[0]) && !commaGrouped[v]) continue;
      if (out.indexOf(v) === -1) out.push(v);
    }
    return out;
  }
  // QA2-09: a year-range number immediately followed by a unit or
  // count noun (1950 units) is a quantity, not a year, so it must
  // not be counted as a year. A bare year (in 1950) still counts.
  var QA2_QUANTITY_UNITS = ['units', 'unit', 'items', 'item', 'people', 'sales', 'dollars', 'dollar', 'naira', 'pieces', 'piece', 'orders', 'order', 'customers', 'customer', 'visitors', 'visitor', 'views', 'downloads', 'copies', 'copy', 'tickets', 'ticket'];
  function extractEvaluatorYears(text) {
    var t = clean(text); var out = []; var m; var re = /\b(?:19|20)\d{2}\b/g;
    while ((m = re.exec(t)) !== null) {
      var after = t.slice(re.lastIndex).match(/^\s+([A-Za-z]+)/);
      if (after && QA2_QUANTITY_UNITS.indexOf(after[1].toLowerCase()) !== -1) continue;
      if (out.indexOf(m[0]) === -1) out.push(m[0]);
    }
    return out;
  }
  // QA2-09: quantities for comparison only. extractEvaluatorNumbers
  // keeps its locked contract (plain 1950 units gives []), so this
  // helper adds cue quantities and normalises decimals (1200.50
  // becomes 1200.5) without changing that contract. A bare year is
  // never added here: the cue noun is required.
  function normaliseQuantityValue(v) {
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? String(v) : String(n);
  }
  function evaluatorComparisonQuantities(text) {
    var vals = extractEvaluatorNumbers(text).map(normaliseQuantityValue);
    var t = clean(text); var m;
    var cueRe = /\b(?:19|20)\d{2}\s+(units?|items?|people|sales|dollars?|naira|pieces?|orders?|customers?|visitors?|views|downloads|copies|tickets?)\b/gi;
    while ((m = cueRe.exec(t)) !== null) {
      var v = normaliseQuantityValue(m[0].match(/\d+/)[0]);
      if (vals.indexOf(v) === -1) vals.push(v);
    }
    return vals;
  }
  function significantKeywords(text) {
    var words = (clean(text).toLowerCase().match(/[a-z]{4,}/g) || []);
    var out = [];
    words.forEach(function (w) {
      if (EVALUATOR_STOPWORDS.indexOf(w) !== -1) return;
      if (out.indexOf(w) === -1) out.push(w);
    });
    return out;
  }
  function evaluateSubmission(claimText, note, verificationOrFetch, allClaimTexts) {
    var claim = clean(claimText); var noteText = clean(note || '');
    var verification = null;
    if (verificationOrFetch && verificationOrFetch.tier) verification = verificationOrFetch;
    else verification = classifyEvidenceVerification(noteText, verificationOrFetch || null);
    // QA D1: a verified-reachable object for a different URL must not
    // reach the reachability check. Downgrade it to format-only here,
    // before any check reads its tier.
    if (verification && verification.tier === 'verified-reachable' && verification.url && verification.url !== extractFirstUrl(noteText)) {
      verification = classifyEvidenceVerification(noteText, null);
    }
    // QA2-05: a saved snapshot must never count as a fresh live
    // check for a current evaluation. Downgrade it to format-only;
    // the user must re-run Check link live for a live result.
    if (verification && verification.snapshot) {
      verification = classifyEvidenceVerification(noteText, null);
    }
    var checks = []; var reasons = [];
    // 1. Format
    var format = checkEvidence(noteText);
    if (format.passed) checks.push({ name: 'format', dimension: 'format', result: 'exact', finding: 'Note names a source, gives a date, and gives a link or document name.' });
    else checks.push({ name: 'format', dimension: 'format', result: 'missing', finding: 'Note fails format check: missing ' + format.missing.join(', ') + '.' });
    // 2. Reachability
    if (verification.tier === 'verified-reachable') checks.push({ name: 'reachability', dimension: 'reachability', result: 'exact', finding: 'URL opened (HTTP ' + (verification.status || '2xx') + '). Reachability only; it does not show the claim is supported.' });
    else if (verification.url) checks.push({ name: 'reachability', dimension: 'reachability', result: 'inconclusive', finding: 'URL present but not verified as reachable (' + verification.label + '). Link must be opened by a human before support can be assessed.' });
    else checks.push({ name: 'reachability', dimension: 'reachability', result: 'inconclusive', finding: 'No URL in note; document name only. Reachability cannot be checked, and is not counted as a failure on its own.' });
    // 3a. Numbers
    var claimNums = evaluatorComparisonQuantities(claim); var noteNums = evaluatorComparisonQuantities(noteText);
    if (!claimNums.length) checks.push({ name: 'numbers', dimension: 'support-consistency', result: 'inconclusive', finding: 'Claim gives no number to compare, so no number check is possible. This check neither passes nor fails the submission.' });
    else if (!noteNums.length) checks.push({ name: 'numbers', dimension: 'support-consistency', result: 'missing', finding: 'Claim gives number(s) ' + claimNums.join(', ') + ', but the note gives no number to compare.' });
    else {
      var matched = claimNums.filter(function (n) { return noteNums.indexOf(n) !== -1; });
      var unmatched = claimNums.filter(function (n) { return noteNums.indexOf(n) === -1; });
      var extraNums = noteNums.filter(function (n) { return claimNums.indexOf(n) === -1; });
      if (extraNums.length && matched.length) checks.push({ name: 'numbers', dimension: 'support-consistency', result: 'inconclusive', finding: 'Note contains both matching number(s) ' + matched.join(', ') + ' and different number(s) ' + extraNums.join(', ') + '; context cannot be determined by rules, so this is ambiguous.' });
      else if (unmatched.length) checks.push({ name: 'numbers', dimension: 'support-consistency', result: 'potential-mismatch', finding: 'Claim number(s) ' + unmatched.join(', ') + ' do not appear in the note. Note number(s): ' + noteNums.join(', ') + '. This may be a different figure, not proof of error.' });
      else checks.push({ name: 'numbers', dimension: 'support-consistency', result: 'exact', finding: 'Claim number(s) ' + claimNums.join(', ') + ' appear in the note. A matching number does not prove the claim is true; context was not checked.' });
    }
    // 3b. Years
    var claimYears = extractEvaluatorYears(claim); var noteYears = extractEvaluatorYears(noteText);
    if (!claimYears.length) checks.push({ name: 'years', dimension: 'support-consistency', result: 'inconclusive', finding: 'Claim gives no year to compare.' });
    else if (!noteYears.length) checks.push({ name: 'years', dimension: 'support-consistency', result: 'missing', finding: 'Claim gives year(s) ' + claimYears.join(', ') + ', but the note gives no year to compare.' });
    else {
      var yMatched = claimYears.filter(function (y) { return noteYears.indexOf(y) !== -1; });
      var yUnmatched = claimYears.filter(function (y) { return noteYears.indexOf(y) === -1; });
      if (yUnmatched.length) checks.push({ name: 'years', dimension: 'support-consistency', result: 'potential-mismatch', finding: 'Claim year(s) ' + yUnmatched.join(', ') + ' do not appear in the note. Note year(s): ' + noteYears.join(', ') + '. This needs human review, it is not proof of error.' });
      else checks.push({ name: 'years', dimension: 'support-consistency', result: 'exact', finding: 'Claim year(s) ' + claimYears.join(', ') + ' appear in the note. A matching year does not prove the claim is true.' });
    }
    // 3c. Keywords: unrelated, ambiguous, or consistent
    var claimKeys = significantKeywords(claim); var noteLower = noteText.toLowerCase();
    var keyMatched = claimKeys.filter(function (k) { return noteLower.indexOf(k) !== -1; });
    if (!claimKeys.length) checks.push({ name: 'keywords', dimension: 'support-consistency', result: 'inconclusive', finding: 'Claim has no significant keyword to compare.' });
    else if (!keyMatched.length) checks.push({ name: 'keywords', dimension: 'support-consistency', result: 'potential-mismatch', finding: 'Note mentions none of the claim key terms (' + claimKeys.join(', ') + '), so the note may be for an unrelated document.' });
    else if (keyMatched.length < claimKeys.length && keyMatched.length < 2) checks.push({ name: 'keywords', dimension: 'support-consistency', result: 'inconclusive', finding: 'Note mentions only ' + keyMatched.join(', ') + ' of the claim key terms (' + claimKeys.join(', ') + '); evidence is ambiguous and needs human review.' });
    else checks.push({ name: 'keywords', dimension: 'support-consistency', result: 'exact', finding: 'Note mentions claim key terms: ' + keyMatched.join(', ') + '. A matching keyword or phrase does not prove the claim is true or adequately supported.' });
    // Duplicate check (M1): only when a claim list is supplied.
    // Normalised text comparison only; it does not judge meaning.
    if (allClaimTexts && allClaimTexts.length) {
      var norm = function (x) { return clean(x).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); };
      var normClaim = norm(claim);
      var dupCount = 0;
      allClaimTexts.forEach(function (x) { if (norm(x) === normClaim) dupCount += 1; });
      if (dupCount > 1) checks.push({ name: 'duplicate', dimension: 'support-consistency', result: 'potential-mismatch', finding: 'Duplicate claim detected: the same claim appears ' + dupCount + ' times. A human should merge them or distinguish them.' });
    }
    // Verdict
    var verdict, needsHumanReview;
    if (!format.passed) {
      verdict = 'reject'; needsHumanReview = false;
      reasons.push('Evidence note fails the format check, so this submission cannot be evaluated further. This is not a judgement on the claim itself; fix the note and resubmit.');
    } else {
      var bad = checks.filter(function (c) { return c.result === 'potential-mismatch' || c.result === 'missing'; });
      var uncertain = checks.filter(function (c) { return c.result === 'inconclusive' && c.name !== 'reachability' && c.name !== 'numbers' && c.name !== 'years' && c.name !== 'keywords'; });
      // Inconclusive support checks (numbers/years/keywords with no comparable value, or ambiguous) also hold, except a claim with no numbers/years/keywords to compare at all.
      var supportUncertain = checks.filter(function (c) { return c.dimension === 'support-consistency' && c.result === 'inconclusive' && !(c.name === 'numbers' && !claimNums.length) && !(c.name === 'years' && !claimYears.length) && !(c.name === 'keywords' && !claimKeys.length); });
      var linkInaccessible = verification.url && verification.tier !== 'verified-reachable';
      if (bad.length || supportUncertain.length || linkInaccessible) {
        verdict = 'hold'; needsHumanReview = true;
        checks.forEach(function (c) { if (c.result === 'potential-mismatch' || c.result === 'missing' || (c.dimension === 'support-consistency' && c.result === 'inconclusive')) reasons.push(c.name + ': ' + c.finding); });
        if (linkInaccessible) reasons.push('reachability: link in note is not verified as reachable, so a human must open it before support can be assessed.');
        reasons.push('Human review needed: the rule-based evaluator cannot confidently determine whether this evidence supports the claim.');
      } else {
        verdict = 'pass'; needsHumanReview = false;
        reasons.push('All performed rule-based checks passed. This does not establish that the claim is true or adequately supported; the source content was not read or judged.');
        if (verification.tier !== 'verified-reachable' && !verification.url) reasons.push('Reachability was not verified (document name only); that dimension remains inconclusive and is recorded separately.');
      }
    }
    return {
      verdict: verdict, source: 'rule', evaluator: 'rule-based evaluator',
      checks: checks, reasons: reasons, needsHumanReview: needsHumanReview,
      summary: verdict === 'pass' ? 'Pass (rule-based checks only). Does not prove the claim is true. Human must open and review evidence before any payment recommendation.' : verdict === 'hold' ? 'Hold for human review. Rule-based evaluator cannot confidently determine support.' : 'Reject (evidence note). Format check failed; submission not acceptable as written.',
      claimText: claim, note: noteText
    };
  }
  // H2 (broadened): Explicit human evidence confirmation. A reachable
  // URL does not prove its contents support the claim, because this
  // system does not read or verify source content, and a document-only
  // note is not opened at all. An Approve recommendation therefore
  // requires this confirmation, in addition to Ready state and a fresh
  // Pass evaluation. Confirmation is for the specific evidence that
  // was evaluated: a new evaluation resets it, and it must be given
  // again for new evidence.
  var HUMAN_CONFIRMATION_WORDING = 'I have opened and reviewed this evidence, and it supports the claim.';
  function confirmHumanEvidence(job) {
    if (!job.evaluation || job.evaluation.verdict !== 'pass') return { ok: false, error: 'Human evidence confirmation requires a pass evaluation first.' };
    job.humanEvidenceConfirmation = true;
    job.history = job.history || [];
    job.history.push({ from: job.workState, to: job.workState, reason: 'Human evidence confirmation: ' + HUMAN_CONFIRMATION_WORDING, source: 'user' });
    return { ok: true, job: job };
  }
  function clearHumanEvidenceConfirmation(job) {
    job.humanEvidenceConfirmation = false;
    job.history = job.history || [];
    job.history.push({ from: job.workState, to: job.workState, reason: 'Human evidence confirmation cleared.', source: 'user' });
    return { ok: true, job: job };
  }
  // Plan9 P1: record-only human review of a HOLD verdict. This never
  // changes the verdict, never creates a confirmation, and never
  // enables Approve on its own. It only records that a human reviewed
  // the HOLD, with their note, in history and in the export.
  function recordHumanReview(job, note) {
    if (!job || job.workState !== 'checked' || !job.evaluation || job.evaluation.verdict !== 'hold') {
      return { ok: false, error: 'Human review of a HOLD requires a checked job with a HOLD evaluation.' };
    }
    var n = clean(note || '');
    if (!n) return { ok: false, error: 'Type a short human review note first.' };
    if (n.length > 500) return { ok: false, error: 'Human review note must be 500 characters or fewer.' };
    var review = { id: newReviewId(), verdict: 'hold', note: n, source: 'user' };
    job.humanReview = review;
    job.humanReviewHistory = job.humanReviewHistory || [];
    job.humanReviewHistory.push(review);
    job.history = job.history || [];
    job.history.push({ from: job.workState, to: job.workState, reason: 'Human review of HOLD recorded: ' + n, source: 'user' });
    return { ok: true, job: job };
  }
  // P0 stale evidence protection: editing an evidence note after a
  // job was checked or marked ready invalidates that evaluation.
  // Only checked and ready jobs have a Pass to invalidate; jobs in
  // correction-requested state are already awaiting resubmission, so
  // they are left alone and their correction round is preserved.
  // The previous evaluation is moved to evaluationHistory, never
  // silently deleted, and the stored recommendation is kept so the
  // freshness check shows it as OUTDATED. Correction round and
  // correction history are preserved, so a note edit can never
  // reset the two-round correction limit.
  function invalidateStaleEvaluation(job, claim) {
    if ((job.workState !== 'checked' && job.workState !== 'ready') || !job.evaluation) {
      return { ok: true, invalidated: false, job: job };
    }
    // P0/P1 fix: when the current claim is supplied and the evaluation
    // already matches it (cleaned comparison), a keystroke or spurious
    // input event that left the note unchanged must not destroy it.
    // Without a claim argument, previous behaviour is preserved.
    if (claim && evaluationMatchesClaim(job, claim)) {
      return { ok: true, invalidated: false, job: job };
    }
    var from = job.workState;
    job.evaluationHistory = job.evaluationHistory || [];
    job.evaluationHistory.push({ round: job.correctionRound, verdict: job.evaluation.verdict, summary: job.evaluation.summary, checks: job.evaluation.checks, reasons: job.evaluation.reasons, source: 'rule', invalidatedByNoteEdit: true });
    job.evaluation = null;
    job.checks = [];
    job.humanEvidenceConfirmation = false;
    job.workState = 'assigned';
    job.history = job.history || [];
    job.history.push({ from: from, to: 'assigned', reason: 'Evidence note edited; previous evaluation invalidated. Fresh evaluation required before Ready.', source: 'rule' });
    return { ok: true, invalidated: true, job: job };
  }
  function evaluationMatchesClaim(job, claim) {
    if (!job.evaluation || !claim) return false;
    return job.evaluation.claimText === clean(claim.text) && job.evaluation.note === clean(claim.note || '');
  }
  function markReady(job, claim) {
    if (!evaluationMatchesClaim(job, claim)) {
      return { ok: false, error: 'Cannot move to ready: evaluation is stale or does not match the current claim text and evidence note. Submit and evaluate again for a fresh pass evaluation.' };
    }
    return transitionJob(job, 'ready', 'Fresh pass evaluation, user marked ready');
  }
  function evaluateJob(job, claim, verificationOrFetch, allClaims) {
    if (job.workState !== 'submitted' && job.workState !== 'resubmitted') {
      return { ok: false, error: 'Only a submitted or resubmitted job can be evaluated, not a job in state ' + job.workState + '.' };
    }
    job.humanEvidenceConfirmation = false;
    var verdict = evaluateSubmission(claim.text, claim.note || '', verificationOrFetch || claim.evidenceVerification || null, allClaims);
    // Previous findings stay in history, clearly distinguished from
    // the new evaluation. The evaluator always runs from the beginning
    // on the current claim and note; it never reuses old findings.
    if (job.evaluation) {
      job.evaluationHistory = job.evaluationHistory || [];
      job.evaluationHistory.push({ round: job.correctionRound, verdict: job.evaluation.verdict, summary: job.evaluation.summary, checks: job.evaluation.checks, reasons: job.evaluation.reasons, source: 'rule' });
    }
    job.evaluation = verdict; job.checks = verdict.checks;
    // L3: a fresh evaluation is what the snapshot flag was waiting
    // for. Clearing it here (and only here, never on a mere live
    // check or recalculation) is what makes the chain
    // check -> evaluate -> recalculate restore freshness.
    job.needsFreshEvaluationAfterSnapshot = false;
    // Plan9 P1: a new evaluation is a new finding. Any previous HOLD
    // review belongs to the previous evaluation only, so the current
    // review is cleared on every new evaluation, while the review
    // history is preserved. This is stricter than the plan wording,
    // which cleared only on a non-HOLD verdict, because clearing only
    // then would wrongly attach an old review to a new HOLD.
    job.humanReview = null;
    if (verdict.verdict === 'pass') job.previouslyEscalated = false;
    // Plan9 P1: clear the open correction request on any new
    // evaluation, not only on Pass. The request is already in
    // correctionHistory from creation time, so do not push it again:
    // push only if no value-matching entry (same round, summary, and
    // instructions, compared by value because save/restore copies
    // objects) is already present, which prevents duplicates.
    if (job.correctionRequest) {
      var openReq = job.correctionRequest;
      job.correctionHistory = job.correctionHistory || [];
      var alreadyArchived = job.correctionHistory.some(function (h) {
        return h.round === openReq.round && h.summary === openReq.summary && JSON.stringify(h.instructions || []) === JSON.stringify(openReq.instructions || []);
      });
      if (!alreadyArchived) job.correctionHistory.push(openReq);
      job.correctionRequest = null;
    }
    var moved = transitionJob(job, 'checked', 'Rule-based evaluator returned ' + verdict.verdict + ': ' + verdict.summary);
    if (!moved.ok) return { ok: false, error: moved.error };
    return { ok: true, verdict: verdict, job: job };
  }


  // M2 fix: pure part of the mobile scroll. The page code calls
  // this with the result element's viewport top and the current
  // page scroll, and scrolls the window to the element's absolute
  // document top. Keeping the arithmetic here makes it unit
  // testable in Node, where there is no DOM. It never fits the
  // result into the viewport; it lands at the result's beginning
  // and the user scrolls naturally through the rest.
  function scrollTopForElement(rectTop, pageScrollY) {
    var top = rectTop + (pageScrollY || 0);
    return top < 0 ? 0 : top;
  }

  // L3: restart a flagged ready job for fresh evaluation. Ready
  // jobs otherwise have no outgoing transition, so without this
  // function a restored ready job could never be re-evaluated in
  // the UI, and the check -> evaluate -> recalculate chain could
  // never complete. This only runs for jobs flagged after a
  // snapshot restore: it archives the old evaluation, clears
  // evaluation, checks and confirmation, moves the job back to
  // assigned, and KEEPS the flag, so freshness stays blocked until
  // evaluateJob clears it. Correction round, histories (apart from
  // the new entry), planning, cut and abandoned status are kept.
  function restartJobForFreshEvaluation(job) {
    if (!job || !job.needsFreshEvaluationAfterSnapshot) return { ok: false, error: 'This job does not require a fresh evaluation after a saved snapshot.' };
    if (job.workState !== 'ready') return { ok: false, error: 'Only a ready job can be restarted for fresh evaluation, not a job in state ' + job.workState + '.' };
    if (job.evaluation) {
      job.evaluationHistory = job.evaluationHistory || [];
      job.evaluationHistory.push({ round: job.correctionRound, verdict: job.evaluation.verdict, summary: job.evaluation.summary, checks: job.evaluation.checks, reasons: job.evaluation.reasons, source: 'rule', archivedForFreshEvaluation: true });
    }
    var from = job.workState;
    job.evaluation = null; job.checks = []; job.humanEvidenceConfirmation = false; job.humanReview = null;
    job.workState = 'assigned';
    job.history = job.history || [];
    job.history.push({ from: from, to: 'assigned', reason: 'Re-evaluation requested after saved snapshot; previous evaluation archived. Fresh evaluation required before Ready.', source: 'user' });
    return { ok: true, job: job };
  }

  // Module: Payment Recommender (Stage 4). Rule-based only, not a
  // payment decision, not a wallet, not an escrow call. It never
  // signs, transfers, or releases anything. It only recommends, for
  // human payer approval, whether a demo job looks ready for the
  // payer to consider. Demo jobs are completely separate from the
  // NEAR testnet proof panel: a demo job has no blockchain escrow
  // record unless that relationship is explicitly established, and
  // no demo job ID is ever presented as a chain job ID.
  var RECOMMENDATION_DISCLAIMER = 'Rule-based recommendation for human payer approval only. This does not release funds, authorise a payment, or make a payment decision. No payment is made by this demo.';
  function recommendJob(job, claim, cap) {
    var reasons = [];
    var rec = 'hold';
    var ev = job.evaluation || null;
    var stale = false;
    if (ev && claim) {
      // P0/P1 fix: comparisons use cleaned values only, so a trailing
      // space or double space in the note cannot make a fresh
      // evaluation read as stale. Raw text is still displayed as typed.
      if (ev.claimText && ev.claimText !== clean(claim.text)) stale = true;
      if (ev.note !== undefined && claim.note !== undefined && ev.note !== clean(claim.note || '')) stale = true;
    }
    // Reject: clearly disqualified only. Never reject merely because
    // the system cannot establish whether a claim is true.
    if (job.abandoned) { rec = 'reject'; reasons.push('Task explicitly abandoned by the user, so no payment is recommended.'); }
    else if (job.cut) { rec = 'reject'; reasons.push('Task explicitly cut by the user, so no payment is recommended.'); }
    else if (job.decision === 'Do it yourself' || (job.capStatus && job.capStatus.indexOf('Not bought') === 0)) { rec = 'reject'; reasons.push('Planning decision is Do it yourself, so no checker payment is to be made for this job.'); }
    else if (ev && ev.verdict === 'reject') { rec = 'reject'; reasons.push('Evidence note failed the format check, so this submission is clearly disqualified as written. This is not a judgement on the claim itself.'); }
    else {
      var holds = [];
      if (job.workState === 'escalated') holds.push('Job is escalated for human review; do not approve until a human resolves it.');
      if (claim && claim.status === 'Not supported by evidence') holds.push('Claim is marked Not supported by evidence by the user, so Approve cannot be recommended. Human payer must decide separately whether checker work is still payable.');
      if (!ev) holds.push('No evaluation is recorded for this job, so approval cannot be recommended.');
      else if (stale) holds.push('Evaluation is stale: the claim text or evidence note changed since the evaluation, so re-evaluate before any decision.');
      else if (ev.verdict === 'hold') { holds.push('Evaluation held for human review; rule-based evaluator could not confidently determine support.'); (ev.reasons || []).forEach(function (r) { holds.push('Evaluation reason: ' + r); }); if (job.humanReview) holds.push('Human review recorded: ' + job.humanReview.note + '. This does not change the HOLD verdict and does not authorise payment.'); }
      else if (ev.verdict !== 'pass') holds.push('Evaluation verdict is ' + ev.verdict + ', not pass, so approval cannot be recommended.');
      if (!job.humanEvidenceConfirmation) holds.push('No explicit human evidence confirmation recorded: \'I have opened and reviewed this evidence, and it supports the claim.\' Without this, approval cannot be recommended, even for a reachable link, because the system does not read source content.');
      if (job.workState !== 'ready') holds.push('Job is incomplete: work state is ' + job.workState + ', not Ready. Only a job in Ready state can be approved.');
      if (job.workState === 'correction-requested') holds.push('Correction is unresolved: a correction request is open for this job.');
      if (job.capStatus === 'Blocked by cap') holds.push('Price restriction not met: job is blocked by the cap, so it cannot be approved at the current cap.');
      if (ev && ev.needsHumanReview) holds.push('Evaluation needs human review, so approval cannot be recommended yet.');
      if (holds.length) { rec = 'hold'; reasons = holds; }
      else if (job.capStatus !== 'Allowed') { rec = 'hold'; reasons.push('Price/planning status is ' + (job.capStatus || 'unknown') + ', not Allowed, so approval cannot be recommended.'); }
      else if (!job.finalPrice || job.finalPrice <= 0) { rec = 'hold'; reasons.push('No final demo price is recorded for this job, so approval cannot be recommended.'); }
      else {
        rec = 'approve';
        reasons.push('Job is in Ready state with a fresh pass evaluation.');
        reasons.push('Explicit human evidence confirmation recorded: \'I have opened and reviewed this evidence, and it supports the claim.\'');
        reasons.push('No unresolved correction or escalation: work state is Ready, evaluation verdict is pass, and no correction is open.');
        reasons.push('Price/planning restrictions met: cap status Allowed, planning decision ' + job.decision + ', final demo price ' + job.finalPrice + ' demo units (demo units only, not real money).');
        reasons.push('Evaluation checks passed as rule-based consistency checks only; they do not prove the claim is true.');
        // P0, user decision: Inconclusive is warning only, never a
        // block. A checker who properly completed checking work can
        // still be recommended for payment even when evidence remains
        // inconclusive, but the distinction must be stated, not hidden.
        if (claim && claim.status === 'Inconclusive') reasons.push('Warning: claim is marked Inconclusive, so evidence remains insufficient by the user marking. This Approve is for checker work only, not a claim verdict, and not confirmation that the claim is true.');
        if (claim && claim.status) reasons.push('Claim status at recommendation time: ' + claim.status + '. Payment recommendation is about paying the checker for the checking work, not about the claim being true.');
      }
    }
    return {
      recommendation: rec, reasons: reasons,
      // Freshness fingerprint: the exact decision inputs used to
      // produce this recommendation. Any change to any of them makes
      // this recommendation outdated, never still valid. See
      // isRecommendationFresh below. No payment is involved.
      fingerprint: {
        claimText: claim ? clean(claim.text) : null,
        note: claim ? clean(claim.note || '') : null,
        workState: job.workState,
        evaluationVerdict: ev ? ev.verdict : null,
        planningDecision: job.planningDecision || job.decision,
        decision: job.decision,
        finalPrice: job.finalPrice,
        capStatus: job.capStatus,
        cap: (typeof cap === 'number' ? cap : null),
        cut: !!job.cut,
        abandoned: !!job.abandoned,
        humanEvidenceConfirmation: !!job.humanEvidenceConfirmation,
        evaluationRecord: ev ? JSON.stringify({ verdict: ev.verdict, checks: ev.checks, reasons: ev.reasons, summary: ev.summary, needsHumanReview: ev.needsHumanReview }) : null,
        correctionRound: job.correctionRound,
        correctionRequestRound: job.correctionRequest ? job.correctionRequest.round : null,
        escalated: job.workState === 'escalated',
        claimStatus: claim ? (claim.status || null) : null
      },
      checks: ev ? ev.checks : [],
      history: (job.history || []).slice(),
      evaluationVerdict: ev ? ev.verdict : null,
      source: 'rule', recommender: 'rule-based recommender',
      disclaimer: RECOMMENDATION_DISCLAIMER,
      summary: rec === 'approve' ? 'Approve (for human payer approval only).' : rec === 'reject' ? 'Reject (clearly disqualified for payment).' : 'Hold (human review or missing condition).',
      jobId: job.jobId, claimId: job.claimId
    };
  }


  // Freshness audit (Stage 4 safeguard). A stored recommendation is
  // valid only while every fingerprinted input is unchanged. Any
  // relevant change invalidates it: it must be shown as OUTDATED,
  // never as a valid current recommendation, and must be recalculated
  // before any decision. This function never pays, signs, or releases
  // anything; it only reports whether a stored recommendation is fresh.
  function isRecommendationFresh(job, claim, recommendation, cap) {
    var staleReasons = [];
    if (!recommendation) return { fresh: false, staleReasons: ['No recommendation is recorded for this job.'] };
    var fp = recommendation.fingerprint;
    if (!fp) return { fresh: false, staleReasons: ['Recommendation was made before freshness tracking, so its inputs are not recorded. Recalculate it.'] };
    if (claim) {
      if (fp.claimText !== clean(claim.text)) staleReasons.push('Claim text changed since the recommendation was made.');
      if (fp.note !== clean(claim.note || '')) staleReasons.push('Evidence note changed since the recommendation was made.');
      // L3: a saved snapshot is never fresh verification, and a
      // fresh live check alone does not revive a recommendation
      // that was marked OUTDATED for a snapshot. Only a fresh
      // evaluation after that check (which clears the flag below)
      // followed by recalculation can make it current again.
      // Document-only claims have no verification object, so this
      // never affects them.
      if (claim.evidenceVerification && claim.evidenceVerification.snapshot) {
        staleReasons.push('Evidence verification is a saved snapshot, not a fresh live check. Re-run Check link live, then re-evaluate, then recalculate the recommendation before any decision.');
      } else if (job.needsFreshEvaluationAfterSnapshot) {
        staleReasons.push('Evidence verification was restored as a saved snapshot. A fresh live check alone does not restore this recommendation: re-evaluate, then recalculate, before any decision.');
      }
    }
    if (fp.workState !== job.workState) staleReasons.push('Work state changed from ' + fp.workState + ' to ' + job.workState + ' since the recommendation was made.');
    var evVerdict = job.evaluation ? job.evaluation.verdict : null;
    if (fp.evaluationVerdict !== evVerdict) staleReasons.push('Evaluation verdict changed from ' + fp.evaluationVerdict + ' to ' + evVerdict + ' since the recommendation was made.');
    if (fp.planningDecision !== (job.planningDecision || job.decision)) staleReasons.push('Planning decision changed from ' + fp.planningDecision + ' to ' + (job.planningDecision || job.decision) + ' since the recommendation was made.');
    if (fp.decision !== job.decision) staleReasons.push('Task decision changed from ' + fp.decision + ' to ' + job.decision + ' since the recommendation was made.');
    if (fp.finalPrice !== job.finalPrice) staleReasons.push('Demo price changed from ' + fp.finalPrice + ' to ' + job.finalPrice + ' since the recommendation was made.');
    if (fp.capStatus !== job.capStatus) staleReasons.push('Cap status changed from ' + fp.capStatus + ' to ' + job.capStatus + ' since the recommendation was made.');
    if (typeof cap === 'number') {
      if (fp.cap === null) staleReasons.push('Recommendation was made without a recorded price cap. Recalculate it with the current cap.');
      else if (fp.cap !== cap) staleReasons.push('Price cap changed from ' + fp.cap + ' to ' + cap + ' since the recommendation was made.');
    }
    if (fp.cut !== !!job.cut) staleReasons.push('Task cut status changed since the recommendation was made.');
    if (fp.abandoned !== !!job.abandoned) staleReasons.push('Task abandoned status changed since the recommendation was made.');
    if (fp.humanEvidenceConfirmation !== undefined && fp.humanEvidenceConfirmation !== !!job.humanEvidenceConfirmation) staleReasons.push('Human evidence confirmation changed since the recommendation was made.');
    if (fp.humanEvidenceConfirmation === undefined) staleReasons.push('Recommendation was made before human evidence confirmation tracking. Recalculate it.');
    if (fp.evaluationRecord === undefined) staleReasons.push('Recommendation was made before evaluation record tracking, so its checks, findings, and reasons are not recorded. Recalculate it.');
    else {
      var curEv = job.evaluation;
      var curRecord = curEv ? JSON.stringify({ verdict: curEv.verdict, checks: curEv.checks, reasons: curEv.reasons, summary: curEv.summary, needsHumanReview: curEv.needsHumanReview }) : null;
      if (fp.evaluationRecord !== curRecord) staleReasons.push('Evaluation record changed (checks, findings, or reasons) since the recommendation was made, even though the verdict may still be Pass.');
    }
    if (fp.correctionRound !== job.correctionRound) staleReasons.push('Correction round changed from ' + fp.correctionRound + ' to ' + job.correctionRound + ' since the recommendation was made.');
    var curCorrRound = job.correctionRequest ? job.correctionRequest.round : null;
    if (fp.correctionRequestRound !== curCorrRound) staleReasons.push('Correction status changed since the recommendation was made.');
    if (fp.escalated !== (job.workState === 'escalated')) staleReasons.push('Escalation status changed since the recommendation was made.');
    if (fp.claimStatus === undefined) staleReasons.push('Recommendation was made before claim status tracking. Recalculate it.');
    else if (claim && fp.claimStatus !== (claim.status || null)) staleReasons.push('Claim status changed from ' + fp.claimStatus + ' to ' + (claim.status || null) + ' since the recommendation was made.');
    return { fresh: staleReasons.length === 0, staleReasons: staleReasons };
  }

  // Cap input validation (R9): a whole number, 0 or more. Anything
  // else is invalid and must be shown to the user, never silently
  // replaced with a fallback cap.
  function parseCap(raw) {
    var t = clean(raw);
    if (!/^\d+$/.test(t)) {
      return { valid: false, cap: null, message: 'Enter a whole number of demo units, 0 or more. The previous cap is kept.' };
    }
    return { valid: true, cap: parseInt(t, 10), message: '' };
  }

  function makeJob(claim, index) {
    var quote = demoQuoteFor(index);
    var profile = checkerProfileFor(claim.kind, index);
    var job = {
      jobId: index + 1,
      claimId: claim.id,
      claimUid: ensureClaimUid(claim),
      humanEvidenceConfirmation: false,
      role: claim.role,
      kind: claim.kind,
      checker: profile.name,
      checkerProfile: profile,
      skills: profile.skills,
      planningDecision: '',
      planningReason: '',
      workState: 'assigned',
      correctionRound: 0,
      history: [{ from: null, to: 'assigned', reason: 'Job created from claim', source: 'rule' }],
      checks: [],
      correctionRequest: null,
      correctionHistory: [],
      evaluationHistory: [],
      recommendation: null,
      planned: DEMO_PLANNED,
      quote: quote,
      counter: null,
      decision: '',
      doVsBuy: '',
      reason: '',
      finalPrice: 0,
      capStatus: '',
      spent: 0,
      cut: false,
      abandoned: false
    };
    if (quote <= DEMO_PLANNED) {
      job.decision = 'Buy';
      job.doVsBuy = 'Buy';
      job.reason = 'Demo quote is at or below the 10-unit plan, so buying a demo check is the cheaper option in this demo.';
      job.finalPrice = quote;
    } else {
      // Exactly one counter-offer, at the planned price. The demo
      // checker accepts only if the quote is at most 4 units over
      // plan; otherwise the demo agent walks away and does it itself.
      var accepted = quote <= DEMO_PLANNED + 4;
      job.counter = { offer: DEMO_PLANNED, accepted: accepted, count: 1 };
      if (accepted) {
        job.decision = 'Buy after one counter-offer';
        job.doVsBuy = 'Buy after one counter-offer';
        job.reason = 'Demo quote was above the 10-unit plan, the agent countered once at 10 demo units, and the demo checker accepted.';
        job.finalPrice = DEMO_PLANNED;
      } else {
        job.decision = 'Do it yourself';
        job.doVsBuy = 'Do it yourself';
        job.reason = 'Demo quote stayed above the 10-unit plan after one counter-offer at 10 demo units, so the demo agent walks away and does not buy.';
        job.finalPrice = 0;
      }
    }
    job.planningDecision = job.decision;
    job.planningReason = job.reason;
    return job;
  }

  // Recompute cap status and spent units for a job list, preserving
  // cut flags and counter decisions. Cut jobs and walked-away jobs
  // spend nothing and consume no cap.
  function recomputeJobs(jobs, cap) {
    var remaining = cap;
    var totalSpent = 0;
    var allowed = 0;
    var blocked = 0;
    jobs.forEach(function (job) {
      if (job.abandoned) {
        job.capStatus = 'Abandoned by user';
        job.spent = 0;
        return;
      }
      if (job.cut) {
        job.capStatus = 'Cut by user';
        job.spent = 0;
        return;
      }
      if (job.decision === 'Do it yourself') {
        job.capStatus = 'Not bought — do it yourself (no demo units spent)';
        job.spent = 0;
        return;
      }
      if (job.finalPrice <= remaining) {
        job.capStatus = 'Allowed';
        job.spent = job.finalPrice;
        remaining -= job.finalPrice;
        totalSpent += job.finalPrice;
        allowed += 1;
      } else {
        job.capStatus = 'Blocked by cap';
        job.spent = 0;
        blocked += 1;
      }
    });
    return { jobs: jobs, cap: cap, totalSpent: totalSpent, remaining: remaining, allowed: allowed, blocked: blocked };
  }

  // H3: Preserve job state across rebuilds using stable claim UIDs.
  // A job state is restored only when its claim UID is unique in both
  // the old and new claim lists AND the claim text and note are
  // unchanged. Ambiguous UIDs (same UID for more than one claim in
  // either list) are never restored arbitrarily: those jobs stay fresh
  // (assigned), rather than receiving another claim's state.
  // Planning fields (quote, final price, cap status) are NOT restored:
  // they are recomputed from job order and cap after a rebuild, so a
  // restored recommendation will correctly become stale if its price
  // changed, and must be recalculated.
  // QA2-01: two-tier preservation across rebuilds.
  // Tier 1, always preserved, even when the claim text changed:
  // history, correction history, evaluation history, review history,
  // correction round, escalation flag, cut flag, abandoned flag, and
  // the planning decision and reason. Cut and abandoned jobs are
  // therefore never reactivated by an edit: recomputeJobs spends
  // nothing for them, and their flags are restored verbatim.
  // Tier 2, invalidated only when the text or note changed:
  // work state, evaluation, checks, human confirmation, and the open
  // correction request. The stored recommendation is kept so the
  // Plan9 freshness check reports it as OUTDATED, never as current.
  // When the cleaned claim text is unchanged, nothing in Tier 2 is
  // reset beyond the P0 note-edit invalidation below.
  function preserveJobStates(oldJobs, oldClaims, newJobs, newClaims) {
    function countUid(list, uid) { var n = 0; list.forEach(function (c) { if (c.uid === uid) n += 1; }); return n; }
    function claimForJob(jobs, claims, job) {
      var found = null;
      claims.forEach(function (c) { if (c.id === job.claimId || c.uid === job.claimUid) found = c; });
      return found;
    }
    function reviewAlreadyArchived(history, review) {
      if (!review) return true;
      return (history || []).some(function (hr) {
        return (hr.id && review.id && hr.id === review.id) || (!hr.id && !review.id && hr.note === review.note && hr.verdict === review.verdict);
      });
    }
    newJobs.forEach(function (nj) {
      var newClaim = claimForJob(newJobs, newClaims, nj);
      if (!newClaim || !newClaim.uid) return;
      if (countUid(newClaims, newClaim.uid) !== 1) return;
      var oldJob = null; var oldClaim = null;
      (oldJobs || []).forEach(function (oj) {
        if (oj.claimUid === newClaim.uid) { oldJob = oj; }
      });
      if (!oldJob) return;
      (oldClaims || []).forEach(function (c) { if (c.uid === newClaim.uid) oldClaim = c; });
      if (!oldClaim) return;
      if (countUid(oldClaims, newClaim.uid) !== 1) return;
      var textChanged = clean(oldClaim.text) !== clean(newClaim.text);
      var noteChanged = clean(oldClaim.note || '') !== clean(newClaim.note || '');
      // Tier 1: always preserved.
      nj.history = oldJob.history ? oldJob.history.slice() : nj.history;
      nj.correctionHistory = oldJob.correctionHistory ? oldJob.correctionHistory.slice() : [];
      nj.evaluationHistory = oldJob.evaluationHistory ? oldJob.evaluationHistory.slice() : [];
      nj.humanReviewHistory = oldJob.humanReviewHistory ? oldJob.humanReviewHistory.slice() : [];
      nj.correctionRound = oldJob.correctionRound || 0;
      nj.previouslyEscalated = !!oldJob.previouslyEscalated;
      nj.cut = !!oldJob.cut;
      nj.abandoned = !!oldJob.abandoned;
      if (oldJob.planningDecision !== undefined) nj.planningDecision = oldJob.planningDecision;
      if (oldJob.planningReason !== undefined) nj.planningReason = oldJob.planningReason;
      nj.recommendation = oldJob.recommendation || null;
      if (!textChanged && !noteChanged) {
        // Unchanged cleaned text and note: full restore, no reset.
        nj.workState = oldJob.workState;
        nj.checks = oldJob.checks ? oldJob.checks.slice() : nj.checks;
        nj.correctionRequest = oldJob.correctionRequest || null;
        nj.evaluation = oldJob.evaluation || null;
        nj.humanEvidenceConfirmation = !!oldJob.humanEvidenceConfirmation;
        nj.humanReview = oldJob.humanReview || null;
        return;
      }
      if (!textChanged && noteChanged) {
        // P0 note-edit invalidation, with round and histories kept.
        if ((oldJob.workState === 'checked' || oldJob.workState === 'ready') && oldJob.evaluation) {
          nj.evaluationHistory.push({ round: oldJob.correctionRound, verdict: oldJob.evaluation.verdict, summary: oldJob.evaluation.summary, checks: oldJob.evaluation.checks, reasons: oldJob.evaluation.reasons, source: 'rule', invalidatedByNoteEdit: true });
          nj.workState = 'assigned';
          nj.evaluation = null;
          nj.checks = [];
          nj.humanEvidenceConfirmation = false;
          if (oldJob.humanReview && !reviewAlreadyArchived(nj.humanReviewHistory, oldJob.humanReview)) nj.humanReviewHistory.push(oldJob.humanReview);
          nj.humanReview = null;
          nj.correctionRequest = null;
        } else {
          // Not checked/ready (for example correction-requested):
          // leave the job where it was, including its open request.
          nj.workState = oldJob.workState;
          nj.checks = oldJob.checks ? oldJob.checks.slice() : nj.checks;
          nj.correctionRequest = oldJob.correctionRequest || null;
          nj.evaluation = oldJob.evaluation || null;
          nj.humanEvidenceConfirmation = !!oldJob.humanEvidenceConfirmation;
          nj.humanReview = oldJob.humanReview || null;
        }
        return;
      }
      // Text changed: invalidate Tier 2, keep Tier 1, and record the
      // edit in history so the inheritance is visible, not silent.
      nj.workState = 'assigned';
      nj.evaluation = null;
      nj.checks = [];
      nj.humanEvidenceConfirmation = false;
      nj.correctionRequest = null;
      if (oldJob.humanReview && !reviewAlreadyArchived(nj.humanReviewHistory, oldJob.humanReview)) nj.humanReviewHistory.push(oldJob.humanReview);
      nj.humanReview = null;
      nj.history.push({ from: oldJob.workState, to: 'assigned', reason: 'Claim text edited; previous evaluation and confirmation invalidated. Correction round, escalation history, cut/abandon status, and planning decision preserved.', source: 'user' });
    });
    return newJobs;
  }
  function buildAgentJobs(claims, cap) {
    var jobs = claims.map(function (c, i) { return makeJob(c, i); });
    var summary = recomputeJobs(jobs, cap);
    summary.jobs = jobs;
    return summary;
  }

  // R9 remainder (Phase 4): shareable ?thesis= link. Reads the thesis
  // from a URL query string only — no backend, no server, no account.
  // Returns the decoded thesis as a plain string (never HTML), or ''
  // when the parameter is missing or blank. The page assigns it to a
  // textarea value and renders claims through escapeHtml, so a payload
  // such as "<script>" stays inert text and is never executed.
  function thesisFromShareQuery(query) {
    var q = String(query || '').replace(/^[?#]/, '');
    if (!q) return '';
    var raw = '';
    try {
      var params = new URLSearchParams(q);
      raw = params.get('thesis') || '';
    } catch (e) {
      var m = q.match(/(?:^|&)thesis=([^&]*)/);
      if (m) {
        try { raw = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e2) { raw = ''; }
      }
    }
    return clean(raw);
  }
  // and evidence lines, and reset its status and note, because the
  // old evidence was for the old text. The evidence gate therefore
  // cannot be bypassed by editing a claim after it was marked.
  // M1: saving an edit that does not change the cleaned claim text
  // must not destroy work. The old code cleared note, status and
  // verification unconditionally, so the QA2-01 unchanged-text
  // preservation path could never be reached through the edit
  // button. An identical cleaned text (including whitespace-only
  // changes) returns the claim untouched; a genuinely changed text
  // still takes the D5/QA2-01 invalidation path below.
  function updateClaimText(claim, newText) {
    var t = clean(newText);
    if (!t) return { error: 'Type the new claim text first.' };
    if (clean(claim.text) === t) return claim;
    claim.text = t;
    claim.kind = classifyClaim(t);
    var details = extractDetails(t);
    claim.measure = measureFor(claim.kind, details);
    claim.evidence = evidenceFor(claim.kind, details);
    claim.status = 'Not yet tested';
    claim.note = '';
    claim.evidenceCheck = null;
    claim.evidenceVerification = null;
    // QA D1: a text edit supersedes any in-flight link check.
    claim.checkSeq = (claim.checkSeq || 0) + 1;
    return claim;
  }

  function evidenceCheckText(c) {
    if (!c.note) return 'Not checked (no evidence note yet)';
    if (c.evidenceVerification) return snapshotPrefix(c.evidenceVerification) + c.evidenceVerification.label + ': ' + c.evidenceVerification.detail;
    if (c.evidenceCheck && c.evidenceCheck.passed) return 'Passed format check: named source, date, and openable reference present. This checks the note format only; it does not prove the evidence itself is true.';
    if (c.evidenceCheck) return 'Failed format check: missing ' + c.evidenceCheck.missing.join(', ') + '.';
    return 'Not checked';
  }

  function planAsMarkdown(result) {
    if (!result || result.error) return '';
    var lines = ['# Thesis test plan', '', 'Thesis: ' + result.thesis, '', 'Exported: ' + new Date().toISOString(), 'Recommendations in this export were current only at export time. Recheck freshness in the demo before any decision.', ''];
    if (result.cappedWarning) lines.push(result.cappedWarning, '');
    result.claims.forEach(function (c) {
      lines.push('## ' + c.id + '. ' + c.role + ' (' + c.kind + ')');
      lines.push('');
      lines.push('- Claim: ' + c.text);
      lines.push('- How to measure: ' + c.measure);
      lines.push('- Evidence needed: ' + c.evidence);
      lines.push('- Pass rule: ' + c.passRule);
      lines.push('- Status: ' + c.status);
      lines.push('- Evidence note: ' + (clean(c.note) ? c.note : '(none yet)'));
      lines.push('- Evidence check: ' + evidenceCheckText(c));
      lines.push('');
    });
    // Per-job receipts (R5, DEMO ONLY). Evidence fields are read from
    // the live claim at export time, so a receipt never shows stale
    // evidence after a note or status change.
    // Plan9 P2: export works on a deep copy, never on the live jobs,
    // so Copy or Download cannot change live cap status or prices.
    var exportJobs = result.jobs ? JSON.parse(JSON.stringify(result.jobs)) : null;
    // QA D2: cap 0 is valid, so do not use || 30, which turns 0 into 30.
    var exportCap = (typeof result.cap === 'number') ? result.cap : 30;
    var jobsInfo = exportJobs ? recomputeJobs(exportJobs, exportCap) : buildAgentJobs(result.claims, exportCap);
    var jobs = jobsInfo.jobs;
    lines.push('## Agent jobs — DEMO ONLY, not a live payment, not a real hire, not a real quote');
    lines.push('');
    lines.push('Demo quotes are fixed illustrative values assigned in job order (8, 12, 10, 18, 9 demo units), not prices from any real agent. Demo checkers are named demo checkers, not accounts. No demo units are real money, and no job here is actually bought.');
    lines.push('');
    jobs.forEach(function (job) {
      var claim = null;
      result.claims.forEach(function (c) { if (c.id === job.claimId) claim = c; });
      var counterText = job.counter
        ? ('one counter-offer at ' + job.counter.offer + ' demo units, ' + (job.counter.accepted ? 'accepted' : 'rejected'))
        : 'no counter-offer (demo quote was at or below plan)';
      lines.push('### Receipt — Job ' + job.jobId + ' (claim ' + job.claimId + ', ' + job.role + ')');
      lines.push('');
      lines.push('- Job: ' + (claim ? claim.text : job.role));
      lines.push('- Demo checker: ' + job.checker + ' (demo only, not an account)');
      lines.push('- Do vs buy: ' + job.doVsBuy + ' — ' + job.reason);
      lines.push('- Planned: ' + job.planned + ' demo units. Demo quote: ' + job.quote + ' demo units.');
      lines.push('- Counter-offer: ' + counterText + '.');
      lines.push('- Decision: ' + job.decision + '. Final demo price: ' + job.finalPrice + ' demo units.');
      lines.push('- Cap: ' + job.capStatus + '. Demo units spent on this job: ' + job.spent + '.');
      if (job.evaluation) {
        lines.push('- Rule-based evaluator verdict: ' + job.evaluation.verdict + ' (source: ' + job.evaluation.source + ', not an AI or intelligent fact-checker). ' + job.evaluation.summary);
        job.evaluation.checks.forEach(function (ck) { lines.push('  - Check ' + ck.name + ' (' + ck.dimension + '): ' + ck.result + ' — ' + ck.finding); });
        job.evaluation.reasons.forEach(function (r) { lines.push('  - Reason: ' + r); });
      }
      // QA D3: work state, confirmation, and archived histories are
      // exported whether or not a current evaluation exists, so a
      // restart or invalidation cannot drop them from the export.
      lines.push('- Work state: ' + job.workState + '. Correction round: ' + job.correctionRound + '.');
      lines.push('- Human evidence confirmation: ' + (job.humanEvidenceConfirmation ? 'confirmed (I have opened and reviewed this evidence, and it supports the claim.)' : 'not confirmed.'));
      if (job.correctionHistory) job.correctionHistory.forEach(function (cr) { lines.push('  - Correction round ' + cr.round + ': ' + cr.instructions.join(' ')); });
      if (job.evaluationHistory) job.evaluationHistory.forEach(function (pe) { lines.push('  - Previous evaluation (round ' + pe.round + '): ' + pe.verdict + ' — ' + pe.summary); });
      if (job.humanReviewHistory) job.humanReviewHistory.forEach(function (hr) {
        // QA2-10: the current review is printed once below, so skip
        // the archived copy of that same review (by id, falling back
        // to note-and-verdict for legacy saves without ids).
        if (job.humanReview && ((hr.id && job.humanReview.id && hr.id === job.humanReview.id) || (!hr.id && !job.humanReview.id && hr.note === job.humanReview.note && hr.verdict === job.humanReview.verdict))) return;
        lines.push('  - Archived human review of HOLD: ' + hr.note + '. This did not change the HOLD verdict and did not authorise payment.');
      });
      // Plan9 P2: recommendation is no longer nested inside the
      // evaluation block, so a job with a recommendation but no
      // evaluation still exports that recommendation.
      if (job.recommendation) {
        lines.push('- Recommendation fingerprint: ' + (job.recommendation.fingerprint ? JSON.stringify(job.recommendation.fingerprint) : 'not recorded'));
        lines.push('- Claim status at recommendation time: ' + (claim ? claim.status : '(no claim)') + '. Payment recommendation is about paying the checker for the checking work, not about the claim being true.');
        var fresh = isRecommendationFresh(job, claim, job.recommendation, exportCap);
        if (fresh.fresh) {
          lines.push('- Payment recommendation (current): ' + job.recommendation.recommendation + ' — ' + job.recommendation.summary + ' ' + job.recommendation.disclaimer);
          job.recommendation.reasons.forEach(function (r) { lines.push('  - Recommendation reason: ' + r); });
        } else {
          lines.push('- OUTDATED payment recommendation (do not use as current): ' + job.recommendation.recommendation + ' was recommended earlier, but inputs changed: ' + fresh.staleReasons.join(' ') + ' Recalculate before any decision.');
          lines.push('  - Previous recommendation reasons (history only): ' + job.recommendation.reasons.join(' '));
        }
      }
      if (job.history) lines.push('- Job history: ' + job.history.map(function (h) { return (h.from || 'start') + ' -> ' + h.to + ': ' + h.reason; }).join(' | '));
      if (job.previouslyEscalated) lines.push('- Previously escalated. Correction round stays at 2. A further unsuccessful correction request will escalate again.');
      if (job.humanReview) lines.push('- Human review of HOLD: ' + job.humanReview.note + '. This does not change the HOLD verdict and does not authorise payment.');
      if (claim) {
        lines.push('- Evidence status: ' + claim.status + '.');
        lines.push('- Evidence note: ' + (clean(claim.note) ? claim.note : '(none yet)'));
        lines.push('- Evidence check: ' + evidenceCheckText(claim));
      }
      lines.push('');
    });
    lines.push('Agent totals (demo units only): cap ' + jobsInfo.cap + ', spent ' + jobsInfo.totalSpent + ', ' + jobsInfo.allowed + ' allowed, ' + jobsInfo.blocked + ' blocked.');
    lines.push('');
    lines.push('Note: this plan is a test worksheet. It does not prove or disprove the thesis.');
    return lines.join('\n');
  }

  root.ThesisAgent = {
    clean: clean,
    classifyClaim: classifyClaim,
    splitSubClaims: splitSubClaims,
    analyseThesis: analyseThesis,
    planAsMarkdown: planAsMarkdown,
    checkEvidence: checkEvidence,
    skillsForKind: skillsForKind,
    checkerProfileFor: checkerProfileFor,
    transitionJob: transitionJob,
    evaluateSubmission: evaluateSubmission,
    evaluateJob: evaluateJob,
    restartJobForFreshEvaluation: restartJobForFreshEvaluation,
    scrollTopForElement: scrollTopForElement,
    confirmHumanEvidence: confirmHumanEvidence,
    recordHumanReview: recordHumanReview,
    clearHumanEvidenceConfirmation: clearHumanEvidenceConfirmation,
    preserveJobStates: preserveJobStates,
    HUMAN_CONFIRMATION_WORDING: HUMAN_CONFIRMATION_WORDING,
    buildCorrectionRequest: buildCorrectionRequest,
    recommendJob: recommendJob,
    isRecommendationFresh: isRecommendationFresh,
    RECOMMENDATION_DISCLAIMER: RECOMMENDATION_DISCLAIMER,
    extractEvaluatorNumbers: extractEvaluatorNumbers,
    extractEvaluatorYears: extractEvaluatorYears,
    significantKeywords: significantKeywords,
    requestCorrection: requestCorrection,
    escalationMessage: escalationMessage,
    restartEscalatedJob: restartEscalatedJob,
    invalidateStaleEvaluation: invalidateStaleEvaluation,
    evaluationMatchesClaim: evaluationMatchesClaim,
    markReady: markReady,
    ALLOWED_TRANSITIONS: ALLOWED_TRANSITIONS,
    CHECK_RESULT_TYPES: CHECK_RESULT_TYPES,
    REASONING_PROVIDERS: REASONING_PROVIDERS,
    extractFirstUrl: extractFirstUrl,
    classifyEvidenceVerification: classifyEvidenceVerification,
    evidenceVerificationText: evidenceVerificationText,
    extractDetails: extractDetails,
    parseCap: parseCap,
    thesisFromShareQuery: thesisFromShareQuery,
    measureFor: measureFor,
    evidenceFor: evidenceFor,
    buildAgentJobs: buildAgentJobs,
    recomputeJobs: recomputeJobs,
    updateClaimText: updateClaimText,
    demoQuoteFor: demoQuoteFor,
    demoCheckerFor: demoCheckerFor
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ThesisAgent;
})(typeof window !== 'undefined' ? window : globalThis);
