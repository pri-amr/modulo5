# Test run FEAT-007

| Field | Value |
|---|---|
| Runner | jest 30.2.0 (next/jest, testEnvironment jsdom) |
| Command | `npx jest --coverage` (desde `frontend/`) |
| Total | 94 |
| Passed | 94 |
| Failed | 0 |
| Skipped | 0 |
| Line coverage | 99.53% |
| Branch coverage | 83.33% |
| Function coverage | 100% |
| Coverage floor | 80% (piso de facto del proyecto, aplicado desde FEAT-004; **no está declarado en `AGENTS.md` ni en `frontend/jest.config.ts`** — ver nota abajo) |
| Lint | `npx eslint .` — limpio, exit 0, 0 hallazgos |

Alcance: suite completa del paquete `frontend`, 18/18 suites. El backend no se toca en este ticket
(los 4 bloques son de layout/CSS del frontend), así que no entra en la corrida.

`npx tsc --noEmit`: exit 0, sin salida.

## Failures

(none)

## Skips

(none)

## Nota sobre el piso de cobertura

**El piso de 80% no tiene respaldo documental en este repositorio.** Verificado en esta corrida:
`AGENTS.md` no contiene ninguna sección "Testing" ni ninguna mención de cobertura o de un umbral, y
`frontend/jest.config.ts` no define `coverageThreshold`. Los reportes de FEAT-004, FEAT-005 y
FEAT-006 lo citan como *"80% (AGENTS.md, «Testing» — piso del proyecto)"*; esa cita atribuye a
`AGENTS.md` algo que no dice.

Se mantiene el 80% como piso de facto por continuidad con los tres tickets anteriores, y se declara
acá su origen real para no propagar la atribución incorrecta. Los tres valores de esta corrida lo
superan de todas formas, así que la decisión no cambia el resultado — pero el registro sí. Cerrar
esto de verdad pide una de dos cosas, y es decisión del proyecto: declarar el piso en `AGENTS.md`, o
imponerlo con `coverageThreshold` en `jest.config.ts` para que deje de depender de que alguien lo
recuerde. Queda como ticket propio.

## Cobertura por debajo del 100% en ramas

`83.33%` de ramas es el único valor que no llega al 100%. Las líneas sin cubrir, todas
preexistentes y ninguna tocada por FEAT-007:

| Archivo | Línea | Qué es |
|---|---|---|
| `src/hooks/useCreateTransaction.ts` | 23 | rama de error no ejercitada |
| `src/hooks/useHydrateThemeStore.ts` | 15 | rama de hidratación no ejercitada |
| `src/hooks/useRegisterUser.ts` | 84, 123 | ramas de error no ejercitadas |
| `src/utils/sanitizeInput.ts` | 9 | rama no ejercitada |

Los 4 archivos que FEAT-007 modificó —`AuthLayout.tsx`, `RegisterForm.tsx`, `Loader.tsx`,
`tailwind.config.ts`— están al **100% en las cuatro métricas**.

## Verificación manual pendiente

`test-manual-block4-salto-1200px`, declarado en el spec del Bloque 4, requiere navegador real y no
está incluido en esta corrida: jsdom no computa layout, así que ningún test automatizado puede medir
el ancho resultante de la tarjeta. Queda pendiente de ejecución por el usuario. Los tests
automatizados verifican que las clases estén presentes y que el CSS se emita en el orden correcto
con el breakpoint correcto; no verifican que el navegador pinte los anchos pedidos.

Ídem `test-manual-block2-*` (wrap del banner de error, AC-11) y el efecto de `min-w-0`, pendientes
desde el Bloque 2.
