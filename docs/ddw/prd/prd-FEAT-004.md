# PRD FEAT-004: Configurar ESLint y Prettier

| Field | Value |
|-------|-------|
| Ticket | FEAT-004 |
| Tracker | none |
| Date | 2026-08-17 |
| PRD loops | 1 |
| Loops since last human decision | 1 |

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
  `AGENTS.md` (prohibición de `any`, orden de imports, prohibición de `dangerouslySetInnerHTML`).
- Impedir que un commit introduzca nuevos errores de lint, sin exigir que el código ya existente se
  migre para cumplir las reglas nuevas.

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
- FR-11: El repositorio debe tener un hook de pre-commit (husky + lint-staged) que ejecute el lint
  sobre los archivos en stage antes de permitir un commit.
- FR-12: El hook de pre-commit debe bloquear el commit si el lint reporta al menos un error sobre los
  archivos en stage (los warnings no bloquean el commit).

## Non-Functional Requirements

- NFR-01: El comando de lint de cada paquete debe ejecutarse con 0 dependencias cruzadas hacia los
  `node_modules` o la configuración del otro paquete.
- NFR-02: Instalar el hook de pre-commit no debe requerir más de 0 pasos manuales adicionales,
  más allá de correr la instalación de dependencias en la raíz del repo (vía script `prepare`).
- NFR-03: Ejecutar `lint` o `format` sobre un paquete debe modificar 0 archivos fuera de ese
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
- AC-07 (FR-11, FR-12): WHEN un usuario ejecuta `git commit` con archivos en stage que tienen al
  menos un error de lint, THE hook de pre-commit SHALL impedir que el commit se complete.
- AC-08 (FR-11, FR-12): WHEN un usuario ejecuta `git commit` con archivos en stage sin errores de
  lint (con o sin warnings), THE hook de pre-commit SHALL permitir que el commit se complete.
- AC-09 (FR-04, FR-05): IF un archivo `.tsx` de `frontend/` viola una regla recomendada de React o
  de Next.js (por ejemplo, un hook llamado condicionalmente), THEN THE linter SHALL reportarlo.
- AC-10 (FR-02, FR-03): IF se ejecuta `pnpm lint` en un paquete sin que las dependencias del otro
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

## Risks and Mitigations

- R-01: Correr el lint por primera vez sobre código ya escrito puede revelar muchos errores
  preexistentes. Mitigación: este ticket no exige que el código existente pase el lint; el hook de
  pre-commit, vía lint-staged, solo audita los archivos que se modifiquen de ahora en más.
- R-02: Agregar un `package.json` en la raíz del repo (hoy inexistente) para alojar husky y
  lint-staged puede confundirse con un workspace de pnpm. Mitigación: ese `package.json` se limita a
  tooling de git hooks (sin dependencias de runtime ni scripts de build), y así queda documentado en
  el propio archivo.
- R-03: Las reglas de orden de imports pueden generar fricción alta si se aplican de forma
  retroactiva. Mitigación: mismo criterio que R-01 — no se exige migración en este ticket.

## Dependencies

- Ninguna dependencia funcional de FEAT-001, FEAT-002 o FEAT-003: este ticket no modifica su
  comportamiento, aunque el código que ya escribieron queda sujeto a las reglas nuevas si se vuelve
  a tocar (ver R-01).
- pnpm como gestor de paquetes, ya en uso en el repo (`packageManager: pnpm@11.13.0` en ambos
  `package.json`).

## Scope Decision

W-PRD-06 marcó 10 ACs (por encima del umbral de 5–7 de Scope Control). Se evaluó un split en
`FEAT-004a` (Prettier + scripts base, 2 ACs), `FEAT-004b` (reglas ESLint, 6 ACs) y `FEAT-004c`
(pre-commit hook, 2 ACs; depende de `a` y `b`). El usuario decidió **mantenerlo como un solo
ticket**: es infraestructura de desarrollo acoplada (mismos archivos de configuración, mismo
propósito), no una feature de usuario, y dividirlo agrega más ceremonia de proceso que la tarea en
sí.
