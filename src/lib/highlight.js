// Realce de sintaxe simples para scripts k6 (tema inspirado no Dracula).
// Gera HTML com o texto sempre escapado, para uso em dangerouslySetInnerHTML.

const KEYWORDS = new Set([
  "import", "export", "from", "const", "let", "var", "function", "return",
  "default", "if", "else", "for", "while", "true", "false", "null",
  "undefined", "new", "class", "async", "await",
]);

const K6_API = new Set([
  "http", "check", "sleep", "group", "describe", "threshold", "options",
  "setup", "teardown", "SharedArray", "open", "exec",
]);

const K6_MODULES = new Set([
  "k6", "k6/http", "k6/metrics", "k6/data", "k6/execution", "k6/html", "k6/ws",
]);

const COLORS = {
  string: "#f1fa8c",
  module: "#8be9fd",
  comment: "#6272a4",
  number: "#bd93f9",
  keyword: "#ff79c6",
  api: "#50fa7b",
  identifier: "#e2e2e8",
  punctuation: "#ff79c6",
};

export function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const span = (color, text, extra = "") =>
  `<span style="color:${color}${extra}">${escapeHtml(text)}</span>`;

export function highlight(code) {
  let html = "";
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (ch === "`" || ch === "'" || ch === '"') {
      let end = i + 1;
      while (end < code.length && code[end] !== ch) {
        if (code[end] === "\\") end++;
        end++;
      }
      const literal = code.slice(i, end + 1);
      const isModule = K6_MODULES.has(literal.slice(1, -1));
      html += span(isModule ? COLORS.module : COLORS.string, literal);
      i = end + 1;
      continue;
    }

    if (ch === "/" && code[i + 1] === "/") {
      let end = i;
      while (end < code.length && code[end] !== "\n") end++;
      html += span(COLORS.comment, code.slice(i, end), ";font-style:italic");
      i = end;
      continue;
    }

    if (/\d/.test(ch) && (i === 0 || /\W/.test(code[i - 1]))) {
      let end = i;
      while (end < code.length && /[\d.]/.test(code[end])) end++;
      html += span(COLORS.number, code.slice(i, end));
      i = end;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let end = i;
      while (end < code.length && /[\w$]/.test(code[end])) end++;
      const word = code.slice(i, end);
      if (KEYWORDS.has(word)) html += span(COLORS.keyword, word, ";font-weight:600");
      else if (K6_API.has(word)) html += span(COLORS.api, word, ";font-weight:500");
      else html += span(COLORS.identifier, word);
      i = end;
      continue;
    }

    if (/[{}()[\];,.]/.test(ch)) html += span(COLORS.punctuation, ch);
    else html += escapeHtml(ch);
    i++;
  }

  // Uma quebra extra no fim mantém a camada de realce alinhada com a textarea
  // quando o texto termina em linha vazia.
  return html + "\n";
}
