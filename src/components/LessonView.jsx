import { highlight } from "../lib/highlight.js";

export default function LessonView({ topic, onOpenEditor }) {
  return (
    <div className="two-cols">
      <div className="panel">
        <pre className="lesson-text">{topic.lesson}</pre>
      </div>
      <div className="column">
        <div className="panel" style={{ flex: 1, padding: "14px 16px" }}>
          <div className="caption" style={{ fontSize: 11, marginBottom: 10 }}>Script de exemplo</div>
          <pre className="code-view" dangerouslySetInnerHTML={{ __html: highlight(topic.starter || "") }} />
        </div>
        <button type="button" className="btn-primary" onClick={onOpenEditor}>⚡ Abrir no Editor</button>
      </div>
    </div>
  );
}
