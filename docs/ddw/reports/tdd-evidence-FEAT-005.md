# Evidencia TDD — FEAT-005

Registro de qué test se vio fallar, y con qué aserción exacta, antes de cada fix — por bloque, para
no repetir el riesgo de proceso documentado en `AGENTS.md` (los 7 reportes de bloque de FEAT-001 que
nunca se guardaron en disco).

## Block 1 — Dominio + infraestructura de datos (User)

| Test | Falló antes con | Pasa después |
|---|---|---|
| `UserModel requiere email: un User sin email dispara un error de validación de Mongoose` | TS2769/TS2339 — `email` no existía en el tipo que recibía `UserModel.create`; el test no compilaba | ✅ |
| `UserModel requiere passwordHash: un User sin passwordHash dispara un error de validación` | TS2769/TS2339, mismo motivo | ✅ |
| `UserModel rechaza un segundo usuario con el mismo email: el índice único dispara un error de Mongo (código 11000)` | TS2769/TS2339, mismo motivo (el índice único tampoco existía en el schema) | ✅ |
| `UserModel normaliza el email a minúsculas al guardar` | TS2769/TS2339, mismo motivo | ✅ |
| `UserRepository.create persiste un usuario y lo devuelve como entidad de dominio (valida FR-01)` | TS2307 — `Cannot find module '../../../infrastructure/repositories/UserRepository'` (el archivo no existía) | ✅ |
| `UserRepository.findByEmail encuentra un usuario existente sin distinguir mayúsculas de minúsculas (valida FR-02)` | TS2307, mismo motivo | ✅ |
| `UserRepository.findByEmail devuelve null si no existe ningún usuario con ese email (valida FR-02)` | TS2307, mismo motivo | ✅ |
| `seed crea el usuario semilla con email y passwordHash válidos, sin disparar el error de validación de los nuevos campos requeridos` | TS2304 — `Cannot find name 'SEED_USER_NAME'` (import faltante) y, tras agregarlo, fallo de compilación por los campos aún no implementados en `seed.ts`/`UserModel.ts` | ✅ |

Suite del bloque tras el fix: 20/20. Suite completa del backend: 62/62. Commit: `375b3a7`.

## Block 2 — Aplicación + presentación (endpoint de registro)

| Test | Falló antes con | Pasa después |
|---|---|---|
| `RegisterUserService crea la cuenta con datos válidos y devuelve el DTO sin passwordHash (valida AC-01)` | TS2307 — el archivo `RegisterUserService.ts` no existía; la suite completa de `RegisterUserService.test.ts` no compilaba | ✅ |
| `RegisterUserService hashea la contraseña con bcrypt cost 12 antes de persistirla (valida NFR-01)` | TS2307, mismo motivo | ✅ |
| `RegisterUserService lanza un error de conflicto si el email ya está registrado (valida AC-02)` | TS2307 — además `ConflictError.ts` no existía | ✅ |
| `RegisterUserService lanza un error de validación si el email tiene formato inválido (valida AC-03)` | TS2307, mismo motivo | ✅ |
| `RegisterUserService lanza un error de validación si la contraseña tiene menos de 8 caracteres (valida AC-04)` | TS2307, mismo motivo | ✅ |
| `RegisterUserService lanza un error de validación si confirmPassword no coincide con password (valida AC-05)` | TS2307, mismo motivo | ✅ |
| `RegisterUserService lanza un error de validación si falta algún campo obligatorio (valida AC-06)` (4 casos, `it.each`) | TS2307, mismo motivo | ✅ |
| `POST /api/auth/register responde 201 con el usuario creado (valida AC-01, integración)` | `expect(response.status).toBe(201)` recibió `404` (la ruta no estaba montada) | ✅ |
| `POST /api/auth/register responde 409 si el email ya existe (valida AC-02, integración)` | `expect(response.status).toBe(409)` recibió `404` | ✅ |
| `POST /api/auth/register responde 400 ante datos inválidos (valida AC-03 a AC-06, integración)` | `expect(invalidEmailResponse.status).toBe(400)` recibió `404` | ✅ |
| `POST /api/auth/register responde 500 sin filtrar detalles internos si la persistencia falla (valida AC-07, integración)` | `expect(response.status).toBe(500)` recibió `404` | ✅ |

Suite del bloque tras el fix: 14/14 (10 unitarios + 4 integración). Suite completa del backend:
76/76. Coverage del bloque: 100% stmts/branch/func/lines en los 4 archivos de lógica nueva.

Revisión de calidad (arch-auditor) y de cumplimiento de spec (module-verifier): PASSED, 0 FAILs, 2
WARN no bloqueantes (título de `it.each` sin `%s` — cosmético; esta misma persistencia de evidencia,
ya resuelta con este archivo).

## Block 3 — Frontend (formulario de registro + placeholder de login)

| Test | Falló antes con | Pasa después |
|---|---|---|
| `RegisterForm muestra un error por campo si faltan datos obligatorios (valida AC-06)` | `Cannot find module '../../components/RegisterForm' from 'src/__tests__/components/RegisterForm.test.tsx'` (el componente no existía) | ✅ |
| `RegisterForm muestra un error si las contraseñas no coinciden (valida AC-05)` | Mismo `Cannot find module`, mismo archivo de test | ✅ |
| `useRegisterUser redirige a /login tras un registro exitoso (valida AC-01, FR-07)` | `Cannot find module '../../hooks/useRegisterUser' from 'src/__tests__/hooks/useRegisterUser.test.ts'` (el hook no existía) | ✅ |
| `useRegisterUser muestra un mensaje de error y conserva los valores del formulario si el registro falla (valida AC-07)` | Mismo `Cannot find module`, mismo archivo de test | ✅ |
| `useRegisterUser sanitiza el campo name antes de enviarlo (criterio de seguridad de AGENTS.md)` | Mismo `Cannot find module`, mismo archivo de test | ✅ |
| `useRegisterUser aborta la request en curso al desmontarse y no actualiza estado del componente desmontado` (agregado tras el WARN de arch-auditor, paridad con `useCreateTransaction.test.ts`) | Mismo `Cannot find module`, mismo archivo de test | ✅ |
| `la página /login muestra el placeholder sin un formulario funcional (alcance acotado de FR-07)` | `Cannot find module '../../app/login/page' from 'src/__tests__/app/login.page.test.tsx'` (la página no existía) | ✅ |
| 2 tests de smoke en `register.page.test.tsx` (clases de tema del `<main>`, presencia de los 4 labels) | `Cannot find module '../../app/register/page' from 'src/__tests__/app/register.page.test.tsx'` (la página no existía) | ✅ |

Suite del bloque tras el fix: 9/9 (incluye el test de cancelación agregado). Suite completa del
frontend: 57/57, 16/16 suites.

Revisión de calidad (arch-auditor): PASSED, 0 FAILs, 1 WARN (falta de paridad de cobertura con
`useCreateTransaction.test.ts` en el test de cancelación al desmontar) — resuelto agregando ese test
antes de cerrar el bloque. Revisión de cumplimiento de spec (module-verifier): BLOCKED en su primera
pasada por esta misma evidencia no persistida; resuelto con este archivo.
