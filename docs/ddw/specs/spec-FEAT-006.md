# Spec FEAT-006: Rediseño visual de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-006 |
| PRD | docs/ddw/prd/prd-FEAT-006.md |
| Tier | FEATURE |
| Date | 2026-08-27 |
| Spec loops | 0 |
| Loops since last human decision | 0 |

## Summary

Se agrega un nuevo componente de layout puro (`AuthLayout`) que envuelve la pantalla de registro en
una tarjeta centrada de dos paneles (ícono + contenido), responsiva por debajo de 640px. Sobre esa
base se rediseña `RegisterForm`: se renombra "Contraseña" a "Clave" en labels y mensajes de
validación, se estiliza el error de alta fallida como un banner visible, y se ajustan tamaño de
fuente y espaciado. `FormField` gana una prop de variante (`labelSize`) para que el aumento de fuente
no se propague a `TransactionForm.tsx`, que la sigue usando sin esa prop. Sin cambios de backend, de
API ni de dependencias nuevas (ADR-004).

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 | Block 1 |
| FR-02 | Block 1 |
| FR-03 | Block 1 |
| FR-04 | Block 2 |
| FR-05 | Block 2 |
| FR-06 | Block 2 |
| FR-07 | Block 2 |
| FR-08 | Block 2 |
| NFR-01 | Strategy: verificación manual del ratio de contraste (fórmula WCAG) sobre los tokens de color usados por el banner de error y por el texto de la pantalla, en modo oscuro y claro — ver tests manuales del Bloque 2 |

## Dependencies between blocks

Ninguna dependencia dura: Block 1 y Block 2 tocan archivos distintos, salvo
`register.page.test.tsx`, editado por ambos sin conflicto (Block 1 ajusta las aserciones de layout,
Block 2 las de texto de labels). Orden sugerido: Block 1 → Block 2.

## Block 1 — Layout de tarjeta responsivo

> Nota de terminología: "panel izquierdo"/"panel derecho" en este bloque son la misma mitad del
> layout que el PRD describe como izquierda (ícono) y derecha (título + formulario) — mismo
> concepto, palabra de layout distinta a propósito en este documento.

**Files**
- `frontend/src/components/AuthLayout.tsx` (new) — componente de layout puro
- `frontend/src/app/register/page.tsx` (modified) — envuelve el contenido existente en `AuthLayout`
- `frontend/src/__tests__/app/register.page.test.tsx` (modified) — ajusta aserciones de layout
- `frontend/src/__tests__/components/AuthLayout.test.tsx` (new)

**Logic**

`AuthLayout` es un server component (sin `"use client"`: no usa estado, hooks ni handlers — el
ocultamiento del panel izquierdo es puro CSS responsivo, no requiere JS). Recibe
`{ children: ReactNode }` desestructurado y devuelve `React.JSX.Element`. Renderiza una tarjeta
centrada horizontal y verticalmente (`flex`, `items-center`, `justify-center`, ancho de pantalla
completo) que en viewport ≥640px (breakpoint `sm` de Tailwind) mide 40% del ancho del viewport y
muestra dos paneles: izquierdo con un ícono SVG inline estático (literal en el JSX, sin
interpolación de props ni datos — temática financiera genérica, ver ADR-004), y derecho con
`children`. Por debajo de 640px el panel del ícono se oculta (`hidden sm:flex` o equivalente) y
`children` queda solo, centrado, ocupando el ancho disponible.

`register/page.tsx` envuelve el `<h1>Crear cuenta</h1>` y `<RegisterForm />` existentes dentro de
`<AuthLayout>`, sin cambiar el dynamic import de `RegisterForm` que ya tenía.

**Input validation**

No aplica — componente de layout puro, sin inputs de usuario ni props que acepten datos externos más
allá de `children` (contenido ya validado por sus propios componentes).

**Error handling**

- Si `children` es `null` o está vacío, el componente no debe arrojar ningún error de renderizado:
  sigue mostrando la tarjeta y el panel del ícono, con el panel derecho sin contenido. No introduce
  ningún otro camino de error nuevo más allá del error boundary de Next.js que ya cubre el árbol
  existente.

**Required tests**
- [ ] `test-block1-authlayout-empty-children-no-error` — renderizar `AuthLayout` con `children`
  vacío/`null` no arroja ningún error y el panel del ícono se sigue mostrando (valida el manejo de
  errores de arriba).
- [ ] `test-block1-card-width-desktop` — en viewport ≥640px, la tarjeta de AuthLayout tiene un ancho
  igual al 40% del viewport (valida AC-01).
- [ ] `test-block1-icon-panel-visible-desktop` — en viewport ≥640px, el panel del ícono es visible
  (valida AC-01).
- [ ] `test-block1-icon-panel-hidden-mobile` — en viewport <640px, el panel del ícono está oculto
  (valida AC-02).
- [ ] `test-block1-form-panel-centered-mobile` — en viewport <640px, solo se renderiza el panel
  derecho (children), centrado (valida AC-02).
- [ ] `test-block1-icon-inline-svg-no-library` — el ícono se renderiza como un elemento `<svg>`
  inline en el DOM, sin ningún import de librería de íconos en `AuthLayout.tsx` (valida AC-03).
- [ ] `test-block1-register-page-uses-authlayout` — `register/page.tsx` renderiza el título y el
  formulario dentro de `AuthLayout` (integración sobre `register.page.test.tsx`).

**Completion criterion**

`AuthLayout.tsx` creado y usado por `register/page.tsx`; los 7 tests de arriba pasan;
`tsc --noEmit` y `eslint` limpios en `frontend`.

## Block 2 — Estilo, copy y accesibilidad del formulario

**Files**
- `frontend/src/components/FormField.tsx` (modified) — prop de variante `labelSize`
- `frontend/src/components/RegisterForm.tsx` (modified) — labels, banner, fuente, espaciado
- `frontend/src/hooks/useRegisterUser.ts` (modified) — mensajes de validación
- `frontend/src/__tests__/components/RegisterForm.test.tsx` (modified)
- `frontend/src/__tests__/hooks/useRegisterUser.test.ts` (modified)
- `frontend/src/__tests__/app/register.page.test.tsx` (modified) — aserciones de texto de labels
- **Explícitamente no modificado:** `frontend/src/components/TransactionForm.tsx` y su test — hallado
  por el impact-scan como consumidor de `FormField`; decisión confirmada con el usuario: queda fuera
  de alcance de este ticket (el PRD excluye explícitamente el rediseño de otras pantallas), y la prop
  `labelSize` con default `"sm"` garantiza que no cambia su comportamiento visual.

**Logic**

`FormField` gana una prop opcional `labelSize?: "sm" | "base"` (default `"sm"`, el comportamiento
actual), aplicada a la className del `<label>` en vez del `text-sm` hardcodeado de hoy — variante
tipada, no un booleano. `RegisterForm` pasa `labelSize="base"` a sus 4 `FormField`; renombra el label
"Contraseña" a "Clave" y "Confirmar contraseña" a "Confirmar clave"; envuelve los `FormField` en un
contenedor con `space-y-[13px]` (valor arbitrario de Tailwind, documentado como riesgo aceptado en el
PRD); agrega `text-lg` a la función `fieldClassName` existente que arma la className de los inputs;
reemplaza `<p role="alert">{error}</p>` (línea ~77) por un banner (`<div role="alert">` con fondo
tenue, borde y padding, usando el token `--color-error` ya existente — ej.
`rounded-field border border-error bg-error/10 px-4 py-3 text-error`), conservando exactamente el
mismo texto que `error` ya traía. `useRegisterUser.ts` cambia el texto de sus mensajes de validación
yup (líneas ~34-39) de "contraseña" a "clave", sin tocar ninguna regla (`required`/`min(8)`/
`oneOf`).

**Input validation**

Sin cambios de reglas respecto de FEAT-005: longitud mínima 8 caracteres, campo requerido,
coincidencia exacta de la confirmación. Este bloque solo cambia el texto de los mensajes que esas
reglas ya producían.

**Error handling**

- Campo de clave vacío, clave de menos de 8 caracteres, o confirmación que no coincide → mensaje de
  validación de yup, ahora con la palabra "clave" en vez de "contraseña" (ver tests de
  `useRegisterUser` abajo).
- Alta de cuenta fallida tras pasar las validaciones (ej. email ya registrado, error de guardado) →
  el mismo mensaje de `error` que ya devolvía el hook, ahora dentro de un banner visual con
  fondo/borde/padding en vez de texto plano (ver test del banner abajo).

**Required tests**
- [ ] `test-block2-formfield-labelsize-default-sm` — `FormField` sin la prop `labelSize` sigue
  renderizando el label con `text-sm` (preserva el comportamiento actual, protege a
  `TransactionForm`).
- [ ] `test-block2-formfield-labelsize-base` — `FormField` con `labelSize="base"` renderiza el label
  con `text-base`.
- [ ] `test-block2-register-labels-clave` — `RegisterForm` muestra los labels "Clave" y "Confirmar
  clave", y no muestra la palabra "Contraseña" en ningún texto visible (valida AC-04).
- [ ] `test-block2-validation-message-clave-requerida` — al enviar el formulario con la clave vacía
  (input inválido), el mensaje de error mostrado dice "La clave es requerida" (valida AC-05).
- [ ] `test-block2-validation-message-clave-longitud` — al ingresar una clave inválida de menos de 8
  caracteres, el mensaje de error dice "La clave debe tener al menos 8 caracteres" (valida AC-05).
- [ ] `test-block2-validation-message-claves-no-coinciden` — al ingresar una confirmación inválida
  que no coincide con la clave, el mensaje de error dice "Las claves no coinciden" (valida AC-05).
- [ ] `test-block2-error-banner-styled` — cuando el alta falla tras pasar las validaciones (mock de
  error del hook), el mensaje se renderiza dentro de un contenedor con clases de fondo/borde, no
  como `<p>` plano (valida AC-06).
- [ ] `test-block2-input-font-size-lg` — los inputs del formulario tienen la clase `text-lg` (valida
  AC-07).
- [ ] `test-block2-label-font-size-base` — los labels del formulario tienen la clase `text-base`
  (valida AC-07).
- [ ] `test-block2-field-spacing-13px` — el contenedor de campos tiene la clase de espaciado
  `space-y-[13px]` (valida AC-08).
- [ ] `test-manual-block2-nfr01-contrast-banner` — cálculo manual (fórmula WCAG) del ratio de
  contraste entre el texto/borde del banner de error (`--color-error`) y su fondo (`bg-error/10`
  sobre `--color-bg`/`--color-surface`), en modo oscuro y en `.light` — debe ser ≥4.5:1 en ambos
  (valida AC-09/NFR-01); documentar el cálculo y el resultado en el reporte de tests del bloque.
- [ ] `test-manual-block2-nfr01-contrast-text` — cálculo manual del ratio de contraste entre
  `--color-fg` y `--color-bg` (modo oscuro) y sus equivalentes en `.light` — debe ser ≥4.5:1 en
  ambos (valida AC-09/NFR-01).

**Completion criterion**

Los 3 archivos de aplicación modificados según lo descrito; los 12 tests de arriba (10 automatizados
+ 2 manuales) documentados y pasando; `TransactionForm.tsx` y su test sin ningún cambio (verificado
con `git diff`); `tsc --noEmit` y `eslint` limpios en `frontend`; suite completa de frontend en
verde.

## Final verification

Con ambos bloques completos: la pantalla de registro (`/register`) renderiza la tarjeta de dos
columnas descrita por FR-01/FR-02, sin la palabra "Contraseña" en ningún texto visible, con el banner
de error estilizado, la tipografía y el espaciado especificados, y contraste ≥4.5:1 verificado. La
suite completa de `frontend` pasa en verde, `tsc --noEmit` y `eslint` sin errores en ambos paquetes
(no hay cambios de `backend`), y `TransactionForm.tsx` queda bit a bit idéntico a como estaba antes
de este ticket.
