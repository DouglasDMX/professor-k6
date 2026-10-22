// API de treino para os scripts do Professor K6.
// Dados fictícios, em memória; serve só para praticar k6 localmente.
import express from "express";
import { randomUUID } from "node:crypto";

const STATUSES = ["ABERTO", "PRONTO_QA", "MANUTENCAO", "EM_SEPARACAO", "ENTREGUE"];

function seedPedidos() {
  return Array.from({ length: 30 }, (_, i) => ({
    pedido_id: `PED-${1001 + i}`,
    cliente: `Cliente ${String.fromCharCode(65 + (i % 26))}`,
    status: STATUSES[i % STATUSES.length],
    valor_total: Math.round((150 + i * 37.5) * 100) / 100,
  }));
}

function seedPicking() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: 100 + i,
    lote: `LOTE-${String(i + 1).padStart(3, "0")}`,
    pedido_id: `PED-${1001 + i}`,
    status: i % 3 === 0 ? "CONFIRMADO" : "PENDENTE",
  }));
}

// Atraso artificial opcional, para os thresholds terem o que medir.
const latency = (maxMs) => (req, res, next) => {
  if (maxMs <= 0) return next();
  setTimeout(next, Math.floor(Math.random() * maxMs));
};

export function createApp({ maxLatencyMs = 0 } = {}) {
  const pedidos = seedPedidos();
  const picking = seedPicking();
  const tokens = new Set();

  const api = express.Router();
  api.use(express.json({ strict: false }));
  api.use(latency(maxLatencyMs));

  const requireAuth = (req, res, next) => {
    const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!tokens.has(token)) return res.status(401).json({ error: "token ausente ou inválido" });
    next();
  };

  api.get("/health", (req, res) => res.json({ status: "ok" }));

  api.post("/auth/login", (req, res) => {
    const { usuario, senha } = req.body || {};
    if (!usuario || !senha) return res.status(400).json({ error: "usuario e senha são obrigatórios" });
    const token = randomUUID();
    tokens.add(token);
    res.json({ access_token: token, token_type: "Bearer", expires_in: 3600 });
  });

  api.post("/auth/logout", requireAuth, (req, res) => {
    tokens.delete((req.get("authorization") || "").replace(/^Bearer\s+/i, ""));
    res.status(204).end();
  });

  // Leitura liberada sem token para os primeiros exercícios; escrita exige login.
  api.get("/pedidos", (req, res) => {
    const { status } = req.query;
    const lista = status ? pedidos.filter((p) => p.status === status) : pedidos;
    res.json({ total: lista.length, pedidos: lista });
  });

  api.get("/pedidos/:id", (req, res) => {
    const pedido = pedidos.find((p) => p.pedido_id === req.params.id || p.pedido_id === `PED-${req.params.id}`);
    if (!pedido) return res.status(404).json({ error: "pedido não encontrado" });
    res.json({ ...pedido, data: { status: "ATIVO" } });
  });

  api.post("/pedidos/status", (req, res) => {
    const { pedido_id, status } = req.body || {};
    const pedido = pedidos.find((p) => p.pedido_id === pedido_id || p.pedido_id === `PED-${pedido_id}`);
    if (!pedido) return res.status(404).json({ error: "pedido não encontrado" });
    if (status) pedido.status = status;
    res.json(pedido);
  });

  api.get("/picking", (req, res) => {
    const { status } = req.query;
    res.json(status ? picking.filter((p) => p.status === status) : picking);
  });
  api.get("/picking/fila", (req, res) => res.json(picking.filter((p) => p.status === "PENDENTE")));
  api.get("/picking/pendentes", (req, res) => res.json(picking.filter((p) => p.status === "PENDENTE")));
  api.get("/separacao/fila", (req, res) => res.json(picking.filter((p) => p.status === "PENDENTE")));

  api.post("/picking/processar", (req, res) => {
    const item = picking.find((p) => p.lote === req.body?.lote);
    if (!item) return res.status(404).json({ error: "lote não encontrado" });
    item.status = "CONFIRMADO";
    res.json(item);
  });

  api.put("/picking/status", (req, res) => {
    const item = picking.find((p) => p.id === Number(req.body?.id) || p.lote === req.body?.lote);
    if (!item) return res.status(404).json({ error: "item não encontrado" });
    item.status = req.body.status || item.status;
    res.json(item);
  });

  api.put("/picking/:id/confirmar", (req, res) => {
    const item = picking.find((p) => p.id === Number(req.params.id));
    if (!item) return res.status(404).json({ error: "item não encontrado" });
    item.status = "CONFIRMADO";
    res.json(item);
  });

  const app = express();
  // As lições usam as rotas com e sem o prefixo /api.
  app.use("/api", api);
  app.use("/", api);
  return app;
}
