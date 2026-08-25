# ADR-002: No redeclarar `plugins.import` en `frontend/eslint.config.mjs`

| Field | Value |
|-------|-------|
| Date | 2026-08-24 |
| Ticket | FEAT-004 |
| Status | Accepted |

## Context
El spec de FEAT-004 (Block 3) especificaba registrar `eslint-plugin-import` explícitamente en
`frontend/eslint.config.mjs` con `plugins: { import: importPlugin }`, igual que en
`backend/eslint.config.mjs` (Block 2). Al implementarlo tal cual, `pnpm lint` abortaba antes de
analizar un solo archivo con `ConfigError: Cannot redefine plugin "import"`: `eslint-config-next/
core-web-vitals` ya registra internamente el plugin `"import"` con su propia instancia física de
`eslint-plugin-import@2.32.0`, y pnpm termina con dos instancias físicas distintas del mismo
paquete y versión (por peer-deps distintos hacia `eslint-import-resolver-typescript` — `3.10.1`
interno de `eslint-config-next` vs. `^4.4.5` que pide el spec como dependencia directa). ESLint 9
compara plugins por referencia de objeto, no por versión declarada, y aborta.

## Options considered

### Option 1: No redeclarar el plugin (usar la instancia que ya registra `eslint-config-next`)
- **Pros:** `import/order` y el resolver de TypeScript referencian la regla/el resolver por
  nombre, no por el objeto plugin — siguen funcionando igual sin el registro propio. No introduce
  acoplamiento a versiones internas no documentadas de `eslint-config-next`.
- **Cons:** el código final difiere del literal del spec; requiere dejar constancia de por qué.

### Option 2: Fijar `eslint-import-resolver-typescript` a la misma versión interna que usa
`eslint-config-next` (`3.10.1`) para deduplicar la instancia
- **Pros:** permitiría mantener `plugins: { import: importPlugin }` tal como lo escribe el spec.
- **Cons:** exige desviarse de otro requisito explícito del spec (la versión `^4.4.5` del
  resolver) y crea un acoplamiento implícito a una elección interna de `eslint-config-next` que no
  está documentada ni versionada como contrato público — se rompería de nuevo en cualquier
  actualización futura de ese paquete.

## Decision
Se optó por la Opción 1: se removió `plugins: { import: importPlugin }` (y su import) del bloque
de config propio en `frontend/eslint.config.mjs`, dejando que `eslint-config-next/core-web-vitals`
registre el plugin `"import"`. `backend/eslint.config.mjs` no se ve afectado — no depende de
`eslint-config-next`, así que el spec de Block 2 sigue siendo correcto tal cual está.

Verificado de forma independiente por `ddw-module-verifier`: reprodujo el `ConfigError` con el
código literal del spec, confirmó las dos instancias físicas en el store de pnpm, y confirmó que
`import/order` y el resolver de TypeScript siguen funcionando sin el registro duplicado (evidencia
en `docs/ddw/reports/tdd-evidence-FEAT-004.md`, sección Block 3, AC-04).

## Consequences
- `frontend/eslint.config.mjs` no registra `eslint-plugin-import` directamente, aunque la
  dependencia sigue declarada en `package.json` (la usa `eslint-config-next` internamente).
- El bloque de código del spec de Block 3 ya no coincide literalmente con la implementación; este
  ADR es la fuente de verdad de esa diferencia.
- Riesgo aceptado: si una futura versión de `eslint-config-next` deja de registrar el plugin
  `"import"` internamente, `import/order` fallaría en runtime en vez de con un `ConfigError` de
  arranque — cubierto por `pnpm lint` corriendo en cada uso normal (no hay CI en este ticket, ver
  threat model R-02).
