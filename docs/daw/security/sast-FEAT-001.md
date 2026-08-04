# SAST — FEAT-001 (Registrar ingreso o egreso de dinero)

Cierre del CODE (7/7 bloques). Escaneo sobre `backend/` (Express + Mongoose) y `frontend/`
(Next.js 16), siguiendo `.daw/rules/validation-rules.instructions.md` §4.

## Secretos (F-SAST-01)

- ✅ Sin API keys, passwords, tokens ni connection strings hardcodeados (grep sobre `backend/src`
  y `frontend/src`, excluyendo tests).
- ✅ `.env*` está en `.gitignore` (`!.env.example` es la única excepción, correcta).

## Inyección (F-SAST-02, F-SAST-03, F-SAST-05)

- ✅ NoSQL: `TransactionController.ts:27` pasa `req.body` sin validar directamente a
  `CreateTransactionService.execute`, pero la validación completa vive en
  `CreateTransactionRequestDto` (Zod), ejecutada como primer paso de `execute` — el controller no
  duplica validación (comentario explícito en el archivo), y ningún campo llega a una query de
  Mongoose sin pasar por Zod primero. Los repositorios (`MoneySourceRepository.ts`,
  `CategoryRepository.ts`) además verifican `Types.ObjectId.isValid()` antes de `findById`.
- ✅ Comandos: sin `child_process`, `exec`, `eval`, `new Function()` en todo el árbol.
- ✅ Path traversal: no hay manejo de rutas de archivo derivadas de input de usuario (no hay
  endpoints de upload/descarga).

## XSS y funciones inseguras (F-SAST-04, F-SAST-06, F-SAST-08)

- ✅ Cero apariciones de `dangerouslySetInnerHTML` ni `innerHTML` en `frontend/src`.
- ✅ `utils/sanitizeInput.ts` escapa HTML con un mapa de reemplazo fijo (`String.replace`), sin
  `eval` ni inserción directa en el DOM.
- ✅ Sin criptografía débil (MD5/SHA1/DES/ECB) — no hay manejo de contraseñas ni cifrado en este
  ticket.

## SSRF, debug mode, logging (F-SAST-07, F-SAST-09, F-SAST-10)

- ✅ `TransactionService.ts` llama únicamente a la ruta relativa fija `/api/transactions` vía
  `axiosClient` (baseURL de configuración, no derivada de input de usuario) — sin SSRF posible.
- ✅ `errorHandler.ts:12-14` — el detalle completo del error solo va a `console.error` (logs del
  servidor); al cliente se le devuelve `{ error: 'Internal server error' }` genérico para
  cualquier error no controlado. Ningún stack trace ni configuración interna se expone en la
  respuesta HTTP.
- ✅ Logging: `console.log`/`console.error` en `index.ts`, `seed.ts` y `errorHandler.ts` no
  registran contraseñas, tokens ni datos financieros de usuario — solo mensajes operativos y el
  objeto `Error`.

## Upload sin restricciones, CSRF (F-SAST-11, F-SAST-12)

- N/A — no existen endpoints de carga de archivos en este ticket.
- ⚠️ **Informational, no bloqueante**: `POST /api/transactions` es una operación que cambia estado
  sin protección CSRF explícita. No se eleva a FAIL porque la app todavía no usa autenticación
  basada en cookies/sesión — `resolveSeedUser.ts` resuelve un usuario semilla fijo sin ningún
  mecanismo de sesión que un atacante pudiera forjar. Este gap es consecuencia directa de **R1**
  (sin autenticación real), ya evaluado y **aceptado explícitamente en el threat model**
  (`docs/daw/security/threat-FEAT-001.md`, riesgo aceptado 1). CSRF deberá revisarse en el ticket
  que implemente autenticación real, no en este.
- ⚠️ **Informational, mismo origen que R1**: `app.ts:20` usa `cors()` sin restricción de origen.
  Sin sesión ni cookies de por medio (mismo motivo que el punto anterior), el impacto real hoy es
  equivalente al de R1 — cualquier origen puede invocar la API como el usuario semilla, que es
  exactamente el riesgo ya aceptado. No es un finding nuevo: es la misma superficie de R1 vista
  desde otro ángulo. Cuando se implemente autenticación real, restringir `cors()` a los orígenes
  del frontend debe formar parte de ese mismo ticket.

## Validación incompleta y manejo de errores (F-SAST-14, F-SAST-15)

- ✅ Backend: Zod estricto en `CreateTransactionRequestDto` (todos los campos, formatos y enums).
- ✅ Frontend: Yup replica las mismas reglas (`useCreateTransaction.ts`), más `sanitizeInput` sobre
  `description` antes de armar el DTO, además de la validación de forma (no en su reemplazo).
- ✅ `errorHandler.ts` no filtra internals — ver punto de logging arriba.

## Dependencias (F-SAST-13, F-SAST-16)

- 🔴→✅ **Backend** — `pnpm audit --prod` reportó 1 **High**: `fast-uri` (`GHSA-7p8r-x3mc-p8w7`,
  host confusion vía backslash), transitivo de `swagger-jsdoc>@apidevtools/swagger-parser>ajv`.
  **Fix aplicado:** override `fast-uri: '>=3.1.5'` en `backend/pnpm-workspace.yaml`. Resuelto a
  `fast-uri@4.1.2`. Re-corrido `pnpm audit --prod` → **0 vulnerabilidades**. Suite completa
  re-ejecutada tras el cambio: 40/40 tests en verde.
- 🔴→✅ **Frontend** — `pnpm audit --prod` reportó 3 **High** + 2 **Moderate**, todos transitivos
  de `next` (bundlea versiones vulnerables de `postcss` y `sharp`):
  - `postcss` (`GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849`, `GHSA-qx2v-qp2m-jg93`) — lectura
    arbitraria de archivos vía `sourceMappingURL` y XSS en su output.
  - `sharp` (`GHSA-f88m-g3jw-g9cj`, CVEs de libvips) — vulnerabilidades heredadas de libvips.
  **Fix aplicado:** overrides `postcss: '>=8.5.23'` y `sharp: '>=0.35.0'` en
  `frontend/pnpm-workspace.yaml`. Resueltos a `postcss@8.5.25` (ya usado también por
  `@tailwindcss/postcss`) y `sharp@0.35.3`. Re-corrido `pnpm audit --prod` → **0
  vulnerabilidades**. Suite completa re-ejecutada: 21/21 tests en verde, `tsc --noEmit` sin
  errores nuevos.

## Suppressions

Ninguna. Los 2 High (backend) y 3 High + 2 Moderate (frontend) se corrigieron con overrides de
versión, no se suprimieron.

Los 2 hallazgos informational de CORS/CSRF no son suppressions nuevas — son referencias al riesgo
R1 ya aceptado en `docs/daw/security/threat-FEAT-001.md` durante PLAN, con su propio protocolo de
aceptación ya documentado ahí.

---

**Total: 24 categorías revisadas, 0 vulnerabilidades abiertas (1 High backend + 5 
High/Moderate frontend encontradas y corregidas), 2 informational cross-referenciadas a R1**
**Next:** `gates.sast = true` → transición a VERIFY
