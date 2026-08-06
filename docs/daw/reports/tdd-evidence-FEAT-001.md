# Evidencia TDD — FEAT-001: Registrar ingreso o egreso de dinero

Reconstrucción solicitada por el corrective loop de ronda 2 de VERIFY
(`docs/daw/reports/verify-FEAT-001.md`), que encontró que ningún artefacto del repo registra qué
test fallaba antes de escribir el código correspondiente, para ninguno de los 7 bloques originales
ni para el corrective loop de ronda 1.

Fuentes revisadas para esta reconstrucción: `git log` (7 commits de bloque + 1 de corrective loop),
`.daw-state.json` (historial de transiciones), `.daw-journal.jsonl` (espejo del historial, sin
detalle adicional), y el transcript de esta sesión para el corrective loop de ronda 1.

## Lo que sí se pudo reconstruir

### Corrective loop de ronda 1 (commit `4517233`)

El `daw-implementer` que resolvió el FAIL de cobertura de branches dejó, en su reporte de cierre
(dentro de esta misma sesión), evidencia rojo→verde por mutación quirúrgica para los 13 tests
nuevos: rompió temporalmente el comportamiento bajo prueba, corrió el test puntual en rojo con la
aserción exacta que fallaba, revirtió al código original y confirmó verde. El detalle test por
test está copiado tal cual en el reporte del agente (13 casos, cada uno con la mutación aplicada y
la aserción/mensaje de error que la delató). Esto **sí satisface** la Regla #-1 de
`testing.instructions.md` para esos 13 tests: la evidencia existe, es específica y es verificable
contra el diff real (`git show 4517233`).

## Lo que no se pudo reconstruir

### Los 7 bloques originales (commits `7f1bea0` → `d9597d8`, 2026-08-02 a 2026-08-04)

Ninguna fuente disponible en el repo — mensajes de commit, `.daw-state.json`, `.daw-journal.jsonl`
— registra qué assertion fallaba antes de escribir el código de cada bloque. Los mensajes de commit
describen **qué hace** el código (p. ej. "recalcula el balance de la fuente en la moneda
correspondiente"), no **qué test estaba en rojo** antes de que existiera.

La única excepción parcial es el bloque 6 (tema claro/oscuro): la entrada de `.daw-state.json` del
2026-08-03T01:15:00Z narra que `arch-auditor` encontró un FAIL (lógica de sincronización de DOM
dentro de `ThemeToggle`) que se corrigió moviéndola a `hooks/useSyncThemeClass.ts` +
`components/ThemeSync.tsx`, con los tests "actualizados y en verde (6/6)" después del fix. Eso es
evidencia de un ciclo rojo→verde real, pero es evidencia de un **fix de arquitectura post-hoc**, no
de que los tests del bloque se hayan escrito antes que la primera versión del código — no cierra la
Regla #-1 para el bloque completo, solo documenta que hubo al menos una iteración roja dentro de él.

Los subagentes `daw-implementer` que construyeron los 7 bloques en sesiones anteriores sí habrán
producido, en su momento, el reporte con esa evidencia (es el protocolo que el propio
`code.instructions.md` exige) — pero esos reportes fueron intercambios efímeros entre el
orquestador y el subagente, nunca se persistieron a disco como artefacto del repo, y esta sesión no
tiene acceso a las sesiones anteriores donde ocurrieron. Reconstruir ahora, a posteriori, qué
aserción exacta fallaba para cada uno de los ~40 tests de esos 7 bloques significaría inventar el
dato, no recuperarlo — y por eso no está en esta tabla.

## Resumen

| Alcance | Evidencia TDD | Estado |
|---|---|---|
| Corrective loop ronda 1 (13 tests, commit `4517233`) | Reconstruida, verificable (mutación quirúrgica documentada test por test) | ✅ Satisface Regla #-1 |
| Bloque 6 — fix de `ThemeToggle`/`useSyncThemeClass` (parcial) | Hay evidencia de un ciclo rojo→verde real, pero acotado al fix, no al bloque completo | ⚠️ Parcial |
| Bloques 1–5 y 7 (~40 tests, commits `7f1bea0`…`d9597d8`) | No reconstruible sin fabricar el dato — los reportes de los implementadores de esas sesiones no se persistieron | ❌ No recuperable |

## Decisión

Este gap para los bloques 1–5 y 7 no se puede cerrar con más trabajo dentro de este ticket sin
fabricar evidencia — es información que se perdió por no haber persistido los reportes de
implementación en su momento (un vacío del propio proceso de sesiones pausadas de este ticket, no
del código). Se somete al usuario como una aceptación explícita, igual que los 2 riesgos ya
aceptados en `docs/daw/security/threat-FEAT-001.md` durante PLAN.
