# Verify FEAT-007: Ajustes visuales de la pantalla de registro

| Field | Value |
|---|---|
| Ticket | FEAT-007 |
| Tier | FEATURE |
| PRD | docs/ddw/prd/prd-FEAT-007.md |
| Spec | docs/ddw/specs/spec-FEAT-007.md |
| Date | 2026-08-29 |
| Base | 45ce3e1 · commits del ticket: 4534b2e, 74f296c, 3455961, 26f26da |

## Metodología

Verificación cruzada PRD → spec → código → tests, hecha de cero sobre el árbol en `HEAD` con el
working tree limpio. Se re-ejecutaron de forma independiente `npx jest --coverage`, `npx tsc
--noEmit` y `npx eslint .` desde `frontend/` (exit 0 los tres). Además se recompilaron con el
`tailwindcss` 4.3.3 instalado, desde un script fuera del repo, las clases reales de
`auth-layout-card` y la utilidad `space-y-[13px]`, para no aceptar por palabra las dos afirmaciones
mecánicas de las que dependen AC-02/AC-09 y AC-13. No se modificó ningún archivo del repositorio en
esta fase: ni código, ni PRD, ni spec, ni tests. No hizo falta mutar nada.

## F-VER-01 — Cada AC del PRD tiene un test que pasa

- AC-01 (FR-01): pasa.
- AC-02 (FR-02): pasa.
- AC-03 (FR-03): pasa.
- AC-04 (FR-04): pasa.
- AC-05 (FR-05): pasa.
- AC-06 (FR-06): pasa.
- AC-07 (FR-07): pasa.
- AC-08 (NFR-01): pasa — verificación manual ejecutada, cálculo re-derivado acá.
- AC-09 (FR-08): pasa.
- AC-10 (FR-09): pasa a nivel de mecanismo.
- AC-11 (FR-10): pasa a nivel de mecanismo; el comportamiento renderizado queda pendiente de la
  verificación manual declarada en el spec. Es el criterio más débil del ticket, ver seccion 4.
- AC-12 (FR-11): pasa.
- AC-13 (FR-12): pasa a nivel de mecanismo, con el CSS compilado verificado; el ancho renderizado
  queda pendiente de la verificación manual declarada en el spec. Ver seccion 4.

✅ **13/13 AC con veredicto positivo. Ninguna sin test.** Tres de ellas (AC-10, AC-11, AC-13) están
verificadas hasta donde jsdom permite y no más allá; eso se detalla sin adornos en las secciones 4 y 5.

Detalle de trazabilidad, con los nombres de test separados del identificador del criterio para que
ninguna subcadena de un nombre de test se confunda con un veredicto:

1. Paneles internos al 50/50 en ≥640px — `AuthLayout.tsx:16` (`sm:w-1/2` en el panel del ícono) y
   `AuthLayout.tsx:34` (`sm:w-1/2` en el panel de contenido). Test:
   `test-block1-panels-split-50-50` (`AuthLayout.test.tsx:149`).
2. 13px entre el último campo y el botón — `RegisterForm.tsx:30` (`space-y-[13px]` en el `<form>`) y
   `RegisterForm.tsx:82` (contenedor `register-form-actions`). Test:
   `test-block2-button-spacing-13px` (`RegisterForm.test.tsx:168`). Recompilé `space-y-[13px]` con
   el Tailwind del proyecto: emite `margin-block-end` sobre los hijos que no son el último, así que
   la separación entre el bloque de campos y el bloque de acciones la produce **la clase en el
   `<form>`**, no la de los divs hijos. El test afirma exactamente ese ancestro. La corrección de la
   Ronda 2 del Bloque 2 era necesaria y quedó bien resuelta.
3. Botón centrado sin ancho completo — `RegisterForm.tsx:95` (`block mx-auto`, sin `w-full`). Test:
   `test-block2-button-centered-content-width` (`RegisterForm.test.tsx:181`), con aserción negativa
   sobre `w-full`.
4. Radio de 1rem en la tarjeta — `AuthLayout.tsx:12` (`rounded-[1rem]`). Test:
   `test-block1-card-radius-1rem` (`AuthLayout.test.tsx:156`).
5. Radio de 1rem en los inputs — `RegisterForm.tsx:27` (`fieldClassName`). Test:
   `test-block2-input-radius-1rem` (`RegisterForm.test.tsx:190`), sobre los 4 campos.
6. Radio de 1rem en el botón — `RegisterForm.tsx:95`. Test: `test-block2-button-radius-1rem`
   (`RegisterForm.test.tsx:199`).
7. Radio de 1rem en el banner de alta rechazada — `RegisterForm.tsx:86`. Test:
   `test-block2-banner-radius-1rem` (`RegisterForm.test.tsx:205`), que llega al banner por el
   escenario real (submit válido más rechazo del backend), no por render directo.
8. Área táctil del botón ≥24×24px CSS — `RegisterForm.tsx:95`. Test manual
   `test-manual-block2-nfr01-button-touch-target`, ejecutado y documentado en
   `tdd-evidence-FEAT-007.md:117-130`. Ver seccion 3.
9. 13px arriba y abajo del banner de alta rechazada — mismo mecanismo del punto 2. Test:
   `test-block2-banner-spacing-13px` (`RegisterForm.test.tsx:219`).
10. Ancho de los inputs invariante con y sin banner — `RegisterForm.tsx:30` (`w-full` en el `<form>`)
    y `AuthLayout.tsx:34` (`min-w-0` en el panel de contenido). Tests:
    `test-block2-form-fixed-width` (`RegisterForm.test.tsx:162`) y
    `test-block2-banner-text-wraps-no-expand` (`RegisterForm.test.tsx:237`).
11. Wrap del texto del banner sin expandir el contenedor — mismo mecanismo que el punto 10. El único
    test asociado, `test-block2-banner-text-wraps-no-expand`, **declara en su propio comentario que
    no valida ese comportamiento**: jsdom no computa layout. Verificación manual pendiente.
12. Overlay de pantalla completa con spinner centrado — `Loader.tsx:11`
    (`fixed inset-0 z-[100] flex items-center justify-center bg-overlay/50`). Tests:
    `test-block3-loader-fullscreen-overlay` (`Loader.test.tsx:30`), que además afirma la contención
    del spinner, y `test-block3-loader-spinner-preserved` (`Loader.test.tsx:47`).
13. Ancho responsive de la tarjeta — `AuthLayout.tsx:12` (`sm:w-[70%] min-[75rem]:w-[40%]`). Tests:
    `test-block4-card-width-responsive` (`AuthLayout.test.tsx:104`) y
    `test-block4-card-width-cascade-order` (`AuthLayout.test.tsx:115`). Reproduje la compilación de
    forma independiente con las clases reales del componente: se emite el bloque de 40rem con
    `width: 70%` y después el de 75rem con `width: 40%`, en ese orden. La cascada es correcta y el
    corte cae en 75rem. Ver seccion 4.

## F-VER-02 — Cada bloque del spec está implementado

- Block 1: pasa. `AuthLayout.tsx` con `sm:w-1/2` en ambos paneles y `rounded-[1rem]` en la tarjeta
  (commit `4534b2e`). Cubre FR-01 y FR-04.
- Block 2: pasa. `RegisterForm.tsx` con `w-full space-y-[13px]` en el `<form>`, el segundo
  contenedor `register-form-actions`, `block mx-auto` en el botón y `rounded-[1rem]` en inputs,
  botón y banner (commit `74f296c`). Cubre FR-02, FR-03, FR-05, FR-06, FR-07, FR-08, FR-09 y FR-10.
  Incluye el `min-w-0` en `AuthLayout.tsx:34` que el spec autorizaba condicionalmente.
- Block 3: pasa. `Loader.tsx` como overlay de pantalla completa, token `--color-overlay` en `:root`
  y `.light`, color `overlay` en `tailwind.config.ts`, y las dos allowlists de guards extendidas
  (commit `3455961`). Cubre FR-11. `TransactionForm.tsx` sin diff, como el spec exige.
- Block 4: pasa. `AuthLayout.tsx:12` con `sm:w-[70%] min-[75rem]:w-[40%]` y el comentario de
  invariante en `AuthLayout.tsx:9` (commit `26f26da`). Cubre FR-12.

**Trazabilidad FR → bloque → código: los 12 FR del PRD tienen código commiteado.** No hay ningún FR
que el spec mapee a un bloque y que el código no implemente. Verificado uno por uno contra archivo y
línea, no contra la tabla de cobertura del spec.

## F-VER-03 — Cobertura

| Métrica | Suite completa | Los 4 archivos tocados |
|---|---|---|
| Líneas | 99.53% | 100% |
| Ramas | 83.33% | 100% |
| Funciones | 100% | 100% |

Corrida propia de `npx jest --coverage` desde `frontend/`: **18 suites, 94 tests, 94 en verde**,
idéntico a lo que declara `tests-FEAT-007.md`. `AuthLayout.tsx`, `RegisterForm.tsx`, `Loader.tsx` y
`tailwind.config.ts` están al 100% en las cuatro métricas. Las ramas sin cubrir son las cuatro
preexistentes de `useCreateTransaction.ts:23`, `useHydrateThemeStore.ts:15`, `useRegisterUser.ts`
(84 y 123) y `sanitizeInput.ts:9`, ninguna tocada por este ticket.

**Sobre el piso del 80%: la afirmación de `tests-FEAT-007.md` es cierta, y la verifiqué.**
`AGENTS.md` no contiene la cadena "80%", ni "cobertura", ni "coverage", ni una sección "Testing"
(grep sin resultados, exit 1). `frontend/jest.config.ts` no declara `coverageThreshold`. Este
repositorio tampoco tiene un directorio `.ddw/` con reglas propias. El piso del 80% viene del método
(`.ddw/rules/testing.instructions.md` del plugin, y `MINIMUM = 80` en `validate_verify.py`), no del
proyecto. **Matiz que corrijo del reporte de tests:** dice que los reportes de FEAT-004, FEAT-005 y
FEAT-006 atribuyen el piso a `AGENTS.md`; los de FEAT-004 y FEAT-005 hacen lo contrario, citan
`.ddw/rules/testing.instructions.md` y aclaran explícitamente que `AGENTS.md` no declara piso
propio. **La atribución incorrecta es solo la de FEAT-006** (`tests-FEAT-006.md:14` y
`verify-FEAT-006.md:77`). El resto de la nota es exacto, y la recomendación de declarar el piso en
`AGENTS.md` o imponerlo con `coverageThreshold` sigue en pie como ticket propio.

## F-VER-04 — Sad-path y casos borde

- Entrada inválida en el formulario (clave vacía, clave corta, confirmación que no coincide):
  `test-block2-validation-message-clave-requerida`, `test-block2-validation-message-clave-longitud`,
  `test-block2-validation-message-claves-no-coinciden`.
- Camino triste del submit (el backend rechaza el alta): `test-block2-error-banner-styled`,
  `test-block2-banner-radius-1rem`, `test-block2-banner-spacing-13px` y
  `test-block2-banner-text-wraps-no-expand`, los cuatro sobre el escenario real de rechazo.
- Caso borde de robustez de layout: `test-block1-authlayout-empty-children-no-error`.
- Transición de estado del `Loader` (de visible a no visible, sin residuo en el DOM):
  `test-block3-loader-hidden-no-error-residual`.
- Guard de degradación silenciosa: si `--color-overlay` desaparece de un tema, el scrim queda
  transparente con la suite en verde. Cubierto por las allowlists de `globals.test.ts` y
  `tailwind.config.test.ts`, cuya eficacia el implementer demostró por mutación medida
  (`tdd-evidence-FEAT-007.md:340-392`).

## F-VER-05 — Lint y type-checker

- `npx tsc --noEmit` desde `frontend/`: exit 0, sin salida.
- `npx eslint .` desde `frontend/`: exit 0, 0 hallazgos.

Ambos re-ejecutados por mí, no citados del reporte previo. Sin `TODO`, `FIXME`, `console.*` ni
`eslint-disable` en los 8 archivos del ticket (grep, exit 1).

## F-VER-06 — Cada test prometido por el spec

Los 21 identificadores que el spec promete, con su estado real en disco:

| Identificador del spec | Ubicación | Estado |
|---|---|---|
| `test-block1-panels-split-50-50` | `AuthLayout.test.tsx:149` | existe, pasa |
| `test-block1-card-radius-1rem` | `AuthLayout.test.tsx:156` | existe, pasa |
| `test-block1-card-width-desktop` | — | **renombrado a `test-block4-card-width-base-and-cap`** por el Block 4, como el propio spec ordena (líneas 98-100 y 367-375). Ya no existe con ese nombre, y es correcto que no exista: afirmaba `sm:w-[40%]`, que FR-12 vuelve falso |
| `test-block1-authlayout-empty-children-no-error` | `AuthLayout.test.tsx:92` | existe, pasa |
| `test-block2-form-fixed-width` | `RegisterForm.test.tsx:162` | existe, pasa |
| `test-block2-button-spacing-13px` | `RegisterForm.test.tsx:168` | existe, pasa |
| `test-block2-button-centered-content-width` | `RegisterForm.test.tsx:181` | existe, pasa |
| `test-block2-input-radius-1rem` | `RegisterForm.test.tsx:190` | existe, pasa |
| `test-block2-button-radius-1rem` | `RegisterForm.test.tsx:199` | existe, pasa |
| `test-block2-banner-radius-1rem` | `RegisterForm.test.tsx:205` | existe, pasa |
| `test-block2-banner-spacing-13px` | `RegisterForm.test.tsx:219` | existe, pasa |
| `test-block2-banner-text-wraps-no-expand` | `RegisterForm.test.tsx:237` | existe, pasa, con alcance reducido y declarado en el propio test |
| `test-manual-block2-nfr01-button-touch-target` | `tdd-evidence-FEAT-007.md:117-130` | manual, **ejecutado**, cálculo documentado |
| `test-block3-loader-fullscreen-overlay` | `Loader.test.tsx:30` | existe, pasa |
| `test-block3-loader-spinner-preserved` | `Loader.test.tsx:47` | existe, pasa |
| `test-block3-loader-hidden-no-error-residual` | `Loader.test.tsx:64` | existe, pasa |
| `test-block3-tokens-overlay-declarado` | `globals.test.ts:43,51` y `tailwind.config.test.ts:18` | **el identificador no existe**; las aserciones sí, ver W-VER-04 |
| `test-block4-card-width-responsive` | `AuthLayout.test.tsx:104` | existe, pasa |
| `test-block4-card-width-cascade-order` | `AuthLayout.test.tsx:115` | existe, pasa |
| `test-block4-card-width-base-and-cap` | `AuthLayout.test.tsx:98` | existe, pasa (renombrado) |
| `test-manual-block4-salto-1200px` | — | manual, **pendiente**, correctamente declarado como tal |

19 identificadores automatizados existen y pasan, 1 fue renombrado por decisión del propio spec, 1
manual quedó ejecutado, 1 manual quedó pendiente y declarado, y 1
(`test-block3-tokens-overlay-declarado`) no existe con ese nombre aunque su contenido sí está
implementado y en verde. Suite completa: **18/18 suites, 94/94 tests**.

## Seccion 3 — NFR-01: área táctil del botón

**Cumplido, con constancia, y lo re-derivé en vez de aceptarlo.** El botón
(`RegisterForm.tsx:92-98`) no declara ninguna clase de tamaño de fuente propia y ningún ancestro la
declara: `globals.css` solo aplica `bg-bg text-fg` al `body` y no toca `font-size`, y `layout.tsx`
no agrega clases al `body`. Compilando el preflight de Tailwind 4.3.3 del proyecto, `html` recibe
`line-height: 1.5`, `py-2` resuelve a `padding-block: 0.5rem` y `px-4` a `padding-inline: 1rem`. Con
el root de 16px por defecto: alto = 16 × 1.5 + 8 + 8 = **40px**; ancho = el texto "Crear cuenta" (12
caracteres) más 32px de padding, muy por encima de 24px. Supera el mínimo de 24×24px CSS de WCAG 2.2
SC 2.5.8 con holgura. El cálculo del bloque (`tdd-evidence-FEAT-007.md:117-130`) es correcto en
todos sus pasos.

Límite honesto de esta verificación: es aritmética sobre los valores computados del CSS, no una
medición en navegador. Como el botón no tiene alto ni ancho fijados y el margen es de 16px sobre el
umbral, la conclusión es robusta a cualquier variación razonable de fuente.

## Seccion 4 — AC-13 y los límites de lo verificable

Es la pregunta que más pesa en el cierre, así que va sin maquillaje en ninguna de las dos
direcciones.

**Lo que la cobertura automatizada sí prueba, y es más de lo que "presencia de clases" sugiere:**

1. Las clases exactas están en el elemento renderizado, con aserciones negativas contra la grafía
   defectuosa (`AuthLayout.test.tsx:104-113`).
2. Las clases **realmente renderizadas** se extraen del DOM y se compilan con el `tailwindcss` del
   proyecto, y el CSS resultante emite el tramo del 40% **después** del tramo del 70%, con el bloque
   de media del 40% condicionado a `75rem` (`AuthLayout.test.tsx:115-126`). Lo reproduje por mi
   cuenta desde fuera del repo y obtuve exactamente eso. Ese test no es decorativo: mata la clase
   entera de defectos que ADR-007 documenta, y la matriz de mutación de la ronda 2 (5 de 5 muertas)
   lo confirma.

**Lo que ningún test automatizado prueba, y no puede probar en este entorno:**

1. El ancho renderizado. jsdom no computa layout; `getBoundingClientRect` devuelve 0 con cualquier
   CSS. Nadie midió que la tarjeta ocupe 70% ni 40% de nada.
2. Que la regla del 70% no quede tapada en el rango intermedio por la interacción con `max-w-4xl`,
   el `flex` del contenedor y el `px-4` de los ancestros. Eso solo se ve pintado.
3. Que `75rem` equivalga a 1200px en el navegador del usuario: depende del `font-size` raíz. En el
   proyecto nada lo redefine, así que con el default de 16px el corte cae donde FR-12 lo pide; con
   un usuario que agrande la fuente base del navegador, el corte se mueve. Es una consecuencia
   inherente y deseable de elegir `rem` (el `sm:` de Tailwind tiene la misma propiedad), no un
   defecto, pero significa que "1200px" es una equivalencia con condición.

**Veredicto sobre AC-13: verificado a nivel de mecanismo, parcialmente verificado a nivel de
comportamiento.** Darlo por cerrado del todo antes del test manual sería declarar verificado un
ancho que nadie observó; declararlo incumplido sería negar un test que compila el CSS real del
componente y comprueba la única propiedad que podía romperlo en silencio. Lo correcto es lo que el
spec ya previó: `test-manual-block4-salto-1200px` sigue siendo condición de cierre, y hasta que se
ejecute, AC-13 queda **parcialmente verificado**. La misma lectura aplica, con menos respaldo
automatizado, a AC-10 y AC-11.

**Hallazgo nuevo, y es el que más importa para ese test manual: las cifras que manda confirmar están
mal, en todos los documentos.** El spec calcula ≈817px y ≈467px descontando un solo `px-4` (el de
`AuthLayout.tsx:8`), y el PRD calcula 839px y 480px sin descontar ninguno. Pero la tarjeta tiene
**dos** ancestros con `px-4`: `register/page.tsx:10`, que envuelve todo en un `main` con
`min-h-screen bg-bg px-4 py-8` (heredado de FEAT-006, no tocado por este ticket), y
`AuthLayout.tsx:8`. El content box del padre es viewport − 64px, no − 32px. Los valores reales:

| Viewport | Ancho real de la tarjeta | Documentado en el spec |
|---|---|---|
| 1199px | 0.7 × (1199 − 64) ≈ **794px** (66.3% del viewport) | ≈817px |
| 1200px | 0.4 × (1200 − 64) ≈ **454px** (37.9% del viewport) | ≈467px |
| techo `max-w-4xl` | se activa desde **2304px** de viewport | 2272px en el spec, 2240px en el PRD |

No cambia el veredicto de AC-13 (el salto existe, cae donde debe, y la lectura content-box que el
spec adopta sigue siendo la que un porcentaje de CSS puede cumplir), pero sí invalida los números
que el operador humano tiene que confirmar. Si alguien mide 794px contra un criterio que dice 817px,
va a reportar un defecto que no existe. **Este descuido atravesó DEFINE, PLAN, CODE y dos rondas de
revisión sin que nada lo tocara, precisamente porque ningún test mide layout: es la demostración
empírica de por qué la verificación manual de este bloque no es una formalidad.** No se corrige
desde VERIFY, porque no se editan PRD ni spec en esta fase; queda como corrección a aplicar antes de
ejecutar el test manual.

## Seccion 5 — Verificaciones manuales pendientes

Las tres declaradas se revisaron una por una contra los artefactos, buscando específicamente si
alguna figura como hecha sin serlo:

| Verificación | Estado real | Declarada correctamente |
|---|---|---|
| `test-manual-block4-salto-1200px` | pendiente, no ejecutada | Sí, en tres lugares coherentes: spec (Block 4, Required tests y Final verification), `tdd-evidence-FEAT-007.md:538-543` y `tests-FEAT-007.md:60-66`. En ningún documento se afirma como hecha |
| Wrap del banner sin expandir el contenedor | pendiente, no ejecutada | Sí, y con una honestidad poco común: el aviso está escrito **dentro del propio test** (`RegisterForm.test.tsx:238-244`), que declara explícitamente que no valida ese criterio, además del spec y del reporte de tests |
| Efecto de `min-w-0` en el panel de contenido | pendiente, no ejecutada | Sí. `tdd-evidence-FEAT-007.md:91-106` va más lejos y aclara que la clase se agregó de forma **preventiva por razonamiento CSS**, sin la detección empírica que el spec ponía como condición, porque jsdom no permite detectarla |
| `test-manual-block2-nfr01-button-touch-target` | **ejecutado**, con cálculo | Sí. El spec no lo lista entre las pendientes de cierre, coherente con haberse ejecutado |

**Ninguna verificación manual figura como hecha sin serlo.** El expediente es honesto en este punto.
Dos observaciones menores: (a) `tests-FEAT-007.md:69` dice "Ídem `test-manual-block2-*`", en plural
con comodín, y el único identificador manual del Bloque 2 en el spec es el de NFR-01, que sí se
ejecutó; un lector apurado puede leer esa línea como que NFR-01 quedó pendiente, cuando lo pendiente
son el wrap y `min-w-0`, que no tienen identificador propio en Required tests. (b) El `min-w-0` de
`AuthLayout.tsx:34` es la única clase de producción del ticket que **ningún test guarda**: un
refactor puede borrarla y la suite sigue en verde, y su necesidad además no está comprobada. Es
deuda pequeña pero real, y doblemente relevante porque es una de las dos mitades del mecanismo que
sostiene AC-11.

## Seccion 6 — Calidad de los tests (catálogo, apartado 5)

**Cobertura:** por encima del piso en las tres métricas; 100% en los cuatro archivos del ticket.

**Sad paths:** cubiertos, ver F-VER-04. Cinco escenarios de entrada inválida o camino triste, todos
ejercitando el flujo real y no un render forzado del banner.

**Determinismo:** sin dependencia de orden, sin temporizadores, sin fechas ni IDs hardcodeados, sin
estado global compartido (`jest.clearAllMocks` en `afterEach`). Las 18 suites corrieron en verde en
mi ejecución independiente, con los mismos números del reporte previo.

**Tests tautológicos o que verifican implementación en vez de comportamiento.** Acá hay una tensión
real que conviene nombrar en vez de aprobarla en silencio:

- La mayoría de los tests del ticket afirman **presencia de clases CSS**, que es implementación, no
  comportamiento, lo contrario de lo que pide `AGENTS.md`. En un ticket 100% visual bajo jsdom no
  hay alternativa, y el expediente lo reconoce en todos lados; pero conviene tenerlo presente:
  `toHaveClass` es comparación de cadenas y no evalúa si la regla llega a aplicarse. La única
  excepción es `test-block4-card-width-cascade-order`, que compila CSS de verdad, y en menor medida
  los dos tests de espaciado, que tras la Ronda 2 afirman el ancestro causal y no solo la clase.
- **`test-block2-banner-text-wraps-no-expand` es el test más débil del conjunto.** Sus dos
  aserciones (`w-full` en el `<form>` y en el input de email) ya están cubiertas por
  `test-block2-form-fixed-width` y por `test-block2-input-radius-1rem`, así que aporta poco más que
  el escenario en que las evalúa. No es tautológico (se lo vio en rojo antes del fix, y el
  expediente documenta que su primera versión sí lo era y fue rediseñada por eso), pero está muy
  lejos del criterio que le da nombre. Su virtud es que lo dice el propio test, en su comentario.
- Los dos tests de espaciado (`test-block2-button-spacing-13px` y `test-block2-banner-spacing-13px`)
  ya fueron superficiales una vez y se corrigieron. Verifiqué el mecanismo por compilación y hoy
  afirman el elemento correcto. La corrección fue real, no cosmética.
- Sin código muerto en los helpers de test: el campo `condition` de `WidthMedia`, que la ronda 1
  calculaba y descartaba, hoy se usa en `AuthLayout.test.tsx:121` y `:125`. Sin imports sin usar
  (linter en exit 0 y revisión directa de los 8 archivos).

## Warnings (no bloqueantes)

- **W-VER-04 (F-VER-06, forma menor):** el identificador `test-block3-tokens-overlay-declarado` que
  promete el Block 3 no existe como caso de test en ningún archivo. Su contenido sí está
  implementado y en verde, exactamente por el mecanismo que el propio spec describe en su sección
  "Files": la entrada `--color-overlay` en `DARK_TOKENS` (`globals.test.ts:17`) y en `LIGHT_TOKENS`
  (`globals.test.ts:31`), evaluadas por los tests de las líneas 43 y 51, y `overlay` en
  `SEMANTIC_TOKENS` (`tailwind.config.test.ts:14`), evaluado por el `it.each` de la línea 18. Es un
  hueco de **nomenclatura**, no de cobertura: el identificador no es greppable, que es justamente el
  modo de falla por el que este proyecto ya gastó loops correctivos en FEAT-004 y FEAT-005. La tabla
  de mapeo del Bloque 3 en la evidencia TDD (`tdd-evidence-FEAT-007.md:394-400`) tampoco lo lista,
  así que el hueco se propagó sin que nadie lo notara. No bloquea: la regresión que ese guard debía
  cubrir está cubierta y demostrada por mutación medida.
- **W-VER-03 (test frágil):** `test-block4-card-width-cascade-order` depende de internals del
  paquete instalado (la clave `style` del manifiesto de `tailwindcss` y la API `compile`). Un salto
  de versión mayor puede romperlo. El modo de falla es ruidoso y temprano (excepción en carga del
  módulo), verificado por el auditor, así que nunca produce un verde silencioso. Aceptado.
- **W-VER-02:** cobertura de ramas de la suite en 83.33%, entre el piso y el 90% recomendado. Las
  cuatro ramas sin cubrir son preexistentes y ajenas al ticket; los archivos de FEAT-007 están al
  100%.
- **Huecos residuales conocidos y registrados** (`tdd-evidence-FEAT-007.md:503-510` y `:619-630`):
  el test de cascada compara primeras ocurrencias con `indexOf`, y usa una comparación de subcadena
  para el breakpoint. Ambos quedan cerrados a nivel de suite por la aserción de clase exacta de
  `AuthLayout.test.tsx:110`. Documentados, no cerrados, decisión consciente. De acuerdo.
- **`min-w-0` sin test que lo guarde**, ver seccion 5.
- **W-VER-01 (código muerto):** sin hallazgos. Sin imports sin usar, sin variables declaradas y no
  usadas, sin bloques comentados en los 8 archivos del ticket.

## Seccion 7 — Coherencia entre artefactos

Las dos desalineaciones ya conocidas, confirmadas, más las que encontré:

1. **Spec, Block 4, sección "Files" (líneas 262-264): dice que se agrega 1 test nuevo y se actualiza
   `test-block1-card-width-desktop`; Required tests (líneas 345-375) pide 2 nuevos más 1 renombrado.**
   Confirmada. Se implementó lo segundo, que es lo correcto y lo más exigente. Es una contradicción
   interna del spec, no del código. **Reportable como hallazgo documental, no como defecto del
   trabajo:** lo entregado satisface la lectura estricta, y la sección "Files" es la que quedó
   desactualizada. No se corrige desde VERIFY.
2. **Fila de riesgos del PRD (línea 150) que invoca el precedente de ADR-005/ADR-006 para el
   breakpoint, argumento que ADR-007 refuta.** Confirmada. La reconciliación del spec (líneas
   289-296) es explícita: nombra el defecto del argumento del PRD, dice cuál es la mitigación
   vigente y qué variante se implementa. **La reconciliación escrita alcanza** para que el expediente
   sea legible y no engañe a nadie: el spec supera al PRD y lo declara. Queda como hallazgo
   informativo, con una salvedad: el PRD es el documento que un lector abre primero, y sigue
   afirmando un argumento falso sobre su propia mitigación. Corregirlo pide un loop de DEFINE que
   este ticket no justifica; anotarlo, sí.
3. **Nueva: las cifras de ancho del Block 4 están mal en PRD y spec por no contar el `px-4` de
   `register/page.tsx`.** Detallada en seccion 4. Es la única de las tres con consecuencia
   operativa: el test manual pendiente manda confirmar números incorrectos.
4. **Nueva: `tests-FEAT-007.md:33-36` atribuye a FEAT-004 y FEAT-005 una cita que esos reportes no
   hacen.** Detallada en F-VER-03. La conclusión de la nota no cambia.
5. **Nueva: el identificador `test-block3-tokens-overlay-declarado` no existe.** Ver W-VER-04.
6. **Nueva, menor: `tests-FEAT-007.md:69` usa un plural con comodín** para referirse a las
   verificaciones manuales pendientes del Bloque 2, cuando el único manual de ese bloque con
   identificador propio se ejecutó. Ver seccion 5.

## Cross-checks adicionales

- Diff `45ce3e1..HEAD` limpio de sorpresas: 10 archivos de `frontend/` (3 componentes,
  `globals.css`, `tailwind.config.ts` y 5 de test) más documentación. **Sin cambios en `backend/`,
  `package.json` ni `pnpm-lock.yaml`**: cero dependencias nuevas, coherente con F-SAST-16 y con
  ADR-004.
- `TransactionForm.tsx` y `TransactionForm.test.tsx`: sin diff, como el Block 3 exige. El efecto
  global del `Loader` sobre esa pantalla es el confirmado con el usuario.
- `FormField.tsx` y `useRegisterUser.ts`: sin diff. Ninguna regla de validación se tocó, como el PRD
  pone en Out of Scope.
- La única aparición de `sm:w-[40%]` en `src/` es la aserción negativa intencional de
  `AuthLayout.test.tsx:111`. El nombre `test-block1-card-width-desktop` no sobrevive en ningún
  archivo, como corresponde al rename.
- R-01 del threat model: verificado en código. `Loader.tsx:11` usa `z-[100]` y `ThemeToggle.tsx:6`
  usa `z-50`; la precedencia ya no depende del orden del DOM. R-02 sigue aceptado y no mitigado, con
  ADR-006 y ticket de seguimiento.
- Evidencia TDD: los 4 bloques tienen rojo previo documentado con la aserción exacta. Las tres
  declaraciones de ausencia de rojo (rename del Bloque 3, mitad de transición del Bloque 3, y
  `test-block4-card-width-base-and-cap`) están razonadas y son legítimas: en los tres casos el
  código ya existía y fabricar un rojo habría sido mentir. La limitación de la ronda 2 del Bloque 3
  (los valores recibidos no recuperables desde git) está registrada como riesgo de proceso en vez de
  presentarse como verificada. Es el estándar que `AGENTS.md` pide tras FEAT-001, cumplido.

## Veredicto

**PASSED.**

Los 4 bloques están implementados y commiteados, los 12 FR tienen código, los 13 AC tienen veredicto
positivo, la suite está en verde con la cobertura sobre el piso, y el type-checker y el linter en
exit 0, todo re-ejecutado de forma independiente en esta fase.

El PASSED es **condicionado, y la condición no es retórica**: AC-11 y la mitad renderizada de AC-13
están verificados hasta donde jsdom permite y no más allá. Antes de dar el ticket por cerrado hay
que ejecutar las dos verificaciones manuales pendientes, y hacerlo contra las cifras corregidas de
la seccion 4 (≈794px y ≈454px, no ≈817px y ≈467px). Si esas cifras no se corrigen antes, el test
manual va a producir un rechazo falso.

Reportes previos referenciados: `docs/ddw/reports/tests-FEAT-007.md` (94/94, PASSED),
`docs/ddw/security/sast-FEAT-007.md` (17 categorías limpias, 0 vulnerabilidades) y
`docs/ddw/reports/tdd-evidence-FEAT-007.md` (4 bloques, rojo previo documentado).
