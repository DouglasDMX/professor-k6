import { describe, expect, it } from "vitest";
import { parseDuration, parseOptions, parseThresholds, simulate } from "../src/lib/simulator.js";

describe("parseDuration", () => {
  it("converte unidades e combinações", () => {
    expect(parseDuration("30s")).toBe(30);
    expect(parseDuration("2m")).toBe(120);
    expect(parseDuration("1m30s")).toBe(90);
    expect(parseDuration("1h")).toBe(3600);
    expect(parseDuration("abc")).toBeNull();
  });
});

describe("parseOptions", () => {
  it("não confunde maxVUs com vus", () => {
    expect(parseOptions("{ maxVUs: 50 }").vus).toBeUndefined();
  });

  it("deriva vus e duração dos stages", () => {
    const options = parseOptions(`stages: [{ duration: '30s', target: 5 }, { duration: '1m', target: 20 }]`);
    expect(options.vus).toBe(20);
    expect(options.duration).toBe(90);
    expect(options.stages).toHaveLength(2);
  });
});

describe("thresholds", () => {
  it("mantém a métrica de cada expressão", () => {
    const t = parseThresholds(`thresholds: { http_req_duration: ['p(95)<500', 'p(99)<1000'], http_req_failed: ['rate<0.01'] }`);
    expect(t).toEqual([
      { metric: "http_req_duration", expr: "p(95)<500" },
      { metric: "http_req_duration", expr: "p(99)<1000" },
      { metric: "http_req_failed", expr: "rate<0.01" },
    ]);
  });

  it("reprova taxa de falha impossível (antes era sempre aprovada)", () => {
    const script = `import http from 'k6/http';
export const options = { thresholds: { http_req_failed: ['rate<0.0001'] } };
export default function () { http.post('http://x/a', '{}'); }`;
    const result = simulate(script);
    expect(result.summary.thresholds[0].passed).toBe(false);
    expect(result.summary.allPassed).toBe(false);
  });
});

describe("simulate", () => {
  it("exige export default", () => {
    expect(simulate("http.get('x')").error).toMatch(/default/);
  });

  it("exige ao menos uma requisição", () => {
    expect(simulate("export default function() {}").error).toMatch(/requisição/);
  });

  it("é determinístico para o mesmo script", () => {
    const script = "export default function() { http.get('http://x'); }";
    expect(simulate(script)).toEqual(simulate(script));
  });
});
