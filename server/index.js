import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3000;
const maxLatencyMs = Number(process.env.MAX_LATENCY_MS ?? 150);

createApp({ maxLatencyMs }).listen(port, () => {
  console.log(`API de treino do Professor K6 em http://localhost:${port}`);
  console.log(`Latência artificial: até ${maxLatencyMs}ms (MAX_LATENCY_MS)`);
});
