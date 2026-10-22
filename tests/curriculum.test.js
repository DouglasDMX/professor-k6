import { describe, expect, it } from "vitest";
import { modules } from "../src/data/curriculum.js";
import { challenges, DIFFICULTY } from "../src/data/challenges.js";
import { simulate } from "../src/lib/simulator.js";

describe("currículo", () => {
  it("todo módulo tem id, título, cor e tópicos", () => {
    expect(modules.length).toBeGreaterThan(0);
    for (const module of modules) {
      expect(module.label).toBeTruthy();
      expect(module.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(module.topics.length).toBeGreaterThan(0);
    }
  });

  it("todo tópico tem lição e um script inicial que o simulador aceita", () => {
    for (const module of modules) {
      for (const topic of module.topics) {
        expect(topic.label).toBeTruthy();
        expect(topic.lesson.length).toBeGreaterThan(100);
        expect(simulate(topic.starter).ok, topic.label).toBe(true);
      }
    }
  });

  it("não contém hosts ou identificadores reais de empresa", () => {
    const text = JSON.stringify(modules);
    expect(text).not.toMatch(/ferreira|fcx/i);
    expect(text).not.toMatch(/TMS-\d+/);
  });
});

describe("desafios", () => {
  it("toda chave aponta para um tópico existente", () => {
    for (const key of Object.keys(challenges)) {
      const [m, t] = key.split("-").map(Number);
      expect(modules[m]?.topics[t], key).toBeDefined();
    }
  });

  it("todo desafio tem enunciado, dificuldade, dicas e validador", () => {
    for (const list of Object.values(challenges)) {
      for (const c of list) {
        expect(c.title).toBeTruthy();
        expect(c.description).toBeTruthy();
        expect(DIFFICULTY[c.difficulty]).toBeDefined();
        expect(c.hints.length).toBeGreaterThan(0);
        expect(typeof c.validate).toBe("function");
      }
    }
  });

  it("nenhum desafio é aprovado com um script vazio de requisições", () => {
    const result = simulate("export default function() {}");
    for (const list of Object.values(challenges)) {
      for (const c of list) expect(Boolean(c.validate(result, "")), c.title).toBe(false);
    }
  });
});

// Uma solução de referência por desafio garante que todos são concluíveis.
const solutions = {
  "Primeiro script K6": `import http from 'k6/http';
export default function () { http.get('https://exemplo.com'); }`,
  "Importar e usar http": `import http from 'k6/http';
export default function () { http.get('http://localhost:3000/pedidos'); }`,
  "GET + POST no mesmo script": `import http from 'k6/http';
export default function () {
  http.get('http://localhost:3000/pedidos');
  http.post('http://localhost:3000/pedidos/status', JSON.stringify({ pedido_id: 'PED-1001' }));
}`,
  "Check de status 200": `import http from 'k6/http';
import { check } from 'k6';
export default function () {
  const res = http.get('http://localhost:3000/pedidos');
  check(res, { 'status 200': (r) => r.status === 200 });
}`,
  "Múltiplos checks": `import http from 'k6/http';
import { check } from 'k6';
export default function () {
  const res = http.get('http://localhost:3000/pedidos');
  check(res, {
    'status 200': (r) => r.status === 200,
    'tem body': (r) => r.body.length > 0,
    'rápido': (r) => r.timings.duration < 500,
  });
}`,
  "Check com json()": `import http from 'k6/http';
import { check } from 'k6';
export default function () {
  const res = http.post('http://localhost:3000/auth/login', JSON.stringify({ usuario: 'a', senha: 'b' }));
  check(res, { 'tem token': (r) => r.json('access_token') !== undefined });
}`,
  "Sleep obrigatório": `import http from 'k6/http';
import { sleep } from 'k6';
export default function () { http.get('http://localhost:3000/pedidos'); sleep(1); }`,
  "Definir VUs e duration": `import http from 'k6/http';
export const options = { vus: 5, duration: '30s' };
export default function () { http.get('http://localhost:3000/pedidos'); }`,
  "Thresholds básicos": `import http from 'k6/http';
export const options = { thresholds: { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] } };
export default function () { http.get('http://localhost:3000/pedidos'); }`,
  "Stages com ramp-up": `import http from 'k6/http';
export const options = { stages: [
  { duration: '30s', target: 10 },
  { duration: '1m', target: 10 },
  { duration: '30s', target: 0 },
] };
export default function () { http.get('http://localhost:3000/pedidos'); }`,
  "Organizar com group()": `import http from 'k6/http';
import { group } from 'k6';
export default function () { group('consultar', function () { http.get('http://localhost:3000/pedidos'); }); }`,
  "Setup com autenticação": `import http from 'k6/http';
export function setup() {
  const res = http.post('http://localhost:3000/auth/login', JSON.stringify({ usuario: 'a', senha: 'b' }));
  return { token: res.json('access_token') };
}
export default function (data) { http.get('http://localhost:3000/pedidos'); }`,
  "Script completo com setup+teardown": `import http from 'k6/http';
export function setup() { return { token: 'x' }; }
export default function (data) { http.get('http://localhost:3000/pedidos'); }
export function teardown(data) {}`,
  "Métrica customizada": `import http from 'k6/http';
import { Counter } from 'k6/metrics';
const consultas = new Counter('consultas');
export default function () { http.get('http://localhost:3000/pedidos'); consultas.add(1); }`,
  "Dois perfis de carga": `import http from 'k6/http';
export const options = { scenarios: {
  leitura: { executor: 'constant-vus', vus: 5, duration: '30s', exec: 'ler' },
  escrita: { executor: 'ramping-vus', stages: [{ duration: '30s', target: 3 }], exec: 'escrever' },
} };
export function ler() { http.get('http://localhost:3000/pedidos'); }
export function escrever() { http.post('http://localhost:3000/picking/processar', '{}'); }
export default function () { http.get('http://localhost:3000/health'); }`,
  "Variável de ambiente": `import http from 'k6/http';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export default function () { http.get(\`\${BASE_URL}/pedidos\`); }`,
  "Script data-driven com array": `import http from 'k6/http';
const pedidos = ['PED-1001', 'PED-1002'];
export default function () { const id = pedidos[__ITER % pedidos.length]; http.get(\`http://localhost:3000/pedidos/\${id}\`); }`,
  "Smoke test": `import http from 'k6/http';
export const options = { vus: 1, duration: '30s', thresholds: { http_req_duration: ['p(95)<500'] } };
export default function () { http.get('http://localhost:3000/health'); }`,
  "Script pronto para CI": `import http from 'k6/http';
import { check } from 'k6';
export const options = { thresholds: { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] } };
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export default function () {
  const res = http.get(\`\${BASE_URL}/pedidos\`);
  check(res, { 'status 200': (r) => r.status === 200 });
}`,
};

describe("soluções de referência", () => {
  for (const [key, list] of Object.entries(challenges)) {
    for (const c of list) {
      it(`${key} · ${c.title} é concluível`, () => {
        const script = solutions[c.title];
        expect(script, "falta solução de referência").toBeDefined();
        expect(c.validate(simulate(script), script)).toBe(true);
      });
    }
  }
});
