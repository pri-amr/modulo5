# Spec FEAT-004: Configurar ESLint y Prettier

| Field | Value |
|-------|-------|
| Ticket | FEAT-004 |
| PRD | docs/ddw/prd/prd-FEAT-004.md |
| Tier | FEATURE |
| Date | 2026-08-18 |
| Spec loops | 0 |
| Loops since last human decision | 0 |

## Summary
Se instala Prettier con una config compartida (raíz, resuelta por búsqueda ascendente) y un ESLint
propio por paquete (flat config, ESLint 9.x — ver nota de versión en Block 2). `backend/` usa
`@eslint/js` + `typescript-eslint`
recommended + `eslint-plugin-import`. `frontend/` usa `eslint-config-next` (que ya trae
typescript-eslint, React, hooks, jsx-a11y y el plugin de imports como dependencias propias) más un
resolver de TypeScript para el alias `@/*`. Ningún hook de pre-commit ni CI: solo se instala la
herramienta, correrla queda a criterio de cada desarrollador (ver threat model, R-02, riesgo
aceptado).

## Coverage: PRD → blocks
| Requirement | Covered by |
|---|---|
| FR-01 | Block 1 |
| FR-02 | Block 2 |
| FR-03 | Block 3 |
| FR-04 | Block 2, Block 3 |
| FR-05 | Block 3 |
| FR-06 | Block 2, Block 3 |
| FR-07 | Block 2, Block 3 |
| FR-08 | Block 3 |
| FR-09 | Block 1, Block 2 |
| FR-10 | Block 1, Block 3 |
| NFR-01 | Strategy: cada script de `lint`/`format` opera solo sobre su propio `cwd` (`backend/` o `frontend/`) y solo referencia dependencias de su propio `node_modules`; verificado en Block 2 y Block 3 (AC-08). |
| NFR-02 | Strategy: `prettier --write .` y `eslint .` se ejecutan siempre con `cwd` = la carpeta del paquete, nunca con rutas absolutas fuera de ella; verificado en los 3 bloques. |

## Dependencies between blocks
Ninguna dependencia dura entre bloques — los 3 son independientes y se pueden implementar en
cualquier orden. Se sugiere 1 → 2 → 3 porque Block 1 deja el `.prettierignore` que Block 2 y
Block 3 reutilizan como referencia de qué directorios generados excluir también en sus respectivos
`ignores` de ESLint.

## Block 1 — Prettier compartido + scripts `format`

**Files**
- `.prettierrc.json` (nuevo, raíz) — config compartida.
- `.prettierignore` (nuevo, raíz) — excluye directorios generados.
- `backend/package.json` (modificado) — agrega `prettier` y el script `format`.
- `frontend/package.json` (modificado) — agrega `prettier` y el script `format`.

**Logic**
`.prettierrc.json`:
```json
{
  "tabWidth": 4,
  "trailingComma": "none"
}
```
El resto de las opciones queda en su valor por defecto de Prettier (FR-01). Prettier resuelve este
archivo por búsqueda ascendente desde `backend/` y `frontend/` sin necesidad de referenciarlo
explícitamente desde ninguno de los dos `package.json`.

`.prettierignore`:
```
frontend/.next/
frontend/coverage/
backend/dist/
**/coverage
```
(mismos patrones que ya usa `.gitignore` para directorios generados — gap encontrado por el impact
scan de PLAN).

`backend/package.json` y `frontend/package.json`: agregan `"prettier": "^3.9.6"` a
`devDependencies` y `"format": "prettier --write ."` a `scripts`.

**Input validation**
N/A — no procesa input de usuario.

**Error handling**
- Un archivo con sintaxis inválida: Prettier reporta el error de parseo y sale con código distinto
  de cero; no reescribe el archivo. No requiere manejo adicional en este ticket.

**Required tests**
- [ ] `pnpm format` en `backend/` reescribe un archivo de prueba con indentación de 2 espacios a 4 — valida AC-01
- [ ] `pnpm format` en `frontend/` reescribe un archivo de prueba con indentación de 2 espacios a 4 — valida AC-01
- [ ] `pnpm format` sobre un array/objeto multilínea no agrega coma final al último elemento — valida AC-02
- [ ] `pnpm format` en `backend/` no modifica ningún archivo dentro de `frontend/` ni viceversa — valida NFR-02
- [ ] `pnpm format` sobre un archivo con sintaxis inválida sale con código ≠ 0 y no reescribe el
      archivo — valida el manejo de error documentado arriba

**Completion criterion**
`pnpm format` corre sin error en `backend/` y en `frontend/`, y los 4 tests de este bloque pasan.

## Block 2 — ESLint backend (Node/Express/TypeScript)

**Files**
- `backend/eslint.config.mjs` (nuevo).
- `backend/package.json` (modificado) — agrega devDependencies y el script `lint`.

**Logic**
`backend/eslint.config.mjs` (flat config, ESM):
```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  { ignores: ["dist/**", "**/coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // tsc ya valida los identificadores no declarados; no-undef da falsos positivos
      // sistemáticos con TypeScript (globals ambientes, tipos, etc.) — recomendación
      // documentada de typescript-eslint.
      "no-undef": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
);
```
`backend/package.json`: agrega a `devDependencies`: `"eslint": "^9.39.5"`,
`"@eslint/js": "^9.39.5"`, `"typescript-eslint": "^8.67.0"`, `"eslint-plugin-import": "^2.32.0"`; a
`scripts`: `"lint": "eslint ."`.

> **Por qué ESLint 9.x y no 10.x:** `eslint-plugin-import@2.32.0` (la única forma estándar de
> forzar orden de imports, usada acá y arrastrada también por `eslint-config-next` en Block 3)
> declara soporte de peer hasta `eslint@^9` — no `^10` — y no se actualizó en más de un año, así
> que no hay upgrade en camino. Bajar a `9.39.5` (la última de esa línea, publicada 10-jul-2026,
> dentro de la regla de 3 días) es correcto para los dos paquetes, no un downgrade parcial: fija el
> mismo conflicto que existiría en `frontend/` por la dependencia transitiva de `eslint-config-next`
> hacia el mismo paquete. Hallazgo del `ddw-arch-auditor` en PLAN, verificado con
> `npm view eslint-plugin-import peerDependencies`.

**Input validation**
N/A.

**Error handling**
- El comando de instalación (`pnpm install`) puede pedir aprobar un build nuevo para alguno de
  estos 4 paquetes: si eso pasa, CODE se detiene y lo reporta antes de aprobar nada (mitigación de
  R-01 del threat model — ninguno de los 4 debería pedirlo, pero se verifica en vez de asumir).

**Required tests**
- [ ] Un archivo `.ts` con una variable tipada `any` hace fallar `pnpm lint` (exit code ≠ 0) — valida AC-03
- [ ] Un archivo `.ts` con imports en un orden distinto de builtin→external→internal, o sin orden
      alfabético dentro de un grupo, hace fallar `pnpm lint` — valida AC-04
- [ ] `pnpm lint` en `backend/` analiza únicamente `backend/src/**` (no `dist/`, no `coverage/`) y
      devuelve exit code ≠ 0 si hay al menos un error — valida AC-06 (mitad backend)
- [ ] `pnpm lint` en `backend/` completa sin fallar aunque `frontend/node_modules` no exista —
      valida AC-08 (mitad backend)
- [ ] Falla el bloque (se detiene y se reporta) si `pnpm install` en `backend/` pide aprobar un
      build nuevo para `eslint`, `@eslint/js`, `typescript-eslint` o `eslint-plugin-import` —
      valida el manejo de error documentado arriba

**Completion criterion**
`pnpm lint` corre en `backend/` y reporta correctamente errores para los 3 casos de prueba
anteriores; los 5 tests de este bloque pasan.

## Block 3 — ESLint frontend (Next.js/React/TypeScript)

**Files**
- `frontend/eslint.config.mjs` (nuevo).
- `frontend/package.json` (modificado) — agrega devDependencies y el script `lint`.

**Logic**
`frontend/eslint.config.mjs` (flat config, ESM):
```js
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

export default [
  { ignores: [".next/**", "**/coverage/**", "node_modules/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: { import: importPlugin },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-undef": "off",
      "react/no-danger": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [
            { pattern: "react", group: "external", position: "before" },
            { pattern: "next", group: "external", position: "before" },
            { pattern: "next/**", group: "external", position: "before" },
            { pattern: "@/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
];
```
`frontend/package.json`: agrega a `devDependencies`: `"eslint": "^9.39.5"`,
`"eslint-config-next": "^16.3.1"`, `"eslint-plugin-import": "^2.32.0"`,
`"eslint-import-resolver-typescript": "^4.4.5"`; a `scripts`: `"lint": "eslint ."`.

`eslint-plugin-import` y `eslint-import-resolver-typescript` se declaran explícitamente (no quedan
como dependencias transitivas de `eslint-config-next`, aunque este las trae para su propio uso
interno) porque `import/order` y su resolver los referencian por nombre en `plugins` y
`settings["import/resolver"]`, y pnpm no garantiza acceso a dependencias no declaradas
directamente (phantom dependency) bajo su modo estricto. La versión de `eslint-plugin-import` es
idéntica a la que ya trae `eslint-config-next` (`^2.32.0`), así que no hay dos instancias
divergentes del mismo plugin compitiendo por la misma regla.

> **Por qué ESLint 9.x y no 10.x:** mismo motivo que en Block 2 — `eslint-config-next@16.3.1`
> depende internamente de `eslint-plugin-import@2.32.0`, que no soporta ESLint 10 como peer. Bajar
> `eslint` a `9.39.5` en este paquete no es una decisión aislada de Block 3: es la mitad de la
> misma corrección que Block 2, para que ambos paquetes queden en la misma línea mayor de ESLint.

**Input validation**
N/A.

**Error handling**
- Misma verificación de build nuevo en `pnpm install` que en Block 2 (mitigación de R-01).

**Required tests**
- [ ] Un archivo `.tsx` con una variable tipada `any` hace fallar `pnpm lint` — valida AC-03
- [ ] Un archivo con imports desordenados, incluyendo un import con alias `@/...` mezclado fuera de
      orden, hace fallar `pnpm lint` y el alias se clasifica como grupo local/internal (usar un
      archivo real de `frontend/src`, p. ej. una copia modificada de `frontend/src/app/page.tsx`,
      no un caso sintético) — valida AC-04
- [ ] Un componente con `dangerouslySetInnerHTML` hace fallar `pnpm lint` — valida AC-05
- [ ] `pnpm lint` en `frontend/` analiza únicamente `frontend/src/**` (no `.next/`, no `coverage/`)
      y devuelve exit code ≠ 0 si hay al menos un error — valida AC-06 (mitad frontend)
- [ ] Un componente con un hook de React llamado condicionalmente hace fallar `pnpm lint` — valida
      AC-07
- [ ] `pnpm lint` en `frontend/` completa sin fallar aunque `backend/node_modules` no exista —
      valida AC-08 (mitad frontend)
- [ ] Falla el bloque (se detiene y se reporta) si `pnpm install` en `frontend/` pide aprobar un
      build nuevo para `eslint`, `eslint-config-next`, `eslint-plugin-import` o
      `eslint-import-resolver-typescript` —
      valida el manejo de error documentado arriba

**Completion criterion**
`pnpm lint` corre en `frontend/` y reporta correctamente errores para los 5 casos de prueba
anteriores; los 7 tests de este bloque pasan.

## Final verification
- `pnpm lint` y `pnpm format` corren sin errores de configuración (más allá de los hallazgos reales
  de lint) en `backend/` y en `frontend/`, cada uno con su propio `node_modules` — sin instalar el
  del otro paquete (NFR-01).
- Ningún archivo dentro de `backend/src/` ni `frontend/src/` quedó modificado más allá de lo que el
  propio `pnpm format`/`pnpm lint --fix` haría — este ticket no migra código existente (Out of
  Scope del PRD).
- Los 8 AC del PRD (AC-01 a AC-08) están cubiertos por al menos un test de los 3 bloques.
- El threat model (`docs/ddw/security/threat-FEAT-004.md`) queda validado contra este spec antes de
  pasar a CODE.
