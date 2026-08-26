# SAST FEAT-005

| Field | Value |
|-------|-------|
| Ticket | FEAT-005 |
| Tools | lectura manual del diff (backend/src/application, presentation, infrastructure, domain, common; frontend/src/hooks/useRegisterUser.ts, components/RegisterForm.tsx, services/AuthService.ts, app/register, app/login, models/Auth.types.ts) + `pnpm audit --prod` (backend y frontend) |
| Date | 2026-08-25 |

| Rule | Verdict | Notes |
|---|---|---|
| F-SAST-01 | ✅ | Sin secretos embebidos. `SEED_USER_DEV_PASSWORD` (`backend/src/infrastructure/database/seed.ts:14`) es una contraseña de desarrollo con nombre autoexplicativo y comentario explícito de alcance (nunca producción); no hay credenciales reales, API keys ni connection strings en el código. `.env`/`.env.local` están en `.gitignore` |
| F-SAST-02 | ✅ | Todas las queries nuevas usan el query builder tipado de Mongoose (`UserModel.findOne`, `UserModel.create`) con objetos validados por Zod `.strict()` antes de llegar a Mongoose; sin concatenación de strings ni claves computadas desde input del usuario |
| F-SAST-03 | ✅ | Sin `exec`/`spawn`/`child_process` en ningún archivo nuevo |
| F-SAST-04 | ✅ | Sin `eval`, sin deserialización insegura; el body se parsea con `express.json()` (ya existente) + Zod |
| F-SAST-05 | ✅ | Ningún archivo nuevo maneja rutas de filesystem con input del usuario |
| F-SAST-06 | ✅ | Sin `dangerouslySetInnerHTML` en `RegisterForm.tsx` ni en las páginas nuevas; React escapa el output por defecto |
| F-SAST-07 | ✅ | Sin fetch saliente dirigido por input del usuario (el único request saliente es `AuthService.registerUser` hacia el propio backend, URL fija) |
| F-SAST-08 | ✅ | `bcrypt.hash(password, BCRYPT_COST_FACTOR)` con `BCRYPT_COST_FACTOR = 12` (`backend/src/common/constants/security.ts`) — cumple RNF-01/NFR-01 (bcrypt ≥ 12). Sin MD5/SHA1 para contraseñas |
| F-SAST-09 | ✅ | Sin flags de debug ni configuración de entorno nuevas en este ticket |
| F-SAST-10 | ✅ | `password`/`confirmPassword`/`passwordHash` nunca aparecen en un `console.log`/`console.error` ni en `UserResponseDto` (verificado por grep en todos los archivos nuevos) |
| F-SAST-11 | ✅ | Sin superficie de carga de archivos en este ticket |
| F-SAST-12 | ✅ | `POST /api/auth/register` es un endpoint público y anónimo (sin `resolveSeedUser` ni ninguna sesión/cookie de autenticación ambiente) — no hay estado de sesión que un CSRF pueda aprovechar; el peor escenario (registro de cuentas spam vía un POST cross-site) ya está cubierto por el riesgo aceptado R-01 del threat model (`docs/ddw/security/threat-FEAT-005.md`), no por protección CSRF |
| F-SAST-13 | ✅ | `pnpm audit --prod` en `backend/` y `frontend/`: "No known vulnerabilities found" en ambos, incluida la nueva dependencia `bcryptjs@3.0.3` |
| F-SAST-14 | ✅ | Input validado en el borde: `RegisterUserRequestSchema` (Zod `.strict()`, backend) y `registerFormSchema` (Yup, frontend) — tipo, longitud mínima, formato de email, coincidencia de contraseñas |
| F-SAST-15 | ✅ | El fallo de persistencia tras las validaciones se propaga al `errorHandler` genérico ya existente (`{ error: 'Internal server error' }`, sin stack trace ni detalle de Mongo al cliente; detalle completo solo en logs de servidor) — verificado con un test de integración dedicado (AC-07) |
| F-SAST-16 | ✅ | Sin CVEs Medium reportados por `pnpm audit` |
| F-SAST-17 | ✅ | Sin `eval`/`exec`/deserialización dinámica en ningún archivo nuevo |

## Suppressions
None.

Total: 17 clean, 0 vulnerabilities (0 critical, 0 high)
Result: PASSED
