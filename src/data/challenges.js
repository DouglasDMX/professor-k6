// Desafios por tópico. A chave é "<índice do módulo>-<índice do tópico>",
// a mesma usada pelo App para localizar o tópico em curriculum.js.
// validate(result, script): result é o retorno de simulate(script).

export const DIFFICULTY = {
  1: { label: "Fácil", color: "#69f0ae" },
  2: { label: "Médio", color: "#fff59d" },
  3: { label: "Difícil", color: "#ff7043" },
};

const ok = (result) => Boolean(result && result.ok);

export const challenges = {
  // Módulo 1 — Fundamentos
  "0-0": [
    {
      title: "Primeiro script K6",
      difficulty: 1,
      description: "Crie um script com a função default exportada que faz um GET para qualquer URL.",
      validate: (r) => ok(r) && r.summary.endpoints.some((e) => e.method === "GET"),
      hints: [
        "Todo script K6 precisa de: export default function() { ... }",
        "Use http.get('url') dentro da função default.",
        `import http from 'k6/http';
export default function() { http.get('https://exemplo.com'); }`,
      ],
    },
  ],
  "0-1": [
    {
      title: "Importar e usar http",
      difficulty: 1,
      description: "Importe o módulo k6/http e faça uma requisição GET para a API de pedidos.",
      validate: (r, script) =>
        ok(r) &&
        /from\s+['"`]k6\/http['"`]/.test(script) &&
        r.summary.endpoints.some((e) => e.method === "GET" && e.url.includes("pedidos")),
      hints: [
        "Use: import http from 'k6/http'",
        "Dentro da função default, use http.get(url)",
        "A URL deve conter 'pedidos' no caminho",
      ],
    },
    {
      title: "GET + POST no mesmo script",
      difficulty: 2,
      description: "Faça um GET e um POST dentro da mesma função default.",
      validate: (r) =>
        ok(r) &&
        r.summary.endpoints.some((e) => e.method === "GET") &&
        r.summary.endpoints.some((e) => e.method === "POST"),
      hints: [
        "http.get() para leitura, http.post() para escrita",
        "http.post(url, body, params) — body é string JSON",
        "Use JSON.stringify({}) para converter objeto em string",
      ],
    },
  ],
  "0-2": [
    {
      title: "Check de status 200",
      difficulty: 1,
      description: "Adicione um check que valida se o status da resposta é 200.",
      validate: (r, script) => ok(r) && r.summary.checks.names.length > 0 && /200/.test(script),
      hints: [
        "import { check } from 'k6'",
        "check(res, { 'nome': (r) => r.status === 200 })",
        "O primeiro argumento é a resposta, o segundo é um objeto com as verificações",
      ],
    },
    {
      title: "Múltiplos checks",
      difficulty: 2,
      description: "Crie um script com pelo menos 3 checks diferentes na mesma resposta.",
      validate: (r) => ok(r) && r.summary.checks.names.length >= 3,
      hints: [
        "Você pode ter múltiplos checks no mesmo objeto",
        "check(res, { 'check1': ..., 'check2': ..., 'check3': ... })",
        "Verifique: status, body não vazio, e tempo de resposta",
      ],
    },
    {
      title: "Check com json()",
      difficulty: 2,
      description: "Faça um POST e verifique um campo específico no JSON de resposta.",
      validate: (r, script) =>
        ok(r) &&
        r.summary.endpoints.some((e) => e.method === "POST") &&
        r.summary.checks.names.length > 0 &&
        /\.json\s*\(/.test(script),
      hints: [
        "res.json('campo') acessa um campo do JSON da resposta",
        "check(res, { 'tem id': (r) => r.json('id') !== undefined })",
        "Use JSON.stringify para o body do POST",
      ],
    },
  ],
  "0-3": [
    {
      title: "Sleep obrigatório",
      difficulty: 1,
      description: "Crie um script com GET e adicione um sleep de 1 segundo.",
      validate: (r, script) =>
        ok(r) &&
        r.summary.endpoints.some((e) => e.method === "GET") &&
        /\bsleep\s*\(\s*1\s*\)/.test(script),
      hints: [
        "import { sleep } from 'k6'",
        "Chame sleep(1) após a requisição",
        "sleep recebe segundos: sleep(1) = 1 segundo",
      ],
    },
  ],
  "0-4": [
    {
      title: "Definir VUs e duration",
      difficulty: 1,
      description: "Crie um script com options definindo 5 VUs e 30 segundos de duração.",
      validate: (r) => ok(r) && r.summary.vus === 5 && r.summary.duration === 30 && !r.summary.stages,
      hints: [
        "export const options = { ... }",
        "Use as chaves vus e duration",
        "duration: '30s' — note as aspas e o 's'",
      ],
    },
  ],

  // Módulo 2 — Intermediário
  "1-0": [
    {
      title: "Thresholds básicos",
      difficulty: 2,
      description: "Adicione thresholds: p(95) abaixo de 500ms e taxa de falha abaixo de 1%.",
      validate: (r) =>
        ok(r) &&
        r.summary.thresholds.some((t) => t.metric === "http_req_duration" && /^p\(95\)</.test(t.expr)) &&
        r.summary.thresholds.some((t) => t.metric === "http_req_failed" && /^rate</.test(t.expr)),
      hints: [
        "Adicione 'thresholds' dentro do objeto options",
        "http_req_duration: ['p(95)<500']",
        "http_req_failed: ['rate<0.01'] — taxa de falhas",
      ],
    },
  ],
  "1-1": [
    {
      title: "Stages com ramp-up",
      difficulty: 2,
      description: "Crie um script com 3 stages: sobe para 10 VUs, sustenta, e desce para 0.",
      validate: (r) => {
        const stages = ok(r) ? r.summary.stages : null;
        return Boolean(
          stages && stages.length === 3 &&
          stages[0].target === 10 && stages[1].target === 10 && stages[2].target === 0,
        );
      },
      hints: [
        "Use stages em vez de vus+duration dentro de options",
        "Cada stage tem: { duration: '...', target: N }",
        "Três stages: subida (target 10), sustentação (target 10), descida (target 0)",
      ],
    },
  ],
  "1-2": [
    {
      title: "Organizar com group()",
      difficulty: 2,
      description: "Separe o fluxo em pelo menos um group() nomeado, com uma requisição dentro dele.",
      validate: (r) => ok(r) && r.summary.hasGroup,
      hints: [
        "import { group } from 'k6'",
        "group('consultar pedidos', function () { ... })",
        "As métricas aparecem separadas por grupo no relatório final",
      ],
    },
  ],
  "1-3": [
    {
      title: "Setup com autenticação",
      difficulty: 3,
      description: "Crie um script com setup() que faz POST de login e retorna o token.",
      validate: (r, script) =>
        ok(r) && r.summary.hasSetup && r.summary.endpoints.some((e) => e.method === "POST") &&
        /return\s*\{[\s\S]*token/.test(script),
      hints: [
        "export function setup() { ... }",
        "Faça http.post para login dentro do setup",
        "return { token: res.json('access_token') }",
      ],
    },
    {
      title: "Script completo com setup+teardown",
      difficulty: 3,
      description: "Crie um script com setup(), default() recebendo data, e teardown().",
      validate: (r, script) =>
        ok(r) && r.summary.hasSetup && r.summary.hasTeardown &&
        /export\s+default\s+function\s*\w*\s*\(\s*\w+\s*\)/.test(script),
      hints: [
        "Três funções: setup, default e teardown",
        "default function (data) — data recebe o retorno do setup",
        "export function teardown(data) — também recebe data do setup",
      ],
    },
  ],
  "1-4": [
    {
      title: "Métrica customizada",
      difficulty: 2,
      description: "Crie uma métrica Counter ou Trend com k6/metrics e alimente-a na função default.",
      validate: (r, script) =>
        ok(r) && r.summary.customMetrics.length > 0 && /\.add\s*\(/.test(script),
      hints: [
        "import { Counter, Trend } from 'k6/metrics'",
        "const pedidosConsultados = new Counter('pedidos_consultados')",
        "Dentro da default: pedidosConsultados.add(1)",
      ],
    },
  ],

  // Módulo 3 — Avançado
  "2-0": [
    {
      title: "Dois perfis de carga",
      difficulty: 3,
      description: "Declare dois scenarios em options, cada um com o próprio executor.",
      validate: (r) => ok(r) && r.summary.scenarios.length >= 2,
      hints: [
        "export const options = { scenarios: { ... } }",
        "Cada scenario precisa de executor: 'constant-vus', 'ramping-vus', etc.",
        "Use exec: 'nomeDaFuncao' para apontar cada scenario para uma função exportada",
      ],
    },
  ],
  "2-1": [
    {
      title: "Variável de ambiente",
      difficulty: 2,
      description: "Use __ENV.BASE_URL para montar a URL da requisição.",
      validate: (r) => ok(r) && r.summary.usesEnv,
      hints: [
        "__ENV é um objeto com todas as variáveis de ambiente",
        "const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'",
        "Use template string: http.get(`${BASE_URL}/pedidos`)",
      ],
    },
    {
      title: "Script data-driven com array",
      difficulty: 2,
      description: "Use um array de pedidos e __ITER para iterar entre eles.",
      validate: (r, script) => ok(r) && r.summary.usesIteration && /\[[^\]]*['"`][^\]]*\]/.test(script),
      hints: [
        "Crie um array com IDs de pedidos, ex.: ['PED-1001', 'PED-1002']",
        "Use __ITER para escolher o índice: array[__ITER % array.length]",
        "Cada iteração usará um pedido diferente",
      ],
    },
  ],
  "2-2": [
    {
      title: "Smoke test",
      difficulty: 1,
      description: "Monte um smoke test: 1 VU, no máximo 1 minuto, com um threshold de p(95).",
      validate: (r) =>
        ok(r) && r.summary.vus === 1 && r.summary.duration <= 60 &&
        r.summary.thresholds.some((t) => /^p\(95\)/.test(t.expr)),
      hints: [
        "Smoke test valida que o script e a API funcionam com carga mínima",
        "options: { vus: 1, duration: '30s', thresholds: { ... } }",
        "http_req_duration: ['p(95)<500']",
      ],
    },
  ],
  "2-3": [
    {
      title: "Script pronto para CI",
      difficulty: 3,
      description: "Combine __ENV.BASE_URL, checks e thresholds de duração e falha num único script.",
      validate: (r) =>
        ok(r) && r.summary.usesEnv && r.summary.checks.names.length > 0 &&
        r.summary.thresholds.some((t) => t.metric === "http_req_duration") &&
        r.summary.thresholds.some((t) => t.metric === "http_req_failed"),
      hints: [
        "No CI, a URL vem de fora: k6 run -e BASE_URL=... script.js",
        "Thresholds fazem o k6 sair com código diferente de zero quando falham",
        "Use o script do tópico como base e ajuste as metas",
      ],
    },
  ],
};

export const totalChallenges = Object.values(challenges).flat().length;
