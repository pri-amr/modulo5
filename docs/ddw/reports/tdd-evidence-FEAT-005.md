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
