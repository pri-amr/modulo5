## Language

**Always respond in the language the user writes in.** Write every artifact you produce — PRDs,
specs, ADRs, reports, commit messages, status lines — in that same language, regardless of the
language these instructions are written in.

If this project has a fixed working language, state it here and use it instead:

> Working language: `Spanish — write all artifacts in Spanish`

---

## What this project is

Aplicación web de finanzas personales para usuarios argentinos. Centraliza el registro de ingresos y egresos en múltiples bancos y efectivo (ARS/USD), con acceso mediante passkeys o contraseña, a elección del usuario.

**Reference PRD:** `docs/daw/prd/PRD.md`

---

## Stack

| Field | Value |
|-------|-------|
| Language | TypeScript 6 |
| Runtime | Node 24 |
| Framework |  Next.js 16 para frontend y Express + Mongoose para backend |
| Database | MongoDB |
| Test runner | JEST |
| Linter / formatter | ESLint + Prettier |
| Typecheck | `tsc --noEmit` (backend y frontend, ambos con `strict: true`) |
| Package manager | pnpm |
| CSS | Tailwind 4 |
| Requests | axios |
| Others | next-auth 4 para sesiones del frontend |

---

## Architecture conventions

- **Folder structure:**
Carpeta frontend:
La separación por capas es obligatoria, coincide con `src/`:

app/        solo routing, sin lógica de negocio
components/ UI pura, sin lógica compleja
hooks/      orquestación y lógica
services/   llamadas a API, efectos secundarios
contexts/   Zustand stores (contexts/stores)
models/     tipos puros
utils/      funciones puras, sin efectos secundarios
data/       configuración estática
lib/        infraestructura de bajo nivel
actions/    server actions
__tests__/  tests
  components/
  ...
  __mocks__


Carpeta backend:
- La arquitectura del backend debe ser DDD y CQRS. Usar skills /create-module y /init-architecture.

src/
├── domain/
│   └── entities/                  # Interfaces puras, sin dependencias externas
├── application/
│   ├── dtos/
│   │   ├── request/
│   │   └── response/
│   ├── errors/                    # CustomError + subclases HTTP
│   ├── helpers/
│   │   └── mappers/
│   └── services/
├── infrastructure/
│   ├── database/                  # Conexión Mongo
│   ├── models/                    # Schemas Mongoose
│   ├── repositories/
│   └── swagger/
│       ├── docs/                  # Autodescubierto por swagger-jsdoc
│       └── swagger.config.ts
├── presentation/
│   ├── controllers/
│   ├── middlewares/
│   └── routes/
├── common/
│   ├── constants/
│   ├── types/
│   └── utils/
├── __tests__/
│   ├── helpers/                   # db.ts, factories.ts
│   ├── unit/
│   │   └── services/
│   └── integration/
├── app.ts                         # Configuración de Express (sin listen)
└── index.ts                       # Entry point (listen + conexión DB)

- **Layer separation:** 
- Los componentes de UI solo renderizan.
- Los componentes contenedores consumen hooks.
- Nada de `any`.
- Props explícitas.
- Composición en lugar de prop drilling.
- Un hook, un caso de uso. Dividir orquestación, acciones y selectores en lugar de un hook que hace todo
- Nunca mezclar UI y lógica en un hook.
- La regla de dependencias entre capas es la misma que documenta el skill `/create-module`: `domain` no conoce nada; `application` conoce `domain`+`common`; `infrastructure` conoce `domain`+`application`; `presentation` conoce `application`.

- **Error handling:**
- Nunca hacer fetch sin cancelación — siempre limpiar
- Manejo de errores centralizado, respuestas tipadas.

- **Naming:** 
| Patrón | Uso |
|---|---|
| `useXxx` | hooks |
| `XxxService` | services |
| `useXxxStore` | Zustand stores |
| `Xxx.types.ts` | tipos aislados |

Modelos: nombres en inglés, contenido en español.

```ts
// good
import Button from "@component/common/Button"
// bad
import Button from "../../../Button"
```

Preferir composición en lugar de flags booleanas:

```ts
// bad
isPrimary; isSecondary; isDisabled
// good
variant: "primary" | "secondary"
```

- **Dependencies:** 
- Justifica las librerías que instales.
- No instales paquetes de pnpm de menos de tres días de antiguedad, pero siempre usa las versiones más recientes que puedas de cualquier paquete que instales.

---

## Code conventions

- Prohibido: lógica dentro de `components/`, llamadas fetch directas dentro de componentes, hooks con múltiples responsabilidades o stores que llaman a services directamente.
- Testear comportamiento, no implementación. Evitar mocks innecesarios. Los tests deben ser determinísticos.
- Arrow functions, tipos de retorno explícitos, props desestructuradas.
- Nada de `any` — `unknown` o generics estrictos.
- Orden de imports: `react` → `next` → terceros → local. Cada uno ordenado alfabéticamente.
- Sin comentarios salvo que expliquen un POR QUÉ no obvio (restricción oculta, workaround, invariante sutil). 
- Si un componente de más de ~150 líneas está haciendo demasiado — hay que dividirlo.
- Páginas server que importan dinámicamente componentes client.
- Sanitizar inputs incluso cuando Yup ya valida la forma.
- Validar todos los inputs en rutas de API / server actions.

---

## What NOT to do in this project

This section is worth its weight in gold: it is where the scars go, the things that already went
wrong once.

- No permitir que un usuario se autentique con un método distinto al que eligió en su registro (passkey o contraseña, no ambos) (RF01-RF02).
- No permitir eliminar la última passkey activa de una cuenta; siempre debe quedar al menos una (RF33).
- No mostrar ningún valor de conversión si la API de dolarapi.com falla o no responde; mostrar error explícito en su lugar (RF30).
- No implementar passkeys primero. Se implementa todo con usuario y contraseña, en última instancia (cuando todo está terminado), se agrega la posibilidad de ingresar con passkeys
- Nunca exponer tokens del lado del cliente.
- Nunca confiar en datos del store sin validar.
- `dangerouslySetInnerHTML` está prohibido.
- No dejar que el reporte de cierre de un `daw-implementer` (evidencia TDD: qué test y qué
  aserción fallaban antes del fix) se pierda como intercambio efímero entre subagente y
  orquestador. Persistirlo — anexado al mensaje de commit del bloque, o en
  `docs/daw/reports/tdd-evidence-{ticket}.md` — antes de cerrar el bloque. En FEAT-001, los 7
  reportes de bloque nunca se guardaron en disco; para cuando VERIFY los pidió (sesiones después),
  ya no había forma honesta de reconstruirlos sin inventar el dato (~40 tests quedaron sin
  evidencia recuperable, aceptado como riesgo de proceso — ver
  `docs/daw/reports/tdd-evidence-FEAT-001.md`).

---


<!-- BEGIN DAW (managed by DAW — do not edit by hand) -->
# DAW — Dilux Agentic Workflow

This repo uses **DAW**: an agent-driven development pipeline with the phases
`CLASSIFY → DEFINE → PLAN → CODE → VERIFY → RELEASE`.

Before answering, read `.daw/orchestrator.md` and run its Boot Sequence. It is a strict state
machine: it decides what you are allowed to do based on the phase recorded in `.daw-state.json`.

The project's own context — stack, architecture, domain — is elsewhere in this file. It lives here,
in `AGENTS.md`, and not in any one tool's file, on purpose: it is tool-agnostic and comes along
unchanged when the pipeline is ported to another agent.
<!-- END DAW -->
