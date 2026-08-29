# SAST FEAT-007

| Field | Value |
|-------|-------|
| Ticket | FEAT-007 |
| Tools | revisión estática asistida por modelo sobre el diff completo del ticket + `pnpm audit` (frontend y backend) |
| Date | 2026-08-29 |

## Alcance escaneado

Diff completo del ticket contra la base de FEAT-006 (`45ce3e1..HEAD` más el working tree), 10
archivos, 195 inserciones / 26 borrados, todos en `frontend/`:

- `src/components/AuthLayout.tsx`, `src/components/Loader.tsx`, `src/components/RegisterForm.tsx`
- `src/app/globals.css`, `tailwind.config.ts`
- 5 archivos de test (`AuthLayout`, `Loader`, `RegisterForm`, `globals`, `tailwind.config`)

**El ticket es 100% presentacional.** Los cuatro bloques son layout, CSS y posicionamiento: ninguno
toca autenticación, autorización, persistencia, rutas de API, server actions ni el hook
`useRegisterUser`. No se agrega superficie de red. El backend no se modifica.

| Rule | Verdict | Notes |
|---|---|---|
| F-SAST-01 | ✅ | sin secretos embebidos en ninguno de los 10 archivos; grep de `api_key`/`password=`/`secret`/`token` sin resultados. `.env*` está en `.gitignore:19` con excepción para `.env.example` |
| F-SAST-02 | ✅ | no hay consultas: ningún archivo del ticket accede a base de datos |
| F-SAST-03 | ✅ | nada alcanza `exec`/`spawn`; sin llamadas a shell en el diff |
| F-SAST-04 | ✅ | sin `eval`, sin `new Function`, sin deserialización. El único `JSON.parse` nuevo (`AuthLayout.test.tsx:18`) lee el `package.json` de `tailwindcss` desde `node_modules`, ruta derivada de `require.resolve`, no de input de usuario — y es código de test, no de producción |
| F-SAST-05 | ✅ | sin input de usuario en rutas de archivo. Las dos rutas nuevas (`AuthLayout.test.tsx:9,19`) se derivan de `require.resolve` y `__filename`, ambas constantes de build en un archivo de test |
| F-SAST-06 | ✅ | `dangerouslySetInnerHTML` está prohibido por `AGENTS.md` y no aparece: grep sin resultados en los archivos tocados. Sin `innerHTML`. El SVG del Bloque 1 es markup JSX inline, no HTML interpolado |
| F-SAST-07 | ✅ | sin fetch saliente: el ticket no agrega ninguna llamada de red |
| F-SAST-08 | ✅ | sin criptografía en el alcance. El hasheo de claves (bcrypt) vive en el backend y no se toca |
| F-SAST-09 | ✅ | sin modo debug ni flags de desarrollo introducidos |
| F-SAST-10 | ✅ | sin logging: no se agrega ningún `console.*` en código de producción, verificado por `eslint .` en exit 0 |
| F-SAST-11 | ✅ | no hay superficie de upload en la aplicación |
| F-SAST-12 | ✅ | sin cambios en formularios que muten estado del servidor. `RegisterForm` cambió solo clases de layout; su payload, sus `name`/`id` y su submit son los de FEAT-005/006, sin modificar |
| F-SAST-13 | ✅ | `pnpm audit --audit-level low` en `frontend/`: **No known vulnerabilities found**. Ídem `backend/` |
| F-SAST-14 | ✅ | sin inputs nuevos que validar. Los campos del formulario y su validación (Yup + `sanitizeInput`) son los de FEAT-005, intactos en este ticket |
| F-SAST-15 | ✅ | sin manejo de errores nuevo. El banner de error de `RegisterForm` muestra el mismo texto que ya devolvía `useRegisterUser`; el cambio es que hace `wrap` en vez de expandir el contenedor, sin exponer ningún dato adicional ni truncar el mensaje |
| F-SAST-16 | ✅ | **cero dependencias nuevas** en el ticket. El `import { compile } from "tailwindcss"` del test usa `tailwindcss ^4.3.3`, ya declarado en `frontend/package.json` desde antes |
| F-SAST-17 | ✅ | sin caminos de código dinámico. `createRequire(__filename).resolve("tailwindcss/package.json")` (`AuthLayout.test.tsx:17`) resuelve un especificador literal constante, no construido |

## Suppressions

Ninguna.

## Riesgo aceptado, ya registrado en el threat model

No es un hallazgo de SAST y no altera el veredicto, pero se referencia acá para que el expediente
sea consistente: **R-02** de `docs/ddw/security/threat-FEAT-007.md` — durante la carga, el botón de
`ThemeToggle` sigue siendo alcanzable con Tab por debajo del overlay del `Loader`, así que se puede
activar con la pantalla tapada. Aceptado y no mitigado en este ticket: los formularios que consumen
`Loader` ya deshabilitan todos sus controles con `disabled={loading}`, el único elemento focusable
bajo el scrim es el toggle de tema, y su efecto es cosmético y reversible. Cerrarlo pide `inert` o
un focus trap, patrón que el proyecto no usa en ningún otro lado. Registrado en ADR-006.

**R-01** quedó mitigado en el Bloque 3: el overlay usa `z-[100]`, estrictamente superior al `z-50`
de `ThemeToggle`, el único otro elemento con posicionamiento fijo de la aplicación.

Total: 17 clean, 0 vulnerabilities (0 critical, 0 high)
Result: PASSED
