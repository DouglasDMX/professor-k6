import CodeEditor from "./CodeEditor.jsx";
import SimulationOutput from "./SimulationOutput.jsx";

export default function EditorView({ script, onScriptChange, result, onSimulate }) {
  return (
    <div className="two-cols">
      <div className="column" style={{ gap: 10 }}>
        <CodeEditor value={script} onChange={onScriptChange} />
        <button type="button" className="btn-primary" onClick={onSimulate}>▶ Simular Execução K6</button>
      </div>
      <div style={{ overflowY: "auto" }} aria-live="polite">
        <div className="caption" style={{ fontSize: 11, marginBottom: 8 }}>Output da simulação</div>
        <SimulationOutput result={result} />
        {!result && <div className="placeholder">Clique em "Simular Execução K6" para ver o resultado.</div>}
      </div>
    </div>
  );
}
