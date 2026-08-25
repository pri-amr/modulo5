# Spec FEAT-005: Registro de usuario con usuario y contraseña (sin passkeys)

| Field | Value |
|-------|-------|
| Ticket | FEAT-005 |
| PRD | docs/ddw/prd/prd-FEAT-005.md |
| Tier | FEATURE |
| Date | 2026-08-25 |
| Spec loops | 0 |
| Loops since last human decision | 0 |

## Summary

Se agrega el flujo de alta de cuenta (registro) con email y contraseña: extensión del modelo `User`
existente (email único + contraseña hasheada con bcrypt cost 12), un endpoint público
`POST /api/auth/register` en el backend (DDD/CQRS, capa `application` con Zod + bcryptjs), y un
formulario de registro en el frontend que redirige a una página `/login` placeholder tras el alta
exitosa.

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 | Block 2, Block 3 |
| FR-02 | Block 1, Block 2 |
| FR-03 | Block 2, Block 3 |
| FR-04 | Block 2, Block 3 |
| FR-05 | Block 2, Block 3 |
| FR-06 | Block 2, Block 3 |
| FR-07 | Block 3 |
| FR-08 | Block 2, Block 3 |
| NFR-01 | Strategy: constante `BCRYPT_COST_FACTOR = 12` (Block 1) usada por `bcryptjs.hash(password, BCRYPT_COST_FACTOR)` en `RegisterUserService` (Block 2) antes de persistir; nunca se guarda la contraseña en texto plano |

## Dependencies between blocks

Block 2 depende de Block 1 (necesita `User`, `IUserRepository` y `UserRepository` ya extendidos).
Block 3 depende de Block 2 (consume el contrato de `POST /api/auth/register`). Orden de ejecución:
1 → 2 → 3.

## Block 1 — Dominio + infraestructura de datos (User)

**Files**
- `backend/src/domain/entities/User.ts` (modified) — agrega `email: string` y `passwordHash: string`
- `backend/src/domain/repositories/IUserRepository.ts` (new) — `findByEmail`, `create`
- `backend/src/infrastructure/repositories/UserRepository.ts` (new) — implementa `IUserRepository`
- `backend/src/infrastructure/models/UserModel.ts` (modified) — agrega `email`/`passwordHash` al schema
- `backend/src/common/constants/security.ts` (new) — `BCRYPT_COST_FACTOR = 12`
- `backend/src/infrastructure/database/seed.ts` (modified) — el usuario semilla incluye email y
  passwordHash placeholder
- `backend/src/__tests__/integration/routes/transaction.routes.test.ts` (modified) — los dos
  `UserModel.create({ name: ... })` existentes agregan `email`/`passwordHash` válidos
- `backend/src/__tests__/integration/models/UserModel.test.ts` (new)
- `backend/src/__tests__/integration/repositories/UserRepository.test.ts` (new)

**Logic**
Se extiende la entidad de dominio `User` con `email` y `passwordHash`. El schema de Mongoose valida
`email` como único (índice `unique: true`), en minúsculas (`lowercase: true`, `trim: true`) y
obligatorio; `passwordHash` obligatorio. Se crea `IUserRepository` (dominio) con `findByEmail`
(normaliza el argumento a minúsculas antes de consultar) y `create`. `UserRepository`
(infraestructura) lo implementa con un mapper `toEntity` interno, mismo patrón que
`CategoryRepository`. El seed —que hoy crea el usuario demo solo con `name`— pasa a incluir un email
fijo (`usuario.demo@example.com`) y el hash bcrypt (cost `BCRYPT_COST_FACTOR`) de una contraseña de
desarrollo fija, para seguir cumpliendo el nuevo constraint `required` sin romper `seed.test.ts` ni
`resolveSeedUser`. Los dos `UserModel.create` de `transaction.routes.test.ts` que hoy solo pasan
`name` se actualizan igual.

**Data model**
- Entidad `User` (colección `users`):
  - `name`: String, required
  - `email`: String, required, unique (índice único), lowercase: true, trim: true
  - `passwordHash`: String, required
  - `_id`: ObjectId (autogenerado por Mongoose)
- Índices: único sobre `email`.

**Input validation**
No aplica en este bloque (no expone ningún endpoint todavía); la validación de entrada del registro
se especifica en Block 2.

**Error handling**
- Un `create` con `email` duplicado dispara un error de índice único de Mongo (código 11000); Block 2 lo evita con el chequeo previo `findByEmail` y traduce cualquier caso residual a una respuesta genérica vía el `errorHandler` ya existente.

**Required tests**
- [ ] it('UserModel requiere email: un User sin email dispara un error de validación de Mongoose')
- [ ] it('UserModel requiere passwordHash: un User sin passwordHash dispara un error de validación')
- [ ] it('UserModel rechaza un segundo usuario con el mismo email: el índice único dispara un error de Mongo (código 11000)')
- [ ] it('UserModel normaliza el email a minúsculas al guardar')
- [ ] it('UserRepository.create persiste un usuario y lo devuelve como entidad de dominio (valida FR-01)')
- [ ] it('UserRepository.findByEmail encuentra un usuario existente sin distinguir mayúsculas de minúsculas (valida FR-02)')
- [ ] it('UserRepository.findByEmail devuelve null si no existe ningún usuario con ese email (valida FR-02)')
- [ ] it('seed crea el usuario semilla con email y passwordHash válidos, sin disparar el error de validación de los nuevos campos requeridos')

**Rollback**
Revertir el commit de este bloque. No hay migración de datos: el proyecto no tiene usuarios reales
en producción todavía (es la primera vez que `UserModel` gana campos requeridos), así que no hace
falta un script de reversa de datos.

**Completion criterion**
`UserModel.test.ts` y `UserRepository.test.ts` pasan contra Mongo real (mongodb-memory-server);
`seed.test.ts`, `resolveSeedUser.test.ts` y `transaction.routes.test.ts` (ya existentes) siguen
pasando sin cambiar su intención original.

## Block 2 — Aplicación + presentación (endpoint de registro)

**Files**
- `backend/src/application/dtos/request/RegisterUserRequestDto.ts` (new)
- `backend/src/application/dtos/response/UserResponseDto.ts` (new)
- `backend/src/application/errors/ConflictError.ts` (new)
- `backend/src/application/helpers/mappers/UserMapper.ts` (new) — objeto literal, mismo patrón que
  `TransactionMapper.ts`
- `backend/src/application/services/RegisterUserService.ts` (new)
- `backend/src/presentation/controllers/AuthController.ts` (new)
- `backend/src/presentation/routes/auth.routes.ts` (new)
- `backend/src/infrastructure/swagger/docs/auth.swagger.ts` (new)
- `backend/src/app.ts` (modified) — monta `apiRouter.use('/api/auth', authRoutes)`
- `backend/package.json` (modified) — agrega la dependencia `bcryptjs` (ver ADR-003)
- `backend/src/__tests__/unit/services/RegisterUserService.test.ts` (new)
- `backend/src/__tests__/integration/routes/auth.routes.test.ts` (new)

**Logic**
`RegisterUserRequestSchema` (Zod `.strict()`) valida `name` (string no vacío), `email` (formato
email), `password` (mínimo 8 caracteres) y `confirmPassword` (`.refine` contra `password`).
`RegisterUserService.execute(dto: unknown)` parsea el DTO, normaliza `email` a minúsculas, consulta
`userRepository.findByEmail` —si existe, lanza `ConflictError`— y si no, hashea `password` con
`bcryptjs.hash(password, BCRYPT_COST_FACTOR)` y llama a `userRepository.create`. Devuelve
`UserMapper.toResponseDto(user)`, que nunca expone `passwordHash`. `AuthController.registerUser`
invoca el service y responde 201, o delega el error con `next(error)` (mismo patrón que
`TransactionController`). `auth.routes.ts` monta `POST /register` sin middleware de autenticación
(endpoint público, sin `resolveSeedUser`).

**API contract**
- Method + path: `POST /api/auth/register`
- Request body:
  - `name: string` (requerido, no vacío)
  - `email: string` (requerido, formato de email válido)
  - `password: string` (requerido, mínimo 8 caracteres)
  - `confirmPassword: string` (requerido, debe coincidir con `password`)
- Response 201 (éxito): `{ id: string, name: string, email: string }`
- Response 400 (`ValidationError`): `{ error: string }` — campo obligatorio faltante, email con
  formato inválido, password corta, o `confirmPassword` no coincide
- Response 409 (`ConflictError`): `{ error: string }` — email ya registrado
- Response 500: `{ error: "Internal server error" }` — fallo de persistencia inesperado (mismo
  `errorHandler` genérico ya existente)
- Auth: ninguna (endpoint público)

**Input validation**
- `name`: string, requerido, no vacío tras `trim()`
- `email`: string, requerido, formato de email válido (`.email()` de Zod)
- `password`: string, requerido, longitud mínima 8
- `confirmPassword`: string, requerido, debe ser idéntico a `password`
- El objeto es `.strict()`: rechaza cualquier campo no declarado

**Error handling**
- Campo obligatorio faltante o vacío → `ValidationError` (400), mensaje indicando el campo (AC-06)
- `email` con formato inválido → `ValidationError` (400) (AC-03)
- `password` con menos de 8 caracteres → `ValidationError` (400) (AC-04)
- `confirmPassword` no coincide con `password` → `ValidationError` (400) (AC-05)
- `email` ya registrado → `ConflictError` (409) (AC-02)
- Fallo inesperado de persistencia tras pasar todas las validaciones → error genérico propagado al
  `errorHandler` (500); el frontend lo traduce a un mensaje sin perder los datos del formulario
  (AC-07, completado en Block 3)

**Required tests**
- [ ] it('RegisterUserService crea la cuenta con datos válidos y devuelve el DTO sin passwordHash (valida AC-01)')
- [ ] it('RegisterUserService hashea la contraseña con bcrypt cost 12 antes de persistirla (valida NFR-01)')
- [ ] it('RegisterUserService lanza un error de conflicto si el email ya está registrado (valida AC-02)')
- [ ] it('RegisterUserService lanza un error de validación si el email tiene formato inválido (valida AC-03)')
- [ ] it('RegisterUserService lanza un error de validación si la contraseña tiene menos de 8 caracteres (valida AC-04)')
- [ ] it('RegisterUserService lanza un error de validación si confirmPassword no coincide con password (valida AC-05)')
- [ ] it('RegisterUserService lanza un error de validación si falta algún campo obligatorio (valida AC-06)')
- [ ] it('POST /api/auth/register responde 201 con el usuario creado (valida AC-01, integración)')
- [ ] it('POST /api/auth/register responde 409 si el email ya existe (valida AC-02, integración)')
- [ ] it('POST /api/auth/register responde 400 ante datos inválidos (valida AC-03 a AC-06, integración)')
- [ ] it('POST /api/auth/register responde 500 sin filtrar detalles internos si la persistencia falla (valida AC-07, integración)')

**Completion criterion**
`RegisterUserService.test.ts` y `auth.routes.test.ts` pasan; `POST /api/auth/register` devuelve
201/400/409/500 según corresponda; `bcryptjs` agregado a `package.json` y usado con
`BCRYPT_COST_FACTOR` (Block 1).

## Block 3 — Frontend (formulario de registro + placeholder de login)

**Files**
- `frontend/src/app/register/page.tsx` (new)
- `frontend/src/app/login/page.tsx` (new, placeholder)
- `frontend/src/components/RegisterForm.tsx` (new)
- `frontend/src/hooks/useRegisterUser.ts` (new)
- `frontend/src/services/AuthService.ts` (new)
- `frontend/src/models/Auth.types.ts` (new)
- `frontend/src/__tests__/components/RegisterForm.test.tsx` (new)
- `frontend/src/__tests__/hooks/useRegisterUser.test.ts` (new)
- `frontend/src/__tests__/app/register.page.test.tsx` (new)
- `frontend/src/__tests__/app/login.page.test.tsx` (new)

**Logic**
`app/register/page.tsx` es un server component que importa dinámicamente `RegisterForm` (mismo
patrón que `app/page.tsx` con `next/dynamic`). `RegisterForm` renderiza los 4 campos (name, email,
password, confirmPassword) usando `FormField`/`Loader` ya existentes, delegando toda la
orquestación a `useRegisterUser`. El hook valida con un schema Yup (name/email/password/
confirmPassword, con un test de coincidencia de contraseñas), sanitiza `name` con `sanitizeInput`
(nunca `password`/`confirmPassword`, porque alterarlas rompería la autenticación futura), llama a
`AuthService.registerUser` (axios + `AbortSignal`, mismo patrón que `TransactionService`), y ante
error mantiene los valores del formulario intactos (solo limpia el estado en la rama de éxito,
AC-07). Ante éxito, redirige a `/login` con `next/navigation` (`useRouter().push('/login')`).
`app/login/page.tsx` es un placeholder estático (sin formulario funcional): muestra un mensaje
indicando que el inicio de sesión estará disponible en un ticket posterior.

**Data model**
`Auth.types.ts` no define un esquema de persistencia: son tipos TypeScript puros que reflejan el
contrato de Block 2 (`RegisterUserRequestDto`, `UserResponseDto`), sin valores default ni índices
propios — la persistencia y sus constraints ya están definidas en Block 1.

**Input validation**
- `name`: string, requerido
- `email`: string, requerido, formato de email válido
- `password`: string, requerido, mínimo 8 caracteres
- `confirmPassword`: string, requerido, debe coincidir con `password`

**Error handling**
- Errores de validación de Yup (campo faltante, formato de email, contraseña corta, confirmación
  que no coincide) → se muestran por campo (`fieldErrors`), mismo patrón que `useCreateTransaction`
- Error de red o de respuesta del backend (400/409/500) → se muestra un mensaje general de error
  (`error`); los valores ingresados NO se limpian (AC-07)

**Required tests**
- [ ] it('RegisterForm muestra un error por campo si faltan datos obligatorios (valida AC-06)')
- [ ] it('RegisterForm muestra un error si las contraseñas no coinciden (valida AC-05)')
- [ ] it('useRegisterUser redirige a /login tras un registro exitoso (valida AC-01, FR-07)')
- [ ] it('useRegisterUser muestra un mensaje de error y conserva los valores del formulario si el registro falla (valida AC-07)')
- [ ] it('useRegisterUser sanitiza el campo name antes de enviarlo (criterio de seguridad de AGENTS.md)')
- [ ] it('la página /login muestra el placeholder sin un formulario funcional (alcance acotado de FR-07)')

**Completion criterion**
`RegisterForm.test.tsx`, `useRegisterUser.test.ts`, `register.page.test.tsx` y `login.page.test.tsx`
pasan; el flujo completo (registro → redirect a `/login` placeholder) funciona manualmente contra el
backend de Block 2.

## Final verification

Los 8 FR y el NFR-01 de `prd-FEAT-005.md` quedan cubiertos por al menos un bloque; las 7 AC tienen
al menos un test automatizado que las valida (unitario y/o de integración); `pnpm test`,
`tsc --noEmit` y ESLint pasan limpios en `backend` y `frontend`; el endpoint
`POST /api/auth/register` funciona end-to-end contra MongoDB real (dev) y devuelve los códigos de
estado documentados.
