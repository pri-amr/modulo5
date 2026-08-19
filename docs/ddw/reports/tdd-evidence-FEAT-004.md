# Evidencia TDD — FEAT-004

Registro por bloque de qué test falló, con qué aserción, antes de la implementación, y su corrida
en verde después. Ver `AGENTS.md` ("What NOT to do", último ítem) — este archivo existe para no
repetir la pérdida de evidencia de FEAT-001.

## Block 1 — Prettier compartido + scripts `format`

Evidencia capturada en la ronda 2 del bloque (la ronda 1 quedó BLOCKED por diseño de tests inseguro,
ver `docs/adr/` / historial del bloque; los 5 tests en sí no cambiaron de intención, solo el
mecanismo de invocación de Prettier).

Estado "antes": sin `.prettierrc.json`/`.prettierignore`, y con `backend/package.json` /
`frontend/package.json` revertidos a la versión previa a este bloque (sin `prettier` en
devDependencies ni script `format`).

### Backend — `npx jest src/__tests__/tooling/format.test.ts`

```
Tests: 4 failed, 4 total
```

- **AC-01** (`reescribe un archivo de prueba con indentación de 2 espacios a 4`):
  `expect(result.status).toBe(0)` → Expected: `0`, Received: `1`
- **AC-02** (`no agrega coma final al último elemento...`):
  `expect(result.status).toBe(0)` → Expected: `0`, Received: `1`
- **Sintaxis inválida** (`sale con código distinto de cero y no reescribe...`):
  `expect(result.stderr.toLowerCase()).toContain("invalid-syntax.ts")` → recibido:
  `"...cannot find module '...node_modules\prettier\bin\prettier.cjs'..."` (prettier no resoluble
  sin la devDependency instalada)
- **NFR-02** (`correr prettier en backend/ no modifica un fixture de frontend/ ni viceversa`):
  `expect(backendResult.status).toBe(0)` → Expected: `0`, Received: `1`

### Frontend — `npx jest src/__tests__/tooling/format.test.ts`

```
Tests: 1 failed, 1 total
```

- **AC-01**: `expect(result.status).toBe(0)` → Expected: `0`, Received: `1`

### Después de implementar (`.prettierrc.json`, `.prettierignore`, devDependency + script `format`
en ambos `package.json`)

```
backend:  Test Suites: 1 passed, 1 total  |  Tests: 4 passed, 4 total
frontend: Test Suites: 1 passed, 1 total  |  Tests: 1 passed, 1 total
```

Suite completa de cada paquete, sin regresiones:

```
backend:  14 suites / 58 tests passed
frontend: 13 suites / 49 tests passed
```

Verificado independientemente por `ddw-module-verifier` (ronda 2): corrió ambas suites él mismo —
backend 4/4 (14.5s), frontend 1/1 (9.8s) — y confirmó `git status --porcelain` idéntico antes y
después de la corrida (sin residuos fuera de `__fixtures__/`).
