// Thesis Agent — pure, dependency-free logic.
// No network calls, no wallet, no keys. Every verdict starts as
// "Not yet tested". Nothing here sends a transaction or moves money.
(function (root) {
  'use strict';

  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function classifyClaim(text) {
    var lower = text.toLowerCase();
    if (/\?$/.test(text.trim())) return 'Check';
    if (/(better than|outperform|more than|higher than|cheaper than|faster than)/.test(lower)) return 'Comparison';
    if (/(will|future|by 20|next year|growth)/.test(lower)) return 'Prediction';
    if (/(because|causes|leads to|increases|reduces|improves|lowers|raises|lose|loses|gain|gains|hurt|hurts|help|helps|affect|affects|impact|impacts|drive|drives|boost|boosts|cut|cuts|save|saves)/.test(lower)) return 'Cause and effect';
    if (/(is|are|means|defined as)/.test(lower)) return 'Definition';
    return 'General claim';
  }

  function evidenceFor(kind) {
    if (kind === 'Check') return 'The answer to the question, with its source named';
    if (kind === 'Comparison') return 'Side-by-side data for both options, measured the same way';
    if (kind === 'Prediction') return 'A dated forecast plus the actual result when the date arrives';
    if (kind === 'Cause and effect') return 'Before-and-after data, or a comparison group without the change';
    if (kind === 'Definition') return 'The source definition and one clear example';
    return 'A named source, a number, or a document you can open and check';
  }

  function measureFor(kind) {
    if (kind === 'Check') return 'Answer the question directly, then note what would prove the answer wrong';
    if (kind === 'Comparison') return 'Record the same measure for both sides and note the difference';
    if (kind === 'Prediction') return 'Write the expected number and date now, then compare later';
    if (kind === 'Cause and effect') return 'Measure before the change, then again after, on the same group';
    if (kind === 'Definition') return 'Check whether the example fits every part of the definition';
    return 'Write down what would count as passing, before you look for proof';
  }

  function splitSubClaims(thesis) {
    // A "because" split keeps its logic: first part is the effect, second is
    // the claimed cause. Losing that link was the weakest part of v1.
    var becauseParts = clean(thesis).split(/\s+because\s+/i);
    if (becauseParts.length === 2) {
      var effect = clean(becauseParts[0]);
      var cause = clean(becauseParts[1]);
      if (effect.length > 3 && cause.length > 3) {
        return [
          { text: effect, role: 'Effect claimed' },
          { text: cause, role: 'Cause claimed' },
          { text: 'What evidence would show this cause does NOT produce this effect?', role: 'Falsification check' }
        ];
      }
    }
    var parts = thesis
      .split(/\s+(?:so that|in order to)\s+/i)
      .join(' | ')
      .split(/\s*[,;]\s*|\s+ and \s+|\s+ but \s+|\s*\|\s*/)
      .map(clean)
      .filter(function (p) { return p.length > 3; });
    // Keep the whole thesis as claim 1 if splitting produced nothing useful,
    // and cap the list so the plan stays readable on a phone screen.
    if (parts.length === 0) parts = [clean(thesis)];
    if (parts.length === 1) {
      return [
        { text: parts[0], role: 'Main claim' },
        { text: 'What evidence would change your mind about this claim?', role: 'Falsification check' },
        { text: 'Who is affected by this claim, and in what situation?', role: 'Scope check' }
      ];
    }
    return parts.slice(0, 5).map(function (p, i) {
      return { text: p, role: i === 0 ? 'Main claim' : 'Sub-claim ' + i };
    });
  }

  function analyseThesis(raw) {
    var thesis = clean(raw);
    if (!thesis) return { error: 'Type a thesis or claim first, then press Break it down.' };
    if (thesis.length < 10) return { error: 'That is a bit short to test. Add a few more words, for example who it affects and what changes.' };
    var claims = splitSubClaims(thesis).map(function (c, i) {
      var kind = classifyClaim(c.text);
      return {
        id: i + 1,
        role: c.role,
        text: c.text,
        kind: kind,
        measure: measureFor(kind),
        evidence: evidenceFor(kind),
        passRule: 'Pass only if the evidence is named, dated, and openable. Otherwise it stays untested.',
        status: 'Not yet tested',
        note: ''
      };
    });
    return {
      thesis: thesis,
      claimCount: claims.length,
      claims: claims,
      summary: 'This thesis breaks into ' + claims.length + ' checkable parts. None of them is marked true or false yet. Add evidence for each part, then mark it yourself.'
    };
  }

  function planAsMarkdown(result) {
    if (!result || result.error) return '';
    var lines = ['# Thesis test plan', '', 'Thesis: ' + result.thesis, ''];
    result.claims.forEach(function (c) {
      lines.push('## ' + c.id + '. ' + c.role + ' (' + c.kind + ')');
      lines.push('');
      lines.push('- Claim: ' + c.text);
      lines.push('- How to measure: ' + c.measure);
      lines.push('- Evidence needed: ' + c.evidence);
      lines.push('- Pass rule: ' + c.passRule);
      lines.push('- Status: ' + c.status);
      lines.push('- Evidence note: ' + (c.note || '(none yet)'));
      lines.push('');
    });
    lines.push('Note: this plan is a test worksheet. It does not prove or disprove the thesis.');
    return lines.join('\n');
  }

  root.ThesisAgent = {
    clean: clean,
    classifyClaim: classifyClaim,
    splitSubClaims: splitSubClaims,
    analyseThesis: analyseThesis,
    planAsMarkdown: planAsMarkdown
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ThesisAgent;
})(typeof window !== 'undefined' ? window : globalThis);
