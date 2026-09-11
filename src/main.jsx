import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE = {
  draft: 'life-priorities-answers',
  history: 'life-priorities-history'
};

const categories = [
  { id: 'health', name: 'Health' },
  { id: 'wealth', name: 'Wealth' },
  { id: 'family', name: 'Family & Relationships' },
  { id: 'career', name: 'Career & Goals' },
  { id: 'lifestyle', name: 'Lifestyle & Time' },
  { id: 'purpose', name: 'Purpose & Legacy' },
  { id: 'needs', name: 'Needs' },
  { id: 'wants', name: 'Wants' }
];

const questions = categories.flatMap((category) => [
  { id: `${category.id}-importance`, category: category.id, metric: 'importance', text: `How important is ${category.name.toLowerCase()} to the life you want?` },
  { id: `${category.id}-attention`, category: category.id, metric: 'attention', text: `How much attention does ${category.name.toLowerCase()} currently receive?` },
  { id: `${category.id}-satisfaction`, category: category.id, metric: 'satisfaction', text: `How satisfied are you with your current position in ${category.name.toLowerCase()}?` }
]);

const actionLibrary = {
  health: {
    Underinvested: 'Protect three 30-minute blocks this week for movement, recovery, or an overdue health task.',
    'Needs attention': 'Choose one health friction point and take the smallest concrete step this week, such as scheduling an appointment or restarting one routine.',
    Overinvested: 'Keep the health habits that matter, but reclaim one low-value block for a higher-priority area.',
    Aligned: 'Maintain one health habit that is repeatable even during a busy week.'
  },
  wealth: {
    Underinvested: 'Schedule one 45-minute money session to review spending, debt, savings, and one next financial move.',
    'Needs attention': 'Identify the single financial issue creating the most pressure and define one measurable step to reduce it this month.',
    Overinvested: 'Automate or simplify one money task so financial management uses less attention without losing control.',
    Aligned: 'Keep one monthly money review and track the single number that matters most to your current goal.'
  },
  family: {
    Underinvested: 'Protect one recurring block of undistracted time with the person or people who matter most.',
    'Needs attention': 'Choose one relationship that feels strained or neglected and make one specific contact or plan within seven days.',
    Overinvested: 'Keep the relationships that matter while setting one boundary around an obligation that is crowding out another priority.',
    Aligned: 'Maintain one recurring ritual that keeps important relationships from becoming accidental.'
  },
  career: {
    Underinvested: 'Reserve one focused hour this week for the career move with the highest future payoff, not the loudest current demand.',
    'Needs attention': 'Name the biggest career frustration and choose one skill, conversation, application, or project that can change it.',
    Overinvested: 'Remove or delegate one low-value work commitment and redirect the time toward a neglected life priority.',
    Aligned: 'Define one 30-day career outcome and protect a weekly block to move it forward.'
  },
  lifestyle: {
    Underinvested: 'Put one block of unclaimed personal time on the calendar before other obligations consume it.',
    'Needs attention': 'Remove one recurring source of avoidable friction from your week and replace it with a simpler routine.',
    Overinvested: 'Audit leisure and convenience time for one activity that consumes more time than value.',
    Aligned: 'Protect the routine that gives you the most energy per hour invested.'
  },
  purpose: {
    Underinvested: 'Spend 30 minutes writing what you want the next five years to stand for, then choose one action that matches it.',
    'Needs attention': 'Pick one meaningful project, contribution, or creative pursuit and give it a small deadline within 30 days.',
    Overinvested: 'Keep the meaningful work, but check whether it is displacing immediate responsibilities that need attention now.',
    Aligned: 'Keep one recurring activity that connects daily life to a larger purpose.'
  },
  needs: {
    Underinvested: 'List the three needs that are currently non-negotiable and schedule the first concrete step for the most neglected one.',
    'Needs attention': 'Separate a true need from an urgent preference, then address the need with the highest consequence if ignored.',
    Overinvested: 'Check whether caution or maintenance has expanded beyond what is actually necessary and reclaim one block of time or money.',
    Aligned: 'Keep your essential needs visible and review them before taking on new wants or commitments.'
  },
  wants: {
    Underinvested: 'Choose one want that would genuinely improve your life and give it a realistic budget, date, or first step.',
    'Needs attention': 'Identify whether the dissatisfaction is about the thing you want or what you expect it to change for you.',
    Overinvested: 'Pause one lower-value want for 30 days and redirect that money or attention toward a higher-ranked priority.',
    Aligned: 'Keep wants intentional by choosing them deliberately instead of letting convenience make the decision.'
  }
};

const measureLibrary = {
  health: 'Measure: number of protected health blocks completed.',
  wealth: 'Measure: one financial action completed and one number tracked.',
  family: 'Measure: one protected connection completed without multitasking.',
  career: 'Measure: one concrete career output completed.',
  lifestyle: 'Measure: hours reclaimed or one recurring friction removed.',
  purpose: 'Measure: one meaningful milestone completed.',
  needs: 'Measure: one neglected essential need moved forward.',
  wants: 'Measure: one intentional decision made with a budget or deadline.'
};

function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadAnswers() {
  return loadJson(STORAGE.draft, {});
}

function loadHistory() {
  const value = loadJson(STORAGE.history, []);
  return Array.isArray(value) ? value : [];
}

function getAnalysis(answers) {
  return categories.map((category) => {
    const importance = Number(answers[`${category.id}-importance`]) || 0;
    const attention = Number(answers[`${category.id}-attention`]) || 0;
    const satisfaction = Number(answers[`${category.id}-satisfaction`]) || 0;
    const gap = importance - attention;
    const lowSatisfaction = satisfaction <= 4 && importance >= 7;
    const priority = Math.max(0, Math.min(100, Math.round((importance * 0.5 + Math.max(gap, 0) * 0.3 + (10 - satisfaction) * 0.2) * 10)));
    let status = 'Aligned';
    if (gap >= 3) status = 'Underinvested';
    else if (lowSatisfaction) status = 'Needs attention';
    else if (gap <= -3) status = 'Overinvested';
    return { ...category, importance, attention, satisfaction, gap, priority, status, lowSatisfaction };
  });
}

function getSummary(analysis) {
  const averageSatisfaction = Math.round((analysis.reduce((sum, item) => sum + item.satisfaction, 0) / analysis.length) * 10);
  const balanceScore = Math.max(0, 100 - Math.round((analysis.reduce((sum, item) => sum + Math.abs(item.gap), 0) / analysis.length) * 10));
  return { averageSatisfaction, balanceScore };
}

function getAction(item) {
  return actionLibrary[item.id]?.[item.status] || 'Choose one small action that moves this area closer to the attention you believe it deserves.';
}

function getPlan(analysis) {
  return [...analysis]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((item, index) => ({
      id: item.id,
      category: item.name,
      action: getAction(item),
      measure: measureLibrary[item.id],
      target: index === 0 ? 'Week 1' : index === 1 ? 'Week 2' : 'By day 30',
      status: 'Not started'
    }));
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function wrapText(text, max = 82) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function pdfEscape(text) {
  return String(text)
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function createPdfDocument(rows) {
  const pages = [];
  let current = [];
  let y = 748;

  rows.forEach((row) => {
    const size = row.size || 11;
    const leading = row.leading || size + 6;
    const wrapped = wrapText(row.text || '', row.max || (size >= 18 ? 56 : 82));
    const needed = Math.max(1, wrapped.length) * leading + (row.after || 0);
    if (y - needed < 48 && current.length) {
      pages.push(current);
      current = [];
      y = 748;
    }
    (wrapped.length ? wrapped : ['']).forEach((line) => {
      current.push({ ...row, text: line, y });
      y -= leading;
    });
    y -= row.after || 0;
  });
  if (current.length) pages.push(current);

  const fontRegularId = 3 + pages.length * 2;
  const fontBoldId = fontRegularId + 1;
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';

  const kids = [];
  pages.forEach((page, pageIndex) => {
    const pageId = 3 + pageIndex * 2;
    const contentId = pageId + 1;
    kids.push(`${pageId} 0 R`);
    const stream = page.map((row) => {
      const font = row.bold ? 'F2' : 'F1';
      const size = row.size || 11;
      return `BT /${font} ${size} Tf 50 ${row.y} Td (${pdfEscape(row.text)}) Tj ET`;
    }).join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
  objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function downloadReport({ analysis, summary, plan, createdAt }) {
  const top = [...analysis].sort((a, b) => b.priority - a.priority).slice(0, 3);
  const rows = [
    { text: 'LIFE PRIORITIES', size: 22, bold: true, leading: 28, after: 8 },
    { text: 'Personal Priority Report', size: 15, bold: true, leading: 22 },
    { text: `Created: ${formatDate(createdAt || Date.now())}`, size: 10, after: 14 },
    { text: `Priority Balance: ${summary.balanceScore}/100`, size: 13, bold: true },
    { text: `Average Satisfaction: ${summary.averageSatisfaction}/100`, size: 13, bold: true, after: 16 },
    { text: 'TOP 3 ACTION PRIORITIES', size: 14, bold: true, after: 4 }
  ];

  top.forEach((item, index) => {
    rows.push({ text: `${index + 1}. ${item.name} - Action Priority ${item.priority}/100`, bold: true });
    rows.push({ text: `Importance ${item.importance}/10 | Attention ${item.attention}/10 | Satisfaction ${item.satisfaction}/10 | Gap ${item.gap > 0 ? '+' : ''}${item.gap}` });
    rows.push({ text: `Recommended action: ${getAction(item)}`, after: 8 });
  });

  rows.push({ text: '30-DAY PLAN', size: 14, bold: true, after: 4 });
  plan.forEach((item, index) => {
    rows.push({ text: `${index + 1}. ${item.category} - ${item.target} - ${item.status || 'Not started'}`, bold: true });
    rows.push({ text: item.action });
    rows.push({ text: item.measure, after: 8 });
  });

  rows.push({ text: 'ALL AREAS', size: 14, bold: true, after: 4 });
  [...analysis].sort((a, b) => b.priority - a.priority).forEach((item) => {
    rows.push({ text: `${item.name}: priority ${item.priority}/100 | importance ${item.importance}/10 | attention ${item.attention}/10 | satisfaction ${item.satisfaction}/10 | ${item.status}` });
  });

  rows.push({ text: 'Use this report as a decision aid, not a diagnosis or professional financial, medical, or mental-health assessment.', size: 9, after: 4 });

  const pdf = createPdfDocument(rows);
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const day = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
  link.href = url;
  link.download = `life-priorities-${day}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [mode, setMode] = useState('landing');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(loadAnswers);
  const [history, setHistory] = useState(loadHistory);
  const [activeSaved, setActiveSaved] = useState(null);
  const [comparison, setComparison] = useState([]);

  const draftAnswered = Object.keys(answers).filter((key) => answers[key]).length;
  const resultAnswers = activeSaved?.answers || answers;
  const analysis = useMemo(() => getAnalysis(resultAnswers), [resultAnswers]);

  function persistHistory(next) {
    setHistory(next);
    localStorage.setItem(STORAGE.history, JSON.stringify(next));
  }

  function choose(value) {
    const current = questions[index];
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    localStorage.setItem(STORAGE.draft, JSON.stringify(next));
    if (index < questions.length - 1) setIndex(index + 1);
    else {
      setActiveSaved(null);
      setMode('results');
    }
  }

  function resumeAssessment() {
    const firstUnanswered = questions.findIndex((question) => !answers[question.id]);
    if (firstUnanswered === -1 && draftAnswered === questions.length) {
      setActiveSaved(null);
      setMode('results');
      return;
    }
    setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setActiveSaved(null);
    setMode('assessment');
  }

  function startFresh() {
    localStorage.removeItem(STORAGE.draft);
    setAnswers({});
    setIndex(0);
    setActiveSaved(null);
    setMode('assessment');
  }

  function saveAssessment(payload) {
    const now = new Date().toISOString();
    if (activeSaved) {
      const updated = { ...activeSaved, ...payload, answers: activeSaved.answers, updatedAt: now };
      const next = history.map((entry) => entry.id === activeSaved.id ? updated : entry);
      persistHistory(next);
      setActiveSaved(updated);
      return updated;
    }

    const entry = {
      id: `assessment-${Date.now()}`,
      createdAt: now,
      answers: { ...answers },
      ...payload
    };
    const next = [entry, ...history];
    persistHistory(next);
    setActiveSaved(entry);
    return entry;
  }

  function openSaved(entry) {
    setActiveSaved(entry);
    setMode('results');
  }

  function deleteSaved(id) {
    const next = history.filter((entry) => entry.id !== id);
    persistHistory(next);
    if (activeSaved?.id === id) setActiveSaved(null);
  }

  function openComparison(entries) {
    setComparison(entries);
    setMode('compare');
  }

  if (mode === 'landing') {
    return <Landing
      onResume={resumeAssessment}
      onFresh={startFresh}
      onHistory={() => setMode('history')}
      hasProgress={draftAnswered > 0}
      historyCount={history.length}
    />;
  }

  if (mode === 'history') {
    return <History
      history={history}
      onHome={() => setMode('landing')}
      onOpen={openSaved}
      onDelete={deleteSaved}
      onCompare={openComparison}
    />;
  }

  if (mode === 'compare') {
    return <Comparison entries={comparison} onBack={() => setMode('history')} />;
  }

  if (mode === 'results') {
    return <Results
      analysis={analysis}
      answers={resultAnswers}
      savedEntry={activeSaved}
      onSave={saveAssessment}
      onHome={() => setMode('landing')}
      onHistory={() => setMode('history')}
      onStartFresh={startFresh}
    />;
  }

  const current = questions[index];
  const progress = Math.round((Object.keys(answers).filter((key) => answers[key]).length / questions.length) * 100);
  const category = categories.find((item) => item.id === current.category);

  return <main className="shell">
    <header className="topbar"><button className="text-button" onClick={() => setMode('landing')}>Home</button><b>LIFE PRIORITIES</b><span>{index + 1} / {questions.length}</span></header>
    <div className="progress"><span style={{ width: `${Math.max(progress, 3)}%` }} /></div>
    <section className="card">
      <p className="eyebrow">{category.name}</p>
      <h1>{current.text}</h1>
      <p className="hint">Rate this from 1 to 10.</p>
      <div className="scale">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((number) => <button key={number} className={answers[current.id] === number ? 'selected' : ''} onClick={() => choose(number)} aria-label={`Rate ${number} out of 10`}><strong>{number}</strong><small>{number === 1 ? 'Low' : number === 10 ? 'High' : ''}</small></button>)}
      </div>
      <button className="back" disabled={!index} onClick={() => setIndex(index - 1)}>Back</button>
    </section>
  </main>;
}

function Landing({ onResume, onFresh, onHistory, hasProgress, historyCount }) {
  return <main className="landing">
    <div>
      <p className="eyebrow">A PERSONAL AUDIT</p>
      <h1>Build a life around what actually matters.</h1>
      <p className="lead">See where your priorities are, where your attention is going, and what deserves a deliberate change next.</p>
      <div className="landing-actions">
        <button className="primary" onClick={hasProgress ? onResume : onFresh}>{hasProgress ? 'Continue Assessment' : 'Start Assessment'}</button>
        {hasProgress && <button className="secondary" onClick={onFresh}>Start Fresh</button>}
        {historyCount > 0 && <button className="secondary" onClick={onHistory}>Previous Assessments ({historyCount})</button>}
      </div>
      <p className="micro">24 questions · about 5 minutes · results stay on this device unless you download or share them</p>
    </div>
  </main>;
}

function Results({ analysis, answers, savedEntry, onSave, onHome, onHistory, onStartFresh }) {
  const complete = questions.every((question) => answers[question.id]);
  const underinvested = analysis.filter((item) => item.status === 'Underinvested').sort((a, b) => b.priority - a.priority);
  const overinvested = analysis.filter((item) => item.status === 'Overinvested').sort((a, b) => a.gap - b.gap);
  const topPriorities = [...analysis].sort((a, b) => b.priority - a.priority).slice(0, 3);
  const summary = getSummary(analysis);
  const basePlan = useMemo(() => getPlan(analysis), [analysis]);
  const [planStatus, setPlanStatus] = useState({});
  const [saveNotice, setSaveNotice] = useState(savedEntry ? 'Saved assessment' : '');

  useEffect(() => {
    const statuses = {};
    (savedEntry?.plan || []).forEach((item) => { statuses[item.id] = item.status || 'Not started'; });
    setPlanStatus(statuses);
    setSaveNotice(savedEntry ? 'Saved assessment' : '');
  }, [savedEntry?.id]);

  const plan = basePlan.map((item) => ({ ...item, status: planStatus[item.id] || item.status }));

  function handleSave() {
    const saved = onSave({
      analysis,
      summary,
      plan
    });
    setSaveNotice(savedEntry ? 'Saved assessment updated.' : `Saved ${formatDate(saved.createdAt)}.`);
  }

  function handleDownload() {
    downloadReport({ analysis, summary, plan, createdAt: savedEntry?.createdAt || Date.now() });
  }

  return <main className="shell">
    <header className="topbar"><button className="text-button" onClick={onHome}>Home</button><b>LIFE PRIORITIES</b><button className="text-button" onClick={onHistory}>History</button></header>
    {!complete && <div className="notice">This profile is incomplete. Finish all 24 questions before treating the scores as meaningful.</div>}
    <section className="results">
      <div className="results-heading">
        <div><p className="eyebrow">YOUR PRIORITY PROFILE</p><h1>Your life, translated into decisions.</h1></div>
        {savedEntry && <span className="saved-badge">Saved · {formatDate(savedEntry.createdAt)}</span>}
      </div>

      <div className="summary-grid">
        <div><span>Priority balance</span><strong>{summary.balanceScore}<small>/100</small></strong><p>How closely attention matches stated importance.</p></div>
        <div><span>Average satisfaction</span><strong>{summary.averageSatisfaction}<small>/100</small></strong><p>Your average satisfaction across all eight areas.</p></div>
      </div>

      <section className="insight-section">
        <p className="eyebrow">START HERE</p><h2>Your top 3 action priorities</h2>
        <p className="section-copy">This is an action-priority score, not a judgment of what matters most. It combines importance, underinvestment, and dissatisfaction.</p>
        <div className="priority-list">
          {topPriorities.map((item, i) => <div className="priority-card" key={item.id}><div className="rank">{i + 1}</div><div><b>{item.name}</b><p>{item.status}. Importance {item.importance}/10 · Attention {item.attention}/10 · Satisfaction {item.satisfaction}/10.</p><p className="recommendation">{getAction(item)}</p></div><strong>{item.priority}</strong></div>)}
        </div>
      </section>

      <section className="insight-section plan-section">
        <p className="eyebrow">30-DAY PLAN</p><h2>Turn the scores into movement.</h2>
        <p className="section-copy">Keep the plan deliberately small. Three actions completed beats fifteen intentions marinating in a notes app.</p>
        <div className="plan-grid">
          {plan.map((item, index) => <article className="plan-card" key={item.id}>
            <div className="plan-top"><span className="plan-number">{index + 1}</span><div><b>{item.category}</b><small>{item.target}</small></div></div>
            <p>{item.action}</p><p className="measure">{item.measure}</p>
            <label>Status<select value={item.status} onChange={(event) => setPlanStatus((previous) => ({ ...previous, [item.id]: event.target.value }))}><option>Not started</option><option>In progress</option><option>Done</option></select></label>
          </article>)}
        </div>
      </section>

      <section className="insight-section">
        <p className="eyebrow">THE GAP</p><h2>Where importance and attention disagree</h2>
        <div className="bars">{[...analysis].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).map((item) => <div key={item.id}><div className="label"><b>{item.name}</b><span>{item.gap > 0 ? '+' : ''}{item.gap} gap</span></div><div className="gap-track"><i className={item.gap > 0 ? 'positive' : item.gap < 0 ? 'negative' : ''} style={{ width: `${Math.min(Math.abs(item.gap) * 10, 100)}%` }} /></div><div className="metric-row"><span>Importance {item.importance}/10</span><span>Attention {item.attention}/10</span><span>{item.status}</span></div></div>)}</div>
      </section>

      {underinvested.length > 0 && <section className="insight-section callout"><p className="eyebrow">REBALANCE</p><h2>Areas you're underinvesting in</h2><p className="section-copy">These are areas you say matter more than the attention they currently receive.</p><ul>{underinvested.map((item) => <li key={item.id}><b>{item.name}</b><span>Importance {item.importance}/10 vs. attention {item.attention}/10</span></li>)}</ul></section>}
      {overinvested.length > 0 && <section className="insight-section"><p className="eyebrow">CHECK YOUR ALLOCATION</p><h2>Areas receiving more attention than their importance</h2><ul>{overinvested.map((item) => <li key={item.id}><b>{item.name}</b><span>Attention {item.attention}/10 vs. importance {item.importance}/10</span></li>)}</ul></section>}
      {underinvested.length === 0 && overinvested.length === 0 && <section className="insight-section callout"><p className="eyebrow">BALANCED</p><h2>Your stated priorities and attention are broadly aligned.</h2><p className="section-copy">That does not mean everything is perfect. It means your time and stated priorities are not fighting each other very much.</p></section>}

      <section className="insight-section"><p className="eyebrow">ALL AREAS</p><div className="bars">{[...analysis].sort((a, b) => b.priority - a.priority).map((item) => <div key={item.id}><div className="label"><b>{item.name}</b><span>{item.priority}/100</span></div><div className="bar"><i style={{ width: `${item.priority}%` }} /></div><div className="metric-row"><span>Satisfaction {item.satisfaction}/10</span><span className={`status ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span></div></div>)}</div></section>

      {saveNotice && <div className="save-notice" role="status">{saveNotice}</div>}
      <div className="actions actions-wrap">
        <button className="primary" onClick={handleSave}>{savedEntry ? 'Update Saved Results' : 'Save Results'}</button>
        <button className="secondary" onClick={handleDownload}>Download PDF Report</button>
        <button className="secondary" onClick={() => window.print()}>Print Results</button>
        <button className="secondary" onClick={onStartFresh}>Start New Assessment</button>
      </div>
    </section>
  </main>;
}

function History({ history, onHome, onOpen, onDelete, onCompare }) {
  const [selected, setSelected] = useState([]);
  const ordered = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function toggle(id) {
    setSelected((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : previous.length < 2 ? [...previous, id] : [previous[1], id]);
  }

  function compare() {
    const entries = selected.map((id) => history.find((item) => item.id === id)).filter(Boolean);
    if (entries.length === 2) onCompare(entries);
  }

  return <main className="shell">
    <header className="topbar"><button className="text-button" onClick={onHome}>Home</button><b>ASSESSMENT HISTORY</b><span>{history.length} saved</span></header>
    <section className="results history-page">
      <p className="eyebrow">TRACK CHANGE</p><h1>Previous assessments</h1>
      <p className="section-copy">Save repeated assessments over time, then compare two snapshots. Progress gets much less mystical when there are actual numbers attached.</p>
      {history.length >= 2 && <div className="compare-toolbar"><span>Select two assessments to compare.</span><button className="primary" disabled={selected.length !== 2} onClick={compare}>Compare Selected ({selected.length}/2)</button></div>}
      {history.length === 0 ? <div className="empty-state">No saved assessments yet.</div> : <div className="history-list">{ordered.map((entry) => {
        const entryAnalysis = entry.analysis || getAnalysis(entry.answers || {});
        const entrySummary = entry.summary || getSummary(entryAnalysis);
        const top = [...entryAnalysis].sort((a, b) => b.priority - a.priority)[0];
        return <article className={`history-card ${selected.includes(entry.id) ? 'selected-history' : ''}`} key={entry.id}>
          <label className="history-select"><input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)} aria-label={`Select assessment from ${formatDate(entry.createdAt)}`} /><span>Compare</span></label>
          <div className="history-main"><b>{formatDate(entry.createdAt)}</b><p>Balance {entrySummary.balanceScore}/100 · Satisfaction {entrySummary.averageSatisfaction}/100</p><p>Top action priority: {top?.name || 'Not available'}</p></div>
          <div className="history-actions"><button onClick={() => onOpen(entry)}>View</button><button className="danger-text" onClick={() => { if (window.confirm('Delete this saved assessment?')) onDelete(entry.id); }}>Delete</button></div>
        </article>;
      })}</div>}
    </section>
  </main>;
}

function Comparison({ entries, onBack }) {
  if (entries.length !== 2) return <main className="shell"><button onClick={onBack}>Back</button></main>;
  const [older, newer] = [...entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const olderAnalysis = older.analysis || getAnalysis(older.answers || {});
  const newerAnalysis = newer.analysis || getAnalysis(newer.answers || {});
  const olderSummary = older.summary || getSummary(olderAnalysis);
  const newerSummary = newer.summary || getSummary(newerAnalysis);
  const balanceDelta = newerSummary.balanceScore - olderSummary.balanceScore;
  const satisfactionDelta = newerSummary.averageSatisfaction - olderSummary.averageSatisfaction;

  return <main className="shell">
    <header className="topbar"><button className="text-button" onClick={onBack}>History</button><b>COMPARISON</b><button className="text-button" onClick={() => window.print()}>Print</button></header>
    <section className="results compare-page">
      <p className="eyebrow">CHANGE OVER TIME</p><h1>{formatDate(older.createdAt)} <span className="arrow">→</span> {formatDate(newer.createdAt)}</h1>
      <div className="summary-grid">
        <div><span>Priority balance change</span><strong>{balanceDelta > 0 ? '+' : ''}{balanceDelta}</strong><p>{olderSummary.balanceScore} → {newerSummary.balanceScore}</p></div>
        <div><span>Satisfaction change</span><strong>{satisfactionDelta > 0 ? '+' : ''}{satisfactionDelta}</strong><p>{olderSummary.averageSatisfaction} → {newerSummary.averageSatisfaction}</p></div>
      </div>
      <section className="insight-section"><p className="eyebrow">BY AREA</p><div className="comparison-table"><div className="comparison-row comparison-head"><span>Area</span><span>Satisfaction</span><span>Priority gap</span><span>Action priority</span></div>{categories.map((category) => {
        const before = olderAnalysis.find((item) => item.id === category.id);
        const after = newerAnalysis.find((item) => item.id === category.id);
        const satDelta = after.satisfaction - before.satisfaction;
        const gapImprovement = Math.abs(before.gap) - Math.abs(after.gap);
        const priorityDelta = after.priority - before.priority;
        return <div className="comparison-row" key={category.id}><b>{category.name}</b><span>{before.satisfaction} → {after.satisfaction} <em className={satDelta > 0 ? 'good' : satDelta < 0 ? 'bad' : ''}>{satDelta > 0 ? `+${satDelta}` : satDelta || '—'}</em></span><span>{before.gap > 0 ? '+' : ''}{before.gap} → {after.gap > 0 ? '+' : ''}{after.gap} <em className={gapImprovement > 0 ? 'good' : gapImprovement < 0 ? 'bad' : ''}>{gapImprovement > 0 ? 'closer' : gapImprovement < 0 ? 'wider' : 'same'}</em></span><span>{before.priority} → {after.priority} <em>{priorityDelta > 0 ? `+${priorityDelta}` : priorityDelta || '—'}</em></span></div>;
      })}</div></section>
      <p className="micro comparison-note">Higher satisfaction is generally positive. A smaller absolute priority gap means attention moved closer to stated importance. A higher action-priority score is not automatically good or bad; it means that area currently deserves more deliberate attention.</p>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
