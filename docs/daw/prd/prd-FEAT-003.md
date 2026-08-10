# PRD FEAT-003: Aplicar tokens semánticos de tema a componentes

| Field | Value |
|-------|-------|
| Ticket | FEAT-003 |
| Tracker | none |
| Date | 2026-08-08 |
| PRD loops | 0 |

## Context and Problem

FEAT-002 definió los 10 tokens semánticos de color (`bg`, `surface`, `surface-muted`, `fg`, `fg-muted`,
`line`, `accent`, `accent-blue`, `success`, `error`), respaldados por variables CSS por modo
(`:root` = oscuro por defecto, `.light` = override), y los expuso como colores de la paleta de
Tailwind. Esa feature los aplicó únicamente a `body` (fondo y texto base) y a `Loader.tsx`
(reemplazando el `#376BCB` hardcodeado), y dejó explícitamente fuera de alcance aplicarlos al resto
de la interfaz: "Rediseño visual completo de `TransactionForm`, `ThemeToggle`, `page.tsx` y
`layout.tsx` (aplicar tokens a inputs, botones, selects, espaciado, tipografía) — decisión explícita
del usuario; queda para un ticket de UI aparte" (Out of Scope, PRD FEAT-002).

Hoy esos cuatro archivos no usan ningún color de la paleta semántica: `layout.tsx` no fija ninguna
clase de tema inicial en `<html>`, `ThemeToggle.tsx` es un `<button>` sin ninguna clase visual,
`page.tsx` no aplica ningún token, y `TransactionForm.tsx` renderiza inputs, selects, labels, textos
de error y el botón de envío sin ninguna clase de Tailwind. El mecanismo de alternancia de tema
(FEAT-001) y la capa de tokens (FEAT-002) existen, pero no son visibles en la mayor parte de la
interfaz.

Este ticket cierra ese alcance pendiente: aplica los tokens semánticos ya existentes a los cuatro
componentes que FEAT-002 dejó afuera, sin definir tokens nuevos ni tocar el mecanismo de alternancia
de tema.

## Goals

- Aplicar los tokens semánticos de color de FEAT-002 a `layout.tsx`, `ThemeToggle.tsx`, `page.tsx` y
  `TransactionForm.tsx`, de forma que respondan al modo claro/oscuro igual que `body` y `Loader`.
- Que el `<html>` refleje el tema oscuro por defecto (RNF-11 de FEAT-002) desde el primer render del
  servidor, sin depender de que el efecto cliente de `ThemeSync` termine de correr.
- Que los inputs, selects y textos de error de `TransactionForm` comuniquen visualmente el estado de
  validación (borde de error) usando el token semántico de error, en lugar de depender solo del
  texto del mensaje.

## Functional Requirements

- FR-01: El sistema debe aplicar la clase `dark` de forma estática al elemento `<html>` en
  `layout.tsx`.
- FR-02: El sistema debe aplicar al botón de `ThemeToggle.tsx` las clases de Tailwind
  `fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted
  text-fg shadow hover:bg-accent-blue hover:text-white`.
- FR-03: El sistema debe aplicar a `page.tsx` clases de Tailwind que usen los tokens semánticos de
  fondo, texto y espaciado ya definidos por FEAT-002 (`bg-*`, `text-*`), de forma consistente con el
  resto de la interfaz, sin introducir tokens nuevos. El detalle exacto de las clases se define en la
  fase PLAN de este ticket.
- FR-04: El sistema debe calcular, para cada input y select de `TransactionForm` que tenga un error
  de validación asociado (`fieldErrors`), un indicador booleano de error por campo (`hasError`) a
  partir de `fieldErrors[campo]`.
- FR-05: El sistema debe aplicar a cada input y select de `TransactionForm` las clases de Tailwind
  `w-full rounded-field border bg-surface px-3 py-2 text-fg`, agregando `border-error` cuando el
  campo tiene error (`hasError` es verdadero) o `border-line` cuando no lo tiene.
- FR-06: El sistema debe aplicar a cada `<label>` de `TransactionForm` la clase de Tailwind
  `block text-sm font-medium`.
- FR-07: El sistema debe aplicar a cada texto de error de campo (`<p role="alert">` bajo un input o
  select) de `TransactionForm` la clase de Tailwind `mt-1 text-sm text-error`.
- FR-08: El sistema debe aplicar al botón de envío de `TransactionForm` la clase de Tailwind
  `rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50`.
- FR-09: El sistema no debe modificar ningún token semántico definido en `globals.css` o
  `tailwind.config.ts` (los 10 tokens de FEAT-002 permanecen sin cambios).

## Non-Functional Requirements

- NFR-01: Usabilidad — al alternar entre modo claro y modo oscuro, los cuatro componentes cubiertos
  por este ticket deben actualizar su apariencia visual sin recargar la página, reutilizando el
  mismo mecanismo de FEAT-001/FEAT-002 (sin lógica de tema nueva).
- NFR-02: Accesibilidad — el indicador visual de error (`border-error`) en `TransactionForm` es un
  refuerzo visual adicional al mensaje de error existente (`role="alert"`); no debe ser el único
  medio de comunicar el error (el texto y el `role="alert"` se mantienen sin cambios).

## Acceptance Criteria

- AC-01: WHEN se carga la aplicación por primera vez (antes de que `ThemeSync` sincronice el estado
  del store), THE system SHALL renderizar el elemento `<html>` con la clase `dark` presente en el
  HTML servido. (covers FR-01)
- AC-02: WHEN se inspecciona `ThemeToggle` en cualquier modo, THE system SHALL mostrar el botón con
  las clases de posicionamiento fijo, forma circular y tokens de color (`bg-surface-muted`, `text-fg`)
  especificadas en FR-02, cambiando a `bg-accent-blue`/`text-white` en estado hover. (covers FR-02)
- AC-03: WHEN se inspecciona `page.tsx` en modo claro y en modo oscuro, THE system SHALL mostrar sus
  clases de fondo y texto usando exclusivamente tokens semánticos ya definidos por FEAT-002, sin
  colores hardcodeados. (covers FR-03, FR-09)
- AC-04: WHEN un campo de `TransactionForm` (input o select) no tiene error de validación, THE system
  SHALL renderizarlo con la clase `border-line`. (covers FR-04, FR-05)
- AC-05: WHEN un campo de `TransactionForm` tiene un error de validación (`fieldErrors[campo]` no
  vacío), THE system SHALL renderizarlo con la clase `border-error` en lugar de `border-line`.
  (covers FR-04, FR-05)
- AC-06: WHEN se inspecciona cualquier `<label>` o el texto de error de un campo en `TransactionForm`,
  THE system SHALL mostrar las clases `block text-sm font-medium` en el label y
  `mt-1 text-sm text-error` en el texto de error. (covers FR-06, FR-07)
- AC-07: WHEN se inspecciona el botón de envío de `TransactionForm` en estado habilitado y en estado
  deshabilitado (`loading=true`), THE system SHALL mostrar la clase `bg-accent` con opacidad reducida
  (`disabled:opacity-50`) en el segundo caso. (covers FR-08)
- AC-08: IF se ejecutan los tests existentes de `TransactionForm`, `ThemeToggle`, `page.tsx` y
  `layout.tsx` después de este cambio, THEN THE system SHALL seguir pasando sin que ningún test deba
  relajar sus aserciones de comportamiento (solo pueden actualizarse aserciones que verificaban la
  ausencia previa de clases, si existieran). (covers FR-01 a FR-08)

## Out of Scope

- Definir tokens semánticos nuevos — se reutilizan únicamente los 10 ya definidos por FEAT-002.
- Cambiar el mecanismo de alternancia de tema (`useThemeStore`, `useSyncThemeClass`, `ThemeSync`) —
  ya resuelto en FEAT-001, no se toca en este ticket.
- Rediseño de layout, tipografía o espaciado más allá de las clases especificadas en este PRD (por
  ejemplo, grillas, breakpoints responsivos nuevos, animaciones).
- Aplicar tokens a `Loader.tsx` — ya resuelto en FEAT-002.
- Definir la utilidad `rounded-field` si no existe ya en la configuración de Tailwind del proyecto —
  se investiga y resuelve en la fase PLAN (impact scan); si no existe, se define como parte de este
  ticket con el valor que ya use el resto del proyecto para radios de borde, o uno nuevo si no hay
  precedente.

## Risks and Mitigations

- Riesgo: la utilidad `rounded-field` usada en FR-05 y FR-08 no es una clase estándar de Tailwind —
  depende de que el proyecto la haya definido como alias en `tailwind.config.ts` (algo no confirmado
  al momento de este PRD). Mitigación: la fase PLAN debe verificar su existencia (impact scan) antes
  de escribir el spec; si no existe, se define explícitamente como parte del spec, con el valor de
  radio de borde que ya use el resto de la interfaz.
- Riesgo: agregar `border-error`/`border-line` condicionalmente a cada campo puede romper tests
  existentes de `TransactionForm.test.tsx` que no esperan esas clases. Mitigación: los tests deben
  actualizarse para reflejar el nuevo comportamiento (cubierto por AC-08), sin relajar ninguna
  aserción de comportamiento funcional.
- Riesgo: agregar `className="dark"` estático a `<html>` en paralelo con `useSyncThemeClass` (que
  agrega/remueve `light`/`dark` dinámicamente tras la hidratación) podría producir una clase
  duplicada o un estado inconsistente si no se revisa la interacción entre ambos. Mitigación: la fase
  PLAN debe confirmar que `useSyncThemeClass` remueve la clase estática correctamente antes de
  agregar la dinámica (ya lo hace: `classList.remove("light", "dark")` antes de `add(theme)`), y que
  no se rompe el mismatch de hidratación de React.

## Dependencies

- Depende de los tokens semánticos y de la configuración de Tailwind ya implementados por FEAT-002
  (`globals.css`, `tailwind.config.ts`) — este ticket no los modifica, solo los consume.
- Depende del mecanismo de alternancia de tema de FEAT-001 (`useThemeStore`, `useSyncThemeClass`,
  `ThemeSync`) — no se modifica, solo se coordina con él (ver Riesgos).
