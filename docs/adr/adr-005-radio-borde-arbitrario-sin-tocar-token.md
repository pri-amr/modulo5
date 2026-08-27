# ADR-005: Radio de borde de 1rem con valores arbitrarios, sin tocar el token `field`

| Field | Value |
|-------|-------|
| Date | 2026-08-27 |
| Ticket | FEAT-007 |
| Status | Accepted |

## Context

FEAT-007 pide que la tarjeta, los inputs, el botón y el banner de error de la pantalla de registro
tengan un radio de borde de 1rem. Hoy esos cuatro elementos usan la clase `rounded-field`, que
`tailwind.config.ts` define como `0.375rem`. Ese mismo token lo usa también
`frontend/src/components/TransactionForm.tsx` (pantalla de transacciones) en sus propios inputs y
botón.

## Options considered

### Option 1: Cambiar el valor del token `field` en `tailwind.config.ts` a `1rem`
- **Pros:** un solo cambio en un lugar; toda clase `rounded-field` existente pasa a 1rem
  automáticamente.
- **Cons:** cambia también el radio de borde de `TransactionForm.tsx`, una pantalla que nadie pidió
  tocar en este ticket.

### Option 2: Usar valores arbitrarios de Tailwind (`rounded-[1rem]`) en los elementos concretos de la pantalla de registro
- **Pros:** aísla el cambio a los elementos que el PRD nombra explícitamente; `TransactionForm.tsx`
  queda bit a bit igual, sin ningún riesgo de regresión visual no pedida.
- **Cons:** el proyecto termina con dos radios de borde "de campo" convivientes (`rounded-field` =
  0.375rem en transacciones, `rounded-[1rem]` en registro) hasta que alguien decida unificarlos.

## Decision

Opción 2: valores arbitrarios `rounded-[1rem]` aplicados localmente en `AuthLayout.tsx` y
`RegisterForm.tsx`. Es el mismo criterio de aislamiento que FEAT-006 ya aplicó con la prop
`labelSize` de `FormField` para no afectar a `TransactionForm.tsx` sin que nadie lo pidiera.

## Consequences

- `tailwind.config.ts` no se modifica; `TransactionForm.tsx` sigue con `rounded-field` (0.375rem)
  sin ningún cambio.
- La pantalla de registro y la de transacciones quedan con radios de borde distintos hasta que un
  ticket futuro decida unificarlos deliberadamente — no es un accidente, es la decisión de este
  ADR.
- Una futura decisión de unificar 1rem como radio estándar de toda la aplicación reemplazaría esta
  (con un nuevo ADR que supere a este) y se aplicaría de una vez sobre el token compartido, en vez
  de arrastrar valores arbitrarios sueltos.
