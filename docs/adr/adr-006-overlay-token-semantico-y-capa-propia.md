# ADR-006: El overlay del `Loader` usa token semántico propio y su propia capa de apilamiento

| Field | Value |
|-------|-------|
| Date | 2026-08-29 |
| Ticket | FEAT-007 |
| Status | Accepted |

## Context

El Bloque 3 de FEAT-007 convirtió al `Loader` en un overlay de pantalla completa. El spec
(`docs/ddw/specs/spec-FEAT-007.md`, Block 3) especificaba la clase literal
`fixed inset-0 z-50 flex items-center justify-center bg-black/50`. Al implementarlo aparecieron dos
problemas que el spec no había previsto, ambos detectados por el `arch-auditor`:

1. `globals.css` declara en su comentario de cabecera que los tokens semánticos son "la única fuente
   de verdad para los colores de la app", y define cada uno con valor propio para tema oscuro y para
   tema claro. `bg-black/50` es un color crudo y *theme-agnostic*: el mismo negro en ambos temas,
   mientras el resto de la interfaz conmuta.
2. `z-50` es exactamente el mismo valor que usa `ThemeToggle.tsx`, el único otro elemento
   posicionado de la aplicación. Con z-index empatado gana el orden del DOM, y `ThemeToggle` se
   renderiza en el layout raíz antes que el contenido. La mitigación R-01 del threat model
   (`docs/ddw/security/threat-FEAT-007.md`) pedía "un z-index explícito y alto"; `z-50` es explícito
   pero no es alto respecto del único competidor que existe.

## Options considered

### Option 1: Implementar el spec al pie de la letra (`bg-black/50`, `z-50`) y registrar los dos huecos como deuda
- **Pros:** cero divergencia entre código y spec; ningún archivo de infraestructura compartida se
  toca; el bloque cierra en una sola ronda.
- **Cons:** deja el scrim fuera del sistema de color, sin conmutar por tema; y deja la precedencia
  del overlay sobre `ThemeToggle` dependiendo del orden del DOM, que es una garantía que se rompe
  sola si alguien reordena el layout o mueve el toggle a un portal, sin que ningún test lo detecte.

### Option 2: Token semántico `--color-overlay` con valor por tema, y capa propia por encima de la escala stock
- **Pros:** el scrim conmuta con el tema como todo el resto de la paleta; la precedencia sobre
  `ThemeToggle` deja de depender del orden del DOM y pasa a estar afirmada por un test; cierra la
  primera cláusula de la mitigación R-01.
- **Cons:** el bloque expande su alcance a dos archivos de infraestructura compartida
  (`globals.css`, `tailwind.config.ts`) que la sección "Files" del spec no contemplaba; y el
  proyecto queda con dos valores de z-index sueltos sin escala tokenizada que los ordene.

## Decision

Opción 2, decidida por el usuario tras el informe del `arch-auditor`. Se agregó `--color-overlay` a
`:root` (`5 5 10`, `#05050A`) y a `.light` (`63 61 77`, `#3F3D4D`) en `globals.css`, se mapeó como
color `overlay` en `tailwind.config.ts`, y el overlay quedó como
`fixed inset-0 z-[100] flex items-center justify-center bg-overlay/50`.

El valor de tema oscuro es más profundo que `--color-bg` (`#0B0B12`) para que la tarjeta siga
flotando por encima del fondo en vez de fundirse con él, y conserva el sesgo azul-violeta del
sistema en lugar del negro acromático. El de tema claro, compuesto al 50% sobre blanco, da ≈
`#9F9EA6`: un velo perceptible pero más suave que el `#808080` que producía `black/50`.

`z-[100]` es un valor arbitrario porque la escala stock de Tailwind termina en 50 y el proyecto no
define una escala `zIndex` propia; los valores arbitrarios ya son patrón establecido acá
(`rounded-[1rem]`, `space-y-[13px]`, `sm:w-[40%]`), y ADR-005 los adoptó explícitamente en este
mismo ticket.

La adición del token es puramente aditiva: ningún token existente cambió de valor, y `overlay` tiene
un solo consumidor (`Loader.tsx`). Por eso la desviación se registró acá en vez de reabrir PLAN.

## Consequences

- Archivos afectados más allá de los que el spec listaba para el Bloque 3: `globals.css`,
  `tailwind.config.ts`, y sus dos tests guardianes `__tests__/app/globals.test.ts` y
  `__tests__/app/tailwind.config.test.ts`, que se extendieron para cubrir el token nuevo. Sin esa
  extensión, borrar `--color-overlay` de `.light` habría dejado el overlay transparente en tema
  claro con la suite entera en verde.
- El spec quedó divergente en tres puntos respecto del código: la clase del overlay, la clase
  esperada en `test-block3-loader-fullscreen-overlay`, y la lista de archivos del bloque. Este ADR es
  la fuente de verdad sobre esos tres puntos hasta que un loop correctivo a PLAN alinee el documento.
- Convención de capas que queda establecida por esta decisión: un componente con posicionamiento
  fijo que deba cubrir la interfaz vive en `z-[100]`; `z-50` queda para el chrome persistente tipo
  `ThemeToggle`. No hay escala tokenizada que lo imponga, así que el contrato vive acá y en los tests
  de ambos componentes.
- Limitación medida y aceptada: sobre el scrim de tema claro, el spinner (`accent-blue` = `#376BCB`)
  queda en **≈1.98:1**, por debajo del umbral 3:1 de WCAG 2.1 SC 1.4.11. En tema oscuro da 8.3:1. El
  `bg-black/50` original daba 1.29:1, así que el token mejoró el contraste sin llevarlo al umbral, y
  ajustar el valor del token no lo resuelve: oscurecerlo acerca el scrim a la luminancia del spinner
  y empeora el número, aclararlo vuelve el velo invisible sobre página blanca. La salida es cambiar
  el color del spinner sobre el scrim, que este bloque tenía vedado. Queda para un ticket de
  seguimiento; el mitigante existente es `role="status"` + `aria-label="Cargando"`, que cubre a
  lectores de pantalla.
- Efecto colateral aceptado: al volverse `fixed`, el `Loader` deja de ocupar altura pero sigue siendo
  hermano dentro del contenedor `space-y-[13px]` de `RegisterForm`, así que el botón hereda 13px de
  margen superior mientras dura la carga. Antes del cambio eran 45px. Montar el overlay por portal a
  `body` lo elimina de raíz y es la ubicación correcta de un scrim de viewport; queda para un ticket
  de seguimiento.
