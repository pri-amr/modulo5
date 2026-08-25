# Threat model FEAT-005: Registro de usuario con usuario y contraseña (sin passkeys)

| Field | Value |
|-------|-------|
| Ticket | FEAT-005 |
| Spec | docs/ddw/specs/spec-FEAT-005.md |
| Tier | FEATURE |
| Date | 2026-08-25 |

## Components

| Component | Source in the spec |
|---|---|
| `backend/src/presentation/routes/auth.routes.ts` + `AuthController.ts` | Block 2 |
| `backend/src/application/services/RegisterUserService.ts` (incluye la validación Zod de `RegisterUserRequestDto.ts`) | Block 2 |
| `backend/src/infrastructure/repositories/UserRepository.ts` + `UserModel.ts` | Block 1 |
| `frontend/src/hooks/useRegisterUser.ts` + `RegisterForm.tsx` | Block 3 |

## Trust boundaries

- Navegador → API: `POST /api/auth/register` cruza a Internet pública llevando email, nombre y
  contraseña en texto plano dentro del body.
- API → MongoDB: `UserRepository` escribe el documento `User` (incluida la contraseña ya hasheada)
  en la base, cruzando hacia la capa de persistencia.

## STRIDE analysis

### `backend/src/presentation/routes/auth.routes.ts` + `AuthController.ts`
- **Spoofing:** el endpoint es público por diseño (crea cuentas nuevas); no hay identidad que
  suplantar todavía porque la cuenta no existe hasta que la petición se procesa.
- **Tampering:** el body se parsea únicamente vía `RegisterUserRequestSchema.strict()` dentro de
  `RegisterUserService` — cualquier campo extra o de tipo incorrecto es rechazado (mismo patrón que
  `CreateTransactionRequestDto`).
- **Repudiation:** no se registra un log de auditoría por intento de registro. Impacto bajo: no hay
  datos financieros ni de terceros involucrados en este flujo, y el propio documento `User` creado
  es la evidencia de que el registro ocurrió.
- **Information Disclosure:** AC-02 exige informar explícitamente si el email ya está registrado —
  esto habilita enumeración de cuentas por diseño del PRD (ver R-01, riesgo aceptado).
- **Denial of Service:** bcrypt (cost 12) es deliberadamente costoso en CPU; sin límite de intentos,
  el endpoint es un vector de agotamiento de CPU (ver R-01, riesgo aceptado — el rate limiting está
  explícitamente Fuera de Alcance del PRD).
- **Elevation of Privilege:** no aplica — el endpoint no otorga roles ni privilegios, solo crea una
  cuenta básica.

### `backend/src/application/services/RegisterUserService.ts`
- **Spoofing:** no aplica (sin autenticación en este flujo).
- **Tampering:** el email se normaliza a minúsculas antes de comparar y de persistir, evitando que
  variantes de mayúsculas/minúsculas alteren la unicidad esperada.
- **Repudiation:** igual que el controller — sin logging dedicado, impacto bajo.
- **Information Disclosure:** la contraseña en texto plano solo vive en memoria durante el hasheo;
  nunca se persiste ni se incluye en `UserResponseDto` (que expone únicamente `id`, `name`, `email`).
- **Denial of Service:** ver R-01.
- **Elevation of Privilege:** no aplica.

### `backend/src/infrastructure/repositories/UserRepository.ts` + `UserModel.ts`
- **Spoofing:** no aplica (capa de persistencia).
- **Tampering:** el índice único de Mongo sobre `email` es una segunda barrera (defensa en
  profundidad) contra el caso borde de dos registros concurrentes con el mismo email pasando el
  chequeo `findByEmail` antes de que cualquiera de los dos inserte.
- **Repudiation:** no aplica más allá de lo ya cubierto arriba.
- **Information Disclosure:** `passwordHash` se persiste ya hasheado (bcrypt, cost 12) — nunca la
  contraseña en texto plano (ver Data classification).
- **Denial of Service:** no aplica directamente (Mongo gestiona sus propios límites de conexión).
- **Elevation of Privilege:** no aplica.

### `frontend/src/hooks/useRegisterUser.ts` + `RegisterForm.tsx`
- **Spoofing:** no aplica.
- **Tampering:** validación de formato con Yup en el cliente — no sustituye la validación server-side
  (Zod), que es la que realmente protege el sistema (defensa en profundidad, mismo patrón que
  `useCreateTransaction`).
- **Repudiation:** no aplica.
- **Information Disclosure:** `sanitizeInput` (escape de HTML) se aplica solo a `name`, nunca a
  `password`/`confirmPassword` — alterar la contraseña real rompería la autenticación futura y no
  mitiga nada (la contraseña nunca se renderiza como HTML).
- **Denial of Service:** no aplica (superficie del lado del cliente).
- **Elevation of Privilege:** no aplica.

## Data classification

| Data | Class | At rest | In transit |
|---|---|---|---|
| `email` | PII | Sin cifrado a nivel de columna (mismo criterio ya aceptado como R8 en `docs/daw/security/threat-FEAT-001.md`: cifrado en reposo es una decisión de infraestructura/despliegue de MongoDB, no de este ticket) | HTTPS en el entorno de despliegue (fuera del código de este ticket) |
| `password` (en tránsito) / `passwordHash` (persistido) | Credenciales | Nunca se persiste en texto plano; se almacena como hash bcrypt (cost 12), transformación de un solo sentido que ya cumple el objetivo de la protección en reposo | HTTPS en el entorno de despliegue |

## Risks and mitigations

| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | Enumeración de cuentas (mensaje "ya existe una cuenta con ese email", AC-02) combinada con ausencia de rate limiting permite tanto descubrir emails registrados como agotar CPU con hasheos bcrypt repetidos | I / D | Medium | Medium | **Riesgo aceptado** (ver abajo) — el mensaje específico lo exige AC-02 (ya aprobado en el PRD) y el rate limiting está explícitamente Fuera de Alcance de `prd-FEAT-005.md` |
| R-02 | Inyección NoSQL vía operadores Mongo (`$gt`, `$where`, etc.) en el body del registro | T | Low | High | `RegisterUserRequestSchema.strict()` (Zod) rechaza claves desconocidas y tipa cada campo antes de tocar Mongoose, mismo patrón que R2 de `threat-FEAT-001.md` |
| R-03 | Condición de carrera: dos registros concurrentes con el mismo email pasan el chequeo `findByEmail` antes de que cualquiera de los dos inserte | T | Low | Low | Índice único (`unique: true`) sobre `email` en `UserModel` como defensa en profundidad — el segundo insert falla a nivel de Mongo aunque el chequeo de aplicación no lo haya detectado |
| R-04 | El error de duplicado de Mongo (o cualquier error inesperado) podría filtrar detalles internos (stack trace, detalle de índice) en la respuesta | I | Low | Medium | Middleware de errores centralizado ya existente (`errorHandler.ts`): mensaje genérico al cliente, detalle completo solo en logs del servidor (mismo control que R5 de `threat-FEAT-001.md`) |

## Accepted risks

### R-01
- **Accepted by:** el usuario del proyecto (decidido explícitamente en PLAN, confirmado tras
  presentarle el trade-off).
- **Justification:** el mensaje específico de email duplicado es un requisito funcional ya aprobado
  (AC-02 de `prd-FEAT-005.md`), y el rate limiting está explícitamente listado en la sección "Out of
  Scope" del mismo PRD. Corregir cualquiera de los dos requeriría reabrir el PRD y ampliar el
  alcance de este ticket.
- **Review conditions:** este riesgo se revisa antes de desplegar la aplicación con datos de
  usuarios reales o exponerla a una red no confiable, o antes si se detecta abuso (intentos
  masivos de registro). Puede cerrarse agregando rate limiting en un ticket futuro.

## Supply chain

`bcryptjs` es la única dependencia nueva que introduce este ticket (ver ADR-003). Es una
reimplementación pura en JavaScript del algoritmo bcrypt, sin bindings nativos, ampliamente usada;
se audita junto con el resto de dependencias en el SAST de la fase CODE (F-SAST-13/16: CVEs en
dependencias).

## Availability

El único vector de disponibilidad identificado es el DoS por CPU vía bcrypt sin límite de intentos,
ya cubierto en R-01 (riesgo aceptado). No hay otros componentes de este ticket expuestos a tráfico
no autenticado además del propio endpoint de registro.
