# ADR-004: Ícono del layout de registro como SVG inline, sin librería de íconos

| Field | Value |
|-------|-------|
| Date | 2026-08-27 |
| Ticket | FEAT-006 |
| Status | Accepted |

## Context

El rediseño visual de la pantalla de registro (FEAT-006, FR-03) agrega una columna izquierda con un
ícono genérico de temática financiera. El proyecto no tenía, hasta este ticket, ninguna librería de
íconos instalada (`frontend/package.json` no declara `lucide-react`, `heroicons`, `react-icons` ni
equivalentes).

## Options considered

### Option 1: SVG inline en el componente
- **Pros:** cero dependencias nuevas; no hay que justificar ni versionar un paquete para mostrar un
  único ícono decorativo; el SVG se ajusta libremente a los tokens de color existentes sin capa de
  props intermedia.
- **Cons:** si más adelante se necesitan varios íconos en la app, escribir cada uno a mano se vuelve
  repetitivo.

### Option 2: Instalar una librería de íconos (ej. lucide-react)
- **Pros:** catálogo amplio listo para usar, consistencia si la app termina necesitando muchos
  íconos.
- **Cons:** dependencia nueva para resolver un solo ícono decorativo en esta etapa del proyecto; hay
  que justificarla por AGENTS.md y verificar antigüedad mínima del paquete sin necesidad real
  todavía.

## Decision

SVG inline, sin librería nueva. Con un solo ícono decorativo en juego, la dependencia no se justifica
todavía; el usuario decidió explícitamente esta opción durante la definición del PRD.

## Consequences

- El ícono vive como markup SVG dentro del componente de layout de la pantalla de registro
  (`frontend/src/components/AuthLayout.tsx`), sin importar ningún paquete de íconos.
- Si en el futuro la app necesita múltiples íconos (dashboard, categorías, fuentes de dinero), este
  patrón de SVG inline puede volverse repetitivo — en ese momento corresponde reevaluar instalar una
  librería, no antes.
- No hay ningún límite técnico impuesto por esta decisión sobre otras pantallas: la próxima que
  necesite un ícono decide de nuevo, con el contexto de ese momento.
