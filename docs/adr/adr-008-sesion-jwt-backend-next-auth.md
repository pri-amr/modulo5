# ADR-008: Sesión híbrida — JWT propio del backend + next-auth v4, token nunca expuesto al cliente

| Field | Value |
|-------|-------|
| Date | 2026-08-31 |
| Ticket | FEAT-008 |
| Status | Accepted |

## Context

Frontend (Next.js) y backend (Express) son orígenes distintos, y RNF-10 del PRD del producto exige
que el backend verifique la pertenencia de los datos por sí mismo. `AGENTS.md` declara `next-auth 4`
en su Stack, nunca instalado (riesgo R2 del PRD de FEAT-008). Un primer diseño exponía el JWT del
backend como `session.backendToken`, leído del lado del cliente y adjuntado por un interceptor de
`axiosClient`. El `ddw-impact-scanner` lo marcó como violación de la regla de `AGENTS.md` "Nunca
exponer tokens del lado del cliente" y dilución de NFR-01.

## Options considered

### Opción 1: Cookie propia del backend, sin next-auth
- **Pros:** una sola pieza de sesión, sin librería adicional.
- **Cons:** funciona en dev porque las cookies no distinguen puerto, pero se rompe en producción con
  dominios distintos sin un `Domain` compartido explícito. No usa lo que `AGENTS.md` ya declara.

### Opción 2: next-auth v4 + proxy total de cada llamada autenticada
- **Pros:** centraliza todo el tráfico autenticado.
- **Cons:** hoy sólo transacciones requiere autenticación; proxyear todo sin necesidad es una capa
  de más para este alcance.

### Opción 3 (elegida): JWT propio del backend + next-auth v4, token recuperado sólo server-side
- **Pros:** el backend firma y verifica su propio JWT con `jsonwebtoken`, independiente del formato
  de next-auth. El navegador sólo sostiene la cookie `HttpOnly` de next-auth; el callback
  `session()` nunca incluye el JWT del backend. Donde hace falta reenviarlo se usa `getToken()` de
  `next-auth/jwt`, que corre exclusivamente server-side.
- **Cons:** dos formatos de token conviviendo, aunque nunca se tocan entre sí.

### Sub-decisión: `jsonwebtoken` en vez de HMAC artesanal con `node:crypto`
`jsonwebtoken` maneja expiración y firma sin las trampas de una implementación manual (timing
attacks, confusión de algoritmo); repetir esa lógica a mano es más riesgo que ahorro acá.

## Decision

Opción 3. El backend firma con `jsonwebtoken` (`sub`: id de usuario, `exp`: 7 días). El frontend usa
next-auth v4 (`CredentialsProvider`, estrategia `jwt`, `maxAge` 7 días) sólo para la sesión del
navegador; el callback `jwt` guarda el JWT del backend, `session()` no lo reexpone. Todo código que
necesite reenviarlo lo obtiene con `getToken()`, nunca a través de la sesión que ve el cliente.

## Consequences

- Nuevo `frontend/src/app/api/transactions/route.ts`: usa `getToken()` y reenvía a Express con
  `Authorization: Bearer`. `TransactionService.ts` pasa a llamar a esa ruta relativa.
- Nuevas dependencias: `jsonwebtoken` (+ tipos) en el backend, `next-auth` en el frontend.
- Limitación aceptada: JWT sin estado — `signOut()` borra la cookie de next-auth pero no invalida el
  JWT del backend, válido hasta su expiración natural. Sin almacén de sesiones para revocación
  activa; documentado como riesgo aceptado en el threat model, no resuelto acá.
- Cualquier endpoint autenticado futuro repite este patrón (Route Handler propio + `getToken()`), no
  el interceptor de `axiosClient` descartado.
