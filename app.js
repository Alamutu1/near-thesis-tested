// Thesis Agent — pure, dependency-free logic.
// No network calls, no wallet, no keys. Every verdict starts as
// "Not yet tested". Nothing here sends a transaction or moves money.
// The evidence check below is a local FORMAT check only: it checks
// that a note names a source, gives a date, and gives an openable
// reference. It does not prove the evidence itself is true.
(function (root) {
  'use strict';

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
    if (/(because|causes|leads to|increase|increases|decrease|decreases|reduce|reduces|improve|improves|lower|lowers|raise|raises|lose|loses|gain|gains|hurt|hurts|help|helps|affect|affects|impact|impacts|drive|drives|boost|boosts|cut|cuts|save|saves)/.test(lower)) return 'Cause and effect';
    if (/(will|future|by 20|next year|growth)/.test(lower)) return 'Prediction';
    if (/(is|are|means|defined as)/.test(lower)) return 'Definition';
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

  function splitSubClaims(thesis) {
    var thesisClean = clean(thesis);
    var claims = [];
    var capped = false;
    var totalFound = 0;

    function finish(list) {
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
      .split(/\s*[,;]\s*|\s+ and \s+|\s+ but \s+|\s*\|\s*/)
      .map(stripLeadingConnectors)
      .filter(function (p) { return p.length >= 2; });
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
        role: c.role,
        text: c.text,
        kind: kind,
        measure: measureFor(kind, details),
        evidence: evidenceFor(kind, details),
        passRule: 'Pass only if the evidence is named, dated, and openable. Otherwise it stays untested.',
        status: 'Not yet tested',
        note: '',
        evidenceCheck: null
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
    var job = {
      jobId: index + 1,
      claimId: claim.id,
      role: claim.role,
      kind: claim.kind,
      checker: demoCheckerFor(index),
      planned: DEMO_PLANNED,
      quote: quote,
      counter: null,
      decision: '',
      doVsBuy: '',
      reason: '',
      finalPrice: 0,
      capStatus: '',
      spent: 0,
      cut: false
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

  function buildAgentJobs(claims, cap) {
    var jobs = claims.map(function (c, i) { return makeJob(c, i); });
    var summary = recomputeJobs(jobs, cap);
    summary.jobs = jobs;
    return summary;
  }

  // Edit one claim's text (R9): reclassify it, rebuild its measure
  // and evidence lines, and reset its status and note, because the
  // old evidence was for the old text. The evidence gate therefore
  // cannot be bypassed by editing a claim after it was marked.
  function updateClaimText(claim, newText) {
    var t = clean(newText);
    if (!t) return { error: 'Type the new claim text first.' };
    claim.text = t;
    claim.kind = classifyClaim(t);
    var details = extractDetails(t);
    claim.measure = measureFor(claim.kind, details);
    claim.evidence = evidenceFor(claim.kind, details);
    claim.status = 'Not yet tested';
    claim.note = '';
    claim.evidenceCheck = null;
    return claim;
  }

  function evidenceCheckText(c) {
    if (!c.note) return 'Not checked (no evidence note yet)';
    if (c.evidenceCheck && c.evidenceCheck.passed) return 'Passed format check: named source, date, and openable reference present. This checks the note format only; it does not prove the evidence itself is true.';
    if (c.evidenceCheck) return 'Failed format check: missing ' + c.evidenceCheck.missing.join(', ') + '.';
    return 'Not checked';
  }

  function planAsMarkdown(result) {
    if (!result || result.error) return '';
    var lines = ['# Thesis test plan', '', 'Thesis: ' + result.thesis, ''];
    if (result.cappedWarning) lines.push(result.cappedWarning, '');
    result.claims.forEach(function (c) {
      lines.push('## ' + c.id + '. ' + c.role + ' (' + c.kind + ')');
      lines.push('');
      lines.push('- Claim: ' + c.text);
      lines.push('- How to measure: ' + c.measure);
      lines.push('- Evidence needed: ' + c.evidence);
      lines.push('- Pass rule: ' + c.passRule);
      lines.push('- Status: ' + c.status);
      lines.push('- Evidence note: ' + (c.note || '(none yet)'));
      lines.push('- Evidence check: ' + evidenceCheckText(c));
      lines.push('');
    });
    // Per-job receipts (R5, DEMO ONLY). Evidence fields are read from
    // the live claim at export time, so a receipt never shows stale
    // evidence after a note or status change.
    var jobsInfo = result.jobs ? recomputeJobs(result.jobs, result.cap || 30) : buildAgentJobs(result.claims, 30);
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
      if (claim) {
        lines.push('- Evidence status: ' + claim.status + '.');
        lines.push('- Evidence note: ' + (claim.note || '(none yet)'));
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
    extractDetails: extractDetails,
    parseCap: parseCap,
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
