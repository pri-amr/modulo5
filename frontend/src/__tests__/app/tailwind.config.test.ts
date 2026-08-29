import config from "../../../tailwind.config";

const SEMANTIC_TOKENS = [
  "bg",
  "surface",
  "surface-muted",
  "fg",
  "fg-muted",
  "line",
  "accent",
  "accent-blue",
  "success",
  "error",
  "overlay",
];

describe("tailwind.config.ts", () => {
  it.each(SEMANTIC_TOKENS)(
    "expone el token semántico %s como color de Tailwind",
    (name) => {
      const colors = config.theme?.extend?.colors as Record<string, string>;
      const cssVarName = `--color-${name}`;

      expect(colors[name]).toBe(`rgb(var(${cssVarName}) / <alpha-value>)`);
    },
  );

  it("no modifica darkMode ni content existentes", () => {
    expect(config.darkMode).toBe("class");
    expect(config.content).toEqual(["./src/**/*.{ts,tsx}"]);
  });
});
