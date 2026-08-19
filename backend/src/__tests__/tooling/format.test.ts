import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const backendRoot = path.resolve(__dirname, "..", "..", "..");
const repoRoot = path.resolve(backendRoot, "..");
const frontendRoot = path.resolve(repoRoot, "frontend");

// Ruta relativa compartida entre backend/ y frontend/: ambos paquetes tienen la
// misma estructura src/__tests__/tooling/__fixtures__.
const fixturesRelDir = path.join("src", "__tests__", "tooling", "__fixtures__");
const fixtureDir = path.join(backendRoot, fixturesRelDir);
const frontendFixtureDir = path.join(frontendRoot, fixturesRelDir);

type PrettierResult = {
    status: number;
    stderr: string;
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
        return { status: 0, stderr: "" };
    } catch (error) {
        const err = error as { status: number | null; stderr?: Buffer };
        return {
            status: err.status ?? 1,
            stderr: err.stderr?.toString() ?? ""
        };
    }
};

describe("prettier --write (backend, acotado a fixtures)", () => {
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
            backendRoot,
            path.join(fixturesRelDir, fixtureName)
        );

        expect(result.status).toBe(0);
        const output = fs.readFileSync(fixturePath, "utf-8");
        expect(output).toContain("    a: 1");
        expect(output).toContain("    b: 2");
    }, 30000);

    it("no agrega coma final al último elemento de un array/objeto multilínea (AC-02)", () => {
        const fixtureName = "no-trailing-comma.ts";
        const fixturePath = path.join(fixtureDir, fixtureName);
        fs.writeFileSync(
            fixturePath,
            "const list = [\n  1,\n  2,\n  3\n];\n\nconst obj = {\n  a: 1,\n  b: 2\n};\n"
        );

        const result = runPrettierOnFixture(
            backendRoot,
            path.join(fixturesRelDir, fixtureName)
        );

        expect(result.status).toBe(0);
        const output = fs.readFileSync(fixturePath, "utf-8");
        expect(output).not.toMatch(/3,\r?\n\];/);
        expect(output).not.toMatch(/2,\r?\n\};/);
    }, 30000);

    it("sale con código distinto de cero y no reescribe un archivo con sintaxis inválida", () => {
        const fixtureName = "invalid-syntax.ts";
        const fixturePath = path.join(fixtureDir, fixtureName);
        const originalContent = "const broken = {\n  a: 1,\n";
        fs.writeFileSync(fixturePath, originalContent);

        const result = runPrettierOnFixture(
            backendRoot,
            path.join(fixturesRelDir, fixtureName)
        );

        expect(result.status).not.toBe(0);
        expect(result.stderr.toLowerCase()).toContain("invalid-syntax.ts");
        const output = fs.readFileSync(fixturePath, "utf-8");
        expect(output).toBe(originalContent);
    }, 30000);

    it("correr prettier en backend/ no modifica un fixture de frontend/ ni viceversa (NFR-02)", () => {
        const fixtureName = "cross-check.ts";
        const backendFixturePath = path.join(fixtureDir, fixtureName);
        const frontendFixturePath = path.join(frontendFixtureDir, fixtureName);
        const originalContent = "const value = {\n  a: 1\n};\n";

        fs.mkdirSync(frontendFixtureDir, { recursive: true });
        fs.writeFileSync(backendFixturePath, originalContent);
        fs.writeFileSync(frontendFixturePath, originalContent);

        try {
            const backendResult = runPrettierOnFixture(
                backendRoot,
                path.join(fixturesRelDir, fixtureName)
            );
            expect(backendResult.status).toBe(0);
            const backendOutputAfterBackendRun = fs.readFileSync(
                backendFixturePath,
                "utf-8"
            );
            expect(backendOutputAfterBackendRun).toContain("    a: 1");
            expect(fs.readFileSync(frontendFixturePath, "utf-8")).toBe(
                originalContent
            );

            const frontendResult = runPrettierOnFixture(
                frontendRoot,
                path.join(fixturesRelDir, fixtureName)
            );
            expect(frontendResult.status).toBe(0);
            expect(fs.readFileSync(frontendFixturePath, "utf-8")).toContain(
                "    a: 1"
            );
            expect(fs.readFileSync(backendFixturePath, "utf-8")).toBe(
                backendOutputAfterBackendRun
            );
        } finally {
            fs.rmSync(frontendFixturePath, { force: true });
        }
    }, 30000);
});
