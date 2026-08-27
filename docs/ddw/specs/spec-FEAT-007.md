# Spec FEAT-007: Ajustes visuales de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-007 |
| PRD | docs/ddw/prd/prd-FEAT-007.md |
| Tier | FEATURE |
| Date | 2026-08-27 |
| Spec loops | 0 |
| Loops since last human decision | 0 |

## Summary

Tres bloques, uno por archivo de aplicación tocado. `AuthLayout` reparte sus dos paneles internos
50/50 (en vez de 40/60 implícito) y redondea la tarjeta a 1rem. `RegisterForm` fija el ancho del
`<form>` (corrige que el banner de error mueva el ancho de los inputs), agrupa el espacio posterior
a los campos en un segundo `space-y-[13px]` (banner, Loader, botón quedan espaciados igual que los
inputs entre sí), centra el botón sin estirar su ancho, y redondea inputs/botón/banner a 1rem
(`rounded-[1rem]`, sin tocar el token compartido `rounded-field` — ADR-005). `Loader` pasa a ser un
overlay de pantalla completa; es un componente compartido, así que el cambio es global por diseño
(afecta también a `TransactionForm`, confirmado).

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 | Block 1 |
| FR-02 | Block 2 |
| FR-03 | Block 2 |
| FR-04 | Block 1 |
| FR-05 | Block 2 |
| FR-06 | Block 2 |
| FR-07 | Block 2 |
| FR-08 | Block 2 |
| FR-09 | Block 2 |
| FR-10 | Block 2 |
| FR-11 | Block 3 |
| NFR-01 | Strategy: verificación manual de que el botón "Crear cuenta" mide al menos 24x24px CSS con su padding actual (`px-4 py-2`) más el contenido — ver test manual del Bloque 2 |

## Dependencies between blocks

Ninguna dependencia dura: los 3 bloques tocan archivos disjuntos (`AuthLayout.tsx` + su test /
`RegisterForm.tsx` / `Loader.tsx` + su test). Orden sugerido: Block 1 → Block 2 → Block 3 (Loader al
final por ser el cambio de mayor alcance — afecta a otra pantalla — para verificarlo con calma).

## Block 1 — AuthLayout: split interno 50/50 y radio de borde

**Files**
- `frontend/src/components/AuthLayout.tsx` (modified)
- `frontend/src/__tests__/components/AuthLayout.test.tsx` (modified — se agregan 2 tests nuevos; el
  test existente `test-block1-card-width-desktop` NO se modifica)

**Logic**

Panel del ícono (`auth-layout-icon-panel`): cambia de `w-2/5` a `sm:w-1/2` (se elimina el `w-2/5`
base porque el panel ya está `hidden` por debajo del breakpoint `sm`, así que su ancho solo importa
en `sm:` y en adelante). Panel de contenido (`auth-layout-content-panel`): agrega `sm:w-1/2`
explícito junto al `w-full` ya existente (que sigue rigiendo por debajo de `sm`). Tarjeta
(`auth-layout-card`): cambia `rounded-field` a `rounded-[1rem]` — **sin tocar `sm:w-[40%]`**, que
sigue siendo el ancho de la tarjeta respecto del viewport (fuera de alcance de este ticket, PRD
sección Out of Scope).

**Input validation**

No aplica — componente de layout puro, sin inputs de usuario.

**Error handling**

- No aplica: sin estado, sin fetch propio. El manejo de `children` vacío/nulo ya está cubierto y
  probado desde FEAT-006 (`test-block1-authlayout-empty-children-no-error`), sin cambios en este
  ticket.

**Required tests**
- [ ] `test-block1-panels-split-50-50` — en viewport ≥640px, `auth-layout-icon-panel` y
  `auth-layout-content-panel` tienen ambos la clase `sm:w-1/2` (valida AC-01). Test nuevo.
- [ ] `test-block1-card-radius-1rem` — `auth-layout-card` tiene la clase `rounded-[1rem]` (valida
  AC-04). Test nuevo.
- [ ] `test-block1-card-width-desktop` (ya existe, sin modificar) — sigue verificando `sm:w-[40%]`
  en la tarjeta; se re-corre como regresión y confirma que el ancho externo de la tarjeta no se
  tocó.
- [ ] `test-block1-authlayout-empty-children-no-error` (ya existe desde FEAT-006, sin cambios) —
  renderizar `AuthLayout` con `children` vacío/`null` no arroja ningún error; se re-corre como
  regresión y es la evidencia del manejo de errores documentado arriba (este bloque no introduce
  ningún camino de error nuevo).

**Completion criterion**

`AuthLayout.tsx` modificado según lo descrito; los 2 tests nuevos pasan; los 6 tests preexistentes
de `AuthLayout.test.tsx` (incluido `test-block1-card-width-desktop`, sin modificar) siguen pasando
sin cambios; `tsc --noEmit` y `eslint` limpios.

## Block 2 — RegisterForm: ancho fijo, espaciado, centrado y radios

**Files**
- `frontend/src/components/RegisterForm.tsx` (modified)
- `frontend/src/__tests__/components/RegisterForm.test.tsx` (modified — solo si algún selector
  existente dependiera de la estructura de contenedores; documentar en la evidencia TDD)
- **Explícitamente no modificado**: `frontend/src/components/FormField.tsx` — su `<p role="alert">`
  de error por campo (línea ~17-19) es un elemento distinto del banner de alta fallida de este
  bloque; con más de un `role="alert"` posible en pantalla a la vez, los tests deben ubicar el
  banner por su texto, no solo por el rol.

**Logic**

`<form>`: agrega `w-full` explícito (hoy no tiene ninguna clase de ancho) — le da al formulario un
ancho propio fijo en vez de shrink-to-fit, lo que corrige que el banner de error mueva el ancho de
los inputs (FR-09) y hace que el texto largo del banner haga wrap en vez de expandir el contenedor
(FR-10). Si al implementar se detecta que el panel de contenido de `AuthLayout` (un flex item) sigue
permitiendo que el `<form>` se expanda por el contenido del banner, agregar `min-w-0` al panel de
contenido de `AuthLayout.tsx` como parte de este mismo bloque, y documentar la decisión en la
evidencia TDD.

Contenido posterior a los 4 `FormField` (el `Loader`, el banner de error, el mensaje de éxito y el
botón): se envuelve en un segundo `<div className="space-y-[13px]">`, además del ya existente que
envuelve los 4 `FormField` — así cualquier elemento visible entre el bloque de campos y el botón
queda espaciado 13px de forma consistente (cubre FR-02, espaciado campos→botón, y FR-08, espaciado
del banner arriba y abajo, con el mismo mecanismo).

Botón "Crear cuenta": agrega `block mx-auto` a su className existente (mantiene
`bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50`, sin `w-full` — conserva
su ancho actual ajustado al contenido, cubre FR-03).

`fieldClassName` (inputs): agrega `rounded-[1rem]` en vez de `rounded-field` (FR-05). Botón:
`rounded-field` → `rounded-[1rem]` (FR-06). Banner de error (`<div role="alert">`):
`rounded-field` → `rounded-[1rem]` (FR-07).

**Input validation**

Sin cambios respecto de FEAT-005/FEAT-006: mínimo 8 caracteres, campo requerido, coincidencia de
confirmación — este bloque no toca `useRegisterUser.ts` ni ninguna regla.

**Error handling**

- Clave vacía, clave corta, confirmación no coincidente → mensajes de validación ya existentes
  (`useRegisterUser.ts`, sin cambios en este ticket) — se verifica que siguen mostrándose con el
  espaciado y radio nuevos.
- Alta fallida tras validaciones (banner) → mismo texto ya existente, ahora con wrap dentro de
  ancho fijo en vez de expandir el contenedor, con 13px de espacio arriba/abajo, y radio 1rem.

**Required tests**
- [ ] `test-block2-form-fixed-width` — el `<form>` tiene la clase `w-full` (valida AC-10, FR-09).
- [ ] `test-block2-button-spacing-13px` — el botón queda dentro del contenedor `space-y-[13px]`
  posterior a los campos (valida AC-02).
- [ ] `test-block2-button-centered-content-width` — el botón tiene las clases `block` y `mx-auto`,
  y NO tiene `w-full` (valida AC-03).
- [ ] `test-block2-input-radius-1rem` — los inputs tienen la clase `rounded-[1rem]` (valida AC-05).
- [ ] `test-block2-button-radius-1rem` — el botón tiene la clase `rounded-[1rem]` (valida AC-06).
- [ ] `test-block2-banner-radius-1rem` — cuando se muestra, el banner de error tiene la clase
  `rounded-[1rem]` (valida AC-07).
- [ ] `test-block2-banner-spacing-13px` — el banner de error, cuando se muestra, queda dentro del
  contenedor `space-y-[13px]` (valida AC-09).
- [ ] `test-block2-banner-text-wraps-no-expand` — con un texto de error largo simulado (mock del
  hook), el ancho de un input de referencia (ej. email) es idéntico al que tiene sin el banner
  presente (valida AC-11, FR-10, ausencia de layout shift; caso de error/inválido).
- [ ] `test-manual-block2-nfr01-button-touch-target` — verificación manual de que el botón mide al
  menos 24x24px CSS con su padding actual (`px-4 py-2`) más el contenido del texto; documentar el
  cálculo en el reporte de evidencia TDD del bloque (valida AC-08/NFR-01).

**Completion criterion**

`RegisterForm.tsx` modificado según lo descrito; los 8 tests automatizados + 1 manual pasan; los
tests preexistentes de `RegisterForm.test.tsx` (labels, mensajes de validación, banner por rol y
texto) siguen pasando; `tsc --noEmit` y `eslint` limpios.

## Block 3 — Loader: overlay de pantalla completa (cambio global)

**Files**
- `frontend/src/components/Loader.tsx` (modified)
- `frontend/src/__tests__/components/Loader.test.tsx` (modified — se agrega 1 test nuevo; los
  tests existentes sobre el spinner interno no deberían necesitar cambios)
- **Explícitamente no modificado**: `frontend/src/components/TransactionForm.tsx` (su código no
  cambia; su comportamiento visual de carga cambia indirectamente al usar el `Loader` actualizado —
  efecto global confirmado con el usuario). `frontend/src/__tests__/components/TransactionForm.test.tsx`
  se re-corre como regresión, sin modificar su código.

**Logic**

Estructura nueva: un `<div>` overlay externo con clases `fixed inset-0 z-50 flex items-center
justify-center bg-black/50` (fondo semitransparente oscuro, cubre todo el viewport, spinner
centrado). Dentro de ese overlay, el `<div>` spinner interno **conserva exactamente sus props y
clases actuales** (`role="status"`, `aria-label="Cargando"`, className
`h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent`) — solo se
envuelve en el nuevo overlay externo, sin cambiar el elemento interno. Sigue retornando `null`
cuando `visible` es `false`.

**Input validation**

No aplica — la única prop es `visible: boolean`, ya existente, sin cambios.

**Error handling**

- Si `visible` es `false`, o cambia de `true` a `false`, el componente no debe arrojar ningún error
  de renderizado ni dejar el overlay o el spinner residual en el DOM.

**Required tests**
- [ ] `test-block3-loader-fullscreen-overlay` — cuando `visible` es `true`, existe un elemento
  contenedor con las clases `fixed`, `inset-0` y `bg-black/50` (valida AC-12).
- [ ] `test-block3-loader-spinner-preserved` — cuando `visible` es `true`, el elemento con
  `role="status"` sigue teniendo la clase `border-accent-blue` (regresión explícita: confirma que
  el spinner interno no cambió, protege a `TransactionForm.test.tsx`).
- [ ] `test-block3-loader-hidden-no-error-residual` — cuando `visible` es `false`, `Loader` no
  arroja ningún error y no renderiza ningún elemento residual (regresión del comportamiento ya
  existente, valida el manejo de errores de arriba).

**Completion criterion**

`Loader.tsx` modificado según lo descrito; los 3 tests pasan; `Loader.test.tsx` y
`TransactionForm.test.tsx` (sin cambios de código) siguen pasando; `tsc --noEmit` y `eslint`
limpios.

## Final verification

Con los 3 bloques completos: la pantalla de registro (`/register`) muestra la tarjeta con sus dos
paneles al 50/50, radio de 1rem en tarjeta/inputs/botón/banner, el botón centrado y separado 13px
del resto sin pegarse a los inputs, el ancho de los inputs constante con o sin banner de error
visible, y el indicador de carga como overlay de pantalla completa — tanto en `/register` como en
la pantalla de transacciones (`TransactionForm`, cambio global confirmado). Suite completa de
`frontend` en verde, `tsc --noEmit` y `eslint` sin errores (no hay cambios de `backend`).
