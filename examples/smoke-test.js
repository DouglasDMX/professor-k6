// Exemplo para rodar contra a API de treino:
//   npm run api
//   k6 run examples/smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/pedidos?status=PRONTO_QA`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'lista não vazia': (r) => r.json('total') > 0,
  });
  sleep(1);
}
