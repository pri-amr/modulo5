# Evidencia TDD — FEAT-007

Registro de qué test se vio fallar, y con qué aserción exacta, antes de cada fix — por bloque, según
lo documentado en `AGENTS.md` (no repetir el riesgo de proceso de FEAT-001).

## Block 1 — AuthLayout: split interno 50/50 y radio de borde

Se agregaron primero los 2 tests nuevos (`test-block1-panels-split-50-50` y
`test-block1-card-radius-1rem`) a `AuthLayout.test.tsx`, sin tocar los 6 tests existentes (incluido
`test-block1-card-width-desktop`, que sigue verificando `sm:w-[40%]` en la tarjeta y no se modificó).
Se corrió `npx jest AuthLayout.test.tsx` desde `frontend/` contra la implementación sin tocar:
**2 de 8 tests fallaron**, los 6 preexistentes pasaron sin cambios.

| Test | Falló antes con | Pasa después |
|---|---|---|
| `test-block1-panels-split-50-50` | `expect(element).toHaveClass("sm:w-1/2")` — recibido en `auth-layout-icon-panel`: `"hidden w-2/5 items-center justify-center bg-accent/10 p-6 sm:flex"` (sin `sm:w-1/2`) | ✅ |
| `test-block1-card-radius-1rem` | `expect(element).toHaveClass("rounded-[1rem]")` — recibido en `auth-layout-card`: `"flex w-full max-w-4xl overflow-hidden rounded-field border border-line bg-surface sm:w-[40%]"` (con `rounded-field`, no `rounded-[1rem]`) | ✅ |
| `test-block1-authlayout-empty-children-no-error` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-card-width-desktop` | Ya pasaba antes (test preexistente, sin cambios) — regresión que confirma que `sm:w-[40%]` no se tocó | ✅ |
| `test-block1-icon-panel-visible-desktop` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-icon-panel-hidden-mobile` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-form-panel-centered-mobile` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |
| `test-block1-icon-inline-svg-no-library` | Ya pasaba antes (test preexistente, sin cambios) | ✅ |

Implementación en `AuthLayout.tsx`:

- `auth-layout-icon-panel`: `hidden w-2/5 items-center justify-center bg-accent/10 p-6 sm:flex` →
  `hidden items-center justify-center bg-accent/10 p-6 sm:flex sm:w-1/2` (se eliminó el `w-2/5` base,
  el panel solo tiene ancho relevante en `sm:` y en adelante porque está `hidden` por debajo).
- `auth-layout-content-panel`: se agregó `sm:w-1/2` junto al `w-full` ya existente.
- `auth-layout-card`: `rounded-field` → `rounded-[1rem]`. `sm:w-[40%]` no se tocó.

Tras implementar:

- Suite del bloque (`AuthLayout.test.tsx`): **8/8 tests, 1/1 suite**.
- Suite completa de `frontend`: **80/80 tests, 18/18 suites**.
- `tsc --noEmit` y `eslint` sobre `AuthLayout.tsx` y `AuthLayout.test.tsx`: sin errores.
- `git diff --stat`: solo dos archivos tocados —
  `frontend/src/components/AuthLayout.tsx` y `frontend/src/__tests__/components/AuthLayout.test.tsx`
  — sin cambios en `RegisterForm.tsx`, `Loader.tsx` ni ningún otro archivo del repo.

No quedó ningún test preexistente modificado por este bloque: los 6 tests originales de
`AuthLayout.test.tsx` conservan exactamente su código, solo se insertaron los 2 nuevos entre ellos.

## Block 2 — RegisterForm: ancho fijo, espaciado, centrado y radios

Se agregaron primero los 8 tests requeridos a `RegisterForm.test.tsx`, sin tocar ninguno de los 11
tests preexistentes. Se corrió `npx jest RegisterForm.test.tsx` desde `frontend/` contra la
implementación sin tocar: **7 de 19 tests fallaron** en la primera corrida.

El octavo test (`test-block2-banner-text-wraps-no-expand`), tal como se había escrito inicialmente
(comparando el `className` del input de email antes y después de mostrar el banner), **pasaba ya
antes de implementar nada** — porque `fieldClassName` nunca dependió del estado del banner, así que
la comparación de strings era trivialmente cierta con o sin el fix. Esto viola la regla de "un test
que pasa antes de implementar no está probando nada", así que se rediseñó antes de tocar
`RegisterForm.tsx`: dado que jsdom no ejecuta un motor de layout real (no hay forma de leer un ancho
en píxeles calculado, `getBoundingClientRect` siempre da 0 independientemente del CSS), la única
forma honesta de probar "el contenedor no se expande por el banner" en este entorno es verificar la
presencia del mecanismo causal (`w-full` en `<form>`) en el escenario específico en que el banner
largo está visible — mismo criterio que ya usa `AuthLayout.test.tsx` (verificar clases, no medir
geometría real). Con el test rediseñado, se re-corrió aislado (`-t
"test-block2-banner-text-wraps-no-expand"`) contra la implementación sin tocar y **sí falló**
legítimamente antes de implementar (ver tabla).

| Test | Falló antes con | Pasa después |
|---|---|---|
| `test-block2-form-fixed-width` | `expect(element).toHaveClass("w-full")` — recibido en `<form>`: `""` (sin ninguna clase) | ✅ |
| `test-block2-button-spacing-13px` | `expect(received).toHaveClass()` — `received value must be an HTMLElement or an SVGElement. Received has value: null` (el `closest('[data-testid="register-form-actions"]')` del botón daba `null` porque ese contenedor no existía) | ✅ (ver corrección de Ronda 2 más abajo — esta primera versión del test NO cubría el bug real) |
| `test-block2-button-centered-content-width` | `expect(element).toHaveClass("block mx-auto")` — recibido en el botón: `"rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50"` (sin `block` ni `mx-auto`) | ✅ |
| `test-block2-input-radius-1rem` | `expect(element).toHaveClass("rounded-[1rem]")` — recibido en el input "Nombre": `"w-full rounded-field border bg-surface px-3 py-2 text-lg text-fg border-line"` (con `rounded-field`, no `rounded-[1rem]`) | ✅ |
| `test-block2-button-radius-1rem` | `expect(element).toHaveClass("rounded-[1rem]")` — recibido en el botón: `"rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50"` | ✅ |
| `test-block2-banner-radius-1rem` | `expect(element).toHaveClass("rounded-[1rem]")` — recibido en el banner: `"rounded-field border border-error bg-error/[3%] px-4 py-3 text-error"` | ✅ |
| `test-block2-banner-spacing-13px` | `expect(received).toHaveClass()` — `received value must be an HTMLElement or an SVGElement. Received has value: null` (el `closest('[data-testid="register-form-actions"]')` del banner daba `null`) | ✅ (ver corrección de Ronda 2 más abajo — esta primera versión del test NO cubría el bug real) |
| `test-block2-banner-text-wraps-no-expand` (rediseñado, ver arriba) | `expect(element).toHaveClass("w-full")` — recibido en `<form>`: `""` | ✅ (ver aclaración honesta sobre su alcance real en Ronda 2 más abajo — no valida AC-11) |
| 11 tests preexistentes (labels, mensajes de validación, banner por rol y texto, `test-block2-field-spacing-13px`, etc.) | Ya pasaban antes (sin cambios) | ✅ |

Implementación en `RegisterForm.tsx`:

- `<form>`: se agregó `className="w-full"` (no tenía ninguna clase de ancho antes).
- `fieldClassName`: `rounded-field` → `rounded-[1rem]`.
- Botón "Crear cuenta": `rounded-field` → `rounded-[1rem]`, y se agregó `block mx-auto` (sin
  `w-full`, conserva ancho de contenido — FR-03).
- Banner de error (`<div role="alert">`): `rounded-field` → `rounded-[1rem]`.
- Se envolvió el `Loader`, el banner de error, el mensaje de éxito y el botón en un segundo
  `<div className="space-y-[13px]" data-testid="register-form-actions">`, además del ya existente
  que envuelve los 4 `FormField` (`data-testid="register-form-fields"`, sin tocar). El
  `data-testid="register-form-actions"` es nuevo, agregado para que los tests puedan ubicar ese
  contenedor sin depender de `role="alert"` (que puede coexistir con los `role="alert"` de error por
  campo de `FormField.tsx`, no tocado en este bloque).

**Decisión sobre `min-w-0` en `AuthLayout.tsx`:** se agregó `min-w-0` al panel de contenido
(`auth-layout-content-panel`, que pasó de `"flex w-full flex-col items-center justify-center p-6
sm:w-1/2"` a `"flex w-full min-w-0 flex-col items-center justify-center p-6 sm:w-1/2"`). Motivo: ese
panel es un flex item en el eje principal horizontal de la tarjeta (`auth-layout-card` es `flex`,
fila), y por defecto un flex item tiene `min-width: auto`, es decir, un tamaño mínimo automático
basado en el contenido de sus descendientes — lo que puede forzarlo a crecer más allá de su
`w-full sm:w-1/2` declarado si algún descendiente (el banner de error, con texto potencialmente
largo) contribuye un tamaño mínimo de contenido mayor. `min-w-0` anula ese mínimo automático y deja
que el ancho declarado (`w-full`/`sm:w-1/2`) mande, permitiendo que el texto del banner haga wrap en
vez de expandir el panel. jsdom no ejecuta layout real, así que no hubo forma de detectar este
problema empíricamente (ni de confirmar que hacía falta el fix) — fue una decisión preventiva basada
únicamente en el razonamiento CSS descrito arriba, no una detección real durante la implementación
como sí describía el spec ("si se detecta..."). Queda marcada como **verificación visual pendiente**
en navegador: falta confirmar si el panel realmente se hubiera expandido sin `min-w-0`, y si con
`min-w-0` el texto del banner efectivamente hace wrap sin desbordar. Es el único cambio permitido
fuera de `RegisterForm.tsx` y se documenta acá tal como pedía la consigna.

**Ajuste de test preexistente:** ninguno. Los 11 tests preexistentes de `RegisterForm.test.tsx`
siguieron pasando sin modificar ni un selector — el `data-testid="register-form-fields"` que usa
`test-block2-field-spacing-13px` no cambió, y `test-block2-error-banner-styled` /
"RegisterForm muestra un error genérico..." siguen ubicando el banner por `getByRole("alert")` /
`findByRole("alert")` sin ambigüedad porque, en los escenarios donde se dispara el banner de alta
fallida, `useRegisterUser.submit()` limpia `fieldErrors` antes de intentar el submit remoto (ver
`setFieldErrors({})` en `useRegisterUser.ts`, no tocado), así que no coexiste con ningún
`role="alert"` de error por campo de `FormField.tsx` en esos casos.

**Test manual `test-manual-block2-nfr01-button-touch-target`:** el botón "Crear cuenta" no tiene
ninguna clase de tamaño de fuente propia, así que hereda el tamaño de fuente base del navegador
(16px) con el `line-height: 1.5` que aplica el preflight de Tailwind 4 sobre `html`/`body`
(`frontend/src/app/globals.css` no sobreescribe ninguno de los dos). Con `py-2` (`padding-top` y
`padding-bottom`: `0.5rem` = 8px cada uno) y `px-4` (`padding-left`/`padding-right`: `1rem` = 16px
cada uno):

- Alto: `font-size × line-height` (contenido de texto) = `16px × 1.5` = `24px`, más
  `padding-top + padding-bottom` = `8px + 8px` = `16px` → alto total ≈ `24px + 16px` = **40px**.
- Ancho: el texto "Crear cuenta" (12 caracteres a 16px) mide bastante más de `24px − 32px` (padding
  horizontal) por sí solo, así que el ancho total supera ampliamente los 24px.

Con alto ≈ 40px y ancho muy por encima de 24px, el botón cumple el mínimo de 24×24px CSS de NFR-01
con margen holgado, sin necesidad de ningún cambio adicional de padding o tamaño de fuente.

Tras implementar (primera ronda):

- Suite del bloque (`RegisterForm.test.tsx`): **19/19 tests, 1/1 suite** (11 preexistentes + 8
  nuevos).
- Suite completa de `frontend`: **88/88 tests, 18/18 suites**.
- `tsc --noEmit` y `eslint src --ext .ts,.tsx`: sin errores.

### Ronda 2 — corrección tras BLOCKED de `module-verifier`: AC-02 y AC-09 NO estaban validados

**El bug real, correctamente encontrado por la revisión:** `space-y-[13px]` de Tailwind genera
`> :not([hidden]) ~ :not([hidden])`, es decir, solo pone `margin-top` entre hermanos dentro del
**mismo** contenedor. La estructura de la primera ronda era:

```
<form className="w-full">                                          ← sin space-y propio
  <div className="space-y-[13px]" data-testid="register-form-fields">…4 FormField…</div>
  <div className="space-y-[13px]" data-testid="register-form-actions">…Loader/banner/success/botón…</div>
</form>
```

`register-form-fields` y `register-form-actions` son hermanos de un `<form>` sin `space-y`, así que
no había NINGÚN margen entre el bloque de campos y el bloque de acciones. En el estado por defecto
(sin error, sin loading, sin éxito) el `<button>` es el único hijo visible de `register-form-actions`
— sin hermano precedente dentro de ese div, `space-y` tampoco le aporta nada — así que el botón
quedaba pegado al último input con **0px**, exactamente la queja original del ticket (AC-02 sin
cubrir). Cuando se muestra el banner de error, el banner es el primer hijo visible de
`register-form-actions` (el `Loader` ya terminó), así que tampoco recibía margen desde el bloque de
campos — solo funcionaba la mitad "banner→botón" de AC-09, no la mitad "campos→banner".

**Por qué los tests de la primera ronda no lo detectaron:** `test-block2-button-spacing-13px` y
`test-block2-banner-spacing-13px` solo verificaban `toHaveClass("space-y-[13px]")` sobre
`register-form-actions`, que sí tenía la clase — pero nunca verificaban la relación entre los dos
divs hermanos ni el ancestro común que realmente produce (o no) la separación entre ellos. Un test
superficial: la clase estaba, pero en el contenedor equivocado para el caso que importa.

**Fix de los tests, corrido contra el código de la Ronda 1 (sin el fix de layout) para capturar el
fallo real de esta ronda:**

```
$ npx jest RegisterForm.test.tsx -t "test-block2-button-spacing-13px|test-block2-banner-spacing-13px"
```

```
● RegisterForm › test-block2-button-spacing-13px

  expect(element).toHaveClass("space-y-[13px]")

  Expected the element to have class:
    space-y-[13px]
  Received:
    w-full

    at Object.toHaveClass (src/__tests__/components/RegisterForm.test.tsx:178:45)

● RegisterForm › test-block2-banner-spacing-13px

  expect(element).toHaveClass("space-y-[13px]")

  Expected the element to have class:
    space-y-[13px]
  Received:
    w-full

    at Object.toHaveClass (src/__tests__/components/RegisterForm.test.tsx:234:45)

Tests: 2 failed, 17 skipped, 19 total
```

Ambos tests ahora verifican, ADEMÁS de la clase en su contenedor respectivo
(`register-form-actions`), que el `<form>` (el único ancestro común entre `register-form-fields` y
`register-form-actions`) también tiene `space-y-[13px]` — es la única señal observable en jsdom (no
computa layout real) de que la separación entre los dos bloques existe.

**Fix de `RegisterForm.tsx`:** `<form className="w-full">` → `<form className="w-full
space-y-[13px]">`. Con `space-y-[13px]` en el `<form>`, los dos divs hijos (`register-form-fields` y
`register-form-actions`) quedan separados 13px entre sí, y cada uno conserva su espaciado interno de
13px — 13px consistente en todo el formulario, tal como declara el spec.

Tras el fix:

```
$ npx jest RegisterForm.test.tsx
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

- Suite completa de `frontend`: **88/88 tests, 18/18 suites**.
- `tsc --noEmit` y `eslint src --ext .ts,.tsx`: sin errores.

**Corrección honesta de lo afirmado en la Ronda 1:** el criterio de completitud de la Ronda 1 decía
"los 8 tests automatizados... pasan" dando a entender que AC-02 y AC-09 quedaban validados — eso era
incorrecto. Hasta esta Ronda 2, ninguno de los dos ACs estaba realmente cubierto por los tests: la
clase `space-y-[13px]` estaba presente en el DOM, pero no en el elemento que produce el efecto
declarado por esos ACs. Recién con el `<form>` con `space-y-[13px]` propio, y con los tests
verificando ese ancestro, AC-02 y AC-09 quedan validados de punta a punta (dentro de los límites de
lo observable en jsdom, es decir: presencia de la clase causal en el elemento correcto, no medición
de píxeles reales).

Archivos tocados en el bloque (ambas rondas): `frontend/src/components/RegisterForm.tsx`,
`frontend/src/__tests__/components/RegisterForm.test.tsx`, y `frontend/src/components/AuthLayout.tsx`
(solo la línea de `min-w-0`, documentada arriba como decisión preventiva pendiente de verificación
visual). `FormField.tsx`, `useRegisterUser.ts` y `Loader.tsx` no se tocaron.

## Block 3 — Loader: overlay de pantalla completa (cambio global)

Tres rondas. La ronda 1 implementó el bloque; la ronda 2 atendió el FAIL del `arch-auditor` más dos
decisiones de diseño del usuario; la ronda 3 cerró el FAIL que ambos revisores levantaron sobre los
guards de tokens.

### Ronda 1 — implementación del overlay

Se escribieron primero los 3 tests nuevos de `Loader.test.tsx` (los 4 preexistentes de FEAT-005/006
no se tocaron) y se corrió `pnpm test -- src/__tests__/components/Loader.test.tsx` contra la
implementación sin tocar:

```
● Loader › muestra el spinner dentro de un overlay que cubre toda la pantalla cuando visible es true

  expect(element).toHaveClass("fixed inset-0 bg-black/50")

  Expected the element to have class:
    fixed inset-0 bg-black/50
  Received:
    h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent

  at Object.toHaveClass (src/__tests__/components/Loader.test.tsx:35:21)

Tests: 1 failed, 6 passed, 7 total
```

La aserción que rompió es `expect(overlay).toHaveClass("fixed", "inset-0", "bg-black/50")` sobre
`container.firstElementChild`: antes del cambio ese primer hijo era el spinner, no un overlay.

Los otros 2 tests del bloque pasaban antes de la implementación **por diseño del spec**, que los
declara textualmente regresión: `test-block3-loader-spinner-preserved` ("regresión explícita:
confirma que el spinner interno no cambió, protege a `TransactionForm.test.tsx`") y
`test-block3-loader-hidden-no-error-residual` ("regresión del comportamiento ya existente"). El
`module-verifier` evaluó ese argumento contra el texto del spec y lo confirmó legítimo: el bloque
introduce exactamente una unidad de comportamiento nuevo (el overlay) y exactamente un test falló
por ella.

### Ronda 2 — FAIL del `arch-auditor` + dos decisiones del usuario

El `arch-auditor` devolvió BLOCKED porque los 3 `it()` estaban nombrados en prosa, mientras los
Bloques 1 y 2 usan el identificador del spec como nombre del `it()`. No es cosmético: el parser
F-VER-06 de `validate_verify.py` solo reconoce identificadores que empiezan con `test`, y este
proyecto ya gastó un loop correctivo VERIFY→CODE→PLAN por lo mismo en FEAT-004 y otro en FEAT-005.
La instrucción equivocada fue del orquestador al despachar la ronda 1.

Además el usuario decidió dos cambios sobre el diseño aprobado: usar un token semántico
(`--color-overlay`) en vez de `bg-black/50`, y subir el overlay a `z-[100]` porque `z-50` empataba
con `ThemeToggle` y dejaba la mitigación R-01 del threat model dependiendo del orden del DOM.

| Punto | Rojo previo |
|---|---|
| 1 — rename a los IDs del spec | **Sin rojo, y no se fabricó ninguno**: un rename puro no puede producirlo |
| 2+3+4 — aserción completa, token, `z-[100]` | Consolidados en un rojo real (abajo) |
| 5 — transición `true → false` | Rojo real en la primera mitad (abajo); la mitad de la transición no falló, ver nota |

```
● Loader › test-block3-loader-fullscreen-overlay

  expect(element).toHaveClass("fixed inset-0 z-[100] flex items-center justify-center bg-overlay/50")

  Expected the element to have class:
    fixed inset-0 z-[100] flex items-center justify-center bg-overlay/50
  Received:
    fixed inset-0 z-50 flex items-center justify-center bg-black/50

  at Object.toHaveClass (src/__tests__/components/Loader.test.tsx:35:21)

● Loader › test-block3-loader-hidden-no-error-residual

  expect(element).toHaveClass("fixed bg-overlay/50")

  Expected the element to have class:
    fixed bg-overlay/50
  Received:
    fixed inset-0 z-50 flex items-center justify-center bg-black/50

  at Object.toHaveClass (src/__tests__/components/Loader.test.tsx:67:41)

Tests: 2 failed, 5 passed, 7 total
```

**Tres declaraciones de ausencia de rojo, hechas por el implementer sin que se le pidieran, y
verificadas contra disco por el `module-verifier`:**

1. El punto 1 (rename) no tiene rojo asociado y no se inventó uno.
2. De las 3 clases agregadas a la aserción del overlay en el punto 2 (`flex`, `items-center`,
   `justify-center`), ninguna produjo rojo por sí sola: ya estaban en la implementación de la ronda
   1. Cierran un hueco de aserción — la mitad "spinner centrado" de AC-12 — no dirigen código nuevo.
   El propio `Received` citado arriba lo demuestra: contiene esas tres clases. El rojo real de ese
   test lo produjeron `z-[100]` y `bg-overlay/50`.
3. La mitad de transición del punto 5 (`rerender` + `toBeEmptyDOMElement`) no falló antes, porque el
   `return null` existía desde antes del ticket. Es cobertura de regresión de lo que el spec describe
   en su sección de manejo de errores ("o cambia de `true` a `false`") y que ningún test ejercitaba;
   no se reclama rojo genuino para esa mitad.

**Limitación de esta ronda, señalada por el `module-verifier`:** los `Received` de la ronda 2 no son
verificables contra disco, porque la ronda 1 nunca quedó en git ni dejó blob recuperable
(`git stash list` vacío, `reflog` en el último commit del Bloque 2, y ninguno de los 18 dangling
blobs de `git fsck` contiene `bg-black/50`). Se aceptaron sobre evidencia circunstancial fuerte — el
`Received` coincide literalmente con el string que el spec dicta en su línea 178, incluido el orden,
y el código de la ronda 2 es ese mismo string con dos tokens sustituidos — pero es una cadena de
confianza, no una verificación directa. **Riesgo de proceso a recordar: una ronda correctiva sobre
working tree sin registrar en git destruye la línea base de verificación de la ronda siguiente.**

### Ronda 3 — el token nuevo dejó obsoletos dos guards que ya existían

Ambos revisores levantaron el mismo FAIL, que ni el implementer ni el orquestador habían visto:
`globals.test.ts` (mapas `DARK_TOKENS` / `LIGHT_TOKENS`) y `tailwind.config.test.ts` (array
`SEMANTIC_TOKENS`) existen desde FEAT-002 para guardar exactamente los dos archivos que la ronda 2
modificó, y no se extendieron. Ambas suites son de **inclusión, no de exactitud**: iteran sobre su
propia lista esperada, así que pasaban en verde por omisión. Los títulos decían "los 10 tokens"
cuando ya había 11.

Agregar una entrada a una allowlist sobre un token ya escrito pasa en verde de una, así que no hay
rojo natural. En vez de fabricarlo, se demostró empíricamente que el guard ahora muerde, mutando
temporalmente los archivos fuente y midiendo el antes y el después con la misma mutación:

**Con `--color-overlay` borrado de `.light` y el mapeo `overlay` borrado de `tailwind.config.ts`,
con los guards SIN corregir:**

```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

Verde con el token borrado de ambos archivos — la brecha, medida.

**Misma mutación, con los guards YA corregidos:**

```
● globals.css › define los 11 tokens bajo .light con los valores de modo claro
  expect(received).toMatch(expected)
  Expected pattern: /--color-overlay:\s*63 61 77;/
  Received string:  "... --color-error: 220 38 38; /* #DC2626 */ "
  at src/__tests__/app/globals.test.ts:55:26

● tailwind.config.ts › expone el token semántico overlay como color de Tailwind
  expect(received).toBe(expected)
  Expected: "rgb(var(--color-overlay) / <alpha-value>)"
  Received: undefined
  at src/__tests__/app/tailwind.config.test.ts:24:28

Test Suites: 2 failed, 2 total
Tests:       2 failed, 15 passed, 17 total
```

Mismo estado del código fuente, resultado opuesto: el delta de cobertura lo aportan esas 5 líneas.

Las mutaciones se revirtieron y se verificó por checksum (`globals.css` MD5 `222bca30…088d61` y
`tailwind.config.ts` MD5 `2b14c7b0…47a21e5c`, idénticos a antes de mutar) y por `git diff --stat`,
que muestra `globals.css` con 2 inserciones y `tailwind.config.ts` con 1, **sin ninguna deleción**.

**Alcance de lo que este guard cubre, y lo que no:** queda cubierta la regresión concreta que motivó
la ronda (que alguien borre `--color-overlay`). Las suites siguen siendo de inclusión, así que un
token *futuro* que se agregue a `globals.css` y no se sume a estos mapas volverá a pasar inadvertido.
Cerrar eso pediría una aserción de conteo o de igualdad de conjuntos, fuera del alcance de este
bloque.

### Mapeo identificador del spec → `it()` real

| Identificador del spec | `it("...")` final |
|---|---|
| `test-block3-loader-fullscreen-overlay` | `test-block3-loader-fullscreen-overlay` |
| `test-block3-loader-spinner-preserved` | `test-block3-loader-spinner-preserved` |
| `test-block3-loader-hidden-no-error-residual` | `test-block3-loader-hidden-no-error-residual` |

### Estado final del bloque

- Suite completa de `frontend`: **18/18 suites, 92/92 tests** en verde (88 antes del bloque, +3 tests
  nuevos de `Loader`, +1 caso generado por `it.each` al sumar `overlay` a `SEMANTIC_TOKENS`).
- `npx tsc --noEmit` y `pnpm lint` (`eslint .`): limpios.
- `TransactionForm.tsx` y `TransactionForm.test.tsx` sin modificar; sin regresión.
- Archivos tocados en las 3 rondas: `frontend/src/components/Loader.tsx`,
  `frontend/src/__tests__/components/Loader.test.tsx`, `frontend/src/app/globals.css`,
  `frontend/tailwind.config.ts`, `frontend/src/__tests__/app/globals.test.ts`,
  `frontend/src/__tests__/app/tailwind.config.test.ts`.
- Desviaciones respecto del spec, documentadas en el ADR del bloque: `z-50` → `z-[100]`,
  `bg-black/50` → `bg-overlay/50`, y la sección "Files" del Bloque 3, que no contemplaba
  `globals.css` ni `tailwind.config.ts`.

## Block 4 — AuthLayout: ancho responsive de la tarjeta

Bloque agregado después de que los Bloques 1-3 ya estaban commiteados, por el loop correctivo
CODE→PLAN→DEFINE→PLAN que introdujo FR-12/AC-13 (ancho de la tarjeta 70% entre 640px y 1199px, 40%
desde 1200px). Una sola ronda de implementación.

Archivos tocados: `frontend/src/components/AuthLayout.tsx` y
`frontend/src/__tests__/components/AuthLayout.test.tsx`. Ningún otro.

### El rojo, por test

Comando, corrido desde `frontend/` antes de tocar `AuthLayout.tsx`:
`npx jest src/__tests__/components/AuthLayout.test.tsx`

Resultado de esa corrida: `Tests: 2 failed, 8 passed, 10 total`.

**1. `test-block4-card-width-responsive` — ROJO.** Falló en `AuthLayout.test.tsx:99`, sobre la
aserción `expect(card).toHaveClass("sm:w-[70%]")`:

```
expect(element).toHaveClass("sm:w-[70%]")
Expected the element to have class:
  sm:w-[70%]
Received:
  flex w-full max-w-4xl overflow-hidden rounded-[1rem] border border-line bg-surface sm:w-[40%]
```

**2. `test-block4-card-width-cascade-order` — ROJO.** Falló en `AuthLayout.test.tsx:112`, sobre la
aserción `expect(emittedWidths).toContain("70%")`:

```
expect(received).toContain(expected) // indexOf
Expected value: "70%"
Received array: ["40%"]
```

**3. `test-block4-card-width-base-and-cap` — NO se vio en rojo, y queda declarado en vez de
fabricar una salida.** Es el renombrado de `test-block1-card-width-desktop`: sus dos aserciones
(`w-full`, `max-w-4xl`) son sobre clases que el bloque deliberadamente no toca, así que ya eran
ciertas antes del cambio y es imposible que se vieran rojas. Su valor es de regresión —`max-w-4xl`
no tiene cobertura en ningún otro test del archivo, verificado por grep sobre todo
`frontend/src/__tests__/`: una sola aparición, la de este test— y no de TDD. Presentarlo como rojo
habría sido mentir.

Los tres `Received` de arriba fueron **reproducidos independientemente por el `ddw-module-verifier`**,
que revirtió `AuthLayout.tsx` a `sm:w-[40%]`, volvió a correr la suite y confirmó que coinciden
carácter por carácter con lo que produce el código. Dejó el archivo con el mismo MD5 con el que lo
encontró.

### Verificación por mutación del test de cascada

`test-block4-card-width-cascade-order` es el único test automatizable que valida que la clase
*llegue a aplicarse*, y no solo que esté escrita. Para no darlo por bueno, se lo sometió a mutación
—primero el implementer, después el verifier de forma independiente— mutando la clase de
`auth-layout-card` y revirtiendo después:

| Mutación | `cascade-order` | `responsive` | ¿Atrapada? |
|---|---|---|---|
| `min-[1200px]:w-2/5` | 🔴 (`indexOf("40%")` = -1) | 🔴 | Sí |
| `min-[1200px]:w-[40%]` | 🔴 (`indexOf("40%")` = 0, no > 1) | 🔴 | Sí |
| `xl:w-[40%]` | 🟢 pasa | 🔴 | Sí, por el otro test |

Salida textual de la primera mutación:

```
● AuthLayout › test-block4-card-width-cascade-order
expect(received).toBeGreaterThan(expected)
Expected: > 1
Received:   -1
```

**El reparto de roles entre los dos tests es deliberado y quedó confirmado por la matriz.** El
test de cascada atrapa 2 de las 3 mutaciones: con `xl:w-[40%]` se queda en verde, porque `xl:` es
`80rem` —misma unidad que `sm:`, orden de emisión correcto—. Lo que `xl:` rompe no es la cascada
sino el corte (1280px en vez de 1200px), y eso lo detecta la aserción positiva de
`test-block4-card-width-responsive`. Ninguno de los dos cubre las tres por sí solo; el par sí. Es
exactamente lo que el spec describe: el guard es la aserción positiva sobre `min-[75rem]:w-[40%]`,
y la cascada verifica que la clase llegue a aplicarse.

### Un falso verde encontrado y cerrado durante la implementación

La primera versión de `test-block4-card-width-cascade-order` afirmaba únicamente el orden
(`indexOf("40%") > indexOf("70%")`), sin verificar presencia. Antes del cambio `emittedWidths` era
`["40%"]`, así que `indexOf("40%")` = 0 e `indexOf("70%")` = -1, y `0 > -1` **pasaba en verde con el
diseño sin implementar**. Se agregó `expect(emittedWidths).toContain("70%")`, que es precisamente la
aserción sobre la que el test falla al revertir. Sin ella el test no habría tenido rojo real.

### Hueco residual conocido, no cerrado

El test compara **primeras** ocurrencias (`indexOf`), no cuál regla gana por ser la última emitida.
Si un tercer tramo re-emitiera `width: 70%` después del bucket del 40% —por ejemplo agregando
`min-[100rem]:w-[70%]`— el array sería `["70%","40%","70%"]`: `toContain` pasa e
`indexOf("40%")`=1 > `indexOf("70%")`=0, y el test quedaría verde aunque en viewports muy anchos
ganara el 70%. Ninguna mutación realista lo alcanza y ningún requisito actual lo pide, pero queda
registrado: un `lastIndexOf` en la comparación lo cerraría. Detectado por el `ddw-module-verifier`.

### Mapeo identificador del spec → `it()` real

| Identificador del spec | `it("...")` final | Nota |
|---|---|---|
| `test-block4-card-width-responsive` | `test-block4-card-width-responsive` | nuevo |
| `test-block4-card-width-cascade-order` | `test-block4-card-width-cascade-order` | nuevo |
| `test-block4-card-width-base-and-cap` | `test-block4-card-width-base-and-cap` | **renombrado desde `test-block1-card-width-desktop`** |

El rename queda asentado acá porque el spec lo exige explícitamente: el test dejó de afirmar
`sm:w-[40%]`, que FR-12 vuelve falso, y pasó a afirmar `w-full` y `max-w-4xl`. No se eliminó porque
era la única cobertura de `max-w-4xl`.

### Estado final del bloque

- Suite completa de `frontend`: **18/18 suites, 94/94 tests** en verde (92 antes del bloque, +2
  tests nuevos; el renombrado no suma).
- `npx tsc --noEmit` y `npx eslint .`: limpios. Confirmado de forma independiente por el
  `ddw-module-verifier`.
- Sin dependencias nuevas: `tailwindcss ^4.3.3` ya estaba en `frontend/package.json`, así que el
  `import { compile } from "tailwindcss"` del test no agrega nada.
- El único `sm:w-[40%]` que queda en código es la aserción negativa intencional
  (`AuthLayout.test.tsx:101`); el resto de las apariciones son documentos.
- Desviaciones respecto del spec: ninguna en el código. Dos asunciones del implementer sobre la
  forma de codificar la aserción de orden y sobre derivar las clases del DOM renderizado en vez del
  fuente; el spec permite ambas y el verifier las validó.

### Verificación manual pendiente

`test-manual-block4-salto-1200px` requiere navegador real —jsdom no computa layout— y queda
pendiente de ejecución por el usuario. Es la única validación de que la tarjeta pasa de ≈817px a
≈467px al cruzar 1200px y, sobre todo, de que **por debajo de 1200px no queda en 40%**, que es el
síntoma que delataría el defecto de ordenamiento de media queries.

### Ronda correctiva 2 — se cierra el agujero del breakpoint

El `ddw-arch-auditor` dio BLOCKED sobre la ronda 1 con un FAIL: el campo `condition` de
`MediaBlock`/`WidthMedia` se calculaba y se descartaba en la línea del `.map(entry => entry.width)`.
No era solo código muerto — era el dato que faltaba. **El test de cascada verificaba el ORDEN pero
no en QUÉ breakpoint entraba el 40%.** Lo demostró compilando la mutación `xl:w-[40%]`:

```
MUT xl | media order: ["(width >= 40rem)", "(width >= 80rem)"] | widths: [100%, 70%, 40%]
```

Orden correcto, 40% después del 70% → el test pasaba en verde con el corte en 1280px en vez de
1200px, incumpliendo FR-12.

Corrección aplicada (única, sobre `AuthLayout.test.tsx`; el código de producción no se tocó y se
verificó por hash antes y después):

```ts
const wideCondition = widthMedia.find((entry) => entry.width === "40%")?.condition;
...
expect(wideCondition).toContain("75rem");
```

**El rojo de la mutación `xl:w-[40%]`**, reportado por el implementer y después **reproducido
textualmente por el auditor de forma independiente**:

```
expect(received).toContain(expected) // indexOf

Expected substring: "75rem"
Received string:    "(width >= 80rem)"

> 125 |     expect(wideCondition).toContain("75rem");
      |                           ^
Tests: 1 failed, 9 skipped, 10 total
```

Las dos aserciones previas **pasaron** bajo esa mutación: con `xl:`, Tailwind emite `["70%","40%"]`
con `idx40=1 > idx70=0`. Solo la aserción nueva la mata. Eso confirma que el agujero era real y no
teórico.

### Matriz de mutación final, ejecutada por el auditor

| Mutación | Resultado | Aserción que la mata |
|---|---|---|
| `xl:w-[40%]` | 🔴 | `:125` (única) |
| `min-[80rem]:w-[40%]` | 🔴 | `:125` (única) |
| `min-[1200px]:w-[40%]` | 🔴 | `:124` (orden invertido) |
| `min-[1200px]:w-2/5` | 🔴 | `:124` (`idx40=-1`) |
| `min-[75rem]:w-2/5` | 🔴 | `:124` (`idx40=-1`) |

**5/5 muertas. Ninguna mutación que rompa FR-12 sobrevive a nivel de suite.** Esto supera la tabla
de la ronda 1, que registraba 2 de 3 y delegaba `xl:` en el otro test.

### Dos propiedades verificadas, no asumidas

**`wideCondition === undefined` es inalcanzable.** El `?.` lo permitiría sintácticamente, pero:
`find(e => e.width === "40%")` devuelve `undefined` ⟺ no hay entrada con width `"40%"` ⟺
`emittedWidths.indexOf("40%") === -1`, y con `idx40 = -1` la línea `:124` **siempre** falla primero,
porque ningún índice es `< -1`. Nunca se llega a `expect(undefined).toContain(...)`. Comprobado con
`min-[1200px]:w-2/5`, que efectivamente produce `wideCondition: undefined` y falla en `:124`.

**La desviación sobre `require.resolve` es cierta, no plausible.** El implementer no pudo aplicar
`require.resolve("tailwindcss/index.css")` porque `next/jest` instala un `moduleNameMapper` que
redirige todo `.css` a `styleMock.js`. El auditor lo ejecutó dentro de Jest y confirmó los tres
puntos: `require.resolve` y `createRequire(__filename).resolve` devuelven **ambos** el `styleMock.js`
(Jest parchea `createRequire`; su `toString()` muestra una arrow function de Jest, no la nativa de
Node), y pasarlo a `compile()` reproduce ``CssSyntaxError: Invalid declaration: `"use strict"` ``.
La solución adoptada —derivar la entrada del manifiesto vía `tailwindPackage.exports["."].style`—
funciona **por diseño y no por casualidad**: el `moduleNameMapper` solo intercepta CSS y assets, y
`.json` no está mapeado. Si esa clave desapareciera en una versión futura, rompe con un `TypeError`
en tiempo de carga del módulo: no es un mensaje de dominio, pero falla ruidosa y temprano, nunca
produce un verde silencioso.

### WARN conocido y no cerrado

`:125` usa `toContain("75rem")`, que es match de **subcadena**: `min-[175rem]:w-[40%]` produce
`"(width >= 175rem)"`, que contiene `"75rem"`, y las tres aserciones de `cascade-order` pasarían con
un breakpoint de 2800px. **A nivel de suite la mutación sí se atrapa**, en `:110`
(`toHaveClass("min-[75rem]:w-[40%]")`), que fija la clase exacta. Es defensa en profundidad
deliberada: `:110` fija la clase, `:125` fija la semántica compilada. Endurecerlo a
`toContain("width >= 75rem")` mataría `175rem` sin depender de `:110`, a cambio de más acoplamiento
a la forma literal que emite Tailwind. Se deja como está.

El hueco del `indexOf` sobre primeras ocurrencias, registrado en la ronda 1, sigue abierto en los
mismos términos.

### Estado final tras la ronda 2

- Suite completa de `frontend`: **18/18 suites, 94/94 tests** en verde. Mismos números que la ronda
  1: no se agregaron tests, se endureció uno existente. Confirmado de forma independiente por el
  auditor.
- `npx tsc --noEmit` y `npx eslint .`: exit 0, confirmados por el auditor.
- `AuthLayout.tsx` sin modificar en esta ronda, verificado por hash idéntico antes y después
  (blob de git `ddb36e18162e240df863b810ccd822b28bde47c1`).
- Veredicto final del `ddw-arch-auditor`: **APPROVED**, 0 FAILs.

### Nota de proceso: colisión de mutaciones

En la ronda 1 se despacharon el `ddw-module-verifier` y el `ddw-arch-auditor` **en paralelo**, y
ambos mutan archivos para verificar guards. El auditor observó `AuthLayout.tsx` pasar por
`sm:w-[40%]`, `min-[1200px]:w-[40%]`, `min-[1200px]:w-2/5` y `xl:w-[40%]` en ~2 minutos, y dos de
sus corridas dieron rojo por eso y no por el código. Ningún resultado quedó comprometido —el archivo
volvió a su contenido correcto y se verificó por hash— pero el riesgo de commitear un mutante fue
real. **Error de despacho del orquestador, no de los agentes.** A partir de la ronda 2 los revisores
que mutan archivos se despachan de a uno.

### Diagnóstico de Prettier, para cerrar dos versiones contradictorias del expediente

La ronda 1 lo atribuyó a `.prettierrc.json` (`tabWidth: 4`, `trailingComma: "none"`); el implementer
de la ronda 2 lo atribuyó a CRLF contra `endOfLine: "lf"` y afirmó que **no hay** `.prettierrc`.
Medición aislada del auditor:

| Configuración | `AuthLayout.tsx` | `AuthLayout.test.tsx` |
|---|---|---|
| `.prettierrc` + LF por defecto (estado real) | falla | falla |
| `--no-config --end-of-line lf` | falla | falla |
| `--no-config --end-of-line crlf --tab-width 4` | falla | falla |
| `--no-config --end-of-line crlf --trailing-comma none` | pasa | falla |
| `--no-config --end-of-line crlf` (sin ningún factor) | pasa | pasa |

**Concurren dos causas independientes, y cada explicación por separado es incompleta:** los archivos
son CRLF y `endOfLine` por defecto es `"lf"`; y `.prettierrc.json` existe **en la raíz del repo** con
`tabWidth: 4` y `trailingComma: "none"`. La afirmación de que no hay `.prettierrc` es falsa: está un
nivel arriba de `frontend/`, donde el implementer buscó. No hay `.gitattributes` en ninguno de los
dos niveles, lo que explica los CRLF. Prettier no es gate en ningún lado (no hay `.github/`, ni
`.husky/`, ni `lint-staged`; `pnpm lint` es solo `eslint .`), y los 41 archivos fallan ya en HEAD.
Deuda preexistente, ticket propio.

### `test-manual-block4-salto-1200px` — ejecutado, resultado OK

**Fecha:** 2026-08-29. **Ejecutado por:** el usuario, en navegador real sobre `/register`.
**Resultado: OK.**

Lo verificado al cruzar los 1200px redimensionando la ventana:

1. La tarjeta da un salto de ancho visible y brusco al cruzar el corte, en la dirección esperada
   (más ancha por debajo, más angosta por encima).
2. **Por debajo de 1200px la tarjeta no queda en 40%** — el síntoma que delataría el defecto de
   ordenamiento de media queries que ADR-007 documenta, y el único que ningún test automatizado
   puede observar porque jsdom no computa layout.
3. El formulario y el panel del ícono siguen legibles a ambos lados del salto.

Con esto **AC-13 queda verificado de punta a punta**: los tests automatizados cubren que las clases
estén presentes y que el CSS se emita con el orden y el breakpoint correctos
(`test-block4-card-width-responsive` y `test-block4-card-width-cascade-order`), y esta verificación
manual cubre que el navegador efectivamente pinte el comportamiento pedido, que es lo que aquellos
no pueden alcanzar.

**Alcance honesto de este registro:** el usuario confirmó el comportamiento como correcto en
conjunto, a ojo. No se tomaron mediciones al píxel ni capturas. Registrarlo como una medición
instrumentada sería atribuirle una precisión que no tuvo.

### Corrección: las cifras de ancho que circularon en los artefactos están mal

Detectado por el `ddw-module-verifier` en VERIFY, y confirmado en el fuente. **La tarjeta tiene dos
ancestros con `px-4`, no uno:**

- `frontend/src/app/register/page.tsx:9` — `<main className="min-h-screen bg-bg px-4 py-8 text-fg">`
- `frontend/src/components/AuthLayout.tsx:8` — `<div className="... px-4 py-8">`

Son 64px descontados, no 32px. Los valores correctos:

| | PRD | Spec / evidencia (rondas 1-2) | **Real** |
|---|---|---|---|
| Ancho a 1199px | 839px | ≈817px | **≈794px** |
| Ancho a 1200px | 480px | ≈467px | **≈454px** |
| Viewport donde `max-w-4xl` prevalece | 2240px | ~2272px | **2304px** |

Cuenta: a 1199px, `1199 − 32 = 1167` para el wrapper de `AuthLayout`, y `1167 − 32 = 1135` para su
content box; 70% de 1135 ≈ 794px. A 1200px, `1200 − 32 − 32 = 1136`; 40% ≈ 454px.

**Esto no incumple AC-13**, que está expresado en porcentajes y se satisface igual. Lo que estaba
mal era el criterio numérico contra el cual medir: el PRD no descontó ningún `px-4` y el spec
descontó uno solo. El error atravesó DEFINE, PLAN, CODE y dos rondas completas de revisión sin que
nada lo detectara, **porque ningún test mide layout** — es exactamente el hueco que el propio
Bloque 4 documenta, materializado sobre sus propias cifras.

Ni el PRD ni el spec se pueden editar desde VERIFY. La corrección queda asentada acá y en
`docs/ddw/reports/verify-FEAT-007.md`, que es el artefacto propio de esta fase.

### `test-manual-block2-*` (AC-11, wrap del banner) y efecto de `min-w-0` — ejecutados, resultado OK

**Fecha:** 2026-08-29. **Ejecutado por:** el usuario, en navegador real sobre `/register`.
**Resultado: OK.**

Verificado que, ante un error de registro con mensaje largo, el banner ajusta el texto en varias
líneas en vez de ensanchar el contenedor, y que el ancho de los inputs permanece constante con y sin
banner visible — que es el comportamiento que AC-11 pide y el que `min-w-0` habilita.

Con esto **quedan cerradas las tres verificaciones manuales pendientes del ticket**: el salto de
1200px del Bloque 4, el wrap del banner y el efecto de `min-w-0` del Bloque 2. NFR-01 ya tenía
constancia propia, re-derivada por el `ddw-module-verifier` compilando el preflight (`py-2` da 40px
de alto contra el mínimo de 24px).

**Alcance honesto:** confirmación visual del usuario, a ojo, sin mediciones instrumentadas ni
capturas. Es la única verificación posible para estos criterios —jsdom no computa layout— y se
registra por lo que es.

### Corrección a `docs/ddw/reports/tests-FEAT-007.md`

Ese reporte, en su sección "Nota sobre el piso de cobertura", afirma que **FEAT-004, FEAT-005 y
FEAT-006** citan el piso del 80% como si `AGENTS.md` lo declarara. **La afirmación es injusta con dos
de los tres.** Verificado por el `ddw-module-verifier` en VERIFY:

- **FEAT-004 y FEAT-005** citan `.ddw/rules/testing.instructions.md` y aclaran explícitamente que
  `AGENTS.md` no declara piso propio. Su atribución es correcta.
- **Solo FEAT-006** hace la atribución incorrecta, citando `80% (AGENTS.md, "Testing" — piso del
  proyecto)`.

Lo demás de esa nota se sostiene: `AGENTS.md` no contiene "80%", ni "cobertura", ni "coverage", ni
una sección "Testing" (grep exit 1), y `frontend/jest.config.ts` no declara `coverageThreshold`. El
piso sigue sin respaldo en este repositorio y sigue mereciendo su ticket.

La corrección se asienta acá y no editando `tests-FEAT-007.md`, porque ese reporte ya está
commiteado y su receipt está atado a sus bytes: modificarlo invalidaría el gate `tests` que ya se
ganó sobre él.
