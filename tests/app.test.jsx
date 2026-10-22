import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import App from "../src/App.jsx";

describe("App", () => {
  it("renderiza a primeira lição sem depender do localStorage", () => {
    const html = renderToString(<App />);
    expect(html).toContain("Professor K6");
    expect(html).toContain("O QUE É K6?");
    expect(html).toContain(`aria-valuemax="19" aria-valuenow="0"`);
  });
});
