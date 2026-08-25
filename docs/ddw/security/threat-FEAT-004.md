# Threat model FEAT-004: Configurar ESLint y Prettier

| Field | Value |
|-------|-------|
| Ticket | FEAT-004 |
| Spec | docs/ddw/specs/spec-FEAT-004.md |
| Tier | FEATURE |
| Date | 2026-08-18 |

## Components
| Component | Source in the spec |
|---|---|
| `.prettierrc.json` | Block 1 |
| `.prettierignore` | Block 1 |
| `backend/package.json` | Block 1, Block 2 |
| `frontend/package.json` | Block 1, Block 3 |
| `backend/eslint.config.mjs` | Block 2 |
| `frontend/eslint.config.mjs` | Block 3 |

## Trust boundaries
- **Registro de npm (público) → `node_modules` local de cada desarrollador**, vía `pnpm install`:
  siete paquetes nuevos entran al árbol de dependencias, todos como `devDependency`, y `pnpm`
  ejecuta código arbitrario de cualquier paquete cuyo `postinstall`/`preinstall` no esté bloqueado.
- **Repositorio git → configuración de linting que se ejecuta localmente**: quien tenga permiso de
  push puede editar `eslint.config.mjs` o `.prettierrc.json` y nada en este ticket detecta ese
  cambio automáticamente (no hay hook de pre-commit ni CI — ambos descartados explícitamente del
  alcance de este PRD).

## STRIDE analysis

### `backend/package.json`
- **Spoofing:** N/A — no hay identidad de usuario ni sesión involucrada en `pnpm install`.
- **Tampering:** un paquete comprometido (typosquatting, mantenedor comprometido) podría alterar
  archivos del working tree durante su instalación. Ver R-01.
- **Repudiation:** N/A — no aplica un concepto de "acción atribuible a un usuario" en una
  instalación de dependencias de desarrollo.
- **Information Disclosure:** un script de instalación malicioso corre con los permisos del
  usuario del sistema operativo y podría leer `.env` (secretos locales, ya excluidos de git pero
  presentes en disco) u otros archivos sensibles del developer. Ver R-01.
- **Denial of Service:** un `postinstall` roto o un paquete que descarga binarios pesados podría
  colgar `pnpm install` en la máquina del desarrollador. Impacto acotado a productividad local, no
  a un servicio en producción. Ver R-03.
- **Elevation of Privilege:** N/A — el proceso corre con los mismos permisos que ya tiene el
  desarrollador; no hay escalamiento de privilegios del sistema operativo ni de la aplicación.

### `frontend/package.json`
Agrega `eslint`, `eslint-config-next`, `eslint-plugin-import` y `eslint-import-resolver-typescript`
— misma frontera que
`backend/package.json` (registro npm → `node_modules` local), mismo riesgo y misma mitigación.
- **Spoofing:** N/A — no hay identidad de usuario ni sesión involucrada en `pnpm install`.
- **Tampering:** un paquete comprometido (typosquatting, mantenedor comprometido) podría alterar
  archivos del working tree durante su instalación. Ver R-01.
- **Repudiation:** N/A — no aplica un concepto de "acción atribuible a un usuario" en una
  instalación de dependencias de desarrollo.
- **Information Disclosure:** un script de instalación malicioso corre con los permisos del
  usuario del sistema operativo y podría leer `.env` (secretos locales, ya excluidos de git pero
  presentes en disco) u otros archivos sensibles del developer. Ver R-01.
- **Denial of Service:** un `postinstall` roto o un paquete que descarga binarios pesados podría
  colgar `pnpm install` en la máquina del desarrollador. Impacto acotado a productividad local, no
  a un servicio en producción. Ver R-03.
- **Elevation of Privilege:** N/A — el proceso corre con los mismos permisos que ya tiene el
  desarrollador; no hay escalamiento de privilegios del sistema operativo ni de la aplicación.

### `backend/eslint.config.mjs`
- **Spoofing:** N/A.
- **Tampering:** este archivo es, junto con su equivalente de `frontend/`, el único mecanismo de
  este ticket que detecta `any` y orden de imports incorrecto en el backend. Si alguien lo edita
  para aflojar una regla, nada en este ticket lo nota — no hay hook ni CI que corra `pnpm lint`
  automáticamente. Ver R-02.
- **Repudiation:** git ya deja rastro de quién y cuándo modificó este archivo (no es un control
  nuevo de este ticket, es el control existente del repositorio).
- **Information Disclosure:** N/A — la config no procesa datos de usuario, solo código fuente ya
  presente en el repo.
- **Denial of Service:** una regla mal escrita (p. ej. un patrón regex catastrófico en
  `import/order`) podría hacer que `pnpm lint` tarde desproporcionadamente. Impacto bajo — se
  detecta en la primera corrida local, no en producción.
- **Elevation of Privilege:** N/A.

### `frontend/eslint.config.mjs`
- **Spoofing:** N/A.
- **Tampering:** este archivo es el único mecanismo de este ticket que detecta
  `dangerouslySetInnerHTML` (regla `react/no-danger`, prohibido por `AGENTS.md`), `any` y orden de
  imports en el frontend. Si alguien lo edita para aflojar `react/no-danger`, nada en este ticket
  lo nota — no hay hook ni CI que corra `pnpm lint` automáticamente. Ver R-02.
- **Repudiation:** git ya deja rastro de quién y cuándo modificó este archivo (no es un control
  nuevo de este ticket, es el control existente del repositorio).
- **Information Disclosure:** N/A — la config no procesa datos de usuario, solo código fuente ya
  presente en el repo.
- **Denial of Service:** una regla mal escrita (p. ej. un patrón regex catastrófico en
  `import/order`) podría hacer que `pnpm lint` tarde desproporcionadamente. Impacto bajo — se
  detecta en la primera corrida local, no en producción.
- **Elevation of Privilege:** N/A.

### `.prettierrc.json`
- **Spoofing:** N/A — no hay identidad involucrada en formatear código.
- **Tampering:** cambiar `tabWidth` o `trailingComma` es un problema de estilo, no de seguridad —
  no protege ningún dato ni control de acceso.
- **Repudiation:** N/A — git ya deja rastro de cualquier cambio a este archivo.
- **Information Disclosure:** N/A — Prettier reescribe formato, no procesa datos de usuario.
- **Denial of Service:** N/A — Prettier no corre en producción, solo en tiempo de desarrollo.
- **Elevation of Privilege:** N/A — no ejecuta lógica de negocio ni controla acceso a nada.

### `.prettierignore`
- **Spoofing:** N/A.
- **Tampering:** un `.prettierignore` mal escrito puede hacer que Prettier reformatee (o deje de
  reformatear) archivos generados como `.next/`, pero eso es ruido en el diff, no un problema de
  seguridad — no hay dato ni control protegido por este archivo.
- **Repudiation:** N/A — git ya deja rastro de cualquier cambio a este archivo.
- **Information Disclosure:** N/A — es una lista de rutas, no procesa datos de usuario.
- **Denial of Service:** N/A — Prettier no corre en producción, solo en tiempo de desarrollo.
- **Elevation of Privilege:** N/A.

## Data classification
| Data | Class | At rest | In transit |
|---|---|---|---|
| `.env*` del desarrollador (credenciales de Mongo, claves de API) | credentials | ya excluido de git vía `.gitignore` (`.env*`); no forma parte de este ticket, pero es lo único "sensible" alcanzable si R-01 se materializa | N/A — nunca sale de la máquina local como parte de este ticket |
| Código fuente en `backend/src/` y `frontend/src/` | public (dentro del repo privado del equipo) | sin cambios — este ticket no toca su contenido, solo lo analiza | N/A |

## Risks and mitigations
| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | Un paquete nuevo (o una de sus transitivas) resulta malicioso o comprometido y su script de instalación exfiltra `.env` u otros archivos locales | T/I | Low | High | `pnpm` ya bloquea por defecto los scripts `postinstall`/`preinstall` de cualquier paquete no listado en `allowBuilds` (ver `backend/pnpm-workspace.yaml` / `frontend/pnpm-workspace.yaml`, que hoy solo permiten `esbuild`, `mongodb-memory-server`, `unrs-resolver`, `sharp`). Ninguno de los 7 paquetes nuevos de este ticket (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-import`, `eslint-config-next`, `eslint-import-resolver-typescript`, `prettier`) requiere build nativo conocido — el bloque de implementación debe verificar que `pnpm install` NO pida aprobar un build nuevo; si lo pide, se para y se revisa antes de aprobar. Todas las versiones fijadas fueron verificadas con `npm view <pkg> time` con ≥ 3 días de publicadas (rango 01-jun-2026 a 13-ago-2026), evitando el paquete recién subido que es el vector típico de un ataque de supply chain recién lanzado. |
| R-02 | Sin hook de pre-commit ni CI (ambos fuera de alcance por decisión del usuario en PLAN), una regla que sí importa para seguridad — `react/no-danger` detectando `dangerouslySetInnerHTML`, prohibido por `AGENTS.md` — puede aflojarse silenciosamente y nadie se entera hasta una revisión manual | T | Medium | Medium | Aceptado — ver "Accepted risks" abajo. |
| R-03 | Un `postinstall` roto o un paquete que descarga binarios pesados cuelga `pnpm install` en la máquina de un desarrollador | D | Low | Low | Impacto acotado a productividad individual; no hay mitigación adicional más allá de poder cancelar la instalación e investigar. No amerita control nuevo. |

## Accepted risks

### R-02
- **Accepted by:** Priscila Sacchi (usuaria del proyecto), en la decisión tomada durante PLAN de
  este mismo ticket de sacar el hook de pre-commit del alcance.
- **Justification:** este PRD instala el linter y el formatter pero deliberadamente no instala
  ningún mecanismo que fuerce su ejecución antes de un commit o un merge — la usuaria lo decidió
  así explícitamente (ver `docs/ddw/prd/prd-FEAT-004.md`, sección "Out of Scope"). Mientras eso
  siga así, cualquier regla de ESLint — incluida `react/no-danger` — depende de que alguien la
  corra manualmente; no hay una segunda capa que la reemplace.
- **Review conditions:** se revisa el día que se cree un ticket para un hook de pre-commit o un
  pipeline de CI (ambos ya identificados como Out of Scope en este PRD y en el anterior), o antes,
  si el proyecto empieza a manejar escritura de datos financieros reales de usuarios en producción
  — momento en el que depender de la disciplina manual deja de ser aceptable.

## Supply chain
Siete `devDependencies` nuevas, ninguna en el bundle de producción (ver tabla de R-01). Todas
verificadas con ≥ 3 días de antigüedad desde su última publicación en npm al momento de este
diseño. `eslint-config-next` trae como dependencias propias `typescript-eslint`,
`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`,
`@next/eslint-plugin-next`, `eslint-plugin-import` y `eslint-import-resolver-node` — de esa lista,
solo `eslint-plugin-import` se agrega también de forma explícita en `frontend/package.json`, porque
`import/order` la referencia por nombre desde `eslint.config.mjs`; el resto queda como dependencia
transitiva porque nada de este ticket las importa directamente. `eslint-import-resolver-typescript`
se declara explícita por el mismo motivo. Depender de que un paquete referenciado por nombre quede
disponible solo como dependencia transitiva de un tercero (phantom dependency) es frágil bajo el modo
estricto de pnpm.

## Availability
Ningún componente de este ticket corre en producción ni atiende tráfico — todo se ejecuta en
tiempo de desarrollo (`pnpm lint`, `pnpm format`) o de instalación (`pnpm install`). No hay vector
de disponibilidad relevante más allá de R-03, ya cubierto arriba.
