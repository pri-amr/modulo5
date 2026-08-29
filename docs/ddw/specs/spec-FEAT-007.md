# Spec FEAT-007: Ajustes visuales de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-007 |
| PRD | docs/ddw/prd/prd-FEAT-007.md |
| Tier | FEATURE |
| Date | 2026-08-27 |
| Spec loops | 1 |
| Loops since last human decision | 0 |

## Summary

Cuatro bloques. `AuthLayout` reparte sus dos paneles internos 50/50 (en vez de 40/60 implícito) y
redondea la tarjeta a 1rem. `RegisterForm` fija el ancho del `<form>` (corrige que el banner de
error mueva el ancho de los inputs), agrupa el espacio posterior a los campos en un segundo
`space-y-[13px]` (banner, Loader, botón quedan espaciados igual que los inputs entre sí), centra el
botón sin estirar su ancho, y redondea inputs/botón/banner a 1rem (`rounded-[1rem]`, sin tocar el
token compartido `rounded-field` — ADR-005). `Loader` pasa a ser un overlay de pantalla completa;
es un componente compartido, así que el cambio es global por diseño (afecta también a
`TransactionForm`, confirmado). El Bloque 4 da a la tarjeta un ancho responsive: 70% del viewport
entre 640px y 1199px, 40% de 1200px en adelante.

**Estado de implementación al momento de esta revisión del spec.** Los Bloques 1, 2 y 3 ya están
implementados y commiteados en la rama (`4534b2e`, `74f296c`, `3455961`). Este spec se revisó
después, por un loop correctivo CODE → PLAN → DEFINE que sumó FR-12 al PRD. Para esos tres bloques
el spec ahora **describe el código que existe**, no al revés: las tres desviaciones que el Bloque 3
había acumulado respecto de la versión anterior de este documento quedaron incorporadas acá y están
razonadas en `docs/adr/adr-006-overlay-token-semantico-y-capa-propia.md`. El Bloque 4 es el único
que queda por implementar.

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
| FR-12 | Block 4 |
| NFR-01 | Strategy: verificación manual de que el botón "Crear cuenta" mide al menos 24x24px CSS con su padding actual (`px-4 py-2`) más el contenido — ver test manual del Bloque 2 |

## Dependencies between blocks

Ninguna dependencia dura. Los Bloques 1, 2 y 3 tocan archivos disjuntos (`AuthLayout.tsx` + su test
/ `RegisterForm.tsx` / `Loader.tsx` + su test, más los dos archivos de tokens que el Bloque 3
incorporó). Se implementaron en ese orden, con el Loader al final por ser el cambio de mayor alcance.

El Bloque 4 vuelve sobre `AuthLayout.tsx` y su test, los mismos archivos del Bloque 1, pero sobre
una clase distinta: el Bloque 1 cambia la proporción **interna** entre los dos paneles
(`sm:w-1/2` en cada uno) y el radio de la tarjeta, y el Bloque 4 cambia el ancho **externo** de la
tarjeta respecto del viewport (`sm:w-[40%]`). No hay solapamiento de **clases**, así que el Bloque 4
se implementa sobre el Bloque 1 ya commiteado sin re-abrirlo. Sí hay solapamiento de **un test**:
`test-block1-card-width-desktop`, que afirma `sm:w-[40%]`, deja de ser cierto con FR-12 y el Bloque
4 lo renombra y lo reconvierte (ver sus Required tests).

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
es el ancho de la tarjeta respecto del viewport y pertenece al Bloque 4 (FR-12,
sumado al PRD después de que este bloque ya estaba commiteado).

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
  tocó. **Estado histórico:** así quedó este bloque al commitearse (`4534b2e`). El Bloque 4, sumado
  después por FR-12, supera esta línea: renombra ese test a `test-block4-card-width-base-and-cap` y
  le saca la aserción sobre `sm:w-[40%]`, que FR-12 vuelve falsa.
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
- `frontend/src/__tests__/components/Loader.test.tsx` (modified — se agregan 3 tests nuevos; los 4
  tests preexistentes sobre el spinner interno no se modifican)
- `frontend/src/app/globals.css` (modified — token `--color-overlay` en `:root` y en `.light`)
- `frontend/tailwind.config.ts` (modified — color `overlay` mapeado al token)
- `frontend/src/__tests__/app/globals.test.ts` (modified — el token nuevo se suma a las allowlists
  `DARK_TOKENS` y `LIGHT_TOKENS`, que son de inclusión: sin esta entrada, borrar `--color-overlay`
  de `.light` dejaba el overlay transparente en tema claro con la suite entera en verde)
- `frontend/src/__tests__/app/tailwind.config.test.ts` (modified — `overlay` sumado a
  `SEMANTIC_TOKENS`, por el mismo motivo)
- **Explícitamente no modificado**: `frontend/src/components/TransactionForm.tsx` (su código no
  cambia; su comportamiento visual de carga cambia indirectamente al usar el `Loader` actualizado —
  efecto global confirmado con el usuario). `frontend/src/__tests__/components/TransactionForm.test.tsx`
  se re-corre como regresión, sin modificar su código.

**Logic**

Estructura nueva: un `<div>` overlay externo con clases `fixed inset-0 z-[100] flex items-center
justify-center bg-overlay/50` (fondo semitransparente oscuro, cubre todo el viewport, spinner
centrado). Dentro de ese overlay, el `<div>` spinner interno **conserva exactamente sus props y
clases actuales** (`role="status"`, `aria-label="Cargando"`, className
`h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent`) — solo se
envuelve en el nuevo overlay externo, sin cambiar el elemento interno. Sigue retornando `null`
cuando `visible` es `false`.

El scrim usa el token semántico `--color-overlay` en vez de un negro crudo, porque `globals.css`
declara que los tokens son la única fuente de verdad para los colores de la app y `bg-black/50` no
conmuta con el tema. Valores: `5 5 10` (`#05050A`) en `:root`, más profundo que `--color-bg` para
que la tarjeta siga flotando sobre el fondo; `63 61 77` (`#3F3D4D`) en `.light`, que al 50% sobre
blanco compone ≈ `#9F9EA6`. El `z-[100]` reemplaza al `z-50` original porque `ThemeToggle.tsx` usa
exactamente `z-50`, y con z-index empatado la precedencia del overlay dependía del orden del DOM —
que es lo que la mitigación R-01 del análisis de amenazas pedía evitar al exigir un z-index
"explícito y alto". Ambas decisiones son del usuario y están razonadas en `docs/adr/adr-006-overlay-token-semantico-y-capa-propia.md`,
que también deja escrita la convención de capas: `z-[100]` para lo que cubre la interfaz, `z-50`
para el chrome persistente tipo `ThemeToggle`.

**Input validation**

No aplica — la única prop es `visible: boolean`, ya existente, sin cambios.

**Error handling**

- Si `visible` es `false`, o cambia de `true` a `false`, el componente no debe arrojar ningún error
  de renderizado ni dejar el overlay o el spinner residual en el DOM.

**Required tests**
- [ ] `test-block3-loader-fullscreen-overlay` — cuando `visible` es `true`, existe un elemento
  contenedor con las clases `fixed`, `inset-0`, `z-[100]`, `flex`, `items-center`, `justify-center`
  y `bg-overlay/50`, y ese contenedor envuelve al spinner (valida AC-12: las tres clases de flex
  más la contención son lo que cubre la mitad "spinner centrado" del criterio).
- [ ] `test-block3-loader-spinner-preserved` — cuando `visible` es `true`, el elemento con
  `role="status"` sigue teniendo la clase `border-accent-blue` (regresión explícita: confirma que
  el spinner interno no cambió, protege a `TransactionForm.test.tsx`).
- [ ] `test-block3-loader-hidden-no-error-residual` — el componente pasa de `visible` en `true` a
  `visible` en `false` mediante `rerender`, sin arrojar error y sin dejar overlay ni spinner
  residual en el DOM (cubre la transición que describe el manejo de errores de arriba, que ningún
  test preexistente ejercitaba).
- [ ] `test-block3-tokens-overlay-declarado` — el token `--color-overlay` está declarado en `:root`
  y en `.light` de `globals.css`, y mapeado como color `overlay` en `tailwind.config.ts` (guard de
  las allowlists existentes; sin él, perder el token en un tema deja el overlay transparente con la
  suite en verde, porque `toHaveClass("bg-overlay/50")` es un match de string y no evalúa si la
  variable CSS resuelve).

**Completion criterion**

`Loader.tsx` modificado según lo descrito; los 3 tests del componente más el guard de tokens pasan;
`Loader.test.tsx` y `TransactionForm.test.tsx` (sin cambios de código) siguen pasando; `tsc
--noEmit` y `eslint` limpios.

## Block 4 — AuthLayout: ancho responsive de la tarjeta

**Files**
- `frontend/src/components/AuthLayout.tsx` (modified — solo la clase de ancho de
  `auth-layout-card`)
- `frontend/src/__tests__/components/AuthLayout.test.tsx` (modified — se agrega 1 test nuevo y se
  actualiza `test-block1-card-width-desktop`, que hoy afirma `sm:w-[40%]` y quedaría contradiciendo
  a FR-12; los otros 7 tests del archivo no se tocan)

**Logic**

Tarjeta (`auth-layout-card`): la clase `sm:w-[40%]` se reemplaza por `sm:w-[70%]
min-[75rem]:w-[40%]`. El `w-full` base no se toca, así que por debajo de 640px el comportamiento de
FEAT-006 queda idéntico (ancho completo, panel del ícono oculto).

**La unidad del breakpoint es obligatoriamente `rem`, y esto no es una preferencia de estilo.**
Tailwind 4 ordena las variantes `min-width` por valor numérico pero no sabe comparar unidades
distintas: `1200px` contra el `40rem` de `sm:` no son comparables, así que el bucket de px se emite
primero. Verificado compilando los candidatos con el `tailwindcss` instalado en el proyecto:

```
sm:w-[70%] + min-[1200px]:w-[40%]  ->  @media order: ["1200px", "40rem"]
sm:w-[70%] + min-[75rem]:w-[40%]   ->  @media order: ["40rem",  "75rem"]
```

Con `min-[1200px]:`, a partir de 1200px matchean ambas reglas, tienen la misma especificidad (una
clase cada una) y gana la última emitida — `sm:w-[70%]`. El 40% nunca se aplicaría y AC-13 quedaría
incumplido en su segunda mitad, en silencio. `75rem` = 1200px con el root de 16px, y `globals.css`
no redefine `font-size`, así que el corte cae donde FR-12 lo pide. Definir un breakpoint nombrado en
la config **no** resuelve esto si se declara en px: el determinante es la unidad, no si la variante
es arbitraria o nombrada. Razonado en `docs/adr/adr-007-breakpoint-ancho-tarjeta-en-rem.md`.

**Corrección de una fila del PRD, que este spec supera.** La sección de riesgos del PRD registra el
breakpoint fuera de escala como "exige una variante arbitraria `min-[1200px]:`" y lo da por mitigado
invocando el precedente de ADR-005 (`rounded-[1rem]`) y ADR-006 (`z-[100]`). Ese argumento no
aplica: aquellos dos son valores de **utilidad**, que no participan del ordenamiento de variantes;
un breakpoint sí, y ahí está justamente el defecto que ADR-007 documenta. Invocar ese precedente fue
lo que hizo parecer resuelto un riesgo que no lo estaba. La mitigación vigente es ADR-007, y la
variante que se implementa es `min-[75rem]:`, no `min-[1200px]:`. El PRD quedó escrito antes de esa
verificación y no se edita desde PLAN; esta es la reconciliación.

Se mantiene el prefijo `sm:` para el tramo del 70% en vez de `min-[640px]:` porque los paneles
internos del mismo archivo ya usan `sm:flex` y `sm:w-1/2`: las tres clases deben anclar al mismo
corte de 640px, y desacoplarlas dejaría una inconsistencia latente si alguien tocara la escala.

El JSX lleva un comentario de una línea explicando por qué `75rem` y no `1200px` — es un invariante
sutil de los que `AGENTS.md` sí permite comentar, y sin él alguien lo "simplifica" a px y
reintroduce el defecto sin que nada se queje.

**Anchos reales resultantes.** `w-[70%]` es 70% del content box del padre, no del viewport, y el
padre (`AuthLayout.tsx:8`) lleva `px-4`, que descuenta 32px. A 1199px la tarjeta mide
0.7 × (1199 − 32) ≈ **817px**; a 1200px mide 0.4 × (1200 − 32) ≈ **467px**. El `max-w-4xl` (896px)
no se toca y no muerde en el tramo del 70%, con más margen del que sugiere una cuenta sobre el
viewport pelado.

**Interpretación de "del viewport" en AC-13.** FR-12 y AC-13 dicen "70% del viewport" y "40% del
viewport"; lo que se entrega es 70%/40% del content box del padre, que es lo que `w-[70%]` significa
en CSS. Medido contra el viewport pelado eso da 68.1% a 1199px y 38.9% a 1200px. La diferencia son
los 32px de `px-4` del contenedor, que existen desde FEAT-006 y que el PRD mantiene fuera de
alcance. **Se adopta la lectura content-box**: es la única que un porcentaje de CSS puede cumplir
sin agregar un cálculo que nadie pidió, y es la que codifica el criterio manual del bloque. No es
un incumplimiento de AC-13 y no debe reportarse como tal en VERIFY.

**Cota superior de AC-13, que el criterio no explicita.** Por encima de ~2272px de viewport el
`max-w-4xl` prevalece sobre el 40%: en un monitor de 2560px la tarjeta queda en 896px, que es ~35%
del viewport y no 40%. Es el techo heredado de FEAT-006, que el PRD mantiene deliberadamente en Out
of Scope. No es un defecto del Bloque 4 y no debe reportarse como tal. El PRD sitúa ese techo "a
partir de 2240px": es el mismo número en el otro marco de referencia — 2240px es el ancho del
content box, y 2272px el del viewport que lo contiene, con los 32px de `px-4` de diferencia. Como
el PRD dice "viewports muy anchos", la cifra que corresponde a esa frase es **2272px**, la de acá.

El salto de ancho al cruzar 1200px (≈817px → ≈467px) es brusco y visible al redimensionar. Está
aceptado como decisión del usuario, que evaluó un tramo intermedio y lo descartó; queda registrado
en la sección de riesgos del PRD para que no se "corrija" más adelante sin volver a decidirlo. Esa
fila del PRD cita 839px y 480px, cifras ilustrativas calculadas sobre el viewport sin descontar el
`px-4` del contenedor; los valores correctos son los de acá.

**Input validation**

No aplica — componente de layout puro, sin inputs de usuario.

**Error handling**

- No aplica: sin estado, sin fetch propio. El manejo de `children` vacío/nulo ya está cubierto y
  probado desde FEAT-006 (`test-block1-authlayout-empty-children-no-error`), sin cambios en este
  bloque.

**Required tests**
- [ ] `test-block4-card-width-responsive` — `auth-layout-card` tiene las clases `sm:w-[70%]` y
  `min-[75rem]:w-[40%]`, NO tiene ya `sm:w-[40%]`, y **NO tiene `min-[1200px]:w-[40%]`** (valida
  AC-13). Test nuevo. **El guard es la aserción positiva sobre `min-[75rem]:w-[40%]`**: se pone roja
  ante cualquier reemplazo que reintroduzca el defecto de ordenamiento — `min-[1200px]:w-[40%]`,
  `min-[1200px]:w-2/5`, `xl:w-[40%]`, un breakpoint nombrado en px. La aserción negativa sobre la
  grafía `min-[1200px]:w-[40%]` se conserva como documentación de cuál es el defecto, **no como
  guard**: cubre una sola grafía, y el único caso que dispara solo a ella —agregar la variante en px
  conservando la rem— es de comportamiento correcto, porque a ≥1200px la regla en px queda muerta
  igual. Lo que ninguna de las dos alcanza es verificar que la clase presente llegue a aplicarse:
  `toHaveClass` es match de string. Eso lo cubre el test siguiente.
- [ ] `test-block4-card-width-cascade-order` — **extrae las clases del `auth-layout-card` realmente
  renderizado** (o del fuente de `AuthLayout.tsx` vía `readFileSync`, patrón que el archivo ya usa
  en `test-block1-icon-inline-svg-no-library`), las compila con el paquete `tailwindcss` ya
  instalado, y afirma que el bloque `@media` del tramo del 40% aparece **después** del `@media` del
  tramo del 70% en el CSS generado. Derivar las clases del componente es lo que hace al test
  load-bearing: compilar literales hardcodeados validaría una propiedad de Tailwind, desacoplada de
  lo que el componente hace, y seguiría en verde ante las cuatro mutaciones de arriba. Es el único
  test automatizable que valida AC-13 de verdad y no la mera presencia de una clase. Sin
  dependencias nuevas: `tailwindcss` 4.3.3 publica build CJS (`"require": "./dist/lib.js"`), y
  `require("tailwindcss").compile` funciona bajo `testEnvironment: "jsdom"` sin tocar la config de
  Jest — lo único que hace falta es pasarle el callback `loadStylesheet`, porque
  `@import "tailwindcss"` no resuelve solo. Verificado en PLAN contra el paquete instalado.
- [ ] `test-block4-card-width-base-and-cap` (**renombrado desde
  `test-block1-card-width-desktop`**, que existe desde FEAT-006) — deja de afirmar `sm:w-[40%]`,
  que FR-12 vuelve falso, y pasa a afirmar que el ancho base `w-full` y el techo `max-w-4xl` siguen
  intactos, que es la parte de ese test que sigue siendo regresión válida. Se renombra porque tras
  la conversión ya no verifica nada específico de desktop (`w-full` y `max-w-4xl` son clases base,
  sin variante) y su prefijo `block1` apuntaría a un bloque que ya no lo gobierna; un test cuyo
  nombre miente manda al próximo lector al lugar equivocado. **No se elimina**: `max-w-4xl` no
  tiene cobertura en ningún otro test del archivo. El rename queda registrado en la evidencia TDD
  del bloque, nombre viejo → nombre nuevo.
- [ ] `test-block1-panels-split-50-50` (existente, sin modificar) — se re-corre como regresión y
  confirma que cambiar el ancho externo no alteró la proporción interna 50/50.
- [ ] `test-block1-card-radius-1rem` (existente, sin modificar) — se re-corre como regresión y
  confirma que el radio de 1rem del Bloque 1 sigue en pie.
- [ ] `test-block1-authlayout-empty-children-no-error` (existente desde FEAT-006, sin modificar) —
  renderizar `AuthLayout` con `children` vacío/`null` no arroja ningún error; se re-corre como
  regresión y es la evidencia del manejo de errores documentado arriba (este bloque no introduce
  ningún camino de error nuevo).
- [ ] `test-manual-block4-salto-1200px` — verificación manual en navegador: redimensionar la
  ventana cruzando los 1200px y confirmar que la tarjeta pasa de **≈817px a ≈467px** (no del
  viewport pelado: el padre descuenta 32px de `px-4`), y que el formulario y el panel del ícono
  siguen legibles a ambos lados del salto. Confirmar además que **por debajo de 1200px la tarjeta
  no queda en 40%**, que es el síntoma que delataría el defecto de ordenamiento de media queries.
  En monitores de más de ~2272px la tarjeta se planta en 896px (~35% del viewport) por el
  `max-w-4xl` heredado: es el comportamiento esperado, no un defecto a reportar. jsdom no computa
  layout real, así que ningún test automatizado puede medir el ancho resultante.

**Completion criterion**

`AuthLayout.tsx` con la clase de ancho nueva y su comentario de invariante; los dos tests nuevos
pasan; `test-block4-card-width-base-and-cap` renombrado, actualizado y pasando; los otros 7 tests
de `AuthLayout.test.tsx` siguen pasando sin cambios; suite completa de `frontend` en verde;
`tsc --noEmit` y `eslint` limpios; verificación manual del salto documentada.

## Final verification

Con los 4 bloques completos: la pantalla de registro (`/register`) muestra la tarjeta con sus dos
paneles al 50/50, radio de 1rem en tarjeta/inputs/botón/banner, el botón centrado y separado 13px
del resto sin pegarse a los inputs, el ancho de los inputs constante con o sin banner de error
visible, y el indicador de carga como overlay de pantalla completa — tanto en `/register` como en
la pantalla de transacciones (`TransactionForm`, cambio global confirmado). La tarjeta ocupa el 70%
del viewport entre 640px y 1199px y el 40% de 1200px en adelante. Suite completa de `frontend` en
verde, `tsc --noEmit` y `eslint` sin errores (no hay cambios de `backend`).

**Verificaciones manuales pendientes al cierre del ticket**, ninguna cubierta por tests automatizados
porque jsdom no computa layout real: AC-11 (wrap del texto del banner sin expandir el contenedor) y
el efecto de `min-w-0` en el panel de contenido, ambas arrastradas del Bloque 2; y
`test-manual-block4-salto-1200px`. Además, la limitación de contraste registrada en ADR-006 (el
spinner sobre el scrim de tema claro queda en ≈1.98:1, bajo el umbral 3:1 de WCAG 2.1 SC 1.4.11)
no se resuelve en este ticket y tiene ticket de seguimiento propio.
