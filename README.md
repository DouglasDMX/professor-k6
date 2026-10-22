# Professor K6

Plataforma de estudo de **testes de performance com [k6](https://k6.io)**: lições em português, um editor com
realce de sintaxe que simula a execução do script e desafios com dicas progressivas.

Criei o Professor K6 para capacitar o time de QA em testes de carga. A ideia é aprender o modelo mental do k6
(VUs, iterações, checks, thresholds, scenarios) sem precisar instalar nada nem ter uma API de pé. Quando a pessoa
quiser rodar de verdade, o repositório traz uma API de treino local.

## Para quem é

- Analistas de QA que vão escrever o primeiro teste de carga.
- Devs que querem colocar thresholds de performance no pipeline.
- Quem já usou JMeter ou Gatling e quer conhecer o k6.

## Conteúdo

| Módulo | Tópicos |
|---|---|
| 🔰 Fundamentos | O que é k6 · requisições HTTP · checks · sleep e think time · options (vus, duration, iterations) |
| 🔶 Intermediário | Thresholds · stages (ramp-up/ramp-down) · groups e tags · setup e teardown · métricas customizadas |
| 🔷 Avançado | Scenarios · testes data-driven · tipos de teste (smoke, load, stress, spike, soak) · CLI e CI |

São 14 tópicos e 19 desafios. O progresso fica salvo no navegador.

## Como rodar

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev        # abre a plataforma em http://localhost:5173
npm test           # testes (currículo, simulador, API e renderização)
npm run build      # gera o site estático em dist/
```

### Rodando os scripts com o k6 de verdade

Os exemplos das lições apontam para `http://localhost:3000`, onde sobe a API de treino incluída no repositório.
Os dados são fictícios e ficam em memória.

```bash
npm run api                    # sobe a API em http://localhost:3000
k6 run examples/smoke-test.js  # em outro terminal (instale o k6: https://grafana.com/docs/k6/latest/set-up/install-k6/)
```

Rotas disponíveis (com e sem o prefixo `/api`): `GET /health`, `POST /auth/login`, `POST /auth/logout`,
`GET /pedidos[?status=]`, `GET /pedidos/:id`, `POST /pedidos/status`, `GET /picking[?status=]`,
`GET /picking/fila`, `GET /picking/pendentes`, `GET /separacao/fila`, `POST /picking/processar`,
`PUT /picking/status`, `PUT /picking/:id/confirmar`.

A API aplica uma latência aleatória de até 150 ms para os thresholds terem o que medir. Para mudar, use
`MAX_LATENCY_MS=0 npm run api`.

## Decisões técnicas

- **Simulação em vez de execução.** O navegador não roda k6. O simulador (`src/lib/simulator.js`) lê a estrutura
  do script (options, stages, scenarios, requisições, checks e thresholds) e gera métricas plausíveis e
  determinísticas: o mesmo script sempre produz o mesmo resultado. Assim dá para ver na hora o efeito de mudar
  VUs, stages ou um threshold. A própria interface avisa que os números são simulados.
- **Desafios validados pela estrutura do script.** Cada desafio tem um validador que recebe o resultado da
  simulação e o texto do script. Os testes incluem uma solução de referência por desafio, para garantir que
  todos podem ser concluídos.
- **Sem backend obrigatório.** O site é estático (GitHub Pages). A API de treino é opcional e só existe para
  praticar com o k6 real.
- **Editor leve.** Uma `textarea` transparente sobre uma camada com realce de sintaxe, sem dependência de editor
  externo. O bundle final tem cerca de 65 kB gzip.

## Estrutura

```
src/
├── App.jsx                 # estado da navegação, editor e desafios
├── components/             # Sidebar, LessonView, EditorView, ChallengesView, CodeEditor, SimulationOutput
├── data/
│   ├── curriculum.js       # módulos, tópicos, lições e scripts de exemplo
│   └── challenges.js       # desafios por tópico, dicas e validadores
├── lib/
│   ├── simulator.js        # leitura do script e métricas simuladas
│   ├── highlight.js        # realce de sintaxe
│   └── progress.js         # progresso no localStorage
└── styles/app.css
server/                     # API de treino (Express)
examples/                   # scripts para rodar com o k6
tests/                      # Vitest
```

## Licença

[MIT](./LICENSE) © Carlos Douglas Santos da Silva
