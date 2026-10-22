import { useMemo, useRef } from "react";
import { highlight } from "../lib/highlight.js";

// Textarea transparente sobre uma camada com realce de sintaxe.
// O scroll da textarea é espelhado na camada para as duas ficarem alinhadas.
export default function CodeEditor({ value, onChange, label = "Editor de script k6" }) {
  const layerRef = useRef(null);
  const html = useMemo(() => highlight(value), [value]);

  function syncScroll(event) {
    if (layerRef.current) {
      layerRef.current.scrollTop = event.target.scrollTop;
      layerRef.current.scrollLeft = event.target.scrollLeft;
    }
  }

  function handleKeyDown(event) {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.target;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      event.target.selectionStart = event.target.selectionEnd = selectionStart + 2;
    });
  }

  return (
    <div className="editor">
      <pre ref={layerRef} className="editor-layer" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
      <textarea
        className="editor-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        aria-label={label}
      />
    </div>
  );
}
