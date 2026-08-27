# PRD FEAT-006: Rediseño visual de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-006 |
| Tracker | none |
| Date | 2026-08-27 |
| PRD loops | 0 |
| Loops since last human decision | 0 |

## Context and Problem

La pantalla de registro (`frontend/src/app/register/page.tsx` + `RegisterForm.tsx`, entregada en
FEAT-005) tiene hoy un layout de una sola columna sin jerarquía visual: el formulario ocupa todo el
ancho disponible, los campos quedan pegados unos a otros sin espaciado, la fuente de labels e inputs
es chica, y el mensaje de error que dispara cuando el alta falla (por ejemplo AC-02 de FEAT-005,
email ya registrado) se muestra como texto plano sin ningún estilo (`RegisterForm.tsx:77`), a
diferencia de los errores de campo individuales que sí tienen color y espaciado
(`FormField.tsx:16-20`). Además, el copy usa la palabra "Contraseña" en labels y mensajes de
validación, y se quiere reemplazar por "Clave".

Este ticket es puramente visual/de layout sobre la pantalla de registro ya funcional: no cambia
ninguna regla de negocio ni de validación existente (FR-01 a FR-08 y AC-01 a AC-07 de FEAT-005 se
mantienen intactos), solo su presentación y su copy.

## Goals

- Dar a la pantalla de registro un layout de tarjeta centrada con jerarquía visual clara (ícono +
  formulario), en vez del formulario suelto de ancho completo actual.
- Que el error de alta fallida sea visualmente imposible de pasar por alto (hoy es indistinguible de
  texto normal).
- Reemplazar la palabra "Contraseña" por "Clave" en toda la pantalla.
- Mejorar la legibilidad (tamaño de fuente, espaciado) sin tocar ninguna regla de validación.

## Functional Requirements

- FR-01: El sistema debe mostrar, en viewports de 640px de ancho o más, la pantalla de registro como
  una tarjeta centrada horizontal y verticalmente cuyo ancho es igual al 40% del ancho del viewport,
  dividida en dos columnas: la columna izquierda con el ícono y la columna derecha con el título
  "Crear cuenta" seguido del formulario.
- FR-02: El sistema debe ocultar la columna izquierda (ícono) en viewports de menos de 640px de
  ancho, mostrando únicamente el título y el formulario centrados, ocupando el ancho disponible.
- FR-03: El sistema debe renderizar el ícono de la columna izquierda como un SVG inline de temática
  financiera genérica, sin agregar ninguna dependencia de librería de íconos al proyecto.
- FR-04: El sistema debe etiquetar el campo de contraseña como "Clave" y el campo de confirmación
  como "Confirmar clave", sin mostrar en ningún lugar de la pantalla la palabra "Contraseña".
- FR-05: El sistema debe reemplazar la palabra "contraseña" por "clave" en todos los mensajes de
  validación del formulario de registro (campo requerido, longitud mínima, confirmación no
  coincidente).
- FR-06: El sistema debe mostrar el mensaje de error de alta fallida (el que hoy se renderiza sin
  estilo en `RegisterForm.tsx:77`) dentro de un banner de alerta visualmente distinguible, con fondo,
  borde y padding, en vez de como texto plano.
- FR-07: El sistema debe renderizar el texto de los inputs del formulario de registro a 18px
  (`text-lg`) y el texto de los labels a 16px (`text-base`).
- FR-08: El sistema debe aplicar 13px de espaciado vertical entre campos consecutivos del formulario
  de registro.

## Non-Functional Requirements

- NFR-01: El texto de la pantalla de registro y el banner de error de FR-06 deben cumplir un ratio de
  contraste de color de al menos 4.5:1 contra su fondo (WCAG 2.1 nivel AA).

## Acceptance Criteria

- AC-01 (FR-01): WHEN un usuario visita la pantalla de registro en un viewport de 640px de ancho o
  más, THE sistema SHALL mostrar una tarjeta centrada horizontal y verticalmente con un ancho igual
  al 40% del ancho del viewport, con el ícono en la columna izquierda y el título más el formulario
  en la columna derecha.
- AC-02 (FR-02): WHEN un usuario visita la pantalla de registro en un viewport de menos de 640px de
  ancho, THE sistema SHALL ocultar la columna del ícono y mostrar únicamente el título y el
  formulario centrados.
- AC-03 (FR-03): THE sistema SHALL renderizar el ícono de la columna izquierda como un elemento SVG
  inline en el HTML de la página, sin cargar ninguna librería de íconos externa.
- AC-04 (FR-04): WHEN la pantalla de registro se renderiza, THE sistema SHALL mostrar el label
  "Clave" para el campo de contraseña y "Confirmar clave" para el campo de confirmación, sin que la
  palabra "Contraseña" aparezca en ningún texto visible de la pantalla.
- AC-05 (FR-05): IF el usuario deja vacío el campo de clave, ingresa una clave de menos de 8
  caracteres, o ingresa una confirmación que no coincide con la clave, THEN THE sistema SHALL mostrar
  el mensaje de validación correspondiente usando la palabra "clave" en vez de "contraseña".
- AC-06 (FR-06): IF el alta de la cuenta falla después de pasar todas las validaciones (por ejemplo,
  email ya registrado o error de guardado), THEN THE sistema SHALL mostrar el mensaje de error dentro
  de un banner con fondo, borde y padding visualmente distinguible del resto del formulario.
- AC-07 (FR-07): WHEN la pantalla de registro se renderiza, THE sistema SHALL aplicar un tamaño de
  fuente de 18px a los inputs del formulario y de 16px a los labels.
- AC-08 (FR-08): WHEN la pantalla de registro se renderiza, THE sistema SHALL separar cada campo del
  formulario del siguiente con 13px de espacio vertical.
- AC-09 (NFR-01): THE sistema SHALL renderizar el texto de la pantalla de registro y el banner de
  error de FR-06 con un ratio de contraste de al menos 4.5:1 contra su fondo.

## Out of Scope

- Cualquier cambio a las reglas de validación existentes (formato de email, longitud mínima de
  clave, duplicados, campos requeridos): este ticket solo cambia copy y estilo visual, no
  comportamiento. Las reglas siguen siendo las de FEAT-005 (FR-01 a FR-08, AC-01 a AC-07).
- La pantalla de login (`/login`): queda fuera de este ticket.
- Cualquier cambio de backend: este ticket es exclusivamente frontend/visual.
- Instalar una librería de íconos (ej. lucide-react, heroicons): el ícono se resuelve con SVG inline
  (FR-03).
- Proveer o diseñar un logo de marca real: se usa un ícono genérico de temática financiera, no un
  logotipo de marca.
- Agregar nuevos tokens de color o modificar el modo claro/oscuro: se reutilizan exclusivamente los
  tokens ya definidos en `globals.css` (`--color-error`, etc.).
- Rediseño de cualquier otra pantalla de la aplicación.

## Risks and Mitigations

| Riesgo | Mitigación |
|---|---|
| 13px (FR-08) no es un valor estándar de la escala de espaciado de Tailwind (los pasos son 4px: `space-y-3`=12px, `space-y-3.5`=14px) | Se implementa con un valor arbitrario de Tailwind (ej. `space-y-[13px]`) o margen explícito en CSS; queda documentado como decisión de diseño en el spec, no cambia el requisito |
| El banner de error de FR-06 (fondo + borde en color `--color-error`) podría no alcanzar el contraste 4.5:1 exigido por NFR-01 según la opacidad de fondo elegida | Se verifica el contraste real durante la implementación con los tokens existentes (texto a opacidad plena, fondo a opacidad reducida) antes de cerrar el bloque; si no alcanza, se ajusta la opacidad del fondo sin introducir tokens nuevos |
| El renombre de "Contraseña" a "Clave" (FR-04, FR-05) deja al proyecto con terminología inconsistente si en el futuro se reintroduce la palabra "contraseña" en otra pantalla (ej. login) | Fuera de alcance de este ticket; si el login usa "Contraseña" al implementarse, es una decisión a tomar en ese ticket, no aquí |

## Dependencies

- FEAT-005 (registro de usuario con email y contraseña), ya mergeado a `dev`: este ticket rediseña
  visualmente esa pantalla sin cambiar su comportamiento. Depende de que
  `frontend/src/components/RegisterForm.tsx`, `FormField.tsx`, `useRegisterUser.ts` y
  `frontend/src/app/register/page.tsx` existan con su forma actual.
- Tokens de color definidos en `frontend/src/app/globals.css` (`--color-error`, `--color-bg`,
  `--color-fg`, etc.) y el breakpoint `sm` (640px) de la configuración de Tailwind del proyecto.
