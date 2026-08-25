# ADR-003: Librería de hasheo de contraseñas para el registro de usuario

| Field | Value |
|-------|-------|
| Date | 2026-08-25 |
| Ticket | FEAT-005 |
| Status | Accepted |

## Context

FEAT-005 introduce el primer flujo que persiste una contraseña de usuario. RNF-01 del PRD base y
NFR-01 de `prd-FEAT-005.md` piden bcrypt con factor de costo ≥ 12, o argon2id con parámetros
equivalentes. El entorno de desarrollo de este proyecto es Windows, y el repo no tenía hasta ahora
ninguna dependencia con bindings nativos (compilación C++ vía node-gyp) en `backend/package.json`.

## Options considered

### Option 1: `bcrypt` (bindings nativos)
- **Pros:** implementación de referencia, más usada en producción, benchmarks más rápidos que las
  alternativas puras en JS.
- **Cons:** requiere compilar un módulo nativo (node-gyp, Visual Studio Build Tools / Python en
  Windows) tanto en desarrollo local como en cualquier pipeline de CI; introduce una fuente de
  fallos de instalación ajena a la lógica de la aplicación.

### Option 2: `bcryptjs` (implementación pura en JavaScript)
- **Pros:** mismo algoritmo y formato de hash que `bcrypt` (interoperable), sin dependencias
  nativas ni toolchain de compilación, instala igual en cualquier SO.
- **Cons:** más lento que la versión nativa bajo carga alta (no relevante para el volumen de
  registros de esta aplicación).

### Option 3: `argon2` (`argon2` / `@node-rs/argon2`)
- **Pros:** ganador del Password Hashing Competition, resistencia superior a ataques con GPU/ASIC.
- **Cons:** las implementaciones para Node.js también dependen de bindings nativos o de binarios
  Rust prebuilt; agrega una superficie de configuración (memoria, paralelismo) que el PRD no exige
  y que no hay necesidad de introducir todavía.

## Decision

Se adoptó `bcryptjs` con factor de costo 12. Cumple NFR-01 (bcrypt ≥ 12) sin agregar un toolchain de
compilación nativa al proyecto, evitando fallos de instalación en el entorno Windows de desarrollo
y en cualquier pipeline de CI que se agregue más adelante.

## Consequences

- Nueva dependencia en `backend/package.json`: `bcryptjs`.
- `RegisterUserService` hashea la contraseña con `bcryptjs.hash(password, 12)` antes de persistirla.
- Si en el futuro el volumen de registros concurrentes lo justifica, se puede reevaluar con una
  nueva ADR que reemplace esta (por ejemplo, migrando a `bcrypt` nativo u `argon2`); los hashes ya
  generados con `bcryptjs` siguen siendo válidos porque el formato del hash es el mismo estándar
  bcrypt.
