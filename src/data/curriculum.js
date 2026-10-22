// Currículo do Professor K6: módulos, tópicos, lição em texto e script inicial.
// As URLs dos exemplos apontam para a API de treino local (server/), em http://localhost:3000.

export const modules = [
    {
      id: 1,
      label: "🔰 Módulo 1 — Fundamentos",
      color: "#4fc3f7",
      topics: [
        {
          label: "O que é K6 e por que usar",
          lesson: `O QUE É K6?
══════════════════════════════════════════════════════
K6 é uma ferramenta open-source de testes de performance criada
pela Grafana Labs. Com ela você escreve scripts em JavaScript e
simula centenas ou milhares de usuários acessando sua API ao
mesmo tempo — para descobrir gargalos ANTES de entrar em produção.

POR QUE USAR K6 E NÃO JMETER OU GATLING?
══════════════════════════════════════════════════════
  • Scripts em JavaScript (mesma linguagem do frontend/Node)
  • Leve: roda em linha de comando, sem interface pesada
  • Integra com CI/CD, Grafana, InfluxDB, DataDog
  • Output limpo e legível no terminal
  • Thresholds nativos: o próprio K6 falha o build se a performance cair

COMO O K6 FUNCIONA?
══════════════════════════════════════════════════════
  1. Você escreve um script .js descrevendo as requisições
  2. K6 lança N usuários virtuais (VUs) simultâneos
  3. Cada VU executa a função default em loop durante o tempo definido
  4. No final, K6 exibe um relatório com todas as métricas

INSTALAÇÃO
══════════════════════════════════════════════════════
  Windows (chocolatey):
    choco install k6

  Linux/Mac (brew):
    brew install k6

  Verificar:
    k6 version

RODANDO O PRIMEIRO TESTE
══════════════════════════════════════════════════════
  k6 run script.js
  k6 run --vus 10 --duration 30s script.js

ESTRUTURA MÍNIMA DE UM SCRIPT
══════════════════════════════════════════════════════
  import http from 'k6/http';

  export default function () {
    http.get('https://minha-api.com/pedidos');
  }

  Esse é o script mais simples possível. Uma linha de requisição
  dentro da função default já é um teste de carga válido.`,
          starter: `import http from 'k6/http';

// Função principal — executada por cada VU em cada iteração
export default function () {
  http.get('http://localhost:3000/pedidos');
}`,
        },
        {
          label: "HTTP Requests (GET, POST, PUT)",
          lesson: `REQUISIÇÕES HTTP NO K6
══════════════════════════════════════════════════════
O módulo k6/http tem métodos para todos os verbos HTTP:
  http.get(url, [params])
  http.post(url, body, [params])
  http.put(url, body, [params])
  http.del(url, [params])
  http.patch(url, body, [params])

A RESPOSTA (Response Object)
══════════════════════════════════════════════════════
Toda requisição retorna um objeto com:
  res.status        → código HTTP (200, 201, 404, 500...)
  res.body          → corpo da resposta (string)
  res.json()        → parseia o body como JSON
  res.headers       → headers da resposta
  res.timings.duration → tempo total em ms

HEADERS E AUTENTICAÇÃO
══════════════════════════════════════════════════════
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    }
  };
  http.get(url, params);

ENVIANDO JSON NO BODY
══════════════════════════════════════════════════════
  const payload = JSON.stringify({ pedido_id: 123, status: 'ENTREGUE' });
  const params  = { headers: { 'Content-Type': 'application/json' } };
  http.post(url, payload, params);

EXEMPLOS PRÁTICOS (contexto TMS)
══════════════════════════════════════════════════════
  // Consultar pedido
  const res = http.get(\`/api/pedidos/\${pedidoId}\`);

  // Atualizar status do picking
  http.put('/api/picking/status', JSON.stringify({
    pedido_id: 8550,
    status: 'SEPARADO'
  }), { headers: { 'Content-Type': 'application/json' } });

  // Login para obter token
  const login = http.post('/api/auth/login', JSON.stringify({
    usuario: 'operador01',
    senha: 'senha123'
  }), { headers: { 'Content-Type': 'application/json' } });
  const token = login.json('access_token');`,
          starter: `import http from 'k6/http';

export default function () {
  // GET — consultar pedidos em manutenção
  const res = http.get('http://localhost:3000/pedidos?status=MANUTENCAO');

  // POST — atualizar status do pedido
  const payload = JSON.stringify({
    pedido_id: 8550,
    status: 'LIBERADO',
    operador: 'operador01'
  });
  http.post('http://localhost:3000/pedidos/status', payload, {
    headers: { 'Content-Type': 'application/json' }
  });
}`,
        },
        {
          label: "Checks — validando respostas",
          lesson: `O QUE SÃO CHECKS?
══════════════════════════════════════════════════════
Checks são asserções sobre a resposta HTTP. Eles NÃO falham o
teste imediatamente — apenas contabilizam quantas passaram e
quantas falharam. No final, você vê no relatório:

  ✓ checks.........................: 98.5% ✓ 985 ✗ 15

É diferente de um throw: o K6 continua rodando mesmo se um check
falhar. Para interromper o teste em falhas críticas, use Thresholds
(próximo tópico) combinados com checks.

SINTAXE DO CHECK
══════════════════════════════════════════════════════
  check(response, {
    'nome do check': (r) => condicao_booleana,
  });

CHECKS MAIS COMUNS
══════════════════════════════════════════════════════
  check(res, {
    'status é 200':         (r) => r.status === 200,
    'status é 2xx':         (r) => r.status >= 200 && r.status < 300,
    'body não está vazio':  (r) => r.body.length > 0,
    'tem campo pedido_id':  (r) => r.json('pedido_id') !== undefined,
    'resposta rápida':      (r) => r.timings.duration < 500,
    'não retornou erro':    (r) => !r.body.includes('error'),
  });

VERIFICANDO JSON ANINHADO
══════════════════════════════════════════════════════
  // Se a resposta for: { "data": { "status": "ATIVO" } }
  check(res, {
    'status é ATIVO': (r) => r.json('data.status') === 'ATIVO',
  });

COMBINANDO COM IF PARA FLUXO CONDICIONAL
══════════════════════════════════════════════════════
  const ok = check(res, { 'login ok': (r) => r.status === 200 });
  if (!ok) {
    console.error('Login falhou! Status:', res.status);
    return; // para essa iteração
  }
  // continua com o fluxo autenticado...`,
          starter: `import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get('http://localhost:3000/pedidos/PED-1002');

  check(res, {
    'status é 200':          (r) => r.status === 200,
    'pedido existe':         (r) => r.json('pedido_id') !== undefined,
    'status não é erro':     (r) => r.status < 400,
    'resposta abaixo 500ms': (r) => r.timings.duration < 500,
  });
}`,
        },
        {
          label: "Sleep e think time",
          lesson: `POR QUE USAR SLEEP?
══════════════════════════════════════════════════════
Sem sleep, cada VU dispara requisições na velocidade máxima —
isso não representa usuários reais, que leem a tela, preenchem
formulários, clicam em botões. O resultado sem sleep gera
carga irreal e não representa o comportamento de produção.

O "think time" (tempo de reflexão) é o tempo que um usuário
real leva entre uma ação e outra. Em aplicações corporativas
costuma ser 1-5 segundos.

SINTAXE
══════════════════════════════════════════════════════
  import { sleep } from 'k6';

  sleep(1);      // 1 segundo
  sleep(0.5);    // 500ms
  sleep(2.5);    // 2.5 segundos

THINK TIME ALEATÓRIO (mais realista)
══════════════════════════════════════════════════════
  import { sleep } from 'k6';

  // Pausa entre 1 e 3 segundos aleatoriamente
  sleep(Math.random() * 2 + 1);

IMPACTO NO THROUGHPUT
══════════════════════════════════════════════════════
  Sem sleep:   10 VUs × 100 req/s = 1000 req/s (surto irreal)
  Com sleep 1s: 10 VUs × 1 req/s =   10 req/s (mais real)

  A regra prática: use o tempo médio de interação real do usuário.
  Para sistemas de picking (TMS), operadores levam ~2-5s entre ações.

QUANDO NÃO USAR SLEEP
══════════════════════════════════════════════════════
  • Testes de stress máximo (soak test sem sleep = carga contínua)
  • Quando você quer medir throughput máximo da API
  • Em jobs/filas onde não há usuário humano`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  // Simula operador consultando pedido
  const res = http.get('http://localhost:3000/pedidos?status=PRONTO_QA');
  check(res, { 'lista carregada': (r) => r.status === 200 });

  sleep(2); // operador lê a lista (~2 segundos)

  // Abre um pedido específico
  const detalhe = http.get('http://localhost:3000/pedidos/PED-1001');
  check(detalhe, { 'detalhe carregado': (r) => r.status === 200 });

  sleep(Math.random() * 3 + 1); // lê o detalhe (1~4s)
}`,
        },
        {
          label: "Options — vus, duration, iterations",
          lesson: `CONTROLANDO A CARGA COM OPTIONS
══════════════════════════════════════════════════════
O objeto options (exportado como constante) configura como o
K6 vai executar o teste: quantos usuários, por quanto tempo,
quantas iterações no total.

FORMAS DE DEFINIR CARGA
══════════════════════════════════════════════════════

1. VUs + DURATION (mais comum)
   K6 mantém N usuários virtuais por T segundos:

   export const options = {
     vus: 10,
     duration: '30s',
   };

2. ITERATIONS (número fixo de execuções)
   A função default roda exatamente N vezes no total:

   export const options = {
     vus: 5,
     iterations: 50,  // 50 execuções totais, 10 por VU
   };

3. STAGES (ramp-up/ramp-down — próximo módulo)

UNIDADES DE TEMPO
══════════════════════════════════════════════════════
  '30s'   → 30 segundos
  '1m'    → 1 minuto
  '1m30s' → 1 minuto e 30 segundos
  '1h'    → 1 hora

COMBINANDO OPTIONS COM THRESHOLDS
══════════════════════════════════════════════════════
  export const options = {
    vus: 20,
    duration: '1m',
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed:   ['rate<0.01'],
    },
  };

BOA PRÁTICA: SEMPRE DEFINA OPTIONS NO SCRIPT
══════════════════════════════════════════════════════
  Sem options → K6 usa 1 VU por 1 iteração (útil para debug).
  Em testes reais, sempre declare explicitamente no script
  para garantir reprodutibilidade.`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/picking/fila');

  check(res, {
    'status 200':     (r) => r.status === 200,
    'fila não vazia': (r) => r.json('total') > 0,
  });

  sleep(1);
}`,
        },
      ],
    },
    {
      id: 2,
      label: "🔶 Módulo 2 — Intermediário",
      color: "#ffb74d",
      topics: [
        {
          label: "Thresholds — critérios de aceite",
          lesson: `O QUE SÃO THRESHOLDS?
══════════════════════════════════════════════════════
Thresholds são os critérios de aprovação/reprovação do seu teste.
Se um threshold falhar, K6 retorna exit code 99 — o que faz
pipelines de CI/CD falharem automaticamente.

É a diferença entre: "o sistema ficou lento" (check) e
"o sistema FALHOU nos critérios de qualidade" (threshold).

MÉTRICAS DISPONÍVEIS PARA THRESHOLD
══════════════════════════════════════════════════════
  http_req_duration   → tempo total da requisição (ms)
  http_req_failed     → taxa de erros (0 a 1 = 0% a 100%)
  http_reqs           → total de requisições por segundo
  checks              → taxa de checks passando

OPERADORES NOS THRESHOLDS
══════════════════════════════════════════════════════
  p(95)<500     → 95% das req devem responder em <500ms
  p(99)<1000    → 99% das req devem responder em <1000ms
  avg<300       → média deve ser <300ms
  rate<0.01     → menos de 1% de falhas
  count>100     → mais de 100 ocorrências

THRESHOLDS POR GRUPO (avançado)
══════════════════════════════════════════════════════
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<300'],
    'http_req_duration{name:pedidos}': ['p(95)<800'],
  }
  // Requer tag no request: http.get(url, { tags: { name: 'login' } })

BOAS PRÁTICAS
══════════════════════════════════════════════════════
  • p(95) < 500ms é um bom ponto de partida para APIs REST
  • http_req_failed < 0.01 (menos de 1% de erro)
  • Defina thresholds junto com o time de produto/dev
  • SLA da empresa costuma virar threshold no K6`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/pedidos');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}`,
        },
        {
          label: "Stages — ramp-up e ramp-down",
          lesson: `POR QUE USAR STAGES?
══════════════════════════════════════════════════════
Em produção, o tráfego não aparece de uma vez — ele cresce
gradualmente. Stages permitem simular esse padrão com rampas
de subida (ramp-up) e descida (ramp-down) de usuários.

Isso é importante para detectar:
  • Em qual ponto a API começa a degradar
  • Se o sistema se recupera quando a carga cai
  • Qual é a capacidade máxima sustentável

ESTRUTURA DOS STAGES
══════════════════════════════════════════════════════
  stages: [
    { duration: '30s', target: 10 },  // sobe de 0 para 10 VUs
    { duration: '1m',  target: 10 },  // mantém 10 VUs por 1 min
    { duration: '30s', target: 0  },  // desce de 10 para 0 VUs
  ]

PADRÕES COMUNS
══════════════════════════════════════════════════════

Ramp-up simples:
  { duration: '1m',  target: 50 },   // sobe até 50 VUs
  { duration: '3m',  target: 50 },   // sustenta
  { duration: '1m',  target: 0  },   // desce

Stress test (subida agressiva):
  { duration: '30s', target: 100 },
  { duration: '1m',  target: 200 },
  { duration: '30s', target: 0   },

Spike test (pico repentino):
  { duration: '10s', target: 1   },  // tráfego normal
  { duration: '1m',  target: 100 },  // pico repentino
  { duration: '10s', target: 1   },  // volta ao normal

LENDO O RESULTADO DE STAGES
══════════════════════════════════════════════════════
  No output do K6, você vê VUs variando conforme os stages:
  default [  10% ] 5 VUs  | 00m03s/00m30s`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5  }, // ramp-up: 0 → 5 VUs
    { duration: '1m',  target: 5  }, // sustenta 5 VUs
    { duration: '30s', target: 20 }, // sobe para 20 VUs
    { duration: '1m',  target: 20 }, // sustenta 20 VUs
    { duration: '30s', target: 0  }, // ramp-down: 20 → 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed:   ['rate<0.05'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/separacao/fila');
  check(res, { 'fila ok': (r) => r.status === 200 });
  sleep(1);
}`,
        },
        {
          label: "Groups e Tags",
          lesson: `GROUPS — AGRUPANDO REQUISIÇÕES
══════════════════════════════════════════════════════
Grupos permitem organizar requisições relacionadas e ver métricas
separadas por grupo no relatório. É como dar um nome a um fluxo
de negócio dentro do teste.

  import { group } from 'k6';

  group('fluxo de login', () => {
    http.post('/api/auth/login', ...);
  });

  group('consulta de pedidos', () => {
    http.get('/api/pedidos');
    http.get('/api/pedidos/12345');
  });

TAGS — FILTRANDO MÉTRICAS ESPECÍFICAS
══════════════════════════════════════════════════════
Tags adicionam metadados às requisições, permitindo filtrar
thresholds e métricas por endpoint específico:

  http.get('/api/pedidos', {
    tags: { name: 'listar-pedidos', tipo: 'leitura' }
  });

  // Threshold só para esse endpoint:
  thresholds: {
    'http_req_duration{name:listar-pedidos}': ['p(95)<300'],
  }

QUANDO USAR CADA UM?
══════════════════════════════════════════════════════
  GROUP → quando você quer organizar fluxos de negócio
          e ver tempo total do fluxo no relatório
  TAG   → quando você quer threshold ou métrica
          separada por endpoint específico

EXEMPLO REAL (TMS)
══════════════════════════════════════════════════════
  group('fluxo separação', () => {
    group('buscar picking', () => {
      http.get('/api/picking?status=PENDENTE');
    });
    group('confirmar separação', () => {
      http.put('/api/picking/123/confirmar', ...);
    });
  });`,
          starter: `import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  group('autenticacao', () => {
    const res = http.post('http://localhost:3000/auth/login',
      JSON.stringify({ usuario: 'operador01', senha: 'senha123' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, { 'login ok': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('consulta picking', () => {
    const res = http.get('http://localhost:3000/picking/fila',
      { tags: { name: 'picking-fila' } }
    );
    check(res, { 'fila carregada': (r) => r.status === 200 });
    sleep(2);
  });
}`,
        },
        {
          label: "Setup e Teardown",
          lesson: `CICLO DE VIDA DO SCRIPT K6
══════════════════════════════════════════════════════
Um script K6 tem 4 fases:

  1. init       → código fora de funções (carrega módulos, lê arquivos)
  2. setup()    → executa UMA VEZ antes de todos os VUs iniciarem
  3. default()  → executa em loop em cada VU durante o teste
  4. teardown() → executa UMA VEZ após todos os VUs terminarem

SETUP — PREPARANDO O AMBIENTE
══════════════════════════════════════════════════════
  export function setup() {
    // Executa 1x antes do teste. Retorne dados para os VUs.
    const res = http.post('/api/auth/login', JSON.stringify({
      usuario: 'teste.performance',
      senha: 'senha123'
    }), { headers: { 'Content-Type': 'application/json' } });

    return { token: res.json('access_token') };
    //       ↑ esse objeto chega como parâmetro em default()
  }

RECEBENDO DADOS DO SETUP
══════════════════════════════════════════════════════
  export default function (data) {
    //                     ↑ recebe o que setup() retornou
    http.get('/api/pedidos', {
      headers: { Authorization: 'Bearer ' + data.token }
    });
  }

TEARDOWN — LIMPANDO APÓS O TESTE
══════════════════════════════════════════════════════
  export function teardown(data) {
    // Executa 1x depois do teste.
    // Ideal para: logout, limpar dados de teste, notificações.
    http.post('/api/auth/logout', null, {
      headers: { Authorization: 'Bearer ' + data.token }
    });
  }

CASO DE USO TÍPICO
══════════════════════════════════════════════════════
  setup()    → faz login, cria dados de teste, retorna token
  default()  → usa o token para acessar endpoints
  teardown() → revoga token, deleta dados de teste`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 5, duration: '20s' };

// Executa 1x — obtém token de autenticação
export function setup() {
  const res = http.post('http://localhost:3000/auth/login',
    JSON.stringify({ usuario: 'perf.test', senha: 'senha123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'login ok no setup': (r) => r.status === 200 });
  return { token: res.json('access_token') };
}

// Executa em loop nos VUs — recebe token do setup
export default function (data) {
  const headers = {
    'Authorization': 'Bearer ' + data.token,
    'Content-Type': 'application/json',
  };
  const res = http.get('http://localhost:3000/pedidos', { headers });
  check(res, { 'pedidos carregados': (r) => r.status === 200 });
  sleep(1);
}

// Executa 1x ao final — faz logout
export function teardown(data) {
  http.post('http://localhost:3000/auth/logout', null, {
    headers: { 'Authorization': 'Bearer ' + data.token }
  });
}`,
        },
        {
          label: "Métricas customizadas",
          lesson: `ALÉM DAS MÉTRICAS PADRÃO
══════════════════════════════════════════════════════
K6 coleta métricas padrão automaticamente (http_req_duration,
http_reqs, etc.), mas você pode criar suas próprias métricas
para medir qualquer coisa de negócio.

TIPOS DE MÉTRICAS CUSTOMIZADAS
══════════════════════════════════════════════════════
  Counter   → soma acumulada (ex: total de pedidos processados)
  Gauge     → valor atual (ex: pedidos na fila)
  Rate      → proporção (ex: taxa de sucesso do checkout)
  Trend     → estatísticas de tempo (ex: tempo de separação)

IMPORTANDO E CRIANDO
══════════════════════════════════════════════════════
  import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

  const pedidosProcessados = new Counter('pedidos_processados');
  const taxaSucesso        = new Rate('taxa_sucesso_checkout');
  const tempoSeparacao     = new Trend('tempo_separacao_ms');

ADICIONANDO VALORES
══════════════════════════════════════════════════════
  pedidosProcessados.add(1);          // incrementa 1
  taxaSucesso.add(res.status === 200); // true=1, false=0
  tempoSeparacao.add(res.timings.duration);

USANDO EM THRESHOLDS
══════════════════════════════════════════════════════
  thresholds: {
    taxa_sucesso_checkout: ['rate>0.95'],  // >95% de sucesso
    tempo_separacao_ms:    ['p(95)<3000'], // p95 abaixo de 3s
    pedidos_processados:   ['count>100'],  // processou >100
  }

EXEMPLO PRÁTICO
══════════════════════════════════════════════════════
  const errosAutenticacao = new Counter('erros_auth');

  export default function() {
    const res = http.post('/api/auth/login', ...);
    if (res.status !== 200) {
      errosAutenticacao.add(1);
    }
  }`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Métricas de negócio customizadas
const pedidosConsultados = new Counter('pedidos_consultados');
const taxaSucesso        = new Rate('taxa_sucesso_picking');
const tempoBusca         = new Trend('tempo_busca_pedido_ms');

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    taxa_sucesso_picking:   ['rate>0.98'],
    tempo_busca_pedido_ms:  ['p(95)<400'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/picking/pendentes');

  const ok = check(res, { 'status 200': (r) => r.status === 200 });

  pedidosConsultados.add(1);
  taxaSucesso.add(ok);
  tempoBusca.add(res.timings.duration);

  sleep(1);
}`,
        },
      ],
    },
    {
      id: 3,
      label: "🔷 Módulo 3 — Avançado",
      color: "#ce93d8",
      topics: [
        {
          label: "Scenarios — múltiplos perfis de carga",
          lesson: `O QUE SÃO SCENARIOS?
══════════════════════════════════════════════════════
Scenarios são configurações avançadas de carga que substituem
e superam o que stages faz. Com scenarios você pode:

  • Rodar múltiplos perfis de carga em paralelo
  • Misturar tipos de executores diferentes
  • Ter thresholds por scenario
  • Simular perfis de usuário diferentes ao mesmo tempo

EXECUTORES DISPONÍVEIS
══════════════════════════════════════════════════════
  constant-vus          → N VUs por T tempo (= vus+duration)
  ramping-vus           → stages com ramp-up/down
  constant-arrival-rate → N req/s fixo (independente de VUs)
  ramping-arrival-rate  → req/s variável com ramp
  per-vu-iterations     → cada VU faz N iterações
  shared-iterations     → N iterações divididas entre VUs

EXEMPLO: 2 SCENARIOS EM PARALELO
══════════════════════════════════════════════════════
  scenarios: {
    leitura_continua: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'fluxoLeitura',   // chama função diferente
    },
    picos_de_escrita: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '30s', target: 0  },
      ],
      exec: 'fluxoEscrita',
    },
  }

ARRIVAL RATE — CONTROLANDO REQ/S
══════════════════════════════════════════════════════
  executor: 'constant-arrival-rate',
  rate: 100,          // 100 requisições por segundo
  timeUnit: '1s',
  duration: '1m',
  preAllocatedVUs: 50,`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    consulta_pedidos: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'consultarPedidos',
    },
    processamento_picking: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '15s', target: 0 },
      ],
      exec: 'processarPicking',
    },
  },
};

export function consultarPedidos() {
  const res = http.get('http://localhost:3000/pedidos?status=ABERTO');
  check(res, { 'listagem ok': (r) => r.status === 200 });
  sleep(1);
}

export function processarPicking() {
  const res = http.post('http://localhost:3000/picking/processar',
    JSON.stringify({ lote: 'LOTE-001' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'processamento ok': (r) => r.status === 200 });
  sleep(2);
}`,
        },
        {
          label: "Data-driven — lendo dados externos",
          lesson: `TESTES COM DADOS VARIADOS
══════════════════════════════════════════════════════
Em testes reais você não quer sempre a mesma requisição.
Você quer simular múltiplos usuários, múltiplos pedidos,
múltiplos produtos — como seria em produção.

OPÇÃO 1: ARRAY NO PRÓPRIO SCRIPT
══════════════════════════════════════════════════════
  const pedidos = [
    { id: 'PED-1001', prioridade: 'ALTA' },
    { id: 'PED-1002', prioridade: 'MEDIA' },
    { id: 'PED-1003', prioridade: 'BAIXA' },
  ];

  export default function() {
    const pedido = pedidos[Math.floor(Math.random() * pedidos.length)];
    http.get(\`/api/pedidos/\${pedido.id}\`);
  }

OPÇÃO 2: SharedArray (para grandes volumes)
══════════════════════════════════════════════════════
  import { SharedArray } from 'k6/data';

  const usuarios = new SharedArray('usuarios', function() {
    return JSON.parse(open('./data/usuarios.json'));
    // SharedArray carrega 1x e compartilha entre VUs (economiza memória)
  });

  export default function() {
    const vu = usuarios[__VU % usuarios.length]; // distribui por VU
    http.post('/api/auth/login', JSON.stringify(vu), ...);
  }

VARIÁVEIS ESPECIAIS DO K6
══════════════════════════════════════════════════════
  __VU         → ID do virtual user (1, 2, 3...)
  __ITER       → número da iteração atual
  __ENV        → variáveis de ambiente (k6 run -e VAR=valor)

  // Cada VU usa um usuário diferente:
  const usuario = usuarios[__VU - 1];

VARIÁVEIS DE AMBIENTE
══════════════════════════════════════════════════════
  k6 run -e BASE_URL=https://api.staging.exemplo.dev script.js

  // No script:
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

// Dados de teste — pedidos do TMS para consulta
const pedidosTMS = [
  'PED-1001', 'PED-1002', 'PED-1003',
  'PED-1004', 'PED-1005', 'PED-1006',
];

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 6,
  duration: '30s',
};

export default function () {
  // Cada iteração usa um pedido diferente
  const pedidoId = pedidosTMS[__ITER % pedidosTMS.length];

  const res = http.get(\`\${BASE_URL}/pedidos/\${pedidoId}\`, {
    tags: { pedido: pedidoId }
  });

  check(res, {
    'pedido encontrado': (r) => r.status === 200,
    'tem status':        (r) => r.json('status') !== undefined,
  });

  sleep(1);
}`,
        },
        {
          label: "Tipos de teste de performance",
          lesson: `OS 6 TIPOS DE TESTE DE PERFORMANCE
══════════════════════════════════════════════════════

1. SMOKE TEST — "o básico funciona?"
   ▸ 1-2 VUs, 1-2 minutos
   ▸ Objetivo: validar o script antes de rodar carga real
   ▸ Se o smoke falha, tem bug no script ou na API

   vus: 1, duration: '1m'

2. LOAD TEST — "aguenta a carga normal?"
   ▸ Carga esperada do dia-a-dia
   ▸ Objetivo: validar SLAs em condições normais
   ▸ Ex: 50 VUs por 5 minutos (pico normal do TMS)

   stages: ramp 0→50, sustenta 5min, ramp 50→0

3. STRESS TEST — "onde está o limite?"
   ▸ Sobe até quebrar, descobre o ponto de ruptura
   ▸ Objetivo: encontrar gargalos e capacidade máxima

   stages: 0→50→100→200→300 VUs progressivamente

4. SOAK TEST / ENDURANCE — "aguenta por muito tempo?"
   ▸ Carga normal por horas (2h, 4h, 8h)
   ▸ Objetivo: detectar memory leaks, degradação gradual

   vus: 50, duration: '4h'

5. SPIKE TEST — "aguenta picos repentinos?"
   ▸ Pico súbito de tráfego (ex: Black Friday)
   ▸ Testa auto-scaling e recuperação do sistema

   stages: 1VU → 500VUs em 10s → 1VU em 10s

6. BREAKPOINT TEST — "qual o máximo absoluto?"
   ▸ Sobe carga até 100% de falha
   ▸ Nunca em produção — só em staging/homologação

QUAL USAR NO TMS?
══════════════════════════════════════════════════════
  Antes de deploy:    Smoke Test + Load Test
  Análise de limite:  Stress Test
  Validação mensal:   Soak Test (2h)
  Campanhas sazonais: Spike Test`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

// SMOKE TEST — valide sempre com isso antes de rodar carga real
export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed:   ['rate<0.01'],
  },
};

// Para Load Test, troque por:
// stages: [
//   { duration: '1m',  target: 20 },
//   { duration: '3m',  target: 20 },
//   { duration: '1m',  target: 0  },
// ]

export default function () {
  const res = http.get('http://localhost:3000/health');
  check(res, {
    'api saudável':       (r) => r.status === 200,
    'responde em < 1s':   (r) => r.timings.duration < 1000,
  });
  sleep(1);
}`,
        },
        {
          label: "Rodando na prática — CLI completo",
          lesson: `COMANDOS ESSENCIAIS DO K6
══════════════════════════════════════════════════════

RODAR UM SCRIPT
══════════════════════════════════════════════════════
  k6 run script.js
  k6 run --vus 10 --duration 30s script.js      # sobrescreve options
  k6 run -e BASE_URL=https://api.staging.exemplo.dev script.js  # variável de ambiente

SAÍDA DO RELATÓRIO — ENTENDENDO CADA LINHA
══════════════════════════════════════════════════════
  ✓ checks.........................: 98.50%  ✓ 985  ✗ 15
    → 98.5% dos checks passaram

  data_received....................: 4.2 MB  140 kB/s
    → dados recebidos total / por segundo

  data_sent........................: 1.1 MB  36 kB/s
    → dados enviados

  http_req_duration................: avg=245ms  min=89ms med=201ms
                                     max=1.2s   p(90)=412ms p(95)=589ms
    → estatísticas de tempo de resposta

  http_req_failed..................: 0.30%   ✓ 0  ✗ 3
    → taxa de falhas (status 4xx/5xx ou timeout)

  http_reqs........................: 1000    33.3/s
    → total de requisições / por segundo

  iterations.......................: 500     16.7/s
    → execuções da função default

  vus..............................: 10      min=1  max=10
    → usuários virtuais

EXPORTANDO RESULTADO
══════════════════════════════════════════════════════
  k6 run --out json=resultado.json script.js    # JSON
  k6 run --out csv=resultado.csv script.js      # CSV

MODO DEBUG (ver cada requisição)
══════════════════════════════════════════════════════
  k6 run --http-debug script.js
  k6 run --http-debug=full script.js  # com headers e body

RODAR SEM VERIFICAÇÃO DE THRESHOLD (útil para debug)
══════════════════════════════════════════════════════
  k6 run --no-thresholds script.js

DOCKER (sem instalar k6)
══════════════════════════════════════════════════════
  docker run --rm -v \${PWD}:/scripts grafana/k6 run /scripts/script.js`,
          starter: `import http from 'k6/http';
import { check, sleep } from 'k6';

// Script completo — pronto para rodar em produção
export const options = {
  stages: [
    { duration: '30s', target: 5  }, // warm-up
    { duration: '1m',  target: 20 }, // carga normal TMS
    { duration: '30s', target: 0  }, // cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate>0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  const res = http.post(\`\${BASE_URL}/auth/login\`,
    JSON.stringify({ usuario: 'perf.test', senha: 'senha123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('access_token') };
}

export default function (data) {
  const headers = {
    'Authorization': 'Bearer ' + data.token,
    'Content-Type': 'application/json',
  };

  const res = http.get(\`\${BASE_URL}/pedidos?status=PRONTO_QA\`, { headers });
  check(res, {
    'status 200':          (r) => r.status === 200,
    'lista não vazia':     (r) => r.json('total') > 0,
    'resposta rápida':     (r) => r.timings.duration < 500,
  });

  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  http.post(\`\${BASE_URL}/auth/logout\`, null, {
    headers: { 'Authorization': 'Bearer ' + data.token }
  });
}`,
        },
      ],
    },
];
