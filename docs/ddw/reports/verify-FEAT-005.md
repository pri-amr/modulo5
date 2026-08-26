# Verify FEAT-005: Registro de usuario con usuario y contraseña (sin passkeys)

| Field | Value |
|-------|-------|
| Ticket | FEAT-005 |
| PRD | docs/ddw/prd/prd-FEAT-005.md |
| Spec | docs/ddw/specs/spec-FEAT-005.md |
| Tier | FEATURE |
| Date | 2026-08-26 |

## F-VER-01 — Toda AC del PRD tiene un test que pasa

| AC | Cubierta por |
|---|---|
| AC-01 (alta exitosa + redirect) | `RegisterUserService.test.ts:37`, `auth.routes.test.ts:34`, `useRegisterUser.test.ts:30`, `RegisterForm.test.tsx:63` |
| AC-02 (email duplicado) | `RegisterUserService.test.ts:66`, `auth.routes.test.ts:51`, `UserRepository.test.ts:37` |
| AC-03 (email inválido) | `RegisterUserService.test.ts:76`, `auth.routes.test.ts` (caso `invalidEmailResponse`, 400) |
| AC-04 (password < 8) | `RegisterUserService.test.ts:85`, `auth.routes.test.ts` (caso `shortPasswordResponse`, 400) |
| AC-05 (confirmPassword no coincide) | `RegisterUserService.test.ts:94`, `auth.routes.test.ts` (caso `mismatchedPasswordResponse`, 400), `RegisterForm.test.tsx:49` |
| AC-06 (campo obligatorio faltante) | `RegisterUserService.test.ts:103` (`it.each`), `auth.routes.test.ts` (caso sin `name`, 400), `RegisterForm.test.tsx:38` |
| AC-07 (persistencia no exitosa: mantiene los datos ingresados) | `auth.routes.test.ts:83`, `useRegisterUser.test.ts:52`, `RegisterForm.test.tsx:82` |

**Resultado: ✅ PASS** — 7/7 AC con al menos un test pasando, verificando comportamiento real (body,
estado, ausencia de campos sensibles), no solo el status code.

## F-VER-02 — Toda tarea del spec está implementada

3/3 bloques verificados archivo por archivo contra el spec (29 archivos entre creados y modificados
en total): Block 1 (8 archivos), Block 2 (11 archivos), Block 3 (10 archivos). Cada archivo existe
con el contenido descrito en su bloque (schema, servicio, controller, rutas, hook, componente,
páginas).

**Resultado: ✅ PASS**

## F-VER-03 — Cobertura ≥ 80% (línea, branch, función), por paquete

| Paquete | Stmts | Branch | Funcs | Lines | Tests |
|---|---|---|---|---|---|
| Backend | 97.54% | 93.84% | 94.87% | 97.39% | 76/76 |
| Frontend | 99.19% | 83.09% | 100% | 99.53% | 61/61 |

Los 4 números de cada paquete, individualmente, están sobre el piso de 80%
(`.ddw/rules/testing.instructions.md`, "Minimum Coverage" — AGENTS.md no declara un piso propio).

**Resultado: ✅ PASS**

## F-VER-04 — Sad-path tests

`POST /api/auth/register`: 400 (4 casos), 409, 500. `RegisterUserService.execute`: 6 casos de
rechazo. `useRegisterUser`/`RegisterForm`: validación de formulario + error de backend con
conservación de datos.

**Resultado: ✅ PASS**

## F-VER-05 — Lint / typecheck limpio

`npx tsc --noEmit` y `npx eslint .` en `backend/` y `frontend/`: 0 errores en los 4 comandos.

**Resultado: ✅ PASS**

## F-VER-06 — Todo test listado en el spec existe y pasa

Los 25 identificadores de "Required tests" del spec (`docs/ddw/specs/spec-FEAT-005.md`), uno por
uno, localizados y pasando:

- `test-block1-usermodel-requiere-email` → `UserModel.test.ts:26`
- `test-block1-usermodel-requiere-passwordhash` → `UserModel.test.ts:33`
- `test-block1-usermodel-rechaza-email-duplicado` → `UserModel.test.ts:40`
- `test-block1-usermodel-normaliza-email-minusculas` → `UserModel.test.ts:49`
- `test-block1-userrepository-create` → `UserRepository.test.ts:22`
- `test-block1-userrepository-findbyemail-case-insensitive` → `UserRepository.test.ts:37`
- `test-block1-userrepository-findbyemail-null` → `UserRepository.test.ts:50`
- `test-block1-seed-usuario-semilla` → `seed.test.ts:69`
- `test-block2-registeruserservice-crea-cuenta` → `RegisterUserService.test.ts:37`
- `test-block2-registeruserservice-bcrypt-cost-12` → `RegisterUserService.test.ts:51`
- `test-block2-registeruserservice-conflicto-email` → `RegisterUserService.test.ts:66`
- `test-block2-registeruserservice-email-invalido` → `RegisterUserService.test.ts:76`
- `test-block2-registeruserservice-password-corta` → `RegisterUserService.test.ts:85`
- `test-block2-registeruserservice-confirmpassword-no-coincide` → `RegisterUserService.test.ts:94`
- `test-block2-registeruserservice-campo-faltante` → `RegisterUserService.test.ts:103`
- `test-block2-authroutes-201` → `auth.routes.test.ts:34`
- `test-block2-authroutes-409` → `auth.routes.test.ts:51`
- `test-block2-authroutes-400` → `auth.routes.test.ts:62`
- `test-block2-authroutes-500` → `auth.routes.test.ts:83`
- `test-block3-registerform-error-por-campo` → `RegisterForm.test.tsx:38`
- `test-block3-registerform-contrasenas-no-coinciden` → `RegisterForm.test.tsx:49`
- `test-block3-useregisteruser-redirige-login` → `useRegisterUser.test.ts:30`
- `test-block3-useregisteruser-conserva-datos-en-error` → `useRegisterUser.test.ts:52`
- `test-block3-useregisteruser-sanitiza-name` → `useRegisterUser.test.ts:73`
- `test-block3-loginpage-placeholder` → `login.page.test.tsx:6`

25/25 localizados, todos pasando. Los 4 tests adicionales agregados durante el closeout de CODE
(corrección de cobertura y paridad con `useCreateTransaction.test.ts`) no estaban comprometidos por
el spec, pero también están presentes y documentados en `docs/ddw/reports/tdd-evidence-FEAT-005.md`.

**Resultado: ✅ PASS**

## TDD evidence

Los 3 bloques reportan, en `docs/ddw/reports/tdd-evidence-FEAT-005.md`, el test y la aserción exacta
que se vio fallar antes de la implementación (errores de compilación TS2307/TS2769/TS2304, o status
404 recibido en vez del esperado) y la confirmación de que pasa después. Verificado contra el código
real: los nombres de test y las aserciones citadas existen literalmente.

## W-VER-01 — Código muerto / imports sin usar

Sin TODO/FIXME/`@ts-ignore`/`eslint-disable` en los archivos nuevos. Ningún archivo supera 150
líneas (el mayor, `useRegisterUser.ts`, tiene 134). ESLint limpio en ambos paquetes.

## W-VER-02 — Cobertura de lógica de negocio 80–90%

- `RegisterUserService.ts`: 100% en las 4 métricas — supera 90% ampliamente.
- ⚠️ `useRegisterUser.ts`: 100% stmts/func/lines, **85.71% branch** (no llega a 90%). Las 2 ramas sin
  cubrir (líneas 84 y 123, ambas defensivas: `instanceof yup.ValidationError` / `instanceof Error`
  en su forma falsa) son la misma clase de rama ya sin cobertura y aceptada en
  `useCreateTransaction.ts:23` — no es una regresión nueva de este ticket, es consistencia con un
  patrón de riesgo ya asumido en el proyecto. No bloquea (el piso obligatorio de F-VER-03 es 80%,
  que sí se cumple); queda documentado para quien toque código similar después.

## W-VER-03 — Tests frágiles

Sin `.only`/`.skip`/`xit`/`xdescribe`. Los tests de integración limpian su propio estado
(`afterEach` con `deleteMany`/`jest.restoreAllMocks`) y usan datos propios por test, sin depender
del orden de ejecución ni de datos ambientales.

## Cross-verificación (ddw-module-verifier)

Corrida completa, independiente, contra PRD + spec + tests reales (no solo contra los reportes de
CODE). Verdict: **PASSED**. FAILs: 0. WARNs: 1 (el mismo W-VER-02 de arriba). PASSes: 21.

## Resumen

| Regla | Resultado |
|---|---|
| F-VER-01 | ✅ PASS |
| F-VER-02 | ✅ PASS |
| F-VER-03 | ✅ PASS |
| F-VER-04 | ✅ PASS |
| F-VER-05 | ✅ PASS |
| F-VER-06 | ✅ PASS |
| W-VER-01 | ✅ sin hallazgos |
| W-VER-02 | ⚠️ `useRegisterUser.ts` en 85.71% branch (no bloqueante) |
| W-VER-03 | ✅ sin hallazgos |

**Result: PASSED**
