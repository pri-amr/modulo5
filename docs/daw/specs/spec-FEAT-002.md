# Spec FEAT-002: Tokens semánticos de tema claro/oscuro (Tailwind + variables CSS en globals.css)

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| PRD | docs/daw/prd/prd-FEAT-002.md |
| Tier | FEATURE |
| Date | 2026-08-06 |
| Spec loops | 0 |

## Summary

Se define un conjunto de 10 tokens semánticos de color como variables CSS en `globals.css`, con
`:root` portando los valores de **modo oscuro** (el default de la app, para evitar el parpadeo
claro→oscuro que produciría usar `:root` para el modo claro — ver "Riesgos" abajo) y `.light`
como override para modo claro, reutilizando sin modificarlo el mecanismo de FEAT-001 que aplica
esa clase a `<html>`. Los tokens se exponen como colores de Tailwind vía `theme.extend.colors` en
`tailwind.config.ts`, con el patrón `rgb(var(--color-x) / <alpha-value>)`. El único color
hardcodeado detectado en el frontend (`#376BCB` inline en `Loader.tsx`) se reemplaza por el token
`accent-blue`.

## Coverage: PRD → blocks

| Requirement | Covered by |
|---|---|
| FR-01 (`--color-bg`) | Block 1 |
| FR-02 (`--color-surface`) | Block 1 |
| FR-03 (`--color-surface-muted`) | Block 1 |
| FR-04 (`--color-fg`) | Block 1 |
| FR-05 (`--color-fg-muted`) | Block 1 |
| FR-06 (`--color-line`) | Block 1 |
| FR-07 (`--color-accent`) | Block 1 |
| FR-08 (`--color-accent-blue`) | Block 1 |
| FR-09 (`--color-success`) | Block 1 |
| FR-10 (`--color-error`) | Block 1 |
| FR-11 (exposición como paleta de Tailwind) | Block 1 |
| FR-12 (`body` usa fondo/texto base) | Block 1 |
| FR-13 (Loader sin color hardcodeado) | Block 2 |
| FR-14 (tokens cambian al alternar tema) | Block 1 (define los 10 tokens dos veces, `:root` y `.light`; el mecanismo de FEAT-001 que alterna la clase en `<html>` no se modifica) |
| NFR-01 (accent-blue = #376BCB en modo claro) | Block 1 (valor `.light`), verificado en Block 2 vía Loader |
| NFR-02 (10 tokens, sin recarga) | Strategy: cascada CSS nativa vía `:root`/`.light`, sin JS adicional — el cambio de clase ya dispara el recálculo de todas las variables sin recargar. |

## Dependencies between blocks

Block 2 depende de Block 1 (usa el token `accent-blue` que Block 1 define y expone en
`tailwind.config.ts`). Orden: Block 1 → Block 2.

## Riesgos de diseño heredados de PLAN (a tener presentes en CODE)

- **FOUC de tema (mitigado por diseño):** el mecanismo de FEAT-001 aplica la clase de tema
  (`.light`/`.dark`) recién en un `useEffect`, después de la hidratación; el HTML servido no
  tiene clase. Definir `:root` con los valores **oscuros** (en vez de claros) hace que el primer
  paint, sin ninguna clase aplicada todavía, ya muestre el estado por defecto correcto (RNF-11:
  oscuro por defecto). El residual — un usuario que eligió modo claro ve un flash oscuro→claro
  breve en cada carga hasta que el efecto aplica `.light` — se acepta como riesgo menor: afecta
  solo a quien activamente cambió el modo, no al caso por defecto, y no se mitiga en este ticket
  (mitigarlo del todo requeriría tocar `useSyncThemeClass`/SSR, fuera de alcance del PRD).
- **Tests de `globals.css` como texto plano:** `jsdom` no ejecuta el pipeline de PostCSS/Tailwind,
  así que no hay forma de leer un color "computado" en los tests de Jest. Los tests de Block 1
  leen el archivo como texto y verifican los valores RGB exactos por selector — es un trade-off
  consciente (verificar la *definición* del token, no su renderizado en un navegador real), no un
  detalle implícito.
- **Ubicación de tests:** `globals.test.ts` y `tailwind.config.test.ts` van en
  `frontend/src/__tests__/app/`, seleccionado por consistencia con la convención existente de que
  `__tests__/` espeja `src/` (ya hay precedente: `__tests__/app/layout.test.tsx` para
  `src/app/layout.tsx`). `tailwind.config.ts` vive fuera de `src/` pero gobierna los estilos de
  `src/app/globals.css`, así que se agrupa ahí en vez de crear una carpeta `styles/` sin
  precedente.

## Block 1 — Infraestructura de tokens semánticos

**Files**
- `frontend/src/app/globals.css` (modified) — agrega los bloques `:root`/`.light` y la regla `body`.
- `frontend/tailwind.config.ts` (modified) — agrega `theme.extend.colors`.
- `frontend/src/__tests__/app/globals.test.ts` (new) — verifica el contenido de `globals.css`.
- `frontend/src/__tests__/app/tailwind.config.test.ts` (new) — verifica el mapeo de colores del config.

**Logic**

`globals.css` queda así (se preservan las 2 líneas existentes al inicio):

```css
@import "tailwindcss";
@config "../../tailwind.config.ts";

/* Tokens semánticos de color (RGB, sin unidad, para el patrón `rgb(var(--x) / <alpha-value>)`
   de Tailwind — ver tailwind.config.ts). :root define el modo oscuro (default de la app, RNF-11);
   .light lo sobreescribe. Estos valores son la única fuente de verdad para los colores de la app. */
:root {
  --color-bg: 11 11 18; /* #0B0B12 */
  --color-surface: 23 22 31; /* #17161F */
  --color-surface-muted: 32 30 43; /* #201E2B */
  --color-fg: 245 245 247; /* #F5F5F7 */
  --color-fg-muted: 160 163 177; /* #A0A3B1 */
  --color-line: 42 40 54; /* #2A2836 */
  --color-accent: 155 123 250; /* #9B7BFA violeta/lila */
  --color-accent-blue: 110 168 255; /* #6EA8FF azul/celeste */
  --color-success: 125 209 129; /* #7DD181 */
  --color-error: 255 82 82; /* #FF5252 */
}

.light {
  --color-bg: 255 255 255; /* #FFFFFF */
  --color-surface: 255 255 255; /* #FFFFFF */
  --color-surface-muted: 243 242 250; /* #F3F2FA */
  --color-fg: 17 17 20; /* #111114 */
  --color-fg-muted: 107 114 128; /* #6B7280 */
  --color-line: 226 228 234; /* #E2E4EA */
  --color-accent: 124 58 237; /* #7C3AED violeta/lila */
  --color-accent-blue: 55 107 203; /* #376BCB azul/celeste, mismo tono que el Loader (RNF-12) */
  --color-success: 30 142 62; /* #1E8E3E */
  --color-error: 220 38 38; /* #DC2626 */
}

body {
  @apply bg-bg text-fg;
}
```

`tailwind.config.ts` agrega, sin tocar `darkMode`/`content` existentes:

```ts
theme: {
  extend: {
    colors: {
      bg: "rgb(var(--color-bg) / <alpha-value>)",
      surface: "rgb(var(--color-surface) / <alpha-value>)",
      "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
      fg: "rgb(var(--color-fg) / <alpha-value>)",
      "fg-muted": "rgb(var(--color-fg-muted) / <alpha-value>)",
      line: "rgb(var(--color-line) / <alpha-value>)",
      accent: "rgb(var(--color-accent) / <alpha-value>)",
      "accent-blue": "rgb(var(--color-accent-blue) / <alpha-value>)",
      success: "rgb(var(--color-success) / <alpha-value>)",
      error: "rgb(var(--color-error) / <alpha-value>)",
    },
  },
},
```

**Input validation**

No aplica — no hay input de usuario en este bloque.

**Error handling**

No aplica — no hay operaciones que puedan fallar en tiempo de ejecución (CSS y config estáticos).

**Required tests**

- [ ] `globals.test.ts` — "define los 10 tokens bajo :root con los valores de modo oscuro" — lee `globals.css`, verifica cada `--color-x: <valor>;` dentro del bloque `:root`. Valida AC-02, AC-05.
- [ ] `globals.test.ts` — "define los 10 tokens bajo .light con los valores de modo claro" — mismo método sobre el bloque `.light`, valores distintos a `:root`. Valida AC-01, AC-05.
- [ ] `globals.test.ts` — "el valor de --color-accent-blue en .light es 55 107 203 (#376BCB)" — assertion dedicada para NFR-01. Valida NFR-01.
- [ ] `globals.test.ts` — "aplica bg-bg y text-fg al body" — verifica la presencia de la regla `body { @apply bg-bg text-fg; }`. Valida FR-12, AC-01, AC-02.
- [ ] `globals.test.ts` — "conserva la sintaxis de importación de Tailwind 4" — verifica que `@import "tailwindcss";` sigue presente y que no aparece ninguna directiva `@tailwind` (v3). Sad path de regresión: falla si alguien reintroduce la sintaxis vieja.
- [ ] `tailwind.config.test.ts` — "expone los 10 tokens semánticos como colores de Tailwind" — importa el config, `it.each` sobre los 10 nombres verificando `theme.extend.colors[nombre] === "rgb(var(--color-nombre) / <alpha-value>)"`. Valida FR-11, AC-04.
- [ ] `tailwind.config.test.ts` — "no modifica darkMode ni content existentes" — verifica que `darkMode === "class"` se mantiene. Sad path de regresión.

**Completion criterion**

`pnpm test globals.test.ts tailwind.config.test.ts` pasa (7/7), y una inspección visual de
`globals.css`/`tailwind.config.ts` confirma que las líneas preexistentes (`@import`, `@config`,
`darkMode`, `content`) no cambiaron.

## Block 2 — Migrar Loader al token de acento

**Files**
- `frontend/src/components/Loader.tsx` (modified) — reemplaza el `style` inline por clases del token.
- `frontend/src/__tests__/components/Loader.test.tsx` (modified) — agrega assertions del nuevo markup.

**Logic**

`Loader.tsx` cambia de:

```tsx
<div
  role="status"
  aria-label="Cargando"
  className="h-8 w-8 animate-spin rounded-full border-4"
  style={{ borderColor: "#376BCB", borderTopColor: "transparent" }}
/>
```

a:

```tsx
<div
  role="status"
  aria-label="Cargando"
  className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"
/>
```

Sin `style` inline. El color proviene íntegramente del token `accent-blue` definido en Block 1.

**Input validation**

No aplica — `Loader` no recibe props de color, solo `visible` (sin cambios).

**Error handling**

No aplica.

**Required tests**

- [ ] `Loader.test.tsx` — "no tiene atributo style" — `expect(screen.getByRole("status")).not.toHaveAttribute("style")`. Valida AC-06.
- [ ] `Loader.test.tsx` — "aplica la clase del token de acento" — `expect(screen.getByRole("status")).toHaveClass("border-accent-blue")`. Valida AC-03, AC-06.
- [ ] `Loader.test.tsx` — mantener sin cambios los 2 tests existentes (renderiza cuando `visible`, no renderiza cuando no). Regresión.

**Completion criterion**

`pnpm test Loader.test.tsx` pasa (4/4: 2 existentes + 2 nuevos), y `grep -n "#[0-9A-Fa-f]\{3,8\}\|style="` sobre `Loader.tsx` no devuelve coincidencias de color.

## Final verification

- Los 4 archivos de test (`globals.test.ts`, `tailwind.config.test.ts`, `Loader.test.tsx` y el
  resto de la suite existente) pasan en verde.
- `pnpm build` (frontend) completa sin errores — confirma que Tailwind 4 sigue compilando con la
  sintaxis preservada.
- Grep global (`grep -rn "#[0-9A-Fa-f]\{3,8\}" frontend/src --include="*.tsx" --include="*.ts"`)
  no devuelve resultados fuera de los propios valores documentados en `globals.css` (que es CSS,
  no `.ts`/`.tsx`) — confirma FR-13 y que no se introdujo un nuevo hardcode en el camino.
- `daw-security-sast` limpio (sin superficie nueva relevante, per threat model).
