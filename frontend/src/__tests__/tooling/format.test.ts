/**
 * @jest-environment node
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const frontendRoot = path.resolve(__dirname, "..", "..", "..");
const fixturesRelDir = path.join("src", "__tests__", "tooling", "__fixtures__");
const fixtureDir = path.join(frontendRoot, fixturesRelDir);

type PrettierResult = {
    status: number;
};

// Corre prettier acotado a UN archivo (nunca "." / el árbol completo). Prettier
// sigue resolviendo .prettierrc.json por búsqueda ascendente desde `cwd` — misma
// config que usaría `pnpm format` — pero el target es el fixture, no el repo real.
// Esto evita tocar ningún archivo trackeado y hace innecesario cualquier `git
// checkout` de limpieza.
const runPrettierOnFixture = (
    cwd: string,
    relativeFixturePath: string
): PrettierResult => {
    try {
        execSync(`pnpm exec prettier --write "${relativeFixturePath}"`, {
            cwd,
            stdio: "pipe"
        });
        return { status: 0 };
    } catch (error) {
        const err = error as { status: number | null };
        return { status: err.status ?? 1 };
    }
};

describe("prettier --write (frontend, acotado a fixtures)", () => {
    beforeEach(() => {
        fs.mkdirSync(fixtureDir, { recursive: true });
    });

    afterEach(() => {
        if (fs.existsSync(fixtureDir)) {
            fs.rmSync(fixtureDir, { recursive: true, force: true });
        }
    });

    it("reescribe un archivo de prueba con indentación de 2 espacios a 4 (AC-01)", () => {
        const fixtureName = "two-space.ts";
        const fixturePath = path.join(fixtureDir, fixtureName);
        fs.writeFileSync(fixturePath, "const value = {\n  a: 1,\n  b: 2\n};\n");

        const result = runPrettierOnFixture(
            frontendRoot,
            path.join(fixturesRelDir, fixtureName)
        );

        expect(result.status).toBe(0);
        const output = fs.readFileSync(fixturePath, "utf-8");
        expect(output).toContain("    a: 1");
        expect(output).toContain("    b: 2");
    }, 30000);
});
