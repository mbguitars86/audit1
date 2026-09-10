import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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
  { id: `${category.id}-importance`, category: category.id, text: `How important is ${category.name.toLowerCase()} to the life you want?` },
  { id: `${category.id}-attention`, category: category.id, text: `How much attention does ${category.name.toLowerCase()} currently receive?` },
  { id: `${category.id}-satisfaction`, category: category.id, text: `How satisfied are you with your current position in ${category.name.toLowerCase()}?` }
]);

function loadAnswers() {
  try { return JSON.parse(localStorage.getItem('life-priorities-answers') || '{}'); } catch { return {}; }
}

function getAnalysis(answers) {
  return categories.map((category) => {
    const importance = answers[`${category.id}-importance`] || 0;
    const attention = answers[`${category.id}-attention`] || 0;
    const satisfaction = answers[`${category.id}-satisfaction`] || 0;
    const gap = importance - attention;
    const priority = Math.round((importance * 0.5 + Math.max(gap, 0) * 0.3 + (10 - satisfaction) * 0.2) * 10);
    let status = 'Aligned';
    if (gap >= 3) status = 'Underinvested';
    else if (gap <= -3) status = 'Overinvested';
    else if (satisfaction <= 4 && importance >= 7) status = 'Needs attention';
    return { ...category, importance, attention, satisfaction, gap, priority, status };
  });
}

function App() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState(loadAnswers);
  const current = questions[index];
  const answered = Object.keys(answers).length;
  const analysis = useMemo(() => getAnalysis(answers), [answers]);

  function choose(value) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    localStorage.setItem('life-priorities-answers', JSON.stringify(next));
    if (index < questions.length - 1) setIndex(index + 1);
    else setFinished(true);
  }

  function start() {
    const firstUnanswered = questions.findIndex((question) => !answers[question.id]);
    setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setStarted(true);
    setFinished(false);
  }

  function reset() {
    localStorage.removeItem('life-priorities-answers');
    setAnswers({}); setIndex(0); setFinished(false); setStarted(false);
  }

  if (!started) return <Landing onStart={start} hasProgress={answered > 0} />;
  if (finished) return <Results analysis={analysis} answered={answered} reset={reset} />;

  const progress = Math.round((answered / questions.length) * 100);
  const category = categories.find((item) => item.id === current.category);
  return <main className="shell">
    <header className="topbar"><b>LIFE PRIORITIES</b><span>{index + 1} / {questions.length}</span></header>
    <div className="progress"><span style={{ width: `${Math.max(progress, 3)}%` }} /></div>
    <section className="card">
      <p className="eyebrow">{category.name}</p><h1>{current.text}</h1><p className="hint">Rate this from 1 to 10.</p>
      <div className="scale">{Array.from({ length: 10 }, (_, i) => i + 1).map((number) => <button key={number} className={answers[current.id] === number ? 'selected' : ''} onClick={() => choose(number)} aria-label={`Rate ${number} out of 10`}><strong>{number}</strong><small>{number === 1 ? 'Low' : number === 10 ? 'High' : ''}</small></button>)}</div>
      <button className="back" disabled={!index} onClick={() => setIndex(index - 1)}>Back</button>
    </section>
  </main>;
}

function Landing({ onStart, hasProgress }) {
  return <main className="landing"><div><p className="eyebrow">A PERSONAL AUDIT</p><h1>Build a life around what actually matters.</h1><p className="lead">A short assessment to help you see where your priorities are, where your time is going, and where the two disagree.</p><button className="primary" onClick={onStart}>{hasProgress ? 'Continue Assessment' : 'Start Assessment'}</button><p className="micro">24 questions · about 5 minutes · saved on this device</p></div></main>;
}

function Results({ analysis, answered, reset }) {
  const complete = answered === questions.length;
  const underinvested = analysis.filter((item) => item.status === 'Underinvested').sort((a, b) => b.priority - a.priority);
  const overinvested = analysis.filter((item) => item.status === 'Overinvested').sort((a, b) => b.gap - a.gap);
  const topPriorities = [...analysis].sort((a, b) => b.priority - a.priority).slice(0, 3);
  const averageSatisfaction = Math.round(analysis.reduce((sum, item) => sum + item.satisfaction, 0) / analysis.length * 10);
  const balanceScore = Math.max(0, 100 - Math.round(analysis.reduce((sum, item) => sum + Math.abs(item.gap), 0) / analysis.length * 10));

  return <main className="shell">
    <header className="topbar"><b>LIFE PRIORITIES</b><button onClick={() => window.print()}>Print</button></header>
    {!complete && <div className="notice">This profile is based on {answered} of {questions.length} answers. Finish the assessment for a complete analysis.</div>}
    <section className="results">
      <p className="eyebrow">YOUR PRIORITY PROFILE</p>
      <div className="summary-grid"><div><span>Priority balance</span><strong>{balanceScore}<small>/100</small></strong></div><div><span>Average satisfaction</span><strong>{averageSatisfaction}<small>/100</small></strong></div></div>

      <section className="insight-section"><p className="eyebrow">START HERE</p><h2>Your top 3 priorities</h2><p className="section-copy">These areas combine high importance, a meaningful attention gap, and lower satisfaction. They are the strongest candidates for action.</p><div className="priority-list">{topPriorities.map((item, i) => <div className="priority-card" key={item.id}><div className="rank">{i + 1}</div><div><b>{item.name}</b><p>{item.status}. Importance {item.importance}/10 · Attention {item.attention}/10 · Satisfaction {item.satisfaction}/10.</p></div><strong>{item.priority}</strong></div>)}</div></section>

      <section className="insight-section"><p className="eyebrow">THE GAP</p><h2>Where your priorities and attention disagree</h2><div className="bars">{[...analysis].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).map((item) => <div key={item.id}><div className="label"><b>{item.name}</b><span>{item.gap > 0 ? '+' : ''}{item.gap} gap</span></div><div className="gap-track"><i className={item.gap > 0 ? 'positive' : item.gap < 0 ? 'negative' : ''} style={{ width: `${Math.min(Math.abs(item.gap) * 10, 100)}%` }} /></div><div className="metric-row"><span>Importance {item.importance}/10</span><span>Attention {item.attention}/10</span><span>{item.status}</span></div></div>)}</div></section>

      {underinvested.length > 0 && <section className="insight-section callout"><p className="eyebrow">REBALANCE</p><h2>Areas you're underinvesting in</h2><p className="section-copy">These are areas you say matter more than the attention they currently receive.</p><ul>{underinvested.map((item) => <li key={item.id}><b>{item.name}</b><span>Importance {item.importance}/10 vs. attention {item.attention}/10</span></li>)}</ul></section>}
      {overinvested.length > 0 && <section className="insight-section"><p className="eyebrow">CHECK YOUR ALLOCATION</p><h2>Areas receiving more attention than their importance</h2><ul>{overinvested.map((item) => <li key={item.id}><b>{item.name}</b><span>Attention {item.attention}/10 vs. importance {item.importance}/10</span></li>)}</ul></section>}
      {underinvested.length === 0 && overinvested.length === 0 && <section className="insight-section callout"><p className="eyebrow">BALANCED</p><h2>Your stated priorities and attention are broadly aligned.</h2><p className="section-copy">That does not mean everything is perfect. It means your time and stated priorities are not fighting each other very much.</p></section>}

      <section className="insight-section"><p className="eyebrow">ALL AREAS</p><div className="bars">{[...analysis].sort((a, b) => b.priority - a.priority).map((item) => <div key={item.id}><div className="label"><b>{item.name}</b><span>{item.priority}/100</span></div><div className="bar"><i style={{ width: `${item.priority}%` }} /></div><div className="metric-row"><span>Satisfaction {item.satisfaction}/10</span><span className={`status ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></div></div>)}</div></section>

      <div className="actions"><button className="primary" onClick={() => window.print()}>Print Results</button><button onClick={reset}>Start Over</button></div>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
