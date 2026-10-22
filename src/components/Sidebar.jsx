import { challenges } from "../data/challenges.js";
import { challengeKey } from "../lib/progress.js";

export default function Sidebar({ modules, current, onSelect, progress, completedCount, totalCount, onResetProgress }) {
  const percent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  return (
    <aside className="sidebar" aria-label="Módulos e tópicos">
      <div className="brand">
        <div className="brand-logo" aria-hidden="true">K6</div>
        <div>
          <div className="brand-name">Professor K6</div>
          <div className="brand-sub">Performance Testing</div>
        </div>
      </div>

      <div className="progress">
        <div className="caption">Progresso</div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={completedCount}>
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-label">{completedCount}/{totalCount} desafios</div>
        {completedCount > 0 && (
          <button type="button" className="progress-reset" onClick={onResetProgress}>
            zerar progresso
          </button>
        )}
      </div>

      {modules.map((module, moduleIndex) => (
        <nav key={module.id} aria-label={module.label}>
          <div className="module-title" style={{ color: module.color }}>{module.label}</div>
          {module.topics.map((topic, topicIndex) => {
            const topicKey = `${moduleIndex}-${topicIndex}`;
            const topicChallenges = challenges[topicKey] || [];
            const done = topicChallenges.length > 0 &&
              topicChallenges.every((_, i) => progress[challengeKey(topicKey, i)]);
            const active = current.module === moduleIndex && current.topic === topicIndex;
            return (
              <button
                key={topicKey}
                type="button"
                className={`topic-btn${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect(moduleIndex, topicIndex)}
              >
                <span className="topic-status" aria-hidden="true">{done ? "✅" : "○"}</span>
                {topic.label}
              </button>
            );
          })}
        </nav>
      ))}
    </aside>
  );
}
