# Evidencia TDD — FEAT-006

Registro de qué test se vio fallar, y con qué aserción exacta, antes de cada fix — por bloque, para
no repetir el riesgo de proceso documentado en `AGENTS.md` (los 7 reportes de bloque de FEAT-001 que
nunca se guardaron en disco).

## Block 1 — AuthLayout (layout compartido de pantallas de autenticación)

Para reconstruir la evidencia "antes" en una ronda correctiva posterior al cierre del bloque, se
renombró temporalmente `frontend/src/components/AuthLayout.tsx` a `AuthLayout.tsx.bak` (volviendo al
estado "no implementado") y se corrió `npx jest AuthLayout.test.tsx register.page.test.tsx` desde
`frontend/`. Con el archivo ausente, ambas suites de test fallan en la etapa de compilación
("Test suite failed to run"): no llegan a ejecutarse test por test, así que los 6 tests de
`AuthLayout.test.tsx` comparten un único mensaje de fallo (el de todo el archivo), y lo mismo ocurre
con el test de `register.page.test.tsx` que depende de `AuthLayout`.

El mensaje real que imprime Jest es `Cannot find module '../../components/AuthLayout'` — no
`'../../components/AuthLayout'` como ruta literal del import (el import real, línea 6 de
`AuthLayout.test.tsx` y línea de `page.tsx`, usa el alias `@/components/AuthLayout`), sino la ruta
relativa a la que `next/jest` resuelve ese alias internamente antes de intentar cargarlo; Jest
reporta el error con esa ruta ya resuelta, no con el alias literal.

| Test | Falló antes con | Pasa después |
|---|---|---|
| `test-block1-authlayout-empty-children-no-error` | Suite completa sin compilar: `Cannot find module '../../components/AuthLayout' from 'src/__tests__/components/AuthLayout.test.tsx'` | ✅ |
| `test-block1-card-width-desktop` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-icon-panel-visible-desktop` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-icon-panel-hidden-mobile` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-form-panel-centered-mobile` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-icon-inline-svg-no-library` | Mismo fallo de suite, mismo mensaje | ✅ |
| `test-block1-register-page-uses-authlayout` | Suite completa sin compilar: `Cannot find module '../../components/AuthLayout' from 'src/app/register/page.tsx'` (dependencia transitiva vía `Require stack: src/app/register/page.tsx → src/__tests__/app/register.page.test.tsx`) | ✅ |

Tras restaurar `AuthLayout.tsx` a su nombre original:

- Suite del bloque (`AuthLayout.test.tsx` + `register.page.test.tsx`): **9/9** (los 7 tests del
  bloque más los 2 tests de `register.page.test.tsx` que no dependen de `AuthLayout` directamente:
  tokens semánticos del `<main>` y presencia de los 4 labels del formulario).
- Suite completa del frontend: **68/68 tests, 17/17 suites**.

No quedó código ni test modificado por este procedimiento: el archivo se renombró y se restauró a su
estado original antes de cerrar la evidencia.

## Block 2 — Estilo, copy y accesibilidad del formulario

Los tests se escribieron/actualizaron primero (`FormField.test.tsx` nuevo, `RegisterForm.test.tsx`,
`useRegisterUser.test.ts` y `register.page.test.tsx` editados) contra la implementación sin tocar
(`FormField` sin prop `labelSize`, labels "Contraseña"/"Confirmar contraseña", mensajes yup con
"contraseña", `<p role="alert">` plano, sin `text-lg`/`text-base`/`space-y-[13px]`). Se corrió
`npx jest FormField.test.tsx RegisterForm.test.tsx useRegisterUser.test.ts register.page.test.tsx`
desde `frontend/` y se capturó la salida completa antes de escribir una sola línea de
implementación: **14 de 23 tests fallaron**. Tras implementar los 3 archivos de aplicación, la misma
corrida da **23/23 verdes**.

| Test | Falló antes con (mensaje/aserción real) | Pasa después |
|---|---|---|
| `test-block2-formfield-labelsize-default-sm` | Pasaba ya antes de tocar código: el `text-sm` del label está hardcodeado hoy en `FormField.tsx`, así que este test de regresión (protege el comportamiento por defecto que usa `TransactionForm`) es verde desde el inicio — no valida una funcionalidad nueva, valida que no se rompa la existente. Se dejó documentado en vez de forzarlo a fallar artificialmente. | ✅ |
| `test-block2-formfield-labelsize-base` | `expect(received).toHaveClass("text-base")` — el label no aceptaba la prop `labelSize`; TypeScript no compila la prop y en runtime (JS transpilado sin narrowing) el label seguía renderizando `class="block text-sm font-medium"`, sin `text-base` | ✅ |
| `test-block2-register-labels-clave` | `TestingLibraryElementError: Unable to find a label with the text of: Clave` (`findByLabelText("Clave")`) — el label real decía "Contraseña" | ✅ |
| `test-block2-validation-message-clave-requerida` | `TestingLibraryElementError: Unable to find an element with the text: La clave es requerida` — el mensaje yup real era "La contraseña es requerida" | ✅ |
| `test-block2-validation-message-clave-longitud` | Mismo error de `findByText`, mensaje real "La contraseña debe tener al menos 8 caracteres" en vez de "La clave debe tener al menos 8 caracteres" | ✅ |
| `test-block2-validation-message-claves-no-coinciden` | Mismo error de `findByText`, mensaje real "Las contraseñas no coinciden" en vez de "Las claves no coinciden" | ✅ |
| `test-block2-error-banner-styled` | Falló en el paso previo de `fillValidForm()`: `TestingLibraryElementError: Unable to find a label with the text of: Clave` (el formulario aún no tenía el label "Clave" para poder completarlo) | ✅ |
| `test-block2-input-font-size-lg` | `expect(element).toHaveClass("text-lg")` — recibido: `"w-full rounded-field border bg-surface px-3 py-2 text-fg border-line"` (sin `text-lg`) | ✅ |
| `test-block2-label-font-size-base` | `expect(element).toHaveClass("text-base")` — recibido: `"block text-sm font-medium"` (sin `text-base`) | ✅ |
| `test-block2-field-spacing-13px` | `TestingLibraryElementError: Unable to find an element by: [data-testid="register-form-fields"]` — el contenedor con `data-testid`/`space-y-[13px]` no existía, los `FormField` no estaban envueltos | ✅ |

Adicionalmente, tests pre-existentes que dependían del texto/copy viejo también fallaron antes de
implementar (evidencia de que no eran falsos verdes):

| Test | Falló antes con | Pasa después |
|---|---|---|
| `RegisterForm muestra un error por campo si faltan datos obligatorios (valida AC-06)` | `findByText("La clave es requerida")` no encontraba nada — el mensaje real seguía siendo "La contraseña es requerida" | ✅ |
| `RegisterForm muestra el mensaje de éxito tras un registro exitoso (valida AC-01)` | Falló en `fillValidForm()` al no encontrar el label "Clave" | ✅ |
| `RegisterForm muestra un error genérico si el backend rechaza el registro (valida AC-07)` | Mismo fallo en `fillValidForm()` | ✅ |
| `RegisterPage renderiza el formulario de registro con sus 4 campos` | `screen.getByLabelText("Clave")` no encontraba nada — el label seguía siendo "Contraseña" | ✅ |
| `useRegisterUser expone los mensajes de validación de clave en español (valida AC-05)` | `expect(result.current.fieldErrors.password).toBe("La clave es requerida")` — recibido `"La contraseña es requerida"` | ✅ |

Tras implementar `FormField.tsx` (prop `labelSize`), `RegisterForm.tsx` (labels, banner, `text-lg`,
`space-y-[13px]`) y `useRegisterUser.ts` (mensajes yup):

- Suite del bloque: **23/23 tests, 4/4 suites** (`FormField.test.tsx`, `RegisterForm.test.tsx`,
  `useRegisterUser.test.ts`, `register.page.test.tsx`).
- `TransactionForm.test.tsx` (fuera del alcance del bloque, corrido igual como control): **verde**,
  sin cambios en `TransactionForm.tsx` ni en su test (confirmado con `git diff --stat` — sin salida,
  cero diff).
- Suite completa de `frontend`: **78/78 tests, 18/18 suites**.
- `tsc --noEmit` y `eslint` sobre los archivos tocados: sin errores.

### Cálculos manuales de contraste WCAG (AC-09/NFR-01)

Fórmula usada: luminancia relativa `L = 0.2126*R' + 0.7152*G' + 0.0722*B'`, donde cada canal se
linealiza como `c = C/255`; si `c ≤ 0.03928` entonces `C' = c/12.92`, si no
`C' = ((c+0.055)/1.055)^2.4`. Ratio de contraste: `(L1+0.05)/(L2+0.05)` con `L1` la luminancia mayor.
Los valores RGB salen de `frontend/src/app/globals.css` (`:root` = modo oscuro, `.light` = modo
claro). El cálculo se hizo con un script Node ejecutado en el scratchpad de la sesión
(no forma parte del repo) para evitar errores de redondeo manual; los resultados se verificaron
también a mano.

**`test-manual-block2-nfr01-contrast-text`** — `--color-fg` vs `--color-bg`:

- Modo oscuro: `--color-fg` = `rgb(245 245 247)`, `--color-bg` = `rgb(11 11 18)`.
  `L(fg) = 0.914327`, `L(bg) = 0.003542`. Ratio = `(0.914327+0.05)/(0.003542+0.05) = 18.011:1`.
- Modo claro (`.light`): `--color-fg` = `rgb(17 17 20)`, `--color-bg` = `rgb(255 255 255)`.
  `L(fg) = 0.005706`, `L(bg) = 1.000000`. Ratio = `(1.000000+0.05)/(0.005706+0.05) = 18.849:1`.
- **Resultado: ambos ≥4.5:1 (18.011:1 y 18.849:1) — cumple, sin cambios necesarios; los tokens
  preexistentes ya cumplían de sobra.**

**`test-manual-block2-nfr01-contrast-banner`** — texto/borde del banner (`--color-error`, color
sólido, no mezclado) contra el fondo tenue del propio banner (`--color-error` mezclado por alpha
sobre `--color-surface`, que es el fondo real detrás del banner: `RegisterForm` solo se renderiza
envuelto por `AuthLayout` — `register/page.tsx:12` — cuya tarjeta usa `bg-surface`, no `bg-bg`
directamente; corregido tras la observación del module-verifier, que detectó que la primera versión
de este cálculo había usado `--color-bg` por error):

> Corrección: en modo claro `--color-surface` y `--color-bg` son ambos `rgb(255 255 255)`, así que
> los números de esa columna no cambian. En modo oscuro sí difieren (`--color-surface` = `rgb(23 22
> 31)` frente a `--color-bg` = `rgb(11 11 18)`), así que los números de esa columna se recalcularon.

Con la propuesta inicial del spec (`bg-error/10`, 10% de opacidad):

- Modo oscuro: color de fondo mezclado = `[46.20, 28.00, 36.10]` (10% de `rgb(255 82 82)` + 90% de
  `rgb(23 22 31)`). Ratio = **5.028:1** → cumple.
- Modo claro: color de fondo mezclado = `[251.50, 233.30, 233.30]` (10% de `rgb(220 38 38)` + 90% de
  `rgb(255 255 255)`). Ratio = **4.137:1** → **no cumple (< 4.5:1)**.

Al no alcanzar el umbral en modo claro con `bg-error/10` (el modo claro es, en ambas versiones del
cálculo, la restricción que decide la opacidad — el modo oscuro nunca bajó de 4.5:1 en ninguna
opacidad probada), se recalculó con opacidades menores:

| Opacidad | Ratio modo oscuro (vs `--color-surface`) | Ratio modo claro |
|---|---|---|
| 10% (`bg-error/10`, propuesta inicial del spec) | 5.028:1 | 4.137:1 ❌ |
| 5% | 5.343:1 | 4.474:1 ❌ |
| 4% | 5.402:1 | 4.543:1 ✅ (margen mínimo) |
| 3% | 5.459:1 | 4.613:1 ✅ |
| 2% | 5.514:1 | 4.685:1 ✅ |

Se eligió **3% (`bg-error/[3%]`)** en vez de 4% para dejar margen de seguridad ante redondeos de
renderizado/gamma del navegador, en lugar del valor apenas suficiente. Implementado en
`RegisterForm.tsx`: `className="rounded-field border border-error bg-error/[3%] px-4 py-3 text-error"`.

- Modo oscuro con 3%: fondo mezclado = `[29.96, 23.80, 32.53]`. Ratio = **5.459:1**.
- Modo claro con 3%: fondo mezclado = `[253.95, 248.49, 248.49]`. Ratio = **4.613:1**.
- **Resultado final: 5.459:1 (oscuro) y 4.613:1 (claro), ambos ≥4.5:1 — cumple.** El borde usa el
  mismo `--color-error` sólido, por lo que su contraste contra `--color-surface` (sin mezclar) es
  aún mayor: **5.620:1 oscuro, 4.829:1 claro**.
