# Spec FEAT-003: Aplicar tokens semánticos de tema a componentes

| Field | Value |
|-------|-------|
| Ticket | FEAT-003 |
| PRD | docs/daw/prd/prd-FEAT-003.md |
| Tier | FEATURE |
| Date | 2026-08-11 |
| Spec loops | 0 |

## Summary

Se aplican los 10 tokens semánticos de color ya definidos por FEAT-002 a los cuatro archivos que esa
feature dejó explícitamente fuera de alcance: `layout.tsx`, `ThemeToggle.tsx`, `page.tsx` y
`TransactionForm.tsx`. Es trabajo puramente de clases Tailwind (sin tokens nuevos, sin tocar el
mecanismo de alternancia de tema), salvo dos piezas nuevas de infraestructura: la utilidad
`rounded-field` (0.375rem) definida en `tailwind.config.ts` como `theme.extend.borderRadius`, y el
cambio del campo Descripción de `TransactionForm` de `<textarea>` a `<input type="text">` (FR-10),
detectado durante el impact scan de PLAN y ya incorporado al PRD (loop correctivo, PRD loops: 1). Se
divide en 3 bloques independientes y shippeables por separado.

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 | Block 1 |
| FR-02 | Block 1 |
| FR-03 | Block 2 |
| FR-04 | Block 3 |
| FR-05 | Block 3 |
| FR-06 | Block 3 |
| FR-07 | Block 3 |
| FR-08 | Block 3 |
| FR-09 | Strategy: ningún bloque toca `globals.css` ni las 10 entradas de color de `tailwind.config.ts` — solo se agrega la entrada nueva `borderRadius.field` (Block 1), que no es un token semántico de color. |
| FR-10 | Block 3 |
| NFR-01 | Strategy: ningún bloque toca `useThemeStore`, `useSyncThemeClass` ni `ThemeSync` — las clases nuevas leen las mismas variables CSS que ya reaccionan al cambio de `theme`, por lo que el toggle sigue actualizando la apariencia sin recarga con el mecanismo existente. |
| NFR-02 | Block 3 — `border-error` es un refuerzo visual adicional al `<p role="alert">` existente, que no se modifica. |
| AC-01 | Block 1 |
| AC-02 | Block 1 |
| AC-03 | Block 2 |
| AC-04 | Block 3 |
| AC-05 | Block 3 |
| AC-06 | Block 3 |
| AC-07 | Block 3 |
| AC-08 | Block 1, Block 2, Block 3 (cada bloque verifica que sus tests previos siguen pasando) |
| AC-09 | Block 3 |

## Dependencies between blocks

Ninguna. Los 3 bloques tocan archivos disjuntos (`tailwind.config.ts`+`layout.tsx`+`ThemeToggle.tsx`
en Block 1; `page.tsx` en Block 2; `TransactionForm.tsx` en Block 3) y ningún bloque importa código
que otro bloque cree. Pueden implementarse y shippearse en cualquier orden; se ejecutan en el orden
1→2→3 por conveniencia (de la infraestructura compartida — `rounded-field` — hacia el consumidor más
complejo).

## Block 1 — Base de tema: layout, ThemeToggle y utilidad `rounded-field`

**Files**
- `frontend/tailwind.config.ts` (modified) — agregar `theme.extend.borderRadius.field = "0.375rem"`.
- `frontend/src/app/layout.tsx` (modified) — agregar `className="dark"` estático al `<html>`.
- `frontend/src/components/ThemeToggle.tsx` (modified) — agregar las clases de FR-02 a ambos
  `<button>` (el de `!hasHydrated` y el hidratado), para que el toggle no "salte" de estilo al
  hidratar.
- `frontend/src/__tests__/components/ThemeToggle.test.tsx` (modified) — agregar aserciones de clase.
- `frontend/src/__tests__/app/layout.test.tsx` (verificar, sin cambios esperados) — confirmar que
  sigue pasando con la clase estática agregada.

**Logic**

`tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: { /* sin cambios, las 10 entradas existentes */ },
    borderRadius: {
      field: "0.375rem",
    },
  },
},
```

`layout.tsx`: cambiar `<html lang="es" suppressHydrationWarning>` por
`<html lang="es" suppressHydrationWarning className="dark">`. `suppressHydrationWarning` ya está
presente y cubre la remoción/adición dinámica que hace `useSyncThemeClass` tras el montaje (confirmado
en el impact scan: `classList.remove("light","dark")` antes de `add(theme)`).

`ThemeToggle.tsx`: agregar a **ambos** `return` (el de carga y el hidratado) la clase:
`"fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-fg shadow hover:bg-accent-blue hover:text-white"`
(FR-02 exacto). El botón de carga (`!hasHydrated`) también la recibe, para que no haya un salto visual
entre el estado de carga y el hidratado — el PRD no lo dice explícitamente, pero el AC-02 dice "en
cualquier modo", y dejar el botón de carga sin clases mientras el resto del layout ya tiene tema
produciría el mismo tipo de inconsistencia visual que motivó el loop correctivo de FR-10; no
constituye un cambio de alcance porque la clase es la misma en ambos casos, no hay lógica nueva.

**Error handling**

No aplica — cambios de clases estáticas, sin lógica condicional nueva ni entradas de usuario.

**Required tests**

- [ ] `ThemeToggle.test.tsx`: nuevo test o extensión de uno existente que verifique
  `toHaveClass("fixed", "right-4", "top-4", "z-50", "rounded-full", "bg-surface-muted", "text-fg")`
  en el botón hidratado — valida AC-02.
- [ ] `ThemeToggle.test.tsx`: verificar que el botón en estado `!hasHydrated` también tiene las
  clases de posicionamiento/forma — refuerzo de AC-02, no un AC nuevo.
- [ ] `layout.test.tsx`: correr sin modificar y confirmar que sigue en verde (la aserción
  `document.documentElement.classList.contains("dark")` no depende de si la clase llegó estática o
  por el efecto) — valida AC-01 y AC-08.

**Completion criterion**

`ThemeToggle.test.tsx` y `layout.test.tsx` pasan; `pnpm --filter frontend exec tsc --noEmit` sin
errores; inspección manual (o snapshot) confirma que `<html>` sirve con `class="dark"` en el HTML
inicial del servidor.

---

## Block 2 — `page.tsx`

**Files**
- `frontend/src/app/page.tsx` (modified) — aplicar clases de fondo/texto/espaciado con tokens
  semánticos.
- `frontend/src/__tests__/app/page.test.tsx` (new) — no existe hoy.

**Logic**

FR-03 deja el detalle exacto de las clases a esta fase. Se aplican al `<main>` y al `<h1>`:

```tsx
<main className="min-h-screen bg-bg px-4 py-8 text-fg">
  <h1 className="mb-6 text-2xl font-semibold">Finanzas personales</h1>
  <TransactionForm ... />
</main>
```

- `bg-bg` / `text-fg`: mismos tokens que ya usa `body` en `globals.css` — consistencia exigida por
  AC-03 ("usando exclusivamente tokens semánticos ya definidos por FEAT-002, sin colores
  hardcodeados"). Aplicarlos de nuevo en `<main>` es redundante con `body` en términos de resultado
  visual, pero cumple la letra de FR-03 ("clases de Tailwind que usen los tokens semánticos... de
  forma consistente con el resto de la interfaz") y dado que es el único elemento con contenido
  visible de `page.tsx`, es donde corresponde aplicarlas.
- `px-4 py-8` / `mb-6 text-2xl font-semibold`: espaciado y tipografía sin token (no hay tokens de
  espaciado/tipografía en FEAT-002, y el PRD no los pide) — usan la escala estándar de Tailwind, no
  colores hardcodeados, por lo que no violan FR-09/AC-03.

**Error handling**

No aplica.

**Required tests**

- [ ] `page.test.tsx` (nuevo): renderiza `HomePage` y verifica `toHaveClass("bg-bg", "text-fg")` en
  el `<main>` — valida AC-03.
- [ ] `page.test.tsx` (nuevo): verifica que no hay ningún atributo `style` con color hardcodeado ni
  clases `bg-[#...]`/`text-[#...]` — refuerzo de AC-03 (FR-09).

**Completion criterion**

`page.test.tsx` pasa; `tsc --noEmit` sin errores; inspección visual en modo claro y oscuro confirma
que `<main>` cambia de fondo/texto al alternar tema.

---

## Block 3 — `TransactionForm.tsx`: `hasError`, clases de campos y Descripción como input

**Files**
- `frontend/src/components/TransactionForm.tsx` (modified) — lógica `hasError` por campo, clases en
  los 7 campos (6 existentes + Descripción convertida), labels, textos de error, botón de submit.
- `frontend/src/__tests__/components/TransactionForm.test.tsx` (modified) — aserciones de clase
  nuevas + revisión de cualquier referencia al tag `textarea` del campo Descripción.

**Logic**

`hasError` (FR-04): función local, no un solo booleano — se calcula por campo a partir de
`fieldErrors[campo]`:

```ts
const hasError = (field: keyof TransactionFormValues): boolean => Boolean(fieldErrors[field]);
```

Clases por tipo de elemento (aplicadas a los 7 campos: `type`, `amount`, `moneySourceId`, `currency`,
`categoryId`, `date`, `description`):

- **input/select** (FR-05):
  `` `w-full rounded-field border bg-surface px-3 py-2 text-fg ${hasError("campo") ? "border-error" : "border-line"}` ``
- **label** (FR-06): `"block text-sm font-medium"` en los 7 `<label>`.
- **texto de error** (FR-07): `"mt-1 text-sm text-error"` en los 7 `<p role="alert">` condicionales
  de campo (no en el `<p role="alert">` de error general del formulario, que el PRD no menciona en
  FR-07 — ese `error` general queda fuera de este FR, se mantiene sin clase salvo que el usuario
  pida lo contrario en una futura iteración).
- **botón submit** (FR-08): `"rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-blue disabled:opacity-50"`.

**Descripción: `<textarea>` → `<input type="text">` (FR-10)**

```tsx
<div>
  <label htmlFor="description" className="block text-sm font-medium">Descripción</label>
  <input
    id="description"
    type="text"
    value={values.description}
    onChange={handleChange("description")}
    disabled={loading}
    className={`w-full rounded-field border bg-surface px-3 py-2 text-fg ${hasError("description") ? "border-error" : "border-line"}`}
  />
  {fieldErrors.description ? <p role="alert" className="mt-1 text-sm text-error">{fieldErrors.description}</p> : null}
</div>
```

Mismo `id`, mismo `onChange`, mismo `disabled`, mismo `value` que el `<textarea>` actual (preserva
comportamiento, cambia solo el tag — FR-10). `handleChange` ya funciona igual para `input` y
`textarea` (usa `ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>`); tras el
cambio el tipo del evento se reduce a `HTMLInputElement | HTMLSelectElement`, hay que ajustar la
firma de `handleChange` en el mismo archivo.

**Error handling**

Sin cambios en el manejo de errores de validación — `fieldErrors` y `error` general siguen viniendo
de `useCreateTransaction`, no modificado por este ticket.

**Required tests**

- [ ] `TransactionForm.test.tsx`: por cada campo sin error, `toHaveClass("border-line")` y NO
  `toHaveClass("border-error")` — valida AC-04.
- [ ] `TransactionForm.test.tsx`: tras un submit inválido que deja `fieldErrors` poblado, cada campo
  con error tiene `toHaveClass("border-error")` y NO `toHaveClass("border-line")` — valida AC-05.
- [ ] `TransactionForm.test.tsx`: labels tienen `toHaveClass("block", "text-sm", "font-medium")` y
  los `<p role="alert">` de campo tienen `toHaveClass("mt-1", "text-sm", "text-error")` — valida
  AC-06.
- [ ] `TransactionForm.test.tsx`: botón de submit tiene `bg-accent` siempre, y
  `disabled:opacity-50` presente en la clase (Tailwind aplica la opacidad vía el modificador
  `disabled:`, se verifica con `toHaveClass("disabled:opacity-50")` y `element.disabled === true`
  cuando `loading=true`) — valida AC-07.
- [ ] `TransactionForm.test.tsx`: el campo Descripción se renderiza como
  `getByLabelText("Descripción")` con `tagName === "INPUT"` y `type === "text"` — valida AC-09.
- [ ] `TransactionForm.test.tsx`: revisar los 9 tests existentes — ninguno depende del tag
  `textarea` (confirmado en el impact scan: usan `findByText`/`role="alert"`, no selectores por
  tag); si alguno usara `getByRole("textbox")` de forma ambigua con múltiples matches al convertir
  el campo, ajustar el selector a `getByLabelText` — no relaja ninguna aserción de comportamiento
  (AC-08).

**Completion criterion**

`TransactionForm.test.tsx` (9 tests existentes + los nuevos de este bloque) pasa en verde; `tsc
--noEmit` sin errores; inspección manual confirma que un campo con error muestra borde rojo y uno
sin error borde neutro, en ambos modos de tema.

---

## Final verification

- Los 3 bloques completos y sus tests en verde: `ThemeToggle.test.tsx`, `layout.test.tsx`,
  `page.test.tsx` (nuevo), `TransactionForm.test.tsx`.
- `pnpm --filter frontend exec tsc --noEmit` limpio.
- Ningún token semántico de color modificado en `globals.css`/`tailwind.config.ts` (solo se agregó
  `borderRadius.field`, que no es un color) — verificable con `git diff` acotado a esas líneas.
- Inspección manual en modo claro y modo oscuro: los 4 componentes cambian de apariencia al alternar
  el tema con `ThemeToggle`, sin recargar la página.
- `daw-security-sast` PASSED (gate de CODE) — cambios son solo de clases CSS y un cambio de tag
  HTML, superficie de ataque no incrementada, pero el gate corre igual por protocolo.
