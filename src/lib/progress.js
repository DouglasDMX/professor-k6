// Progresso dos desafios salvo no navegador. Falhas de acesso ao localStorage
// (modo privado, armazenamento bloqueado) apenas desativam a persistência.

const STORAGE_KEY = "professor-k6:progress";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // sem persistência disponível
  }
}

export const challengeKey = (topicKey, index) => `${topicKey}-${index}`;
