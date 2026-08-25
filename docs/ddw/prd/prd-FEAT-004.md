# PRD FEAT-004: Configurar ESLint y Prettier

| Field | Value |
|-------|-------|
| Ticket | FEAT-004 |
| Tracker | none |
| Date | 2026-08-17 |
| PRD loops | 2 |
| Loops since last human decision | 0 |

## Context and Problem

El repositorio declara ESLint + Prettier como linter/formatter en `AGENTS.md` ("Stack"), pero hoy no
existe ninguna configuración real: no hay `eslint.config.js` ni `.prettierrc` en `backend/` ni en
`frontend/`, ninguna de las dos dependencias está instalada, y no hay script `lint` ni `format` en
ningún `package.json`. El código ya escrito (FEAT-001, FEAT-002, FEAT-003) se apoya únicamente en
`tsc --strict` y en la disciplina manual para cumplir las convenciones de `AGENTS.md` (sin `any`,
arrow functions con tipo de retorno explícito, orden de imports, prohibición de
`dangerouslySetInnerHTML`, etc.), sin ninguna herramienta que las verifique automáticamente.

Este ticket es de infraestructura de desarrollo: no implementa ningún requerimiento funcional del
PRD del producto (`docs/daw/prd/PRD.md`), sino que monta el linter y el formatter que el resto de los
tickets van a usar a partir de ahora.

## Goals

- Formatear el código de forma consistente y automática con Prettier, con indentación de 4 espacios.
- Detectar automáticamente, vía ESLint, violaciones de las convenciones de código ya declaradas en
  `AGENTS.md` (prohibición de `any`, orden de imports, prohibición de `dangerouslySetInnerHTML`),
  sin exigir que el código ya existente se migre para cumplir las reglas nuevas.

## Functional Requirements

- FR-01: El repositorio debe tener una configuración de Prettier compartida entre `backend/` y
  `frontend/`, con `tabWidth: 4` y `trailingComma: "none"`, y el resto de las opciones en su valor
  por defecto de Prettier.
- FR-02: El paquete `backend/` debe tener su propia configuración de ESLint (formato flat config),
  adaptada a un entorno Node/Express con TypeScript.
- FR-03: El paquete `frontend/` debe tener su propia configuración de ESLint (formato flat config),
  adaptada a un entorno Next.js/React con TypeScript.
- FR-04: La configuración de ESLint de `backend/` y de `frontend/` debe incluir las reglas
  recomendadas de typescript-eslint.
- FR-05: La configuración de ESLint de `frontend/` debe incluir además las reglas recomendadas de
  React y de Next.js.
- FR-06: La configuración de ESLint de `backend/` y de `frontend/` debe reportar como error el uso
  del tipo `any`.
- FR-07: La configuración de ESLint de `backend/` y de `frontend/` debe reportar como error un orden
  de imports distinto de: `react` → `next` → paquetes de terceros → módulos locales, con cada grupo
  ordenado alfabéticamente.
- FR-08: La configuración de ESLint de `frontend/` debe reportar como error el uso de
  `dangerouslySetInnerHTML`.
- FR-09: El `package.json` de `backend/` debe exponer los scripts `lint` y `format`.
- FR-10: El `package.json` de `frontend/` debe exponer los scripts `lint` y `format`.

## Non-Functional Requirements

- NFR-01: El comando de lint de cada paquete debe ejecutarse con 0 dependencias cruzadas hacia los
  `node_modules` o la configuración del otro paquete.
- NFR-02: Ejecutar `lint` o `format` sobre un paquete debe modificar 0 archivos fuera de ese
  paquete.

## Acceptance Criteria

- AC-01 (FR-01): WHEN se ejecuta el formateo de Prettier sobre un archivo con indentación de 2
  espacios, THE sistema SHALL reescribirlo usando 4 espacios de indentación.
- AC-02 (FR-01): WHEN se ejecuta el formateo de Prettier sobre un array o un objeto multilínea, THE
  sistema SHALL no agregar una coma final al último elemento.
- AC-03 (FR-06): IF un archivo TypeScript declara una variable, un parámetro o un valor de retorno
  de tipo `any`, THEN THE linter SHALL reportarlo como error.
- AC-04 (FR-07): IF un archivo importa módulos en un orden distinto de react → next → terceros →
  local, o sin orden alfabético dentro de un mismo grupo, THEN THE linter SHALL reportarlo como
  error.
- AC-05 (FR-08): IF un componente de `frontend/` usa la prop `dangerouslySetInnerHTML`, THEN THE
  linter SHALL reportarlo como error.
- AC-06 (FR-09, FR-10): WHEN se ejecuta `pnpm lint` en `backend/` o en `frontend/`, THE sistema
  SHALL analizar únicamente los archivos fuente de ese paquete y devolver un código de salida
  distinto de cero si hay al menos un error.
- AC-07 (FR-04, FR-05): IF un archivo `.tsx` de `frontend/` viola una regla recomendada de React o
  de Next.js (por ejemplo, un hook llamado condicionalmente), THEN THE linter SHALL reportarlo.
- AC-08 (FR-02, FR-03): IF se ejecuta `pnpm lint` en un paquete sin que las dependencias del otro
  paquete estén instaladas, THEN THE comando SHALL completarse sin fallar por esa causa.

## Out of Scope

- Migrar el código ya escrito (FEAT-001, FEAT-002, FEAT-003) para que pase las reglas nuevas de
  lint: este ticket no exige "cero errores" sobre el código existente, solo instala la herramienta.
- Integración con un pipeline de CI: el repo no tiene ningún workflow de CI hoy.
- Reglas de accesibilidad (a11y) más allá de las que ya trae el preset recomendado de React/Next.
- Configuración de editor (VSCode `settings.json`, `extensions.json` recomendadas).
- Una regla de ESLint que prohíba automáticamente lógica de negocio dentro de `components/`: la
  convención ya existe en `AGENTS.md`, pero no hay una regla estándar y confiable para detectarla
  sin falsos positivos; queda fuera de este ticket.
- Cambiar el gestor de paquetes o la estructura de workspaces del repo.
- Hook de pre-commit (con husky, lint-staged o cualquier otra herramienta): decisión explícita del
  usuario de dejarlo fuera de este ticket. Este PRD solo instala el linter y el formatter; nada
  impide todavía que un commit introduzca código con errores de lint. Si se necesita en el futuro,
  es un ticket aparte.

## Risks and Mitigations

- R-01: Correr el lint por primera vez sobre código ya escrito puede revelar muchos errores
  preexistentes. Mitigación: este ticket no exige que el código existente pase el lint — solo se
  detectan errores sobre los archivos que se toquen de ahora en más, y no hay ningún mecanismo en
  este ticket que bloquee un commit por ellos (ver Out of Scope).
- R-02: Las reglas de orden de imports pueden generar fricción alta si se aplican de forma
  retroactiva. Mitigación: mismo criterio que R-01 — no se exige migración en este ticket.

## Dependencies

- Ninguna dependencia funcional de FEAT-001, FEAT-002 o FEAT-003: este ticket no modifica su
  comportamiento, aunque el código que ya escribieron queda sujeto a las reglas nuevas si se vuelve
  a tocar (ver R-01).
- pnpm como gestor de paquetes, ya en uso en el repo (`packageManager: pnpm@11.13.0` en ambos
  `package.json`).

## Scope Decision

En la primera vuelta de DEFINE, W-PRD-06 marcó 10 ACs (por encima del umbral de 5–7 de Scope
Control). Se evaluó un split en `FEAT-004a` (Prettier + scripts base, 2 ACs), `FEAT-004b` (reglas
ESLint, 6 ACs) y `FEAT-004c` (pre-commit hook, 2 ACs; depende de `a` y `b`). El usuario decidió
**mantenerlo como un solo ticket**: es infraestructura de desarrollo acoplada (mismos archivos de
configuración, mismo propósito), no una feature de usuario, y dividirlo agrega más ceremonia de
proceso que la tarea en sí.

En PLAN, el usuario decidió además sacar el hook de pre-commit del alcance por completo (no
migrarlo a otra herramienta): eso eliminó FR-11, FR-12, NFR-02 (el del hook) y las dos ACs que
`FEAT-004c` iba a cubrir. El PRD quedó en **8 ACs** — todavía un punto por encima del umbral de
5–7, pero se mantiene la misma razón que ya se había aceptado para no dividir: es infraestructura
de desarrollo acoplada, no una feature de usuario.
