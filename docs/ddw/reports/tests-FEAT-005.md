# Test run FEAT-005

Corrida del cierre de CODE (closeout), tras completar Block 3/3 y la corrección de cobertura. Los
totales de abajo suman `backend/` + `frontend/` (dos suites Jest independientes, una por
`package.json`); la cobertura es el promedio simple entre los dos paquetes.

| Field | Value |
|---|---|
| Runner | jest (backend: ts-jest / frontend: next/jest), vía `pnpm test` en cada paquete |
| Command | `npx jest --coverage` (cwd: `backend/`) y `npx jest --coverage` (cwd: `frontend/`) |
| Total | 137 |
| Passed | 137 |
| Failed | 0 |
| Skipped | 0 |
| Line coverage | 98.46% (backend 97.39%, frontend 99.53%) |
| Branch coverage | 88.46% (backend 93.84%, frontend 83.09%) |
| Function coverage | 97.44% (backend 94.87%, frontend 100%) |
| Coverage floor | 80% línea/rama/función (`.ddw/rules/testing.instructions.md`, "Minimum Coverage" — AGENTS.md no declara un piso propio, rige el default del método) |
| Lint | `eslint .` en ambos paquetes — clean, 0 findings |

Nota sobre branch coverage del frontend: bajó de 76.05% a 80.39% (línea base pre-FEAT-005) tras
agregar Block 3, y se corrigió a 83.09% con 4 tests adicionales antes de este cierre (detalle en
`docs/ddw/reports/tdd-evidence-FEAT-005.md`, sección "Corrección de cobertura").

## Failures
(none)

## Skips
(none)
