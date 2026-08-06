# PRD FEAT-002: Tokens semánticos de tema claro/oscuro (Tailwind + variables CSS en globals.css)

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| Tracker | none |
| Date | 2026-08-06 |
| PRD loops | 1 |

## Context and Problem

FEAT-001 implementó el mecanismo de alternancia de tema (store de Zustand con `persist`, clase `.dark` aplicada al `<html>` vía `useSyncThemeClass`/`ThemeSync`, modo oscuro por defecto en la primera carga), pero ningún sistema de color real lo respalda: `globals.css` solo importa Tailwind (`@import "tailwindcss"; @config "../../tailwind.config.ts";`) sin definir ni un solo token de color, y el único color concreto de la aplicación hoy es un valor hexadecimal (`#376BCB`) fijado por estilo inline en `Loader.tsx`, al margen de Tailwind. Alternar `theme` hoy cambia una clase en el HTML sin que ningún color visible responda a ese cambio.

Esta feature construye la capa de tokens semánticos de color (variables CSS en `:root`/`.dark`, expuestas como colores de Tailwind) que convierte el mecanismo ya existente en una interfaz efectivamente temizada, cumpliendo RNF-11 (modo claro/oscuro para toda la interfaz), y unifica el color del indicador de carga bajo esa misma capa en lugar de dejarlo hardcodeado, cumpliendo RNF-12.

## Goals

- Definir un conjunto de tokens semánticos de color (fondo, superficie, superficie atenuada, texto, texto atenuado, línea, acento, acento secundario, éxito, error), cada uno con un valor para modo claro y otro para modo oscuro.
- Exponer esos tokens como colores de la paleta de Tailwind, identificados por su nombre semántico, de forma que un componente los consuma con una única clase de utilidad sin declarar variantes `dark:`.
- Aplicar el color base (fondo y texto) de la aplicación a nivel `body` usando esos tokens.
- Eliminar el único color hardcodeado detectado en la base de código (`#376BCB` en `Loader.tsx`), reemplazándolo por el token semántico equivalente.

## Functional Requirements

- FR-01: El sistema debe definir un token semántico de color de fondo (`--color-bg`), con un valor para modo claro y otro para modo oscuro.
- FR-02: El sistema debe definir un token semántico de color de superficie (`--color-surface`), con un valor para modo claro y otro para modo oscuro.
- FR-03: El sistema debe definir un token semántico de superficie atenuada (`--color-surface-muted`), con un valor para modo claro y otro para modo oscuro.
- FR-04: El sistema debe definir un token semántico de color de texto principal (`--color-fg`), con un valor para modo claro y otro para modo oscuro.
- FR-05: El sistema debe definir un token semántico de color de texto atenuado (`--color-fg-muted`), con un valor para modo claro y otro para modo oscuro.
- FR-06: El sistema debe definir un token semántico de color de borde o línea divisoria (`--color-line`), con un valor para modo claro y otro para modo oscuro.
- FR-07: El sistema debe definir un token semántico de color de acento (`--color-accent`), con un valor para modo claro y otro para modo oscuro.
- FR-08: El sistema debe definir un token semántico de color de acento secundario (`--color-accent-blue`) cuyo valor en modo claro coincida con el color definido en RNF-12 para el indicador de carga (#376BCB).
- FR-09: El sistema debe definir un token semántico de color de éxito (`--color-success`), con un valor para modo claro y otro para modo oscuro.
- FR-10: El sistema debe definir un token semántico de color de error (`--color-error`), con un valor para modo claro y otro para modo oscuro.
- FR-11: El sistema debe exponer cada token semántico de color como un color de la paleta de Tailwind, identificado por el mismo nombre semántico sin el prefijo `color-`, de forma que un componente pueda aplicarlo con una única clase de utilidad (por ejemplo `bg-surface`) sin declarar una variante `dark:` adicional.
- FR-12: El sistema debe aplicar el token de fondo y el token de texto principal como estilo base del elemento `body`.
- FR-13: El sistema debe reemplazar el color hardcodeado del indicador de carga (`Loader.tsx`, valor `#376BCB` fijado por estilo inline) por el token semántico de acento secundario, sin cambiar el valor visual resultante en modo claro.
- FR-14: El sistema debe actualizar el valor efectivo de todos los tokens semánticos de color al alternar entre modo claro y modo oscuro, sin requerir recargar la página, reutilizando el mecanismo de clase `.dark` en `<html>` ya implementado en FEAT-001.

## Non-Functional Requirements

- NFR-01: Usabilidad — el token de acento secundario en modo claro debe reproducir exactamente el valor #376BCB que usa hoy el indicador de carga (RNF-12), sin alterar su apariencia visual respecto de antes de esta feature.
- NFR-02: Usabilidad — al alternar entre modo claro y modo oscuro, los 10 tokens semánticos de color definidos por esta feature deben actualizar su valor efectivo en toda la interfaz sin requerir recargar la página (RNF-11).

## Acceptance Criteria

- AC-01: WHEN se carga la aplicación en modo claro, THE system SHALL renderizar el `body` con el color de fondo y el color de texto correspondientes a los valores definidos en `:root` para `--color-bg` y `--color-fg`. (covers FR-01, FR-04, FR-12)
- AC-02: WHEN el usuario alterna a modo oscuro, THE system SHALL renderizar el `body` con el color de fondo y el color de texto correspondientes a los valores definidos bajo la clase `.dark` para `--color-bg` y `--color-fg`. (covers FR-01, FR-04, FR-12, FR-14)
- AC-03: WHEN se inspecciona el indicador de carga (`Loader`) en modo claro, THE system SHALL mostrar su color de acento con el mismo valor #376BCB que tenía antes de esta feature, obtenido ahora del token semántico en lugar de un estilo inline. (covers FR-08, FR-13, NFR-01)
- AC-04: WHERE un componente necesita aplicar un color semántico, THE system SHALL permitir hacerlo con una única clase de utilidad de Tailwind (por ejemplo `bg-surface`, `text-fg-muted`) sin que el componente declare una variante `dark:` adicional. (covers FR-11)
- AC-05: WHEN el usuario alterna entre modo claro y modo oscuro, THE system SHALL actualizar el valor efectivo de los 10 tokens semánticos de color (fondo, superficie, superficie atenuada, texto, texto atenuado, línea, acento, acento secundario, éxito, error) sin recargar la página. (covers FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-14, NFR-02)
- AC-06: IF se inspecciona `Loader.tsx` después de esta feature, THEN THE system SHALL no contener ningún valor de color hexadecimal ni estilo inline de color, dado que el color debe provenir exclusivamente del token semántico. (covers FR-13)

## Out of Scope

- Rediseño visual completo de `TransactionForm`, `ThemeToggle`, `page.tsx` y `layout.tsx` (aplicar tokens a inputs, botones, selects, espaciado, tipografía) — decisión explícita del usuario; queda para un ticket de UI aparte.
- Tokens de diseño no relacionados con color (espaciado, tipografía, radios, sombras).
- Rediseño o cambio del mecanismo de animación del `Loader` (hoy `animate-spin` sobre un `div` con borde) — cualquier animación tipo `loader-dash` (`stroke-dasharray`/`stroke-dashoffset`) asume una implementación SVG que `Loader.tsx` no tiene hoy; si se decide ese rediseño, es un ticket aparte.
- Selector de preferencia del sistema operativo (`prefers-color-scheme`) para elegir el modo inicial — RNF-11 exige modo oscuro por defecto de forma explícita, no seguir la preferencia del SO.
- Persistencia de la elección de tema — ya resuelta en FEAT-001 vía `persist` de Zustand; no se toca en este ticket.
- Alta de nuevos tokens semánticos más allá de los 10 listados en Functional Requirements (por ejemplo, variantes de énfasis adicionales) — se agregan en tickets futuros a medida que un componente los necesite.

## Risks and Mitigations

- Riesgo: el snippet de referencia entregado para esta feature usa las directivas `@tailwind base; @tailwind components; @tailwind utilities;` (sintaxis de Tailwind 3), mientras que `globals.css` ya usa la sintaxis de Tailwind 4 vigente en el proyecto (`@import "tailwindcss"; @config "../../tailwind.config.ts";`). Mitigación: la implementación debe preservar la sintaxis v4 ya configurada y agregar únicamente el bloque de tokens (`:root`/`.dark`) y la regla de `body`, sin reintroducir directivas v3.
- Riesgo: al exponer los tokens con el patrón `rgb(var(--x) / <alpha-value>)` de Tailwind, cualquier consumo directo de la variable CSS fuera de una clase de Tailwind (por ejemplo `style={{ color: "var(--color-fg)" }}`) produciría un color inválido, porque la variable por sí sola no es un color CSS válido (le falta la función `rgb(...)`). Mitigación: documentar en el código que las variables se consumen únicamente a través de las clases de Tailwind generadas, nunca directamente en `style`.
- Riesgo: al reemplazar el estilo inline de `Loader.tsx`, un test existente que verifique ese estilo por atributo (`style` o `borderColor`) puede dejar de pasar aunque el color visual no cambie. Mitigación: actualizar ese test para verificar la clase de Tailwind aplicada en lugar del atributo `style`.

## Dependencies

- Depende del mecanismo de alternancia de tema ya implementado en FEAT-001 (`useThemeStore`, `useSyncThemeClass`, `ThemeSync`, clase `.dark` en `<html>`) — este ticket no lo modifica, solo consume la clase que ya se aplica.
- Depende de la configuración vigente de Tailwind 4 del proyecto (`tailwind.config.ts`, `postcss.config.mjs`, la directiva `@config` en `globals.css`) — se extiende, no se reemplaza.
