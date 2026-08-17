# Verificación FEAT-003: Aplicar tokens semánticos de tema a componentes

| Field | Value |
|---|---|
| Ticket | FEAT-003 |
| PRD | docs/daw/prd/prd-FEAT-003.md |
| Spec | docs/daw/specs/spec-FEAT-003.md |
| SAST | docs/daw/security/sast-FEAT-003.md (PASSED) |
| Verificador | `daw-module-verifier` (agente independiente, no escribió el código) |
| Resultado | **PASSED** (con reservas documentadas) |

## Trazabilidad PRD → Código → Tests

| AC | Resultado | Código | Test |
|---|---|---|---|
| AC-01 | ⚠️ PASS con WARN (F-VER-01) | `layout.tsx:19` (`className="dark"` estático) | `layout.test.tsx` — ver nota abajo |
| AC-02 | ✅ PASS | `ThemeToggle.tsx:5-6` (`TOGGLE_BUTTON_CLASSNAME` en ambos returns) | `ThemeToggle.test.tsx:31-77` |
| AC-03 | ✅ PASS | `page.tsx:9` (`bg-bg px-4 py-8 text-fg`) | `page.test.tsx` (nuevo) |
| AC-04 | ✅ PASS | `TransactionForm.tsx:30-33` (`hasError`/`fieldClassName`) | `TransactionForm.test.tsx:247-264` |
| AC-05 | ✅ PASS | ídem | `TransactionForm.test.tsx:266-289` (con control negativo) |
| AC-06 | ✅ PASS | `FormField.tsx:12,17` | `TransactionForm.test.tsx:291-313` |
| AC-07 | ✅ PASS | `TransactionForm.tsx:138-144` | `TransactionForm.test.tsx:315-353` (clase + `disabled` real) |
| AC-08 | ✅ PASS | — | 48/48 tests verdes; ningún assert preexistente tocado (verificado por diff bloque a bloque) |
| AC-09 | ✅ PASS | `TransactionForm.tsx:123-131` (`<input type="text">`) | `TransactionForm.test.tsx:355-361` (`tagName === "INPUT"`) |

## Spec — tareas por bloque

- ✅ Block 1 (layout + ThemeToggle + `rounded-field`) — 3/3 tests requeridos, verdes.
- ✅ Block 2 (`page.tsx`) — 2/2 tests requeridos, verdes.
- ✅ Block 3 (`TransactionForm`) — 6/6 tests requeridos, verdes (incluye revisión de los 9 tests
  preexistentes por dependencia del tag `textarea`, sin hallazgos).
- ✅ FR-09 verificado por `git diff` acotado: `globals.css` intacto, `tailwind.config.ts` solo ganó
  `borderRadius.field`.
- ✅ Extracción de `FormField.tsx` (fuera del spec original, corrección de arch-auditor ronda 2 por
  longitud) — no altera el DOM ni ningún test; `TransactionForm.tsx` quedó en 149 líneas (<150).

## Evidencia TDD

Aceptada por especificidad y consistencia con el diff real (commits `c26d947`, `b33ce89`,
`0a5e614`): cada test nuevo trae descripta la aserción que fallaba antes del cambio. El verificador
no pudo reconstruir el estado "antes" del código porque ya está mergeado — aceptado como el caso
habitual de verificación post-hoc.

## Calidad

- ✅ `tsc --noEmit` (corrido en vivo) — 0 errores.
- ⚠️ **F-VER-05 (lint) — WARN**: no hay ESLint instalado/configurado en `frontend/` pese a que
  `AGENTS.md` lo declara como stack. Preexistente al ticket, no introducido por FEAT-003.
- ✅ Sin imports sin usar, sin código muerto (revisión manual de los 6 archivos tocados).
- ✅ Cobertura (corrida en vivo, 48/48 tests, 12/12 suites):
  - `layout.tsx`: 87.5%/100%/100%/100%
  - `page.tsx`, `ThemeToggle.tsx`, `TransactionForm.tsx`, `FormField.tsx`, `tailwind.config.ts`:
    100%/100%/100%/100%
  - Global del proyecto: 98.8% stmts / 80.39% branch / 100% funcs / 99.28% lines — ≥80% en las 3
    dimensiones, global y por archivo.
- ⚠️ **W-VER-03 — WARN**: mock de `TransactionService` en `page.test.tsx` posiblemente innecesario
  (`TransactionForm` se importa con `next/dynamic`), ya autoseñalado por el implementador en el
  commit `b33ce89`. No bloquea.

## Sad paths

- ✅ F-VER-04: `TransactionForm` (única superficie de input real de este ticket) mantiene sus
  sad-paths preexistentes, más AC-04/AC-05 que cubren la variante negativa y positiva del
  comportamiento nuevo (`hasError`).

## Seguridad

- ✅ `docs/daw/security/sast-FEAT-003.md` — PASSED, 14 categorías limpias, 1 High de dependencia
  (`nanoid`) corregida vía override, 0 suppressions pendientes.

## WARNs documentados (no bloquean, quedan registrados para antes de RELEASE)

1. **AC-01 / F-VER-01** — `layout.test.tsx` no protege realmente el requisito literal de AC-01
   (clase `dark` presente *antes* de que `ThemeSync` sincronice). El verificador comprobó
   empíricamente que remover `className="dark"` de `layout.tsx` no hace fallar el test, porque el
   tema por defecto del store ya es `"dark"` y React Testing Library flushea el efecto de
   `ThemeSync` dentro de `render()` antes de cualquier `waitFor`. El código SÍ cumple FR-01
   (verificado por lectura directa); el test no blindaría una regresión que lo borrara. Mejora
   sugerida para una iteración futura: asertar la clase inmediatamente tras `render()` sin
   `waitFor`, o mockear `useSyncThemeClass` para aislar la aserción del efecto dinámico.
2. **F-VER-05 (lint)** — sin ESLint configurado en `frontend/`, preexistente, fuera del alcance de
   este ticket.
3. **W-VER-03** — mock posiblemente innecesario en `page.test.tsx`, ya señalado por el implementador.

---

**Total: 9 AC PASS, 3 bloques PASS, 0 FAIL, 3 WARN.**
**Resultado: PASSED → `gates.verify = true`.**
**Next:** confirmar avance a RELEASE.
