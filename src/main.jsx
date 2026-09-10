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
  try {
    return JSON.parse(localStorage.getItem('life-priorities-answers') || '{}');
  } catch {
    return {};
  }
}

function App() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState(loadAnswers);

  const current = questions[index];
  const answered = Object.keys(answers).length;

  const scores = useMemo(() => {
    return Object.fromEntries(
      categories.map((category) => {
        const values = questions
          .filter((question) => question.category === category.id)
          .map((question) => answers[question.id] || 0)
          .filter(Boolean);
        const score = values.length
          ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10)
          : 0;
        return [category.id, score];
      })
    );
  }, [answers]);

  function choose(value) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    localStorage.setItem('life-priorities-answers', JSON.stringify(next));

    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  }

  function start() {
    const firstUnanswered = questions.findIndex((question) => !answers[question.id]);
    setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setStarted(true);
    setFinished(false);
  }

  function reset() {
    localStorage.removeItem('life-priorities-answers');
    setAnswers({});
    setIndex(0);
    setFinished(false);
    setStarted(false);
  }

  if (!started) return <Landing onStart={start} hasProgress={answered > 0} />;
  if (finished) return <Results scores={scores} answered={answered} reset={reset} />;

  const progress = Math.round((answered / questions.length) * 100);
  const category = categories.find((item) => item.id === current.category);

  return (
    <main className="shell">
      <header className="topbar">
        <b>LIFE PRIORITIES</b>
        <span>{index + 1} / {questions.length}</span>
      </header>
      <div className="progress"><span style={{ width: `${Math.max(progress, 3)}%` }} /></div>
      <section className="card">
        <p className="eyebrow">{category.name}</p>
        <h1>{current.text}</h1>
        <p className="hint">Rate this from 1 to 10.</p>
        <div className="scale">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              className={answers[current.id] === number ? 'selected' : ''}
              onClick={() => choose(number)}
              aria-label={`Rate ${number} out of 10`}
            >
              <strong>{number}</strong>
              <small>{number === 1 ? 'Low' : number === 10 ? 'High' : ''}</small>
            </button>
          ))}
        </div>
        <button className="back" disabled={!index} onClick={() => setIndex(index - 1)}>Back</button>
      </section>
    </main>
  );
}

function Landing({ onStart, hasProgress }) {
  return (
    <main className="landing">
      <div>
        <p className="eyebrow">A PERSONAL AUDIT</p>
        <h1>Build a life around what actually matters.</h1>
        <p className="lead">A short assessment to help you see where your priorities are, where your time is going, and where the two disagree.</p>
        <button className="primary" onClick={onStart}>{hasProgress ? 'Continue Assessment' : 'Start Assessment'}</button>
        <p className="micro">24 questions · about 5 minutes · saved on this device</p>
      </div>
    </main>
  );
}

function Results({ scores, answered, reset }) {
  const sorted = [...categories].sort((a, b) => scores[b.id] - scores[a.id]);
  const average = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / categories.length);

  return (
    <main className="shell">
      <header className="topbar">
        <b>LIFE PRIORITIES</b>
        <button onClick={() => window.print()}>Print</button>
      </header>
      <section className="results">
        <p className="eyebrow">YOUR PRIORITY PROFILE</p>
        <h1>{average}<span>/100</span></h1>
        <p className="lead">Your overall priority score based on {answered} answered questions.</p>
        <div className="bars">
          {sorted.map((category) => (
            <div key={category.id}>
              <div className="label"><b>{category.name}</b><span>{scores[category.id]}/100</span></div>
              <div className="bar"><i style={{ width: `${scores[category.id]}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="actions">
          <button className="primary" onClick={() => window.print()}>Print Results</button>
          <button onClick={reset}>Start Over</button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
