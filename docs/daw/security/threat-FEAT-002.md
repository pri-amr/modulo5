# Threat Model FEAT-002: Tokens semánticos de tema claro/oscuro

## Alcance analizado

Diseño de PLAN (2 bloques, ver `docs/daw/specs/spec-FEAT-002.md` una vez escrito):

1. `frontend/src/app/globals.css` — bloques `:root` (10 variables CSS, valores oscuros por
   defecto) y `.light` (mismas 10 variables, valores claros, override), regla `body { @apply
   bg-bg text-fg; }`.
2. `frontend/tailwind.config.ts` — `theme.extend.colors` mapeando los 10 tokens al patrón
   `rgb(var(--color-x) / <alpha-value>)`.
3. `frontend/src/components/Loader.tsx` — reemplazo de un `style` inline por clases Tailwind
   del token `accent-blue`.

Ninguno de los tres componentes acepta input del usuario, expone datos, introduce
autenticación/autorización, ni integra un servicio externo. Todos los valores de color son
literales estáticos definidos en el código fuente, no derivados de datos de usuario ni de la
base de datos.

## Trust Boundaries

No se cruza ni se introduce ningún trust boundary nuevo respecto de FEAT-001: los tres
componentes viven enteramente en el lado cliente, son estáticos (CSS y configuración de build),
y no leen ni escriben datos de sesión, `localStorage` o red. El único trust boundary relevante
del proyecto (cliente no confiable ↔ backend autenticado) no se toca en este ticket.

## Análisis STRIDE por componente

### 1. `globals.css` (tokens `:root`/`.light`) y `tailwind.config.ts`

| Categoría | Análisis |
|---|---|
| Spoofing | N/A — no hay identidad involucrada. |
| Tampering | Los valores son literales en el código fuente, versionados en git; modificarlos requiere acceso al repositorio (mismo nivel de confianza que cualquier otro cambio de código). No hay una vía de manipulación en tiempo de ejecución. |
| Repudiation | N/A — no hay una acción de usuario que registrar. |
| Information Disclosure | Los valores de color no son sensibles (son de diseño visual público). Ninguno. |
| Denial of Service | Un valor CSS malformado degradaría la presentación visual (por ejemplo, un color inválido cae al valor heredado), pero no afecta la disponibilidad del servicio ni de la API. Impacto bajo, acotado a estética. |
| Elevation of Privilege | N/A. |

### 2. `Loader.tsx`

| Categoría | Análisis |
|---|---|
| Spoofing | N/A. |
| Tampering | N/A — no procesa datos externos; el cambio es puramente de presentación (clases en lugar de `style` inline). |
| Repudiation | N/A. |
| Information Disclosure | Ninguno — no maneja datos. |
| Denial of Service | N/A. |
| Elevation of Privilege | N/A. |

## Datos sensibles (F-TM-05)

No aplica: este ticket no introduce, transporta ni almacena PII, credenciales ni datos
financieros. Los únicos datos son valores de color estáticos (clasificación: públicos, de
diseño). No corresponde especificar cifrado en tránsito/reposo (F-TM-07) porque no hay datos
sensibles en el alcance.

## Riesgos identificados

| Riesgo | STRIDE | Likelihood | Impact | Mitigación |
|---|---|---|---|---|
| Un valor CSS de token quede malformado y degrade la legibilidad (ej. contraste insuficiente entre `--color-fg` y `--color-bg` en algún modo) | Denial of Service (degradación de UX, no de servicio) | Low | Low | Los tests de `globals.test.ts` verifican los 10 valores exactos por modo (Block 1 del plan); un valor incorrecto rompe el test antes de llegar a CODE completo. |
| Consumo futuro de las variables CSS con datos dinámicos (fuera de este ticket) — si un ticket futuro permitiera al usuario elegir un color custom y lo interpolara directamente en `rgb(var(--x) / <alpha-value>)` sin sanitizar, sería un vector de inyección CSS | Tampering / Information Disclosure (futuro) | Low | Low | No aplica a este ticket (todos los valores son literales estáticos). Se deja documentado como advertencia para cualquier ticket futuro que haga los tokens configurables por el usuario: sanitizar/validar el valor antes de inyectarlo en una variable CSS consumida por Tailwind. |

No se identificaron riesgos CRITICAL ni HIGH. Los dos riesgos LOW no requieren aprobación
formal de riesgo aceptado (F-TM-04 aplica solo a CRITICAL/HIGH sin mitigación viable) — ambos
tienen mitigación concreta ya folded en el plan.

## Veredicto

```
┌─────────────────────────────────────────────────────────┐
│  /daw-threat-modeling — PASSED                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Attack surfaces identified: 3 (globals.css,             │
│    tailwind.config.ts, Loader.tsx — todos estáticos,     │
│    sin input de usuario)                                 │
│  Trust boundaries declared: 0 nuevos (ninguno se cruza)  │
│                                                          │
│  Risks:                                                  │
│    🟢 LOW: valor de token malformado degrada contraste   │
│       — Mitigación: tests de valores exactos (Block 1)   │
│    🟢 LOW: futura interpolación insegura de tokens        │
│       configurables por usuario — Mitigación: fuera de   │
│       alcance de este ticket, documentado para tickets    │
│       futuros                                             │
│                                                          │
│  Mitigaciones ya incorporadas al plan:                    │
│    1. globals.test.ts verifica los 10 valores exactos     │
│       por modo antes de que el spec se dé por completo    │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│  Risks: C:0 H:0 M:0 L:2                                   │
│  Report: docs/daw/security/threat-FEAT-002.md             │
└─────────────────────────────────────────────────────────┘
```
