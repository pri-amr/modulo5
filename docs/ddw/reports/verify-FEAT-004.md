# Verification FEAT-004

| Field | Value |
|---|---|
| Module | backend/eslint.config.mjs, frontend/eslint.config.mjs, .prettierrc.json |
| Line coverage | 97.99% (backend 96.69%, frontend 99.28%) |
| Branch coverage | 86.81% (backend 93.22%, frontend 80.39%) |
| Function coverage | 96.55% (backend 93.1%, frontend 100%) |
| Coverage floor | 80% línea/rama/función (`.ddw/rules/testing.instructions.md`, "Minimum Coverage" — AGENTS.md no declara un piso propio) |
| Lint | `eslint .` en backend/ y frontend/ — clean, 0 findings en ambos (re-corrido por `ddw-module-verifier` de forma independiente) |

Este ticket es infraestructura de tooling (ESLint + Prettier), no código de aplicación con
endpoints propios: los 8 AC del PRD se verifican con comando + output real (no con tests
automatizados — decisión de usuario documentada en `docs/ddw/reports/tdd-evidence-FEAT-004.md`,
2026-08-22). El `ddw-module-verifier` reprodujo los 8 AC de forma independiente, sin confiar en el
reporte de evidencia, con resultado idéntico.

## Acceptance criteria
- ✅ AC-01 (FR-01) — Prettier reindenta 2→4 espacios, verificado en backend/ y frontend/
- ✅ AC-02 (FR-01) — sin coma final en array/objeto multilínea, verificado en ambos paquetes
- ✅ AC-03 (FR-06) — `any` hace que `eslint` termine con código de salida 1 en ambos paquetes — regla `@typescript-eslint/no-explicit-any`
- ✅ AC-04 (FR-07) — orden de imports incorrecto hace que `eslint` termine con código de salida 1 en ambos paquetes, incluida la clasificación del alias `@/**` en frontend/
- ✅ AC-05 (FR-08) — `dangerouslySetInnerHTML` hace que `eslint` termine con código de salida 1 en frontend/ — regla `react/no-danger`
- ✅ AC-06 (FR-09, FR-10) — `pnpm lint` analiza solo `src/` de cada paquete (dist/.next/coverage ignorados), código de salida distinto de cero si hay al menos un hallazgo
- ✅ AC-07 (FR-04, FR-05) — hook de React llamado condicionalmente hace que `eslint` termine con código de salida 1 en frontend/ — regla `react-hooks/rules-of-hooks`
- ✅ AC-08 (FR-02, FR-03) — `pnpm lint` de un paquete no depende del `node_modules` del otro: verificado estructuralmente (sin workspace de raíz, sin referencias cruzadas en ninguno de los dos `eslint.config.mjs`, `cwd` siempre acotado al propio paquete) tras no poder simular el borrado directo en el sandbox de verificación

## Spec blocks
- ✅ Block 1 — Prettier compartido + scripts `format` (commit df2b85e), 4 puntos de verificación manual reproducidos
- ✅ Block 2 — ESLint backend (commit de6b112), 5 puntos de verificación manual reproducidos
- ✅ Block 3 — ESLint frontend (commit 54d7f66), 7 puntos de verificación manual reproducidos; desviación del literal del spec documentada y verificada en ADR-002

## FR/NFR
- ✅ FR-01 a FR-10 — cubiertos, cada uno con archivo:línea (detalle completo en el reporte del `ddw-module-verifier`)
- ✅ NFR-01 — ninguna config referencia rutas del otro paquete; lockfiles y `node_modules` independientes
- ✅ NFR-02 — `pnpm format`/`pnpm lint` en un paquete no modifica archivos del otro (confirmado con `git status`)

## Out of Scope (PRD)
- ✅ Sin husky/lint-staged, sin hooks reales en `.git/hooks`, sin workflow de CI — consistente con el Out of Scope del PRD
- ✅ El commit de cierre (a932fc5) sobre archivos preexistentes de `backend/src/` es mecánico: reordenamiento de imports (`eslint --fix`) y un ajuste de configuración del propio linter (`no-unused-vars` ignore pattern) — no una migración de comportamiento de aplicación

## Tests
- ✅ Sad-path tests: N/A para este ticket — no hay endpoints ni funciones de aplicación nuevas; los "sad paths" son los 8 AC en sí (código que debe hacer terminar el linter con código de salida distinto de cero), todos reproducidos arriba
- ✅ Full suite: 102/102 (backend 54/54, frontend 48/48), 0 fallidos — `docs/ddw/reports/tests-FEAT-004.md`

Los 17 checks manuales que el spec promete (uno por bullet de "Required tests" en sus 3 bloques),
cada uno reproducido de forma independiente por el `ddw-module-verifier` con resultado idéntico al
documentado en `docs/ddw/reports/tdd-evidence-FEAT-004.md`:

- `test-manual-format-backend-tabwidth` — PASS (Block 1, AC-01)
- `test-manual-format-frontend-tabwidth` — PASS (Block 1, AC-01)
- `test-manual-format-sin-coma-final` — PASS (Block 1, AC-02)
- `test-manual-format-no-cruza-paquetes` — PASS (Block 1, NFR-02)
- `test-manual-format-sintaxis-invalida` — PASS (Block 1, manejo de error)
- `test-manual-lint-backend-any` — PASS (Block 2, AC-03)
- `test-manual-lint-backend-import-order` — PASS (Block 2, AC-04)
- `test-manual-lint-backend-scope-src` — PASS (Block 2, AC-06 mitad backend)
- `test-manual-lint-backend-sin-node-modules-frontend` — PASS (Block 2, AC-08 mitad backend)
- `test-manual-lint-backend-build-script-approval` — PASS (Block 2, manejo de error)
- `test-manual-lint-frontend-any` — PASS (Block 3, AC-03)
- `test-manual-lint-frontend-import-order-alias` — PASS (Block 3, AC-04)
- `test-manual-lint-frontend-dangerous-html` — PASS (Block 3, AC-05)
- `test-manual-lint-frontend-scope-src` — PASS (Block 3, AC-06 mitad frontend)
- `test-manual-lint-frontend-conditional-hook` — PASS (Block 3, AC-07)
- `test-manual-lint-frontend-sin-node-modules-backend` — PASS (Block 3, AC-08 mitad frontend)
- `test-manual-lint-frontend-build-script-approval` — PASS (Block 3, manejo de error)

## Warnings (no bloqueantes)
- ⚠️ El commit de cierre (a932fc5) deja dos líneas con solo espacios en blanco tras remover
  directivas `eslint-disable` obsoletas en `express.d.ts:6` y `errorHandler.ts:5` — excede
  literalmente lo que `eslint --fix`/`prettier --write` producen por sí solos (edición manual
  funcionalmente inerte, sin ADR propio). Sin impacto en ningún AC ni en el comportamiento de la
  aplicación. Higiene de proceso a considerar en un futuro touch de esos archivos.
- ⚠️ `docs/ddw/security/sast-FEAT-004.md` describe "un eslint-disable obsoleto" removido en el
  cierre cuando en realidad fueron dos (el de `express.d.ts` y el de `errorHandler.ts`) — desajuste
  menor de conteo en la nota del reporte SAST, no en su veredicto (0 vulnerabilidades sigue siendo
  correcto).

Result: PASSED
