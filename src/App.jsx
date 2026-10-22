import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import LessonView from "./components/LessonView.jsx";
import EditorView from "./components/EditorView.jsx";
import ChallengesView from "./components/ChallengesView.jsx";
import { modules } from "./data/curriculum.js";
import { challenges, totalChallenges } from "./data/challenges.js";
import { simulate } from "./lib/simulator.js";
import { challengeKey, loadProgress, saveProgress } from "./lib/progress.js";

const TABS = [
  { id: "lesson", label: "📖 Lição" },
  { id: "editor", label: "⚡ Editor" },
  { id: "challenges", label: "🎯 Desafios" },
];

export default function App() {
  const [current, setCurrent] = useState({ module: 0, topic: 0 });
  const [tab, setTab] = useState("lesson");
  const [script, setScript] = useState("");
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(loadProgress);
  const [selectedChallenge, setSelectedChallenge] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [verdict, setVerdict] = useState(null);

  const module = modules[current.module];
  const topic = module.topics[current.topic];
  const topicKey = `${current.module}-${current.topic}`;
  const topicChallenges = challenges[topicKey] || [];
  const challenge = topicChallenges[selectedChallenge];

  useEffect(() => {
    setScript(topic.starter || "");
    setResult(null);
    setSelectedChallenge(0);
    setHintsShown(0);
    setVerdict(null);
    setTab("lesson");
  }, [topic]);

  useEffect(() => saveProgress(progress), [progress]);

  function runSimulation() {
    setResult(simulate(script));
  }

  function verifyChallenge() {
    if (!challenge) return;
    const simulation = simulate(script);
    setResult(simulation);
    const passed = !simulation.error && challenge.validate(simulation, script);
    setVerdict(passed);
    if (passed) {
      setProgress((prev) => ({ ...prev, [challengeKey(topicKey, selectedChallenge)]: true }));
    }
  }

  function selectChallenge(index) {
    setSelectedChallenge(index);
    setHintsShown(0);
    setVerdict(null);
  }

  const completedCount = Object.entries(challenges).reduce(
    (total, [key, list]) => total + list.filter((_, i) => progress[challengeKey(key, i)]).length,
    0,
  );

  return (
    <div className="app">
      <Sidebar
        modules={modules}
        current={current}
        onSelect={(moduleIndex, topicIndex) => setCurrent({ module: moduleIndex, topic: topicIndex })}
        progress={progress}
        completedCount={completedCount}
        totalCount={totalChallenges}
        onResetProgress={() => setProgress({})}
      />

      <main className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{module.label} — {topic.label}</div>
            <div className="topbar-sub">K6 Performance Testing · trilha de estudo</div>
          </div>
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="content">
          {tab === "lesson" && (
            <LessonView
              topic={topic}
              onOpenEditor={() => {
                setScript(topic.starter || "");
                setTab("editor");
              }}
            />
          )}
          {tab === "editor" && (
            <EditorView script={script} onScriptChange={setScript} result={result} onSimulate={runSimulation} />
          )}
          {tab === "challenges" && (
            <ChallengesView
              challenges={topicChallenges}
              selected={selectedChallenge}
              onSelect={selectChallenge}
              isDone={(i) => Boolean(progress[challengeKey(topicKey, i)])}
              hintsShown={hintsShown}
              onShowHint={() => setHintsShown((n) => n + 1)}
              verdict={verdict}
              onVerify={verifyChallenge}
              script={script}
              onScriptChange={setScript}
              result={result}
            />
          )}
        </div>
      </main>
    </div>
  );
}
