# PRD FEAT-007: Ajustes visuales de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-007 |
| Tracker | none |
| Date | 2026-08-27 |
| PRD loops | 1 |
| Loops since last human decision | 0 |

## Context and Problem

Tras FEAT-006 (rediseño visual de `/register`, ya commiteado en la misma rama
`feat/FEAT-006-rediseno-registro`, sin PR abierto todavía), el usuario detectó varios problemas
visuales concretos al revisar el resultado:

1. El botón "Crear cuenta" queda pegado al último input (Confirmar clave), sin el espaciado que sí
   tienen los inputs entre sí.
2. El panel del ícono y el panel del formulario dentro de la tarjeta (`AuthLayout`) no están
   repartidos 50/50 — hoy el ícono ocupa 40% del ancho y el contenido el resto, de forma implícita.
3. Ni la tarjeta, ni los inputs, ni el botón, ni el banner de error tienen bordes redondeados a
   1rem — hoy usan el token compartido `rounded-field` (0.375rem).
4. El banner de error no tiene el mismo espaciado vertical que el resto de los elementos del
   formulario.
5. Cuando aparece el banner de error, el ancho de los inputs del formulario cambia — el formulario
   no tiene un ancho propio fijo, así que el contenido del banner fuerza un recálculo del ancho de
   todo el árbol.
6. El indicador de carga (`Loader`) se muestra embebido en el flujo del formulario (un spinner
   chico "arriba del botón") en vez de cubrir toda la pantalla mientras dura la carga.

Este ticket corrige los seis puntos sobre la pantalla ya construida, sin tocar ninguna regla de
validación del formulario. El punto 6 toca el componente compartido `Loader.tsx`, por lo que su
corrección es intencionalmente global (ver Out of Scope).

## Goals

- Que el botón "Crear cuenta" tenga el mismo espaciado visual respecto del formulario que ya tienen
  los campos entre sí, y quede centrado como ellos.
- Que la tarjeta de la pantalla de registro reparta su ancho interno 50/50 entre el ícono y el
  formulario en desktop.
- Que la tarjeta, los inputs, el botón y el banner de error tengan un radio de borde consistente de
  1rem, sin afectar el radio de borde de ninguna otra pantalla de la aplicación.

## Functional Requirements

- FR-01: El sistema debe repartir el panel del ícono y el panel de contenido de la tarjeta de
  registro en 50% de ancho cada uno, en viewport de 640px de ancho o más.
- FR-02: El sistema debe separar el último campo del formulario de registro del botón "Crear
  cuenta" con 13px de espacio vertical.
- FR-03: El sistema debe centrar horizontalmente el botón "Crear cuenta" dentro del contenedor del
  formulario, sin expandir su propio ancho al 100% de ese contenedor.
- FR-04: El sistema debe aplicar un radio de borde de 1rem a la tarjeta de la pantalla de registro.
- FR-05: El sistema debe aplicar un radio de borde de 1rem a cada input del formulario de registro.
- FR-06: El sistema debe aplicar un radio de borde de 1rem al botón "Crear cuenta".
- FR-07: El sistema debe aplicar un radio de borde de 1rem al banner de error de alta fallida del
  formulario de registro.
- FR-08: El sistema debe separar el banner de error de alta fallida con 13px de espacio vertical
  tanto del elemento que lo precede como del elemento que lo sigue.
- FR-09: El sistema debe mantener fijo el ancho de los inputs del formulario de registro,
  independientemente de si el banner de error se muestra o no.
- FR-10: El sistema debe ajustar (wrap) el texto del banner de error dentro del ancho fijo de su
  contenedor, en vez de expandir el contenedor.
- FR-11: El sistema debe mostrar el indicador de carga (`Loader`) como un overlay que cubre toda la
  pantalla, con un fondo semitransparente oscuro y el spinner centrado, en vez de embebido en el
  flujo del formulario que lo usa.

## Non-Functional Requirements

- NFR-01: El botón "Crear cuenta" debe mantener un área táctil de al menos 24x24px CSS (WCAG 2.2,
  criterio 2.5.8 nivel AA) tras el cambio de centrado y de ancho ajustado a su contenido.

## Acceptance Criteria

- AC-01 (FR-01): WHEN la pantalla de registro se renderiza en un viewport de 640px de ancho o más,
  THE sistema SHALL mostrar el panel del ícono y el panel de contenido con un ancho igual (50% cada
  uno) dentro de la tarjeta.
- AC-02 (FR-02): WHEN la pantalla de registro se renderiza, THE sistema SHALL separar el último
  campo del formulario del botón "Crear cuenta" con 13px de espacio vertical.
- AC-03 (FR-03): WHEN la pantalla de registro se renderiza, THE sistema SHALL centrar
  horizontalmente el botón "Crear cuenta" dentro del contenedor del formulario, sin que su ancho
  ocupe el 100% de ese contenedor.
- AC-04 (FR-04): WHEN la pantalla de registro se renderiza, THE sistema SHALL aplicar un radio de
  borde de 1rem a la tarjeta.
- AC-05 (FR-05): WHEN la pantalla de registro se renderiza, THE sistema SHALL aplicar un radio de
  borde de 1rem a cada input del formulario.
- AC-06 (FR-06): WHEN la pantalla de registro se renderiza, THE sistema SHALL aplicar un radio de
  borde de 1rem al botón "Crear cuenta".
- AC-07 (FR-07): IF el alta de la cuenta falla tras pasar todas las validaciones, THEN THE sistema
  SHALL mostrar el banner de error con un radio de borde de 1rem.
- AC-08 (NFR-01): WHEN la pantalla de registro se renderiza, THE sistema SHALL mostrar el botón
  "Crear cuenta" con un área táctil de al menos 24x24px CSS.
- AC-09 (FR-08): IF el alta de la cuenta falla tras pasar todas las validaciones, THEN THE sistema
  SHALL mostrar el banner de error separado por 13px de espacio vertical tanto del elemento
  anterior como del siguiente.
- AC-10 (FR-09): IF el banner de error se muestra, THEN THE sistema SHALL mantener el ancho de los
  inputs del formulario idéntico al que tienen cuando el banner no se muestra.
- AC-11 (FR-10): IF el texto del banner de error es más largo que el ancho disponible del
  contenedor, THEN THE sistema SHALL ajustarlo con salto de línea (wrap) sin expandir el ancho del
  contenedor.
- AC-12 (FR-11): WHILE una operación de carga está en curso (registro u otro formulario que use
  `Loader`), THE sistema SHALL mostrar un overlay de fondo semitransparente oscuro cubriendo todo
  el viewport, con el spinner centrado encima.

## Out of Scope

- Cualquier cambio de comportamiento o lógica del formulario (validaciones, mensajes, submit): ya
  resuelto en FEAT-006, no se toca en este ticket.
- Cambiar el token compartido `rounded-field` (0.375rem) en `tailwind.config.ts`: permanece sin
  modificar; `TransactionForm.tsx` (pantalla de transacciones) sigue usándolo sin cambios.
- El ancho total de la tarjeta respecto del viewport (sigue siendo 40% en ≥640px, valor de
  FEAT-006): este ticket solo cambia la proporción interna entre el panel del ícono y el panel de
  contenido, no el ancho externo de la tarjeta.
- Rediseño de cualquier otra pantalla de la aplicación (login, transacciones, etc.), **con la única
  excepción confirmada de FR-11**: el cambio de `Loader.tsx` es global por naturaleza del
  componente compartido, y por lo tanto también cambia visualmente cómo se ve la carga en
  `TransactionForm.tsx` — excepción intencional y confirmada con el usuario, no un error de
  alcance. Ningún otro aspecto de `TransactionForm.tsx` ni de la pantalla de transacciones se toca
  en este ticket.
- El comportamiento mobile (por debajo de 640px) ya definido en FEAT-006 — panel del ícono oculto,
  contenido a ancho completo: no cambia en este ticket.

## Risks and Mitigations

| Riesgo | Mitigación |
|---|---|
| Cambiar el ancho del panel del ícono de 40% a 50% podría alterar el comportamiento ya validado en el breakpoint mobile si el cambio no queda aislado al prefijo `sm:` | El cambio de ancho se aplica únicamente con clases prefijadas `sm:`, preservando el comportamiento mobile de FEAT-006 (panel del ícono oculto, contenido a ancho completo) sin modificarlo |
| Usar un valor arbitrario de Tailwind (`rounded-[1rem]`) en vez de cambiar el token compartido `rounded-field` podría generar inconsistencia visual futura si alguien no conoce esta decisión y agrega nuevos elementos con el token viejo | Documentado explícitamente en este PRD (Out of Scope) y a documentarse en el spec; la decisión replica el mismo criterio de aislamiento ya aplicado en FEAT-006 (prop `labelSize` de `FormField` para no afectar a `TransactionForm`) |

## Dependencies

- FEAT-006 (rediseño visual de `/register`): ya commiteado en la rama `feat/FEAT-006-rediseno-registro`
  (su PR todavía no existe). Este ticket continúa sobre esa misma rama, sin crear una rama nueva, y
  depende de que `frontend/src/components/AuthLayout.tsx` y `frontend/src/components/RegisterForm.tsx`
  existan con la forma que FEAT-006 les dio.
- `frontend/src/components/Loader.tsx` y su uso compartido en `frontend/src/components/TransactionForm.tsx`
  (FR-11): el cambio del componente es global por diseño (ver Out of Scope). Los tests existentes de
  `frontend/src/__tests__/components/TransactionForm.test.tsx` y
  `frontend/src/__tests__/components/Loader.test.tsx` podrían asumir el renderizado embebido actual
  del `Loader` y necesitar ajustarse a la nueva expectativa (overlay de pantalla completa) — a
  resolver en PLAN/CODE; no implica ningún cambio en la lógica de `TransactionForm.tsx`.
