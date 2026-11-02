// Runs inside the atlas closure. All research and private text uses textContent.
function cleanRatings(saved) {
  const result = {};
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return result;
  for (const e of DB.employers) {
    const item = saved[e.id];
    if (!item || typeof item !== 'object') continue;
    const text = (value, limit = 4000) => typeof value === 'string' ? value.slice(0, limit) : '';
    const record = { criteria: {}, context: text(item.context, 500), constraints: ['clear', 'blocked'].includes(item.constraints) ? item.constraints : 'unknown',
      riskReviewed: item.riskReviewed === true, riskNote: text(item.riskNote), updatedAt: text(item.updatedAt, 40) };
    for (const d of RUBRIC.dimensions) {
      const entry = item.criteria?.[d.id];
      if (!entry || typeof entry !== 'object') continue;
      record.criteria[d.id] = { value: Number.isInteger(entry.value) && entry.value >= 0 && entry.value <= 4 ? entry.value : null,
        basis: ['supported', 'confirmed'].includes(entry.basis) ? entry.basis : 'hunch', reason: text(entry.reason) };
    }
    result[e.id] = record;
  }
  return result;
}
function ratingFor(e) { return review.ratings[e.id] || {criteria:{}, context:'', constraints:'unknown', riskReviewed:false, riskNote:''}; }
function scoreFor(e) { return AtlasScore.calculate(ratingFor(e), review.weights, RUBRIC, e.workforceEvents.length > 0); }
function whole(n) { return Math.round(n); }
function tenth(n) { return n.toFixed(1); }
function logo(e) {
  const box = el('div', undefined, 'mark'), asset = LOGOS[e.id];
  const initials = e.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map(x => x[0]).slice(0,2).join('');
  const fallback = () => { box.replaceChildren(el('span', initials)); box.classList.add('fallback'); box.title = e.displayName + ' · logo unavailable'; };
  if (asset?.dataUri && /^data:image\/(png|webp|jpeg|gif|x-icon|vnd.microsoft.icon|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(asset.dataUri)) {
    const image = el('img'); image.src = asset.dataUri; image.alt = e.displayName + ' logo'; image.loading = 'lazy'; image.decoding = 'async'; image.width = 40; image.height = 40;
    image.onerror = fallback; box.append(image);
  } else fallback();
  return box;
}
function gradeTrack(score, example = false) {
  const track = el('div', undefined, 'grade-track' + (example ? ' example' : ''));
  track.setAttribute('aria-label', example ? 'A 85 to 100, B 70 to below 85, C 50 to below 70, D below 50' : 'Possible personal grade: ' + (score?.range || 'Unrated'));
  for (const band of RUBRIC.gradeBands) {
    const segment = el('span', band.letter, 'grade-segment'); segment.dataset.grade = band.letter;
    if (score?.ratedCount && score.total) {
      const order = RUBRIC.gradeBands.map(b => b.letter), index = order.indexOf(band.letter);
      if (index >= order.indexOf(score.highGrade) && index <= order.indexOf(score.lowGrade)) segment.classList.add('active');
    }
    track.append(segment);
  }
  return track;
}
function scoreCaption(s) {
  if (s.blocked) return 'Hard constraint fails · do not advance';
  if (!s.total) return 'Set your criterion weights';
  if (!s.ratedCount) return 'Unrated · your call, with receipts';
  if (s.ready) return 'Supported personal grade · ' + whole(s.coverage) + '% rated';
  return 'Provisional · ' + whole(s.coverage) + '% rated · ' + whole(s.supported) + '% supported';
}
function compactScore(e) {
  const s = scoreFor(e), button = el('button', undefined, 'card-score'), row = el('div', undefined, 'row');
  button.setAttribute('aria-label', 'Rate ' + e.displayName + ' and see scoring breakdown');
  row.append(el('span', 'MY FIT GRADE', 'score-label'), el('span', s.ratedCount ? s.range + (s.ready ? '' : ' · early read') : '＋ Add your ratings', 'score-value'));
  button.append(row, gradeTrack(s), el('span', scoreCaption(s), 'score-status'));
  button.onclick = () => openDetail(e);
  return button;
}
function enhancedCard(e) {
  const c = el('article', undefined, 'company'), head = el('div', undefined, 'row head'), titles = el('div', undefined, 'titles');
  titles.append(el('h3', e.displayName), el('div', e.niche, 'niche'));
  const keep = el('button', decisionFor(e.id) === 'keep' ? '♥' : '♡', 'quick-keep');
  keep.setAttribute('aria-label', 'Shortlist ' + e.displayName); keep.setAttribute('aria-pressed', String(decisionFor(e.id) === 'keep'));
  keep.onclick = () => { review.decisions[e.id] = {...review.decisions[e.id], decision: decisionFor(e.id) === 'keep' ? 'unreviewed' : 'keep', notes: review.decisions[e.id]?.notes || ''}; save(); render(); };
  head.append(logo(e), titles, keep);
  const tags = el('div', undefined, 'metadata');
  if (e.top100) tags.append(badge(e.priority === 'Start here' ? '✦ Start here' : e.priority, e.priority === 'Conditional shortlist' ? 'amber' : 'purple'));
  if (e.workplace.mode !== 'unknown') tags.append(badge(modeNames[e.workplace.mode], 'green'));
  if (e.workforceEvents.length) tags.append(badge('△ Workforce / project context', 'amber'));
  const receipts = el('div', undefined, 'signal-strip');
  receipts.append(el('span', e.evidence.length + ' linked evidence ' + (e.evidence.length === 1 ? 'note' : 'notes')), el('span', e.researchDepth === 'Expanded dossier' ? 'Deep dive' : 'First look'));
  const foot = el('div', undefined, 'footer'), button = el('button', 'Read the dossier ↗');
  button.setAttribute('aria-label', 'Open ' + e.displayName + ' dossier'); button.onclick = () => openDetail(e);
  foot.append(el('span', decisionFor(e.id) === 'unreviewed' ? 'Checked ' + DB.asOf : 'Your call: ' + decisionFor(e.id)), button);
  c.append(head, tags, el('p', e.thesis, 'thesis'));const searchMatch=briefMatch(e);if(appliedBrief)c.append(el('div','Search interests: '+(searchMatch.matched.join(', ')||'No interest restriction')+(appliedBrief.remote&&searchMatch.remote?' · documented remote option; confirm role':''),'brief-match'));c.append(receipts, compactScore(e), foot);
  return c;
}
function evidenceFor(e, id) {
  if (id === 'people') return e.evidence.filter(f => ['retention','tenure','engagement','boomerang','workforce','restructuring','notice','employer_pride'].includes(f.kind));
  if (id === 'business') return e.evidence.filter(f => ['capital','debt','secondary','business','contract_ceiling','ownership','project_change'].includes(f.kind));
  return [];
}
function supportingLeads(e, dimension) {
  const box = el('div', undefined, 'reference-note');
  const facts = evidenceFor(e, dimension.id);
  if (facts.length) {
    box.append(el('p', 'Research leads to inspect — relevance and meaning still need your judgment:'));
    facts.slice(0,3).forEach(f => { const p = el('p', f.claim); p.append(' ', safeLink('Source ↗', f.url)); box.append(p); });
  } else if (dimension.id === 'flex' && e.workplace.source) {
    box.append(el('p', e.workplace.note), safeLink('Policy / role source ↗', e.workplace.source));
  } else if (dimension.id === 'pay' && e.payExamples.length) {
    e.payExamples.forEach(p => box.append(el('p', p.role + ': ' + payText(p)), safeLink('Exact posting ↗', p.source)));
    box.append(el('p', 'These are role examples, not employer-wide pay benchmarks.'));
  } else {
    box.append(el('p', dimension.id === 'role' ? 'Search hypotheses: ' + e.roleHypotheses.join(' · ') + '. Verify a real role before rating.' : dimension.id === 'location' ? 'Use your own household budget. The city calculator supplies historical context only.' : 'No comparable, sufficient evidence for this criterion is established here yet.'));
  }
  return box;
}
function buildScoreSummary(e, target) {
  const s = scoreFor(e), top = el('div', undefined, 'grade-head'), label = el('div');
  const band = RUBRIC.gradeBands.find(b => b.letter === s.letter);
  label.append(el('strong', s.blocked ? 'Hard constraint fails' : !s.ratedCount ? 'Build your own read' : band ? band.label : 'Still a range of possibilities'), el('span', scoreCaption(s)));
  top.append(el('div', s.range, 'grade-big'), label);
  const bars = el('div', undefined, 'coverage-bars');
  for (const [name, value, supported] of [['Criteria rated',s.coverage,false],['With a recorded basis',s.supported,true]]) {
    const row = el('div', undefined, 'coverage-row'), track = el('div', undefined, 'coverage-track'), fill = el('div', undefined, 'coverage-fill' + (supported ? ' supported' : ''));
    fill.style.width = Math.min(100,value) + '%'; track.append(fill); row.append(el('span',name),track,el('span',whole(value)+'%')); bars.append(row);
  }
  const points = !s.ratedCount || !s.total ? 'No rating yet. Start with one criterion below.' : s.coverage > 99.999 ? tenth(s.earned) + ' / 100 · personal fit, not an employer quality fact.' : 'Possible score: ' + tenth(s.earned) + '–' + tenth(s.upper) + ' / 100. Unknown criteria account for the range.';
  const details = el('details', undefined, 'score-explanation'), summary = el('summary', 'Show the math + what would change this grade');
  const scroll = el('div', undefined, 'table-scroll'), table = el('table', undefined, 'score-table'), heading = el('tr');
  ['Criterion','Weight','Rating','Points'].forEach(x => heading.append(el('th',x))); const thead = el('thead'); thead.append(heading); const tbody = el('tbody');
  s.rows.forEach((row,i) => { const tr=el('tr'); [RUBRIC.dimensions[i].title, tenth(row.weight)+'%',row.value === null ? 'Unknown' : row.value+'/4',row.value === null ? '0–'+tenth(row.weight) : tenth(row.points)].forEach(v=>tr.append(el('td',v))); tbody.append(tr); });
  table.append(thead,tbody); scroll.append(table);
  details.append(summary,el('p','Points = normalized weight × rating ÷ 4. The lower bound is earned points; the upper bound adds all unknown weight. Missing data is not a zero rating, and its weight is never redistributed to known criteria.'),scroll);
  if(s.missing.length){details.append(el('p','Before treating this as a supported grade:'));const list=el('ul');s.missing.forEach(m=>list.append(el('li',m)));details.append(list);}else details.append(el('p','The recorded inputs meet the rubric’s support rules. This is still your judgment about this opportunity, not an independently verified employer certification.'));
  details.append(el('p','A ≥85 · B ≥70 · C ≥50 · D <50. Grade boundaries use unrounded values; displayed totals are rounded. Changing weights can change your grade. A flagged event is investigated once in the relevant criterion, not deducted again as an automatic penalty.'));
  target.replaceChildren(top,gradeTrack(s),el('p',points,'score-status'),bars,details);
}
function scoreEditor(e) {
  const box = section('Your scorecard. Your call.'), summary = el('div', undefined, 'scoreboard');
  box.prepend(el('div','01 / The fit check','thread-kicker'));
  const record = ratingFor(e); let lastSaveNote;
  const persist = () => { record.updatedAt = new Date().toISOString(); review.ratings[e.id] = record; save(); buildScoreSummary(e,summary); render(); if(lastSaveNote)lastSaveNote.textContent=storageOK?'Saved in this browser · private to you':'Session only · export before closing'; };
  const fields = el('div', undefined, 'context-fields'), contextLabel = el('label','Role / team you’re considering','rating-input-label'), context = el('input');
  context.maxLength=500; context.value=record.context; context.placeholder='e.g. Partnerships · US energy team'; context.oninput=()=>{record.context=context.value;persist();}; contextLabel.append(context);
  const constraintsLabel=el('label','My hard constraints','rating-input-label'), constraints=el('select');
  for(const [value,text]of [['unknown','Still checking'],['clear','All checked — clear'],['blocked','A non-negotiable fails']]){const o=el('option',text);o.value=value;constraints.append(o);}constraints.value=record.constraints;constraints.onchange=()=>{record.constraints=constraints.value;persist();};constraintsLabel.append(constraints);fields.append(contextLabel,constraintsLabel);
  box.append(summary,el('p','Rate 0–4 using the anchors below. Choose Unknown whenever you lack a basis. Your ratings never change the public research.','muted'),fields);
  if(e.workforceEvents.length){const risk=el('div',undefined,'risk-context'),label=el('label',undefined,'rating-input-label'),check=el('input'),note=el('textarea');check.type='checkbox';check.checked=record.riskReviewed;label.append(check,' I checked the linked workforce / project context');note.rows=2;note.maxLength=4000;note.value=record.riskNote;note.placeholder='Which event, its date, and why it does or does not affect this team…';note.setAttribute('aria-label','Workforce context for '+e.name);check.onchange=()=>{record.riskReviewed=check.checked;persist();};note.oninput=()=>{record.riskNote=note.value;persist();};risk.append(el('p','△ This dossier has a workforce or project event. Hiring can coexist with cuts. Read the event below before settling the grade.'),label,note);box.append(risk);}
  RUBRIC.dimensions.forEach((dimension,index)=>{
    const entry=record.criteria[dimension.id] || {value:null,basis:'hunch',reason:''};record.criteria[dimension.id]=entry;
    const detail=el('details',undefined,'rating-criterion'),head=el('summary'),valueLabel=el('span',undefined,'criterion-result'),inner=el('div',undefined,'inner'),buttons=el('div',undefined,'rating-buttons'),anchor=el('p',undefined,'anchor-copy');
    const showValue=()=>{valueLabel.textContent=entry.value===null?'Unknown':entry.value+'/4 · '+RUBRIC.anchorLabels[entry.value];anchor.textContent=entry.value===null?'No score until you have a basis. Unknown is an honest answer.':dimension.anchors[entry.value];for(const b of buttons.children)b.setAttribute('aria-pressed',String(Number(b.dataset.value)===entry.value));};
    head.append(el('span',String(index+1),'criterion-dot'),el('span',dimension.title),valueLabel);detail.append(head,inner);
    for(let value=0;value<5;value++){const b=el('button');b.type='button';b.dataset.value=String(value);b.setAttribute('aria-label',dimension.title+': '+value+' — '+RUBRIC.anchorLabels[value]);b.title=dimension.anchors[value];b.append(el('b',String(value)),el('span',RUBRIC.anchorLabels[value]));b.onclick=()=>{entry.value=value;persist();showValue();};buttons.append(b);}
    const clear=el('button','Mark unknown / clear this rating','clear-rating');clear.onclick=()=>{entry.value=null;persist();showValue();};
    const basisLabel=el('label','How much support does this rating have?','rating-input-label'),basis=el('select');
    for(const [value,text] of [['hunch','First impression — not substantiated'],['supported','Supported — relevant source + rationale'],['confirmed','Corroborated — multiple relevant perspectives']]){const o=el('option',text);o.value=value;basis.append(o);}basis.value=entry.basis;basis.onchange=()=>{entry.basis=basis.value;persist();};basisLabel.append(basis);
    const reasonLabel=el('label','The receipt / your reasoning','rating-input-label'),reason=el('textarea');reason.rows=3;reason.maxLength=4000;reason.value=entry.reason;reason.placeholder='Source URL or conversation, date, team / scope, what it supports, and what remains uncertain…';reason.oninput=()=>{entry.reason=reason.value;persist();};reasonLabel.append(reason);
    inner.append(el('p',dimension.question,'question'),el('p',dimension.guidance,'muted'),buttons,anchor,clear,basisLabel,reasonLabel,supportingLeads(e,dimension));showValue();box.append(detail);
  });
  lastSaveNote=el('p','Ratings and reasons stay in this browser. Export your review to keep a copy.','rating-footnote');box.append(lastSaveNote);buildScoreSummary(e,summary);return box;
}
function buildRubricGuide() {
  const guide=$('rubric-guide'),legend=el('div',undefined,'grade-legend');
  RUBRIC.gradeBands.forEach((b,i)=>{const box=el('div');box.append(el('b',b.letter),el('strong',b.label),el('span',i===0?'85–100 points':b.min+' to below '+RUBRIC.gradeBands[i-1].min));legend.append(box);});guide.append(legend);
  guide.append(el('p','A personal grade answers “is this opportunity right for me?” It is not a ranking of employee happiness. No grades are seeded from brand fame, public status, investor names, editorial position or missing data.'));
  const steps=el('ol');[
    'Start with one real role or team. Confirm eligibility, pay floor, mission, office days and travel. Unknown constraints do not pass; a failure blocks advancement regardless of the score.',
    'Rate each criterion 0–4 using its anchors. Weights default to 25 / 20 / 20 / 15 / 15 / 5. You can change them; positive weights are normalized to 100. All-zero weights produce no grade.',
    'For known criteria, points = weight × rating ÷ 4. Unknown criteria produce a possible range from 0 to their full weight. We never inflate known ratings by dropping unknown weight.',
    'A letter settles only when both ends of the possible range fall in the same grade band. Any earlier letter or range is provisional.',
    'A supported grade also needs at least 70% weighted support, recorded reasons for people, role and business, a named opportunity, clear hard constraints, and a reasoned review of any linked workforce / project event. Even a zero-weight critical criterion needs a supported rating.',
    'Support is self-reported, not independently validated. A non-empty rationale is required, but the software cannot verify its truth. First impressions never count toward supported coverage.',
    'Evidence sources are not votes. A layoff is context to investigate for your team, not a double penalty; a funding round is not a culture bonus. Keep dates and populations with every claim.'
  ].forEach(t=>steps.append(el('li',t)));guide.append(steps);
  const example=el('div',undefined,'reference-note');example.append(el('p','Worked example: with default weights, six 3/4 ratings earn 75/100 → B. If location (5%) is unknown, the range is 71.25–76.25, still B. If people (25%) is also unknown, the range becomes 52.5–82.5 → B–C possibilities, and the grade remains provisional. A failed hard constraint blocks advancement even if every rating is 4/4.'));guide.append(example);
  RUBRIC.dimensions.forEach(d=>{const details=el('details',undefined,'rubric-details');details.append(el('summary',d.title+' · '+d.weight+'% default'),el('p',d.guidance));const list=el('ol',undefined,'rubric-anchors');list.start=0;d.anchors.forEach((text,i)=>{const li=el('li');li.append(el('strong',RUBRIC.anchorLabels[i]+': '),document.createTextNode(text));list.append(li);});details.append(list);guide.append(details);});
  guide.append(el('p','Evidence freshness: confirm job terms when applying and before accepting. Revisit workforce and capital facts for active targets every 30 days and financial disclosures each reporting cycle. Older or unclear evidence can inform questions; do not mark it corroborated without checking relevance. Rubric v'+RUBRIC.version+' · updated '+RUBRIC.updatedAt+'.','rating-footnote'));
}
