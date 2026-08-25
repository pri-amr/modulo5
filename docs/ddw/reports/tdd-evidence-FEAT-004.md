# Evidencia TDD — FEAT-004

Registro por bloque de qué test falló, con qué aserción, antes de la implementación, y su corrida
en verde después. Ver `AGENTS.md` ("What NOT to do", último ítem) — este archivo existe para no
repetir la pérdida de evidencia de FEAT-001.

## Decisión — 2026-08-22: se retiran los tests automatizados de tooling

Los tests que invocaban Prettier/ESLint como subproceso contra fixtures
(`backend/src/__tests__/tooling/{format,lint}.test.ts`,
`frontend/src/__tests__/tooling/format.test.ts`) se eliminaron por decisión del usuario:
`.prettierrc.json`, `.prettierignore` y `eslint.config.mjs` son archivos de configuración del repo,
no código de la aplicación, y no ameritan una suite de regresión automatizada — más aún habiendo
costado 3 rondas de corrección por flakiness (contención de subprocesos en Windows, ver Block 2 más
abajo) para una garantía de bajo valor frente a config que cambia con poca frecuencia y de forma
visible en el diff.

De acá en más, los AC de este ticket se verifican **manualmente una vez**, con la evidencia
(comandos + output) pegada en este archivo por bloque, en vez de con tests que corren en cada
`npx jest`. La evidencia "antes/después" (red/green) de los bloques ya cerrados con el mecanismo
viejo se conserva abajo tal cual se capturó, como registro histórico; se agrega debajo de cada una
la verificación manual post-decisión.

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

### Verificación manual post-decisión (2026-08-22, tras retirar `format.test.ts`)

Corrido en `backend/`, con un archivo temporal fuera de git (`.manual-verify-tmp/`, borrado al
terminar) para que Prettier resolviera `.prettierrc.json` por búsqueda ascendente real, igual que
haría sobre cualquier archivo de `backend/src/`.

- **AC-01**: `printf 'const value = {\n  a: 1,\n  b: 2\n};\n'` → `pnpm exec prettier --write` →
  resultado con indentación de 4 espacios (`    a: 1`, `    b: 2`). Confirmado.
- **AC-02**: `printf 'const list = [...]\n\nconst obj = {\n  a: 1,\n  b: 2\n};\n'` →
  `pnpm exec prettier --write` → el objeto multilínea queda sin coma final (`b: 2` sin `,` antes de
  `}`). Confirmado.
- **Sintaxis inválida**: `printf 'const broken = {\n  a: 1,\n'` → `pnpm exec prettier --write` →
  exit code `2`, error de parseo (`SyntaxError: '}' expected`) reportado a stderr, archivo
  original sin modificar. Confirmado.
- **NFR-02**: verificado por inspección — el script `format` de cada `package.json`
  (`"format": "prettier --write ."`) corre siempre con `cwd` = la carpeta del propio paquete, y
  `.prettierrc.json`/`.prettierignore` son archivos únicos en la raíz sin ninguna ruta que cruce
  hacia el otro paquete; ya se había corrido explícitamente en la ronda 2 original (arriba) y no
  hay cambios posteriores a `.prettierrc.json`/`.prettierignore` que pudieran alterar ese
  comportamiento.

## Block 2 — ESLint backend

Evidencia reconstruida en la ronda 2 de corrección del bloque (la ronda 1 lo dejó COMPLETE pero no
había persistido esta evidencia en disco). Reconstrucción: se retiró temporalmente
`backend/eslint.config.mjs` (moviéndolo a `eslint.config.mjs.disabled` y restaurándolo al
finalizar), dejando intactas las devDependencies de ESLint y el script `"lint": "eslint ."` ya
presentes en `backend/package.json`, y se corrió la suite completa de
`src/__tests__/tooling/lint.test.ts`. Esto reproduce fielmente el estado "antes" para los 4 tests
que dependen del archivo de configuración; el 5º test no depende de `eslint.config.mjs` (solo
verifica las devDependencies del `package.json` y que `pnpm install` no pida aprobar builds nuevos)
y por eso ya estaba en verde incluso sin el config, como se documenta abajo.

### Antes (`npx jest src/__tests__/tooling/lint.test.ts --verbose`, sin `eslint.config.mjs`)

```
Test Suites: 1 failed, 1 total
Tests:       4 failed, 1 passed, 5 total
```

- **AC-03** (`una variable tipada `any` hace fallar pnpm lint`):
  `expect(output).toContain(fixtureName)` → Expected substring: `"has-any.ts"` — recibido en su
  lugar la salida de pnpm: `"[ELIFECYCLE] Command failed with exit code 2. ... ESLint couldn't find
  an eslint.config.(js|mjs|cjs) file. From ESLint v9.0.0, the default configuration file is now
  eslint.config.js. ..."`
- **AC-04** (`imports fuera de orden alfabético ... hacen fallar pnpm lint`):
  `expect(output).toContain(fixtureName)` → Expected substring: `"bad-import-order.ts"` — mismo
  mensaje de pnpm/ESLint que en AC-03 (`ESLint couldn't find an eslint.config.(js|mjs|cjs) file`).
- **AC-06** (`pnpm lint analiza únicamente backend/src/** y no dist/ ni coverage/`):
  `expect(distResult.status).toBe(0)` → Expected: `0`, Received: `2` (ESLint aborta con código 2
  al no encontrar `eslint.config.mjs`, en vez de ignorar `dist/` como se espera cuando el config sí
  existe).
- **AC-08** (`pnpm lint en backend/ completa sin fallar aunque frontend/node_modules no exista`):
  excepción no capturada en `fs.copyFileSync`: `ENOENT: no such file or directory, copyfile
  'C:\Proyectos\cursos\modulo5\backend\eslint.config.mjs' -> '...\eslint.config.mjs'` (el test
  copia el archivo de config al directorio temporal aislado; si no existe, ni siquiera puede armar
  el fixture).
- **Test de `pnpm install` / devDependencies** (`pnpm install agrega eslint, @eslint/js,
  typescript-eslint y eslint-plugin-import sin pedir aprobar un build nuevo`): **PASSED** incluso
  sin `eslint.config.mjs` — confirma que este test es independiente del archivo de configuración,
  tal como se documentó arriba.

### Después (con `eslint.config.mjs` restaurado)

```
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        68.801 s
```

Adicionalmente, tras corregir el test AC-06 para usar el binario local de ESLint
(`node node_modules/eslint/bin/eslint.js ...`) en vez de `pnpm exec eslint` — porque esta última
forma resultó flaky en Windows por contención al invocarla varias veces dentro del mismo test
(2 de 4 corridas aisladas fallaron con el mismo error "couldn't find an eslint.config file" pese a
que el archivo sí existía) — se corrió el test aislado (`npx jest lint.test.ts -t "AC-06"`) 5 veces
seguidas, con 5/5 verdes:

```
RUN 1: Tests: 4 skipped, 1 passed, 5 total
RUN 2: Tests: 4 skipped, 1 passed, 5 total
RUN 3: Tests: 4 skipped, 1 passed, 5 total
RUN 4: Tests: 4 skipped, 1 passed, 5 total
RUN 5: Tests: 4 skipped, 1 passed, 5 total
```

### Ronda de corrección final — no determinismo dentro de la suite completa de backend

Las corridas aisladas (arriba) ocultaban un problema real: corriendo la suite completa de backend
(`npx jest`, sin `-t`), AC-03, AC-04 y AC-06 fallaban de forma intermitente. Dos causas raíz:

**Causa raíz 1 (la principal).** AC-03 y AC-04 invocaban `pnpm lint`, equivalente a `eslint .`
sobre **todo** `backend/src/**`, no sobre un path acotado. La aserción `output.toContain(fixtureName)`
dependía entonces de que el resto del árbol estuviera libre de errores de lint — y no lo está: hay
deuda preexistente y ajena a este bloque (`import/order` en varios archivos de
`src/__tests__/integration/`, `src/application/services/CreateTransactionService.ts`,
`src/infrastructure/database/seed.ts`; `@typescript-eslint/no-unused-vars` en
`transaction.routes.test.ts` y `CreateTransactionService.test.ts`), confirmada corriendo
`node node_modules/eslint/bin/eslint.js .` de forma independiente. Cuando ese ruido entraba en el
output, la aserción sobre el fixture podía dejar de cumplirse según el orden/formato en que ESLint
listara los errores.

Fix: AC-03 y AC-04 ahora invocan el binario local de ESLint (`runEslintDirect`, el mismo mecanismo
que ya usaba AC-06) acotado explícitamente al path relativo del propio archivo fixture
(`src/__tests__/tooling/__fixtures-lint__/has-any.ts` y `.../bad-import-order.ts`), no `pnpm lint`
de alcance completo. La intención del AC (que la regla de ESLint rechace `any` / imports
desordenados) se sigue verificando igual, sin depender de que el resto del repo esté libre de deuda
de lint no relacionada con este bloque. Esa deuda preexistente **no se tocó** — sigue fuera del
alcance de este bloque.

**Causa raíz 2 (residual, ~4% de las corridas).** En AC-06, la sub-verificación sobre
`dist/should-be-ignored.ts` falló 1 de 26 corridas con `expect(distResult.status).toBe(0)`
recibiendo un valor distinto de 0 — sospecha de una condición de carrera de filesystem en Windows
entre escribir el fixture y que el subproceso de ESLint lo resuelva contra el ignore pattern.

Fix: se agregó un helper `ensureFixtureWritten` que, después de cada `fs.writeFileSync` de un
fixture usado por AC-03/AC-04/AC-06, hace una lectura síncrona inmediata (`fs.readFileSync`) y
compara el contenido leído contra el escrito, lanzando si no coincide. Esto fuerza a que el
descriptor esté flush a disco antes de lanzar ESLint como proceso separado, en vez de asumirlo.

**Verificación**: se corrió la suite completa de backend (`npx jest`, sin filtros) 8 veces seguidas
(el criterio pedía 5; se corrieron 8 dado que la causa raíz 2 era de baja frecuencia), todas verdes:

```
RUN 1: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (88.3s)
RUN 2: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (88.7s)
RUN 3: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (89.8s)
RUN 4: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (88.8s)
RUN 5: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (88.5s)
RUN 6: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (92.5s)
RUN 7: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (90.1s)
RUN 8: Test Suites: 15 passed, 15 total | Tests: 63 passed, 63 total (97.7s)
```

`pnpm exec prettier --check eslint.config.mjs` verificado en verde tras el cambio (no afectado por
esta ronda, ya que solo se tocó `lint.test.ts`).

### Verificación manual post-decisión (2026-08-22, tras retirar `lint.test.ts`)

`lint.test.ts` nunca se había commiteado (quedó como archivo nuevo sin trackear desde la ronda de
corrección anterior); se borra directamente, sin necesidad de `git rm`. Todo lo corrido abajo usa
el binario local de ESLint (`node node_modules/eslint/bin/eslint.js ...`) desde `backend/`, contra
`eslint.config.mjs` ya commiteado.

- **AC-03**: fixture `export const value: any = 1;` → `eslint <fixture>` → exit `1`,
  `error Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any`. Confirmado.
- **AC-04**: fixture con `import path` antes que `import fs` (mismo grupo `builtin`, fuera de orden
  alfabético) → exit `1`, `` `fs` import should occur before import of `path`  import/order ``.
  Confirmado.
- **AC-06 (mitad backend)**:
  - `dist/should-be-ignored.ts` con el mismo `any` → exit `0`, warning "File ignored because of a
    matching ignore pattern". `dist/` se ignora, tal como declara `eslint.config.mjs`.
  - `src/coverage/lcov-report/block-navigation.js` (JS legacy generado, ya presente en el repo) →
    exit `0`, mismo warning de ignore pattern. `coverage/` se ignora.
  - El mismo fixture con `any`, corrido contra un path real bajo `src/` → exit `1`, mismo error que
    AC-03. Confirma que el scoping ignora `dist/`/`coverage/` pero sí analiza `src/`.
- **AC-08 (mitad backend)**: verificado por inspección — `backend/eslint.config.mjs` no referencia
  ninguna ruta de `frontend/`, y el script `"lint": "eslint ."` corre siempre con `cwd = backend/`,
  por lo que la resolución de módulos de Node nunca sube a buscar `frontend/node_modules`. No se
  reprodujo el escenario borrando `frontend/node_modules` real porque hacerlo forzaría una
  reinstalación completa del paquete frontend sin necesidad — el mecanismo (resolución de módulos
  acotada a `cwd`) es el mismo que ya validó la ronda de corrección anterior (arriba) para el
  análogo de `dist`/`coverage`.
- **Manejo de error de `pnpm install`**: `pnpm install` en `backend/` → `Already up to date`, sin
  ninguna línea `Ignored build scripts`. Confirma que `eslint`, `@eslint/js`, `typescript-eslint` y
  `eslint-plugin-import` no piden aprobar builds nuevos.

Suite completa de Jest corrida después de borrar `lint.test.ts` y `format.test.ts` (backend y
frontend), sin regresiones:

```
backend:  13 suites / 54 tests passed (63.9s)
frontend: 12 suites / 48 tests passed (36.2s)
```
