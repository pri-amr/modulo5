# Evidencia TDD — FEAT-006

Registro de qué test se vio fallar, y con qué aserción exacta, antes de cada fix — por bloque, para
no repetir el riesgo de proceso documentado en `AGENTS.md` (los 7 reportes de bloque de FEAT-001 que
nunca se guardaron en disco).

## Block 1 — AuthLayout (layout compartido de pantallas de autenticación)

Para reconstruir la evidencia "antes" en una ronda correctiva posterior al cierre del bloque, se
renombró temporalmente `frontend/src/components/AuthLayout.tsx` a `AuthLayout.tsx.bak` (volviendo al
estado "no implementado") y se corrió `npx jest AuthLayout.test.tsx register.page.test.tsx` desde
`frontend/`. Con el archivo ausente, ambas suites de test fallan en la etapa de compilación
("Test suite failed to run"): no llegan a ejecutarse test por test, así que los 6 tests de
`AuthLayout.test.tsx` comparten un único mensaje de fallo (el de todo el archivo), y lo mismo ocurre
con el test de `register.page.test.tsx` que depende de `AuthLayout`.

El mensaje real que imprime Jest es `Cannot find module '../../components/AuthLayout'` — no
`'../../components/AuthLayout'` como ruta literal del import (el import real, línea 6 de
`AuthLayout.test.tsx` y línea de `page.tsx`, usa el alias `@/components/AuthLayout`), sino la ruta
relativa a la que `next/jest` resuelve ese alias internamente antes de intentar cargarlo; Jest
reporta el error con esa ruta ya resuelta, no con el alias literal.

| Test | Falló antes con | Pasa después |
|---|---|---|
| `test-block1-authlayout-empty-children-no-error` | Suite completa sin compilar: `Cannot find module '../../components/AuthLayout' from 'src/__tests__/components/AuthLayout.test.tsx'` | ✅ |
| `test-block1-card-width-desktop` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-icon-panel-visible-desktop` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-icon-panel-hidden-mobile` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-form-panel-centered-mobile` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-icon-inline-svg-no-library` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-register-page-uses-authlayout` | Suite completa sin compilar: `Cannot find module '../../components/AuthLayout' from 'src/app/register/page.tsx'` (dependencia transitiva vía `Require stack: src/app/register/page.tsx → src/__tests__/app/register.page.test.tsx`) | ✅ |

Tras restaurar `AuthLayout.tsx` a su nombre original:

- Suite del bloque (`AuthLayout.test.tsx` + `register.page.test.tsx`): **9/9** (los 7 tests del
  bloque más los 2 tests de `register.page.test.tsx` que no dependen de `AuthLayout` directamente:
  tokens semánticos del `<main>` y presencia de los 4 labels del formulario).
- Suite completa del frontend: **68/68 tests, 17/17 suites**.

No quedó código ni test modificado por este procedimiento: el archivo se renombró y se restauró a su
estado original antes de cerrar la evidencia.
