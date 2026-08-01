# ADR-001: Ubicación de las interfaces de repositorio en el backend

| Field | Value |
|-------|-------|
| Date | 2026-08-01 |
| Ticket | FEAT-001 |
| Status | Accepted |

## Context

`AGENTS.md` define la arquitectura del backend como DDD + CQRS y fija la regla de dependencias:
`domain` no conoce nada, `application` conoce `domain`+`common`, `infrastructure` conoce
`domain`+`application`, `presentation` conoce `application`. Bajo esa regla, `application/services`
(p. ej. `CreateTransactionService`) no puede importar directamente clases concretas de
`infrastructure/repositories` — necesita depender de una abstracción.

Sin embargo, el árbol de carpetas documentado en `AGENTS.md` solo lista `domain/entities/` como
subcarpeta de `domain/`, sin mencionar dónde viven los contratos de repositorio. El impact scan de
FEAT-001 confirmó que no hay código, ADR ni convención previa en el repo que resuelva esto — es la
primera vez que el proyecto necesita esta decisión.

## Options considered

### Option 1: `domain/repositories/` (interfaces puras)
- **Pros:** una interfaz sin dependencias externas no rompe "domain no conoce nada"; es el patrón
  estándar de DDD (el dominio define el contrato, la infraestructura lo implementa); `application`
  puede importarla sin violar la regla de capas; extiende el árbol documentado de forma mínima y
  predecible para futuros módulos.
- **Cons:** `AGENTS.md` no menciona hoy esta subcarpeta explícitamente, así que este ADR pasa a ser
  la referencia normativa para los próximos módulos.

### Option 2: Definir el tipo del repositorio inline en `application/services`
- **Pros:** no agrega una carpeta nueva a `domain/`.
- **Cons:** mezcla el contrato con su único consumidor, dificulta reutilizarlo desde otros servicios
  de `application`, y diluye la separación domain/application que el resto de la convención sí
  respeta para entidades.

## Decision

Se adopta la **Option 1**: las interfaces de repositorio viven en `domain/repositories/` (p. ej.
`domain/repositories/ITransactionRepository.ts`, `IMoneySourceRepository.ts`), como interfaces
puras sin dependencias externas. `application/services` depende de estas interfaces;
`infrastructure/repositories` las implementa concretamente contra Mongoose.

## Consequences

- `domain/` pasa a tener dos subcarpetas: `entities/` y `repositories/`. Todo módulo futuro que siga
  DDD/CQRS en este backend repite este patrón.
- `application/services/CreateTransactionService.ts` importa `ITransactionRepository` e
  `IMoneySourceRepository` desde `domain/repositories/`, nunca una clase concreta de
  `infrastructure/`.
- `infrastructure/repositories/TransactionRepository.ts` y `MoneySourceRepository.ts` implementan
  esas interfaces contra los modelos Mongoose de `infrastructure/models/`.
- Sin límite adicional: la inyección de la implementación concreta en el servicio se resuelve por
  constructor/factory simple, sin agregar un framework de DI nuevo.
