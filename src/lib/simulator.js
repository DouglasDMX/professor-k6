// Simulador didático de execução k6.
// Não executa o script: lê a estrutura (options, requisições, checks, thresholds)
// e gera métricas plausíveis e determinísticas, para que o mesmo script
// produza sempre o mesmo resultado.

const HTTP_METHODS = [
  { re: /http\.get\s*\(\s*[`'"](.*?)[`'"]/g, method: "GET" },
  { re: /http\.post\s*\(\s*[`'"](.*?)[`'"]/g, method: "POST" },
  { re: /http\.put\s*\(\s*[`'"](.*?)[`'"]/g, method: "PUT" },
  { re: /http\.del\s*\(\s*[`'"](.*?)[`'"]/g, method: "DELETE" },
  { re: /http\.patch\s*\(\s*[`'"](.*?)[`'"]/g, method: "PATCH" },
];

// Converte '30s', '1m', '1m30s', '2h' em segundos.
export function parseDuration(value) {
  const parts = [...String(value).matchAll(/(\d+(?:\.\d+)?)\s*(h|m|s)/g)];
  if (parts.length === 0) return null;
  const factor = { h: 3600, m: 60, s: 1 };
  return Math.round(
    parts.reduce((total, [, n, unit]) => total + parseFloat(n) * factor[unit], 0),
  );
}

export function parseOptions(script) {
  const options = {};

  const vus = script.match(/\bvus\s*:\s*(\d+)/);
  if (vus) options.vus = parseInt(vus[1], 10);

  const duration = script.match(/\bduration\s*:\s*['"`]([^'"`]+)['"`]/);
  if (duration) options.duration = parseDuration(duration[1]) ?? undefined;

  const iterations = script.match(/\biterations\s*:\s*(\d+)/);
  if (iterations) options.iterations = parseInt(iterations[1], 10);

  const stagesBlock = script.match(/\bstages\s*:\s*\[([\s\S]*?)\]/);
  if (stagesBlock) {
    const stages = [...stagesBlock[1].matchAll(/\{([^}]*)\}/g)].map(([, body]) => {
      const target = body.match(/target\s*:\s*(\d+)/);
      const stageDuration = body.match(/duration\s*:\s*['"`]([^'"`]+)['"`]/);
      return {
        target: target ? parseInt(target[1], 10) : 0,
        duration: (stageDuration && parseDuration(stageDuration[1])) || 30,
      };
    });
    if (stages.length > 0) {
      options.stages = stages;
      options.vus = Math.max(...stages.map((s) => s.target));
      options.duration = stages.reduce((total, s) => total + s.duration, 0);
    }
  }

  if (/\bscenarios\s*:\s*\{/.test(script)) {
    const heads = [...script.matchAll(/(\w+)\s*:\s*\{\s*executor\s*:\s*['"`]([\w-]+)['"`]/g)];
    options.scenarios = heads.map((head, i) => {
      // Corpo aproximado do scenario: até o início do próximo.
      const body = script.slice(head.index, heads[i + 1]?.index ?? script.length);
      const scenarioOptions = parseOptions(body.replace(/\bscenarios\s*:/g, ""));
      const exec = body.match(/\bexec\s*:\s*['"`](\w+)['"`]/);
      return {
        name: head[1],
        executor: head[2],
        exec: exec ? exec[1] : "default",
        vus: scenarioOptions.vus || 1,
        duration: scenarioOptions.duration || 10,
      };
    });
    if (options.scenarios.length > 0) {
      // Scenarios rodam em paralelo: VUs somam, a duração é a do mais longo.
      options.vus = options.scenarios.reduce((total, sc) => total + sc.vus, 0);
      options.duration = Math.max(...options.scenarios.map((sc) => sc.duration));
      delete options.stages;
    }
  }

  return options;
}

export function parseRequests(script) {
  const requests = [];
  for (const { re, method } of HTTP_METHODS) {
    for (const match of script.matchAll(re)) requests.push({ method, url: match[1] });
  }
  return requests;
}

export function parseChecks(script) {
  const names = [];
  for (const match of script.matchAll(/check\s*\([\s\S]*?\{([\s\S]*?)\}\s*\)/g)) {
    names.push(...[...match[1].matchAll(/['"`](.*?)['"`]\s*:/g)].map((m) => m[1]));
  }
  if (names.length === 0 && /check\s*\(/.test(script)) names.push("status verificado");
  return names;
}

// Retorna [{ metric, expr }], ex.: { metric: 'http_req_failed', expr: 'rate<0.01' }.
export function parseThresholds(script) {
  const block = script.match(/\bthresholds\s*:\s*\{([\s\S]*?)\}/);
  if (!block) return [];
  const thresholds = [];
  for (const entry of block[1].matchAll(/['"`]?([\w{}:.\-]+)['"`]?\s*:\s*\[([^\]]+)\]/g)) {
    const metric = entry[1];
    for (const expr of entry[2].matchAll(/['"`]([^'"`]+)['"`]/g)) {
      thresholds.push({ metric, expr: expr[1].replace(/\s+/g, "") });
    }
  }
  return thresholds;
}

function compare(actual, operator, limit) {
  switch (operator) {
    case "<": return actual < limit;
    case "<=": return actual <= limit;
    case ">": return actual > limit;
    case ">=": return actual >= limit;
    case "==": case "===": return actual === limit;
    default: return true;
  }
}

function evaluateThreshold({ metric, expr }, stats) {
  const match = expr.match(/^([\w().]+?)(<=|>=|==|===|<|>)([\d.]+)$/);
  if (!match) return { metric, expr, passed: true, simulated: false };
  const [, aggregation, operator, rawLimit] = match;
  const limit = parseFloat(rawLimit);
  const baseMetric = metric.split("{")[0];

  let actual;
  if (baseMetric === "http_req_duration") {
    actual = {
      avg: stats.timing.avg, min: stats.timing.min, max: stats.timing.max, med: stats.timing.med,
      "p(90)": stats.timing.p90, "p(95)": stats.timing.p95, "p(99)": stats.timing.p99,
    }[aggregation];
  } else if (baseMetric === "http_req_failed" && aggregation === "rate") {
    actual = stats.failRate;
  } else if (baseMetric === "checks" && aggregation === "rate") {
    actual = stats.checkRate;
  }

  if (actual === undefined) return { metric, expr, passed: true, simulated: false };
  return { metric, expr, passed: compare(actual, operator, limit), simulated: true };
}

export function simulate(script) {
  try {
    const options = parseOptions(script);
    const hasDefault = /export\s+default\s+function/.test(script);
    const scenarioEntrypointsExported = (options.scenarios || []).length > 0 &&
      options.scenarios.every((sc) =>
        sc.exec === "default" ? hasDefault : new RegExp(`export\\s+function\\s+${sc.exec}\\s*\\(`).test(script),
      );
    if (!hasDefault && !scenarioEntrypointsExported) {
      return {
        error: `❌ Nenhuma função default exportada encontrada.
Todo script K6 precisa de: export default function() { ... }
(ou, com scenarios, das funções exportadas indicadas em exec).`,
      };
    }
    const endpoints = parseRequests(script);
    if (endpoints.length === 0) {
      return {
        error: `⚠️ Nenhuma requisição HTTP detectada.
Use http.get(), http.post() etc. dentro da função default.`,
      };
    }

    const checkNames = parseChecks(script);
    const vus = options.vus || 1;
    const duration = options.duration || 10;
    const iterations = options.iterations || vus * duration * 2;

    // Tempo médio pseudo-aleatório entre 120 e 480 ms, derivado do tamanho do script.
    const seed = ((script.length * 9301 + 49297) % 233280) / 233280;
    const avg = Math.round(120 + seed * (480 - 120));
    const timing = {
      avg,
      min: Math.round(avg * 0.4),
      med: Math.round(avg * 0.9),
      max: Math.round(avg * 3.5),
      p90: Math.round(avg * 1.6),
      p95: Math.round(avg * 2),
      p99: Math.round(avg * 2.8),
    };

    const failRate = endpoints.some((e) => e.method === "POST") ? 0.012 : 0.003;
    const totalRequests = iterations * endpoints.length;
    const totalChecks = iterations * checkNames.length;
    const passedChecks = Math.round(totalChecks * 0.98);
    const checkRate = totalChecks === 0 ? 1 : passedChecks / totalChecks;

    const thresholds = parseThresholds(script).map((t) =>
      evaluateThreshold(t, { timing, failRate, checkRate }),
    );

    return {
      ok: true,
      summary: {
        vus,
        duration,
        iterations,
        stages: options.stages || null,
        scenarios: options.scenarios || [],
        requests: {
          total: totalRequests,
          failed: Math.round(totalRequests * failRate),
          rps: Math.round((totalRequests / duration) * 10) / 10,
        },
        timing,
        checks: { total: totalChecks, passed: passedChecks, failed: totalChecks - passedChecks, names: checkNames },
        thresholds,
        allPassed: thresholds.every((t) => t.passed),
        hasSetup: /export\s+function\s+setup\s*\(/.test(script),
        hasTeardown: /export\s+function\s+teardown\s*\(/.test(script),
        hasOptions: /export\s+const\s+options/.test(script),
        hasSleep: /\bsleep\s*\(/.test(script),
        hasGroup: /\bgroup\s*\(\s*['"`]/.test(script),
        customMetrics: [...script.matchAll(/new\s+(Counter|Gauge|Rate|Trend)\s*\(/g)].map((m) => m[1]),
        usesEnv: /__ENV\.\w+/.test(script),
        usesIteration: /__ITER\b|__VU\b/.test(script),
        endpoints,
      },
    };
  } catch (error) {
    return { error: "Erro ao simular: " + error.message };
  }
}
