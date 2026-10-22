export default function SimulationOutput({ result }) {
  if (!result) return null;
  if (result.error) return <div className="sim sim-error" role="alert">{result.error}</div>;

  const s = result.summary;
  const passed = s.thresholds.every((t) => t.passed);
  const timing = [
    ["avg", s.timing.avg], ["min", s.timing.min], ["max", s.timing.max],
    ["p90", s.timing.p90], ["p95", s.timing.p95], ["p99", s.timing.p99],
  ];

  return (
    <div className="sim sim-result" style={{ border: `1px solid ${passed ? "#1a4a1a" : "#4a1a1a"}` }}>
      <div className="sim-head" style={{ color: passed ? "#69f0ae" : "#ff5252" }}>
        {passed ? "✓ THRESHOLDS PASSARAM" : "✗ THRESHOLDS FALHARAM"} — Simulação K6
      </div>

      {s.stages && (
        <div style={{ marginBottom: 8, color: "#81c784" }}>
          stages:{" "}
          {s.stages
            .map((stage, i) => `${i === 0 ? 0 : s.stages[i - 1].target}→${stage.target}VUs/${stage.duration}s`)
            .join(" › ")}
        </div>
      )}

      {s.scenarios.length > 0 && (
        <div style={{ marginBottom: 8, color: "#81c784" }}>
          scenarios: {s.scenarios.map((sc) => `${sc.name} (${sc.executor})`).join(" · ")}
        </div>
      )}

      <div className="sim-grid">
        <span className="sim-key">vus (max)</span><span className="sim-val">{s.vus}</span>
        <span className="sim-key">duração</span><span className="sim-val">{s.duration}s</span>
        <span className="sim-key">iterações</span><span className="sim-val">{s.iterations}</span>
        <span className="sim-key">req/s</span><span className="sim-val">{s.requests.rps}</span>
        <span className="sim-key">total reqs</span><span className="sim-val">{s.requests.total}</span>
        <span className="sim-key">falhas</span>
        <span className="sim-val" style={{ color: s.requests.failed > 0 ? "#ff5252" : "#69f0ae" }}>{s.requests.failed}</span>
      </div>

      <div className="sim-section">
        <div className="sim-section-title">http_req_duration:</div>
        <div className="sim-timing">
          {timing.map(([name, value]) => (
            <div key={name}>
              <span style={{ color: "#666" }}>{name}=</span>
              <span style={{ color: "#fff59d" }}>{value}ms</span>
            </div>
          ))}
        </div>
      </div>

      {s.checks.names.length > 0 && (
        <div className="sim-section">
          <div className="sim-section-title">checks:</div>
          {s.checks.names.map((name, i) => (
            <div key={i} style={{ color: "#69f0ae" }}>
              {"  ✓ "}{name}: {Math.round(s.checks.passed / s.checks.names.length)} /{" "}
              {Math.round(s.checks.total / s.checks.names.length)}
            </div>
          ))}
        </div>
      )}

      {s.thresholds.length > 0 && (
        <div className="sim-section">
          <div className="sim-section-title">thresholds:</div>
          {s.thresholds.map((t, i) => (
            <div key={i} style={{ color: t.passed ? "#69f0ae" : "#ff5252" }}>
              {t.passed ? "  ✓" : "  ✗"} {t.metric}: {t.expr}
              {!t.simulated && <span style={{ color: "#666" }}> (não simulado)</span>}
            </div>
          ))}
        </div>
      )}

      <div className="sim-endpoints">
        endpoints: {s.endpoints.map((e) => `${e.method} ${e.url}`).join(" | ")}
      </div>
      <div className="sim-note">Valores simulados a partir da estrutura do script — rode com o k6 de verdade para medir.</div>
    </div>
  );
}
