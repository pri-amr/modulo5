# Evidencia TDD — FEAT-007

Registro de qué test se vio fallar, y con qué aserción exacta, antes de cada fix — por bloque, según
lo documentado en `AGENTS.md` (no repetir el riesgo de proceso de FEAT-001).

## Block 1 — AuthLayout: split interno 50/50 y radio de borde

Se agregaron primero los 2 tests nuevos (`test-block1-panels-split-50-50` y
`test-block1-card-radius-1rem`) a `AuthLayout.test.tsx`, sin tocar los 6 tests existentes (incluido
`test-block1-card-width-desktop`, que sigue verificando `sm:w-[40%]` en la tarjeta y no se modificó).
Se corrió `npx jest AuthLayout.test.tsx` desde `frontend/` contra la implementación sin tocar:
**2 de 8 tests fallaron**, los 6 preexistentes pasaron sin cambios.

| Test | Falló antes con | Pasa después |
|---|---|---|
| `test-block1-panels-split-50-50` | `expect(element).toHaveClass("sm:w-1/2")` — recibido en `auth-layout-icon-panel`: `"hidden w-2/5 items-center justify-center bg-accent/10 p-6 sm:flex"` (sin `sm:w-1/2`) | ✅ |
| `test-block1-card-radius-1rem` | `expect(element).toHaveClass("rounded-[1rem]")` — recibido en `auth-layout-card`: `"flex w-full max-w-4xl overflow-hidden rounded-field border border-line bg-surface sm:w-[40%]"` (con `rounded-field`, no `rounded-[1rem]`) | ✅ |
| `test-block1-authlayout-empty-children-no-error` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-card-width-desktop` | Ya pasaba antes (test preexistente, sin cambios) — regresión que confirma que `sm:w-[40%]` no se tocó | ✅ |
| `test-block1-icon-panel-visible-desktop` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-icon-panel-hidden-mobile` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-form-panel-centered-mobile` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-icon-inline-svg-no-library` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |

Implementación en `AuthLayout.tsx`:

- `auth-layout-icon-panel`: `hidden w-2/5 items-center justify-center bg-accent/10 p-6 sm:flex` →
  `hidden items-center justify-center bg-accent/10 p-6 sm:flex sm:w-1/2` (se eliminó el `w-2/5` base,
  el panel solo tiene ancho relevante en `sm:` y en adelante porque está `hidden` por debajo).
- `auth-layout-content-panel`: se agregó `sm:w-1/2` junto al `w-full` ya existente.
- `auth-layout-card`: `rounded-field` → `rounded-[1rem]`. `sm:w-[40%]` no se tocó.

Tras implementar:

- Suite del bloque (`AuthLayout.test.tsx`): **8/8 tests, 1/1 suite**.
- Suite completa de `frontend`: **80/80 tests, 18/18 suites**.
- `tsc --noEmit` y `eslint` sobre `AuthLayout.tsx` y `AuthLayout.test.tsx`: sin errores.
- `git diff --stat`: solo dos archivos tocados —
  `frontend/src/components/AuthLayout.tsx` y `frontend/src/__tests__/components/AuthLayout.test.tsx`
  — sin cambios en `RegisterForm.tsx`, `Loader.tsx` ni ningún otro archivo del repo.

No quedó ningún test preexistente modificado por este bloque: los 6 tests originales de
`AuthLayout.test.tsx` conservan exactamente su código, solo se insertaron los 2 nuevos entre ellos.
