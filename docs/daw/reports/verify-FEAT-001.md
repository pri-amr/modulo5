# Verificación — FEAT-001: Registrar ingreso o egreso de dinero

## Ronda 1 — 2026-08-04

**Insumos:**
- PRD: `docs/daw/prd/prd-FEAT-001.md`
- Spec: `docs/daw/specs/spec-FEAT-001.md`
- Threat model: `docs/daw/security/threat-FEAT-001.md`
- SAST: `docs/daw/security/sast-FEAT-001.md`
- Agente: `daw-module-verifier` (cross-verificación, no escribió el código)

### Trazabilidad PRD → Código → Tests (F-VER-01)

Los 12 AC (AC-01 a AC-12) tienen código que los implementa y tests que verifican comportamiento
real (mutación de balance, valores conservados en el formulario, clases DOM), no solo status code.

| AC | Código | Tests |
|----|--------|-------|
| AC-01 (egreso válido) | `CreateTransactionService.execute` (`backend/src/application/services/CreateTransactionService.ts:22`) | `CreateTransactionService.test.ts`, `transaction.routes.test.ts`, `TransactionForm.test.tsx` |
| AC-02 (ingreso válido) | ídem, delta positivo | tests simétricos en las 3 capas |
| AC-03 (no afecta otra moneda) | ídem | assert explícito de que la otra moneda no cambia |
| AC-04 (rechaza sin amount) | `CreateTransactionRequestSchema` (Zod) | unit + form |
| AC-05 (rechaza amount ≤ 0) | `amount.gt(0)` | unit (2 casos) + form |
| AC-06 (campos requeridos) | schema `.strict()` | it.each 5 casos (unit) + 5 (form) |
| AC-07 (moneySource ajeno → 403) | verificación de pertenencia (`CreateTransactionService.ts:30-38`) | unit x2, integración, form |
| AC-08 (conserva valores en error) | `errorHandler.ts` + `useCreateTransaction` | tests de 403/500 con `toHaveValue` |
| AC-09 (formato de fecha) | regex `DD-MM-YYYY` + `isRealDate` (Zod y Yup en espejo) | formato inválido, fecha inexistente, mes fuera de rango |
| AC-10 (loading state) | `Loader` controlado por `loading` | assert `role="status"` aparece/desaparece |
| AC-11 (tema dark por defecto) | `useThemeStore` default `'dark'` | test dedicado + `layout.test.tsx` + test SSR |
| AC-12 (toggle de tema persistido) | `toggleTheme()` | alternancia + persistencia en localStorage |

### Tareas del spec (F-VER-02, F-VER-06)

Los 7 bloques del spec están completos, con todos los tests que el spec prometió presentes y en
verde (varios bloques con tests adicionales a los mínimos comprometidos).

### Hallazgos — 3 FAIL, 2 WARNING

1. **❌ Evidencia TDD ausente.** Ningún artefacto del repo (mensajes de commit de los 7 bloques,
   `.daw-state.json`, `.daw-journal.jsonl`) registra qué tests se escribieron por bloque ni cuáles
   fallaban antes de implementar el código correspondiente. `testing.instructions.md` Regla #-1
   exige que el implementador registre esa falla; sin esa evidencia no se puede confirmar que los
   tests se escribieron antes que el código (FAIL, no warning, por protocolo del verificador).

2. **❌ F-VER-03 — cobertura de branches del backend: 70.76% (< 80%).** Concentrada en:
   - `TransactionRepository.ts`: `findById`/`deleteById` sin ejercitar contra Mongo real —
     `findById` además no tiene ningún llamador en código de producción (0% branch).
   - `MoneySourceRepository.ts` (60%), `CategoryRepository.ts` (50%), `resolveSeedUser.ts` (50%),
     `index.ts` (75%), `connection.ts` (50%).
   - Statements 88.69%, Lines 88.01% y Functions 80% sí cumplen el umbral.
   - Frontend cumple los 4 umbrales (Statements 98.63%, Branches 81.96%, Functions 100%, Lines
     99.2%).

3. **❌ F-VER-05 — `tsc --noEmit` falla en frontend** con `TS5101` (`baseUrl` deprecado) en
   `frontend/tsconfig.json:25`, exit code 1. `backend/tsconfig.json` ya tiene
   `"ignoreDeprecations": "6.0"` para neutralizar el mismo warning; no se replicó en frontend.

4. **⚠️ Lint no configurado** en `backend/` ni `frontend/` (sin `.eslintrc`/`eslint.config.*`, sin
   script `lint`), pese a que `AGENTS.md` fija ESLint + Prettier como linter/formatter del stack. No
   es F-VER-05 en sí (la regla aplica "si hay linter configurado"), pero es una brecha respecto a
   las convenciones declaradas.

5. **⚠️ W-VER-01 — código semi-muerto.** `ITransactionRepository.findById` /
   `TransactionRepository.findById` están declarados (Block 3 del spec) pero ningún código de
   producción los invoca; 0% de cobertura real contra Mongo. No viola el spec (el método está en la
   interfaz a propósito, para un futuro GET), pero hoy es superficie sin uso ni test.

### Tests y calidad — resto

- Backend: 40/40 tests en verde. Frontend: 21/21 tests en verde.
- Sad paths (F-VER-04): ✅ cubiertos en los 3 niveles (Zod unit, integración, formulario) más
  `sanitizeInput` con input malicioso.
- Sin tests frágiles (W-VER-03): ✅ nada depende de orden de ejecución, timestamps ni IDs no
  deterministas fuera de lo intencional (seed con `_id` fijos).

### Veredicto: **BLOCKED**

FAILs: 3 | WARNs: 2 | PASSes: 24

### Corrective loop

Se vuelve a la fase CODE para:
1. Agregar tests de `TransactionRepository` / `MoneySourceRepository` / `CategoryRepository` /
   `resolveSeedUser` contra Mongo real que suban branches ≥ 80% (o eliminar `findById` de
   `TransactionRepository` si no tiene consumidor previsto).
2. Agregar `"ignoreDeprecations": "6.0"` a `frontend/tsconfig.json`.
3. Dejar registrada la evidencia TDD (tests y aserciones que fallaban antes de cada bloque) en el
   reporte de cierre de bloque correspondiente, para que quede trazable.

Gates `tests`, `sast` y `verify` se limpian — deben re-ganarse tras el fix.

---

## Ronda 2 — 2026-08-04

**Insumos:** los mismos que la ronda 1, más el commit `4517233` (bloque correctivo de la ronda 1) y
la ronda 2 de `docs/daw/security/sast-FEAT-001.md`. Protocolo completo de FEATURE corrido de cero
(no se asumió nada de la ronda 1 salvo lo ya documentado), incluyendo `npx jest --coverage` en vivo
en ambos paquetes.

### Trazabilidad PRD → Código → Tests (F-VER-01) y tareas del spec (F-VER-02, F-VER-06)

Sin cambios respecto a la ronda 1: los 12 AC y los 7 bloques siguen ✅, ahora reverificados con la
suite creciendo a 53 tests backend (antes 40) tras el bloque correctivo.

### Los 3 FAIL de la ronda 1 — resueltos

1. **✅ F-VER-03 — cobertura de branches del backend.** 70.76% → **93.22%** (agregado). Los 6
   archivos señalados (`TransactionRepository.ts`, `MoneySourceRepository.ts`,
   `CategoryRepository.ts`, `resolveSeedUser.ts`, `index.ts`, `connection.ts`) quedan en
   100/100/100/100. `TransactionRepository.findById` se eliminó (sin caller en producción) en vez
   de testearse artificialmente. Frontend se mantiene en 98.63/81.96/100/99.2.
2. **✅ F-VER-05 — `tsc --noEmit` en frontend.** 0 errores (`"ignoreDeprecations": "6.0"` agregado a
   `frontend/tsconfig.json`, confirmado en el archivo). Backend también en 0 errores.
3. **❌ Evidencia TDD — NO resuelto** (ver detalle abajo).

### Hallazgo — 1 FAIL, 4 WARNING

1. **❌ Evidencia TDD ausente (persiste).** El commit `4517233` no dejó registro de qué assertion
   fallaba antes del fix para ninguno de los 13 tests nuevos. Agravante: los 4 archivos de test de
   integración nuevos (`TransactionRepository`, `MoneySourceRepository`, `CategoryRepository`,
   `resolveSeedUser`) ejercitan código de producción que **ya existía sin cambios** desde el Block 4
   — son tests retroactivos sobre comportamiento ya funcionando, no tests que dirigieron el diseño
   de código nuevo. Ni los 7 bloques originales ni el corrective loop de ronda 1 dejaron ese
   registro en ningún artefacto del repo (commits, `.daw-state.json`, `.daw-journal.jsonl`). Por
   protocolo del verificador: FAIL, no warning.

2. **⚠️ Lint no configurado** (persiste de la ronda 1, sin cambios).

3. **⚠️ W-VER-01 — inconsistencia menor de cobertura justificada.** `backend/src/index.ts` recibe
   `/* istanbul ignore next */` justificado sobre el guard `require.main === module`, pero el guard
   idéntico en `backend/src/infrastructure/database/seed.ts:56-60` (`runSeedAsScript`) no recibió el
   mismo tratamiento y queda sin cubrir (0% de esa rama). No es código muerto — es el entry point
   real de `pnpm seed` — pero es la misma situación resuelta en un archivo y no en el otro. No
   bloquea (el agregado del paquete sigue ≥80%).

4. **⚠️ W-VER-01/W-VER-02 — ramas defensivas sin ejercitar en lógica de negocio central.**
   `TransactionController.ts` branch 50% (línea 24, guard `if (!req.userId)`, no alcanzable
   mientras `resolveSeedUser` sea el único middleware previo) y
   `frontend/src/hooks/useCreateTransaction.ts` branch 72.41% (rama `!value` de `isRealDate`, no
   ejercitada porque Yup ya garantiza string). Ninguno baja el agregado del paquete de 80%, pero
   ambos son lógica de negocio central — quedan documentados para no perderlos de vista.

### Tests y calidad — resto

- Backend: 53/53 tests en verde (cobertura en vivo: 96.87/93.22/93.1/96.68). Frontend: 21/21 tests
  en verde (98.63/81.96/100/99.2).
- Sad paths (F-VER-04): ✅ sin cambios respecto a ronda 1.
- Sin tests frágiles (W-VER-03): ✅.

### Veredicto: **BLOCKED**

FAILs: 1 | WARNs: 4 | PASSes: 28

### Corrective loop propuesto por el verificador

El único punto abierto es documental, no de código: reconstruir o declarar honestamente la
evidencia TDD faltante de los 7 bloques originales y del corrective loop de ronda 1. Dado que esto
es un juicio de alcance/proceso (¿se reconstruye lo reconstruible, se acepta como deuda de proceso,
o se relaja la regla para este ticket?), se eleva al usuario antes de tocar código o gates.
