import CodeEditor from "./CodeEditor.jsx";
import SimulationOutput from "./SimulationOutput.jsx";
import { DIFFICULTY } from "../data/challenges.js";

export default function ChallengesView({
  challenges, selected, onSelect, isDone, hintsShown, onShowHint,
  verdict, onVerify, script, onScriptChange, result,
}) {
  if (challenges.length === 0) {
    return <div className="empty">Nenhum desafio neste tópico ainda.</div>;
  }
  const challenge = challenges[selected];

  return (
    <div className="two-cols" style={{ height: "auto" }}>
      <div>
        <div className="challenge-list">
          {challenges.map((c, i) => {
            const difficulty = DIFFICULTY[c.difficulty];
            return (
              <button
                key={c.title}
                type="button"
                className={`challenge-btn${i === selected ? " active" : ""}`}
                onClick={() => onSelect(i)}
              >
                <span>{isDone(i) ? "✅" : `${i + 1}.`}</span>
                {c.title}
                <span className="difficulty" style={{ color: difficulty.color }}>{difficulty.label}</span>
              </button>
            );
          })}
        </div>

        {challenge && (
          <div className="panel" style={{ padding: "16px 18px" }}>
            <div className="challenge-title">{challenge.title}</div>
            <div className="challenge-desc">{challenge.description}</div>
            <div className="hints">
              {challenge.hints.slice(0, hintsShown).map((hint, i) => (
                <div key={i} className="hint">💡 {hint}</div>
              ))}
            </div>
            <div className="challenge-actions">
              {hintsShown < challenge.hints.length && (
                <button type="button" className="btn-secondary" onClick={onShowHint}>
                  💡 Dica ({hintsShown}/{challenge.hints.length})
                </button>
              )}
              <button type="button" className="btn-primary" onClick={onVerify}>✓ Verificar</button>
            </div>
            {verdict !== null && (
              <div className={`feedback ${verdict ? "success" : "fail"}`} role="status">
                {verdict ? "🎉 Correto! Desafio concluído." : "❌ Ainda não. Verifique seu script e tente novamente."}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="column" style={{ gap: 10 }}>
        <CodeEditor value={script} onChange={onScriptChange} label="Editor do desafio" />
        <SimulationOutput result={result} />
      </div>
    </div>
  );
}
