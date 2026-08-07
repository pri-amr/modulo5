# SAST FEAT-002: Tokens semánticos de tema claro/oscuro

## Alcance escaneado

Commits del ticket (`d483294`, `553554b`, `80e173d`, `56a2ed7`, `045ecb5`) contra base `dev`:

- `frontend/src/app/globals.css`
- `frontend/tailwind.config.ts`
- `frontend/src/components/Loader.tsx`
- `frontend/src/__tests__/app/globals.test.ts`
- `frontend/src/__tests__/app/tailwind.config.test.ts`
- `frontend/src/__tests__/components/Loader.test.tsx`
- Documentación (`docs/daw/prd/`, `docs/daw/specs/`, `docs/daw/security/`, `CHANGELOG.md`)

`frontend/package.json` / `pnpm-lock.yaml` **no cambiaron** — sin dependencias nuevas que auditar
más allá del baseline ya limpio.

## Hallazgos por categoría

| Categoría | Regla | Resultado |
|---|---|---|
| Secretos hardcodeados | F-SAST-01 | ✅ 0 coincidencias (API key/password/token/`-----BEGIN`) en los 6 archivos de código tocados |
| Inyección SQL/NoSQL | F-SAST-02 | ✅ N/A — sin queries, sin backend tocado |
| Inyección de comandos | F-SAST-03 | ✅ N/A — sin `exec`/`spawn`/`system` |
| Path traversal | F-SAST-05 | ✅ N/A — sin paths derivados de input |
| XSS (`dangerouslySetInnerHTML`/`innerHTML`) | F-SAST-06 | ✅ 0 coincidencias |
| Funciones inseguras (`eval`, deserialización) | F-SAST-04/17 | ✅ 0 coincidencias |
| Criptografía débil | F-SAST-08 | ✅ N/A — sin criptografía involucrada |
| SSRF | F-SAST-07 | ✅ N/A — sin llamadas de red nuevas |
| Debug mode en producción | F-SAST-09 | ✅ N/A — sin config de entorno tocada |
| Logging de datos sensibles | F-SAST-10 | ✅ 0 `console.*` en los archivos tocados |
| Upload sin restricción | F-SAST-11 | ✅ N/A |
| CSRF | F-SAST-12 | ✅ N/A — sin formularios/endpoints nuevos |
| Validación de input incompleta | F-SAST-14 | ✅ N/A — ningún archivo tocado acepta input de usuario (CSS/config estáticos, `Loader` solo recibe `visible: boolean` ya validado por TS) |
| Manejo de errores que filtra internals | F-SAST-15 | ✅ N/A — sin manejo de errores nuevo (bloques documentados como "No aplica" en el spec) |

## Dependencias

`pnpm audit` (raíz del monorepo, cubre `frontend/` y `backend/`): **No known vulnerabilities
found**. Sin cambios en `package.json`/`pnpm-lock.yaml` de ningún paquete — el baseline ya
saneado en FEAT-001 (overrides de pnpm) se mantiene intacto.

## Suppressions

Ninguna — no hubo hallazgos Medium que requieran documentación de supresión.

## Veredicto

```
┌─────────────────────────────────────────────────────────────┐
│  /daw-security-sast — PASSED                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Secrets:                                                    │
│    ✅ F-SAST-01: 0 patrones de secretos en 6 archivos          │
│                                                              │
│  Injection:                                                  │
│    ✅ F-SAST-02/03/05: N/A — sin queries, exec ni paths         │
│       derivados de input                                       │
│                                                              │
│  XSS and unsafe functions:                                    │
│    ✅ F-SAST-06: 0 dangerouslySetInnerHTML/innerHTML             │
│    ✅ F-SAST-04/17: 0 eval/deserialización insegura               │
│                                                              │
│  Dependencies:                                                 │
│    ✅ pnpm audit: No known vulnerabilities found (sin            │
│       cambios de dependencias en este ticket)                     │
│                                                              │
│  Suppressions: 0                                                │
│                                                              │
│  ────────────────────────────────────────────────────────────│
│  Total: 14 clean, 0 vulnerabilities (0 critical, 0 high)      │
│  Report: docs/daw/security/sast-FEAT-002.md                   │
│  Next: gates.sast = true, avanzar al cierre de CODE             │
└─────────────────────────────────────────────────────────────┘
```
