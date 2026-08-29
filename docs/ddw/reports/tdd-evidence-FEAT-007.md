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
