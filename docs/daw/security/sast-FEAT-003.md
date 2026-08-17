# SAST — FEAT-003: Aplicar tokens semánticos de tema a componentes

**Alcance:** archivos modificados por los 3 bloques del spec (todos frontend):
`frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`,
`frontend/src/components/ThemeToggle.tsx`, `frontend/src/components/TransactionForm.tsx`,
`frontend/src/components/FormField.tsx` (extraído en Block 3).

Cambios puramente de estilo (reemplazo de clases Tailwind hardcodeadas por tokens semánticos) y de
tipo de input (`<textarea>` → `<input type="text">` en Descripción, FR-10/AC-09). Ninguno introduce
nueva superficie de entrada, endpoint, ni manejo de datos sensibles.

## Resultado: PASSED

| Categoría | Resultado |
|---|---|
| Secretos hardcodeados (F-SAST-01) | ✅ Sin coincidencias — no hay claves/tokens en los archivos tocados |
| Inyección SQL/NoSQL (F-SAST-02) | ✅ N/A — sin queries en estos archivos |
| Inyección de comandos (F-SAST-03) | ✅ N/A — sin `exec`/`spawn` |
| Path traversal (F-SAST-05) | ✅ N/A — sin manejo de paths |
| XSS (F-SAST-06) | ✅ Sin `innerHTML`/`dangerouslySetInnerHTML`; el input de Descripción sigue pasando por `useCreateTransaction` → `sanitizeInput` (sin cambios en ese hook) |
| SSRF (F-SAST-07) | ✅ N/A |
| Funciones inseguras / crypto débil (F-SAST-04/08) | ✅ Sin `eval`, sin crypto |
| Debug mode (F-SAST-09) | ✅ N/A |
| Logging de datos sensibles (F-SAST-10) | ✅ Sin `console.log` de datos de formulario |
| Upload sin restricción (F-SAST-11) | ✅ N/A |
| CSRF (F-SAST-12) | ✅ N/A — sin nuevos endpoints |
| Validación de input incompleta (F-SAST-14) | ✅ Sin cambios en la lógica de validación (Yup en `useCreateTransaction`, no tocado) |
| Manejo de errores que filtra internals (F-SAST-15) | ✅ Sin cambios en manejo de errores |
| Dependencias (F-SAST-13/16) | ⚠️→✅ `pnpm audit --prod` en `frontend/` reportó 1 High preexistente: `nanoid <3.3.18` vía `next>postcss>nanoid` (GHSA-2v37-7h3g-55p8). Corregido agregando `overrides.nanoid: '>=3.3.18'` en `frontend/pnpm-workspace.yaml`. Re-auditado: 0 vulnerabilidades. |

**Suppressions:** 0.

**Nota fuera de alcance:** `pnpm audit --prod` en `backend/` reporta 1 High preexistente
(`js-yaml <4.3.1` vía `swagger-jsdoc`, CVE-2026-59870) no relacionado con este ticket — ningún
archivo de backend fue modificado por FEAT-003. Queda fuera del gate de esta ticket; a evaluar en un
ticket propio.

---

Total: 14 categorías limpias, 1 vulnerabilidad High de dependencias corregida (0 tras el fix).
Report: `docs/daw/security/sast-FEAT-003.md`
Next: cerrar CODE → VERIFY.
