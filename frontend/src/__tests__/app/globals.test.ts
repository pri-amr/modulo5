import { readFileSync } from "fs";
import { join } from "path";

const GLOBALS_CSS_PATH = join(__dirname, "..", "..", "app", "globals.css");

const DARK_TOKENS: Record<string, string> = {
    "--color-bg": "11 11 18",
    "--color-surface": "23 22 31",
    "--color-surface-muted": "32 30 43",
    "--color-fg": "245 245 247",
    "--color-fg-muted": "160 163 177",
    "--color-line": "42 40 54",
    "--color-accent": "155 123 250",
    "--color-accent-blue": "110 168 255",
    "--color-success": "125 209 129",
    "--color-error": "255 82 82",
    "--color-overlay": "5 5 10"
};

const LIGHT_TOKENS: Record<string, string> = {
    "--color-bg": "255 255 255",
    "--color-surface": "255 255 255",
    "--color-surface-muted": "243 242 250",
    "--color-fg": "17 17 20",
    "--color-fg-muted": "107 114 128",
    "--color-line": "226 228 234",
    "--color-accent": "124 58 237",
    "--color-accent-blue": "55 107 203",
    "--color-success": "30 142 62",
    "--color-error": "220 38 38",
    "--color-overlay": "63 61 77"
};

const extractBlock = (css: string, selector: string): string => {
    const pattern = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "m");
    const match = css.match(pattern);
    return match ? match[1] : "";
};

describe("globals.css", () => {
    const css = readFileSync(GLOBALS_CSS_PATH, "utf-8");

    it("define los 11 tokens bajo :root con los valores de modo oscuro", () => {
        const rootBlock = extractBlock(css, ":root");

        Object.entries(DARK_TOKENS).forEach(([token, value]) => {
            expect(rootBlock).toMatch(new RegExp(`${token}:\\s*${value};`));
        });
    });

    it("define los 11 tokens bajo .light con los valores de modo claro", () => {
        const lightBlock = extractBlock(css, "\\.light");

        Object.entries(LIGHT_TOKENS).forEach(([token, value]) => {
            expect(lightBlock).toMatch(new RegExp(`${token}:\\s*${value};`));
        });
    });

    it("el valor de --color-accent-blue en .light es 55 107 203 (#376BCB)", () => {
        const lightBlock = extractBlock(css, "\\.light");

        expect(lightBlock).toMatch(/--color-accent-blue:\s*55 107 203;/);
    });

    it("aplica bg-bg y text-fg al body", () => {
        const bodyBlock = extractBlock(css, "body");

        expect(bodyBlock).toMatch(/@apply\s+bg-bg\s+text-fg;/);
    });

    it("conserva la sintaxis de importación de Tailwind 4", () => {
        expect(css).toMatch(/@import\s+"tailwindcss";/);
        expect(css).not.toMatch(/@tailwind\s+(base|components|utilities);/);
    });
});
