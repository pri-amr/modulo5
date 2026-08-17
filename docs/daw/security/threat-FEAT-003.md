# Threat Model FEAT-003: Aplicar tokens semánticos de tema a componentes

| Field | Value |
|-------|-------|
| Ticket | FEAT-003 |
| Spec | docs/daw/specs/spec-FEAT-003.md |
| Date | 2026-08-11 |

## Componentes analizados

Los 5 archivos que el spec modifica: `frontend/tailwind.config.ts`, `frontend/src/app/layout.tsx`,
`frontend/src/components/ThemeToggle.tsx`, `frontend/src/app/page.tsx`,
`frontend/src/components/TransactionForm.tsx`.

## Trust boundaries (F-TM-02)

Ninguna de las modificaciones cruza un trust boundary nuevo. Todos los componentes son
`app`/`components` del frontend Next.js, renderizados en el cliente/servidor propio de la
aplicación. Los boundaries preexistentes del sistema (cliente ↔ backend Express, formulario ↔
`useCreateTransaction` ↔ API) no se tocan — este ticket no agrega ni modifica ningún endpoint, ni
cambia cómo `TransactionForm` envía datos al backend. `handleChange`, `submit` y la validación de
`useCreateTransaction` permanecen exactamente iguales a antes; el único cambio en `TransactionForm`
es de presentación (clases) y de tag HTML del campo Descripción (`textarea` → `input type="text"`),
sin alterar el flujo de datos.

## Análisis STRIDE por componente

### `tailwind.config.ts` (agrega `borderRadius.field`)
Archivo de configuración de build, no ejecuta en runtime del navegador ni procesa input de usuario.

| Categoría | Evaluación |
|---|---|
| Spoofing | N/A — no hay identidad involucrada |
| Tampering | N/A — valor estático, sin input externo |
| Repudiation | N/A |
| Information Disclosure | N/A — no maneja datos |
| DoS | N/A |
| Elevation of Privilege | N/A |

### `layout.tsx` (agrega `className="dark"` estático)
Cambio de una clase CSS estática en el `<html>` raíz.

| Categoría | Evaluación |
|---|---|
| Spoofing | N/A |
| Tampering | N/A — no hay dato mutable involucrado, la clase es un literal |
| Repudiation | N/A |
| Information Disclosure | N/A |
| DoS | N/A |
| Elevation of Privilege | N/A |

### `ThemeToggle.tsx` (agrega clases Tailwind)
Botón sin nueva lógica; sigue leyendo `theme`/`toggleTheme`/`hasHydrated` del store existente
(`useThemeStore`), no modificado por este ticket.

| Categoría | Evaluación |
|---|---|
| Spoofing | N/A — no hay autenticación involucrada |
| Tampering | N/A — clases estáticas, sin interpolación de datos externos |
| Repudiation | N/A |
| Information Disclosure | N/A |
| DoS | N/A |
| Elevation of Privilege | N/A |

### `page.tsx` (agrega clases Tailwind)
Entry point de la ruta `/`, sin lógica nueva ni datos nuevos.

| Categoría | Evaluación |
|---|---|
| Spoofing | N/A |
| Tampering | N/A |
| Repudiation | N/A |
| Information Disclosure | N/A |
| DoS | N/A |
| Elevation of Privilege | N/A |

### `TransactionForm.tsx` (clases + `hasError` + textarea→input)
Único componente que interactúa con input de usuario (montos, fechas, descripción, etc.) y con datos
potencialmente sensibles (transacciones financieras). Es el componente que amerita el análisis más
cuidadoso.

| Categoría | Evaluación |
|---|---|
| **Spoofing** | N/A — no cambia autenticación ni identidad del usuario. |
| **Tampering** | La clase CSS que se aplica condicionalmente (`border-error`/`border-line`) se deriva de `hasError(field)`, un booleano calculado internamente a partir de `fieldErrors[campo]` (string ya generado por `useCreateTransaction`, no por el usuario directamente) — no hay interpolación de texto de usuario en `className`, por lo que no hay vector de inyección de clases arbitrarias. El valor de `values.description` sigue yendo a un atributo `value` controlado de React (auto-escapado), igual que antes del cambio de tag. |
| **Repudiation** | Sin cambios — no se agrega ni quita logging. |
| **Information Disclosure** | Ninguna: no se expone ningún dato nuevo en el DOM; `hasError` no revela nada que `fieldErrors` no revelara ya vía el `<p role="alert">` existente. |
| **DoS** | N/A — sin llamadas nuevas a servicios externos ni loops. |
| **Elevation of Privilege** | N/A — sin cambios de autorización. |

**Nota sobre el cambio de tag (`textarea` → `input`):** no introduce una superficie nueva. React
escapa `value` igual en ambos elementos; ninguno usa `dangerouslySetInnerHTML` (prohibido por
`AGENTS.md` de todas formas). El único cambio de comportamiento es que el usuario deja de poder
ingresar saltos de línea en Descripción — un cambio de UX ya acordado y documentado en el PRD
(FR-10), no un cambio de seguridad.

## Datos sensibles (F-TM-05, F-TM-07)

`TransactionForm` maneja datos financieros (montos, fuente de dinero, categoría) — clasificación
**financiera**, ya establecida y protegida por FEAT-001 (transporte HTTPS + backend con
autenticación, no tocados por este ticket). Este ticket no agrega, no persiste y no transmite ningún
dato nuevo: solo cambia cómo se presentan visualmente los campos existentes. No aplica ningún
requisito nuevo de cifrado (F-TM-07) porque no se introduce ningún flujo de datos nuevo.

## Riesgos identificados

Ninguno de severidad CRITICAL, HIGH o MEDIUM. Este ticket es exclusivamente de presentación (clases
CSS) más un cambio de tag HTML sin impacto en lógica de datos, validación o transporte.

| Riesgo | STRIDE | Likelihood | Impact | Mitigación |
|---|---|---|---|---|
| Ninguno identificado por encima de LOW | — | — | — | — |

🟢 **LOW** (informativo, no requiere mitigación): el cambio de `textarea` a `input type="text"` en
Descripción reduce la longitud práctica de texto visible al usuario (un input de una línea vs. un
textarea), pero no impone ningún límite de caracteres nuevo ni relaja ninguno existente — la
validación de longitud (si existe) vive en `useCreateTransaction`, no tocada por este ticket. No es
una regresión de seguridad, solo una nota de UX.

## Mitigaciones a incorporar al spec

Ninguna — no hay riesgos CRITICAL/HIGH que requieran cambio de diseño.

---

```
┌─────────────────────────────────────────────────────────┐
│  /daw-threat-modeling — PASSED                            │
├─────────────────────────────────────────────────────────┤
│                                                            │
│  Attack surfaces identified: 5 (los 5 archivos del spec)  │
│  Trust boundaries declared: 0 nuevos (ninguno cruzado)     │
│                                                            │
│  Risks:                                                    │
│    🟢 LOW: cambio de textarea a input de una línea en      │
│       Descripción — nota de UX, no de seguridad            │
│                                                            │
│  Mitigations to fold into the spec:                        │
│    (ninguna necesaria)                                     │
│                                                            │
│  ─────────────────────────────────────────────────────    │
│  Risks: C:0 H:0 M:0 L:1                                    │
│  Report: docs/daw/security/threat-FEAT-003.md              │
└─────────────────────────────────────────────────────────┘
```
