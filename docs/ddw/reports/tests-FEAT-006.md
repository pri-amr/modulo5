# Test run FEAT-006

| Field | Value |
|---|---|
| Runner | Jest 30 (next/jest) |
| Command | `npx jest --coverage` (desde `frontend/`) |
| Total | 78 |
| Passed | 78 |
| Failed | 0 |
| Skipped | 0 |
| Line coverage | 99.53% |
| Branch coverage | 83.33% |
| Function coverage | 100% |
| Coverage floor | 80% (AGENTS.md, "Testing" — piso del proyecto) |
| Lint | `npx eslint .` (frontend) — clean, 0 findings |

## Failures
(none)

## Skips
(none)

## Notas

- Suite completa de `frontend`: 18/18 suites, 78/78 tests (68 antes de este ticket + 10 nuevos del
  Bloque 2; el Bloque 1 agregó 7 tests que reemplazan/extienden los 2 preexistentes de
  `register.page.test.tsx`, netos +7).
- `AuthLayout.tsx`, `FormField.tsx` y `RegisterForm.tsx` (los 3 archivos con lógica nueva o
  modificada de este ticket): **100% stmts/branch/func/lines**.
- Las ramas sin cubrir del reporte (`useCreateTransaction.ts:23`, `useHydrateThemeStore.ts:15`,
  `useRegisterUser.ts:84,123`, `sanitizeInput.ts:9`) son todas preexistentes a FEAT-006 (ramas
  defensivas ya documentadas como aceptadas en `tdd-evidence-FEAT-005.md`), no introducidas por este
  ticket.
- No hay backend involucrado en este ticket (100% frontend); no se corrió la suite de `backend`
  porque no se tocó ningún archivo de ese paquete.
