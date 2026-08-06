# Threat Model FEAT-001: Registrar ingreso o egreso de dinero

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| Date | 2026-08-01 |

## Componentes analizados

- `POST /api/transactions` (presentation/controllers/TransactionController.ts + routes)
- Middleware de resolución de usuario semilla (presentation/middlewares/)
- `CreateTransactionService` (application/services) — valida DTO, verifica pertenencia, crea la transacción, recalcula el balance
- `TransactionRepository`, `MoneySourceRepository`, `CategoryRepository` (infrastructure) contra MongoDB
- Frontend: `TransactionForm` → `useCreateTransaction` → `TransactionService` (axios) → endpoint

## Trust boundaries (F-TM-02)

| Boundary | Cruce | Nivel de confianza |
|---|---|---|
| TB-01 | Navegador (cliente, no confiable) → API Express | Cliente no confiable → servidor confiable |
| TB-02 | API Express → MongoDB | Servidor confiable → almacenamiento persistente |

## Clasificación de datos sensibles (F-TM-05)

- Monto, moneda, fecha, descripción de la transacción, y el balance de la fuente de dinero: **datos financieros**.
- El `userId` semilla usado para la verificación de pertenencia: identificador de cuenta, no PII per se en este ticket (usuario semilla fijo, sin datos personales reales todavía).

## Riesgos (STRIDE)

| # | Riesgo | STRIDE | Likelihood | Impact | Mitigación |
|---|---|---|---|---|---|
| R1 | Sin autenticación real, cualquier request al endpoint actúa como el usuario semilla — no hay verificación de identidad | Spoofing | High | Medium | **Riesgo aceptado** (ver abajo) — ya decidido en DEFINE; `CreateTransactionService` se escribe contra una abstracción de "usuario autenticado" para que el reemplazo por auth real (RF-01/02) no requiera tocar la lógica de negocio |
| R2 | Entrada no tipada podría intentar inyectar operadores Mongo (`$gt`, `$where`, etc.) si no se valida estrictamente | Tampering | Medium | High | Validación estricta con **Zod** en `CreateTransactionRequestDto` (rechaza claves desconocidas, tipa cada campo) antes de tocar Mongoose; schemas Mongoose en modo `strict` |
| R3 | Condición de carrera en el recálculo del balance de la fuente de dinero si dos transacciones concurrentes leen-modifican-escriben el mismo documento | Tampering | Medium | High | Recalcular con el operador atómico `$inc` de Mongoose (`findOneAndUpdate` con `$inc`), nunca leer-calcular-escribir |
| R4 | Un usuario podría intentar registrar una transacción contra una fuente o categoría que no le pertenece | Elevation of Privilege | Medium | High | `CreateTransactionService` verifica pertenencia de fuente y categoría contra el usuario autenticado ANTES de escribir; `ForbiddenError` → 403 (cubre NFR-02/AC-07) |
| R5 | El middleware de errores podría filtrar detalles internos (stack trace, query de Mongo) en la respuesta | Information Disclosure | Low | Medium | Middleware de errores centralizado: mensaje genérico al cliente, detalle completo solo en logs del servidor (cubre FR-11/AC-08) |
| R6 | Sin trazabilidad de cuándo se creó/modificó una transacción | Repudiation | Low | Low | Timestamps automáticos de Mongoose (`createdAt`/`updatedAt`) en el modelo `Transaction` |
| R7 | Endpoint público sin límite de tamaño de payload — vector de degradación de servicio | Denial of Service | Low | Low | `express.json({ limit: '10kb' })` como control mínimo en el bootstrap del backend |
| R8 | Datos financieros en MongoDB sin cifrado a nivel de aplicación | Information Disclosure | Low | Medium | **Riesgo aceptado** (ver abajo) — cifrado en reposo (RNF-02, AES-256) es una decisión de infraestructura/despliegue de MongoDB, no de este ticket |

## Riesgos aceptados (F-TM-04)

### Riesgo aceptado 1: sin autenticación real (R1)
- **Quién lo acepta:** el usuario del proyecto (decidido explícitamente en DEFINE, ver `docs/daw/prd/prd-FEAT-001.md` § Risks and Mitigations).
- **Justificación:** esta es la primera feature del proyecto; no existe todavía ningún módulo de autenticación (RF-01/RF-02, aún no implementado). Bloquear FEAT-001 hasta tener auth real duplicaría trabajo, porque `AGENTS.md` ya define que el login usuario/contraseña se construye antes que las passkeys, en un ticket propio. La lógica de autorización (verificación de pertenencia, R4) se implementa igual desde ahora, contra el usuario semilla, para que no cambie cuando llegue la auth real.
- **Condiciones de revisión:** este riesgo se cierra cuando se implemente el ticket de autenticación (RF-01 a RF-07). Hasta entonces, la aplicación no debe desplegarse con datos de usuarios reales ni exponerse a una red no confiable.

### Riesgo aceptado 2: cifrado en reposo no implementado en este ticket (R8)
- **Quién lo acepta:** el usuario del proyecto.
- **Justificación:** el cifrado en reposo (RNF-02 del PRD general, AES-256) es una propiedad de la configuración de MongoDB/infraestructura de despliegue, no del código de este ticket. Implementarlo aquí implicaría decisiones de infraestructura (KMS, configuración del cluster) fuera del alcance de "registrar una transacción".
- **Condiciones de revisión:** debe resolverse antes de cualquier despliegue a un entorno con datos financieros reales de usuarios; se revisa en el ticket que defina la infraestructura de base de datos de producción.

## Mitigaciones a incorporar al spec

1. Validación estricta con Zod en `CreateTransactionRequestDto` (R2).
2. Recalcular el balance de `MoneySource` con `$inc` atómico, no lectura-cálculo-escritura (R3).
3. Verificación de pertenencia de fuente y categoría en `CreateTransactionService`, antes de cualquier escritura (R4).
4. Middleware de errores centralizado con mensajes genéricos al cliente (R5).
5. Timestamps de Mongoose en el modelo `Transaction` (R6).
6. Límite de tamaño de payload (`express.json({ limit: '10kb' })`) en el bootstrap (R7).

## Resumen

Risks: C:0 H:0 M:2 L:4 (2 aceptados: R1, R8)
Resultado: **PASSED** (con 2 riesgos aceptados, ambos con las 3 condiciones F-TM-04 documentadas)
