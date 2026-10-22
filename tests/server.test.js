import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";

let server;
let base;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("API de treino", () => {
  it("responde ao health check", async () => {
    const res = await fetch(`${base}/health`);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("faz login e logout com token", async () => {
    const login = await post("/auth/login", { usuario: "perf.test", senha: "senha123" });
    const { access_token } = await login.json();
    expect(access_token).toBeTruthy();
    const logout = await post("/auth/logout", null, { Authorization: `Bearer ${access_token}` });
    expect(logout.status).toBe(204);
    const again = await post("/auth/logout", null, { Authorization: `Bearer ${access_token}` });
    expect(again.status).toBe(401);
  });

  it("lista pedidos com filtro e total, com e sem prefixo /api", async () => {
    const res = await fetch(`${base}/pedidos?status=PRONTO_QA`);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.pedidos.every((p) => p.status === "PRONTO_QA")).toBe(true);
    expect((await fetch(`${base}/api/pedidos`)).status).toBe(200);
  });

  it("busca pedido por id e devolve 404 quando não existe", async () => {
    expect((await (await fetch(`${base}/pedidos/PED-1001`)).json()).pedido_id).toBe("PED-1001");
    expect((await fetch(`${base}/pedidos/PED-9999`)).status).toBe(404);
  });

  it("processa lote de picking", async () => {
    const res = await post("/picking/processar", { lote: "LOTE-002" });
    expect((await res.json()).status).toBe("CONFIRMADO");
  });
});
