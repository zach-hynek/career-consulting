// Deliberately independent of employer popularity, funding and editorial order.
// Unknown criteria widen the possible score; they never become zero ratings.
const AtlasScore = (() => {
  const grade = (points, rubric) => rubric.gradeBands.find(b => points >= b.min).letter;
  function calculate(record, weights, rubric, hasWorkforceContext = false) {
    const total = weights.reduce((sum, value) => sum + value, 0);
    let earned = 0, known = 0, supported = 0, ratedCount = 0;
    const rows = rubric.dimensions.map((dimension, index) => {
      const entry = record?.criteria?.[dimension.id];
      const value = Number.isInteger(entry?.value) && entry.value >= 0 && entry.value <= 4 ? entry.value : null;
      const weight = total ? weights[index] / total * 100 : 0;
      const hasSupport = value !== null && ['supported', 'confirmed'].includes(entry?.basis) && !!entry?.reason?.trim();
      const points = value === null ? 0 : weight * value / 4;
      if (value !== null && weight > 0) { known += weight; earned += points; ratedCount++; }
      if (hasSupport) supported += weight;
      return { id: dimension.id, weight, value, points, hasSupport };
    });
    const unknown = Math.max(0, 100 - known), upper = Math.min(100, earned + unknown);
    const missing = [];
    if (!total) missing.push('Set at least one non-zero criterion weight.');
    if (supported + 1e-8 < rubric.minimumSupportedCoverage) missing.push('Support at least 70% of the weighted rubric with a recorded rationale.');
    for (const id of rubric.requiredDimensions) {
      if (!rows.find(row => row.id === id)?.hasSupport) missing.push('Support the ' + rubric.dimensions.find(d => d.id === id).title.toLowerCase() + ' rating.');
    }
    if (!record?.context?.trim()) missing.push('Name the role, team or target opportunity being evaluated.');
    if (record?.constraints !== 'clear') missing.push(record?.constraints === 'blocked' ? 'A hard constraint fails; do not advance this opportunity.' : 'Confirm your hard constraints. Unknown does not pass.');
    if (hasWorkforceContext && !(record?.riskReviewed && record?.riskNote?.trim())) missing.push('Record how the linked workforce / project event affects this team.');
    const lowGrade = total && ratedCount ? grade(earned + 1e-8, rubric) : null;
    const highGrade = total && ratedCount ? grade(upper + 1e-8, rubric) : null;
    const stable = lowGrade !== null && lowGrade === highGrade;
    if (ratedCount && !stable) missing.push('Unknown criteria still span more than one letter grade.');
    return { rows, total, earned, upper, coverage: known, supported, ratedCount, lowGrade, highGrade,
      letter: stable ? lowGrade : null, range: lowGrade ? (stable ? lowGrade : highGrade + '–' + lowGrade) : '—',
      ready: !!total && !!ratedCount && stable && missing.length === 0,
      blocked: record?.constraints === 'blocked', missing };
  }
  return { calculate };
})();
