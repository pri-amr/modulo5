# PRD FEAT-001: Registrar ingreso o egreso de dinero

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| Tracker | none |
| Date | 2026-07-31 |
| PRD loops | 2 |

## Context and Problem

Los usuarios necesitan poder registrar sus movimientos de dinero (ingresos y egresos) asociados a una fuente de dinero (banco o efectivo) y a una categoría, para poder llevar el control centralizado de sus finanzas que es el objetivo central de la aplicación (O1 del PRD general). Esta es la primera feature que se construye en el proyecto: hoy no existe ningún módulo implementado.

Fuera de esta feature quedan la gestión de fuentes de dinero y de categorías (altas propias del usuario), y la autenticación real — ambas se resuelven en tickets posteriores. Para no bloquear esta feature en esas dependencias, se usan datos semilla (ver "Dependencies").

## Goals

- Permitir que un usuario registre una transacción de tipo ingreso o egreso, con los datos mínimos exigidos por el PRD general (monto, fuente, moneda, categoría, fecha, descripción).
- Mantener el monto de la fuente de dinero afectada sincronizado con las transacciones registradas, en la moneda correspondiente.
- Dar feedback claro al usuario ante errores de validación o de guardado, sin pérdida de los datos ya ingresados.

## Functional Requirements

- FR-01: El sistema debe permitir registrar una transacción de tipo egreso (RF-18).
- FR-02: El sistema debe permitir registrar una transacción de tipo ingreso (RF-19).
- FR-03: El sistema debe requerir que la transacción tenga un monto numérico (RF-20).
- FR-04: El sistema debe requerir que la transacción esté asociada a una fuente de dinero existente del usuario autenticado (RF-21).
- FR-05: El sistema debe requerir que la transacción esté asociada a una moneda: ARS o USD (RF-22).
- FR-06: El sistema debe requerir que la transacción esté asociada a una categoría existente del usuario autenticado (RF-23).
- FR-07: El sistema debe requerir que la transacción esté asociada a una fecha en formato DD-MM-YYYY (RF-24).
- FR-08: El sistema debe requerir que la transacción tenga una descripción de texto libre ingresada por el usuario (RF-25).
- FR-09: El sistema debe validar que el monto de la transacción sea un número mayor a cero antes de permitir guardarla (RF-28).
- FR-10: El sistema debe validar que todos los campos obligatorios (monto, fuente, moneda, categoría, fecha, descripción) estén completos antes de permitir guardar la transacción (RF-29).
- FR-11: El sistema debe mostrar un mensaje de error si el guardado de la transacción falla, sin perder los datos ingresados por el usuario (RF-30).
- FR-12: El sistema debe recalcular el monto de la fuente de dinero afectada en la moneda de la transacción al registrarla, sumando el monto si es un ingreso y restándolo si es un egreso, sin modificar el monto de esa fuente en la otra moneda (RF-14, alcance acotado al registro; edición y eliminación quedan fuera de esta feature).

## Non-Functional Requirements

- NFR-01: Usabilidad — el usuario debe poder completar y confirmar el registro de una transacción en menos de 30 segundos desde el dashboard (RNF-07).
- NFR-02: Privacidad — el backend debe rechazar con un código de error 403 el registro de una transacción cuya fuente de dinero o categoría no pertenezca al usuario autenticado, sin crear el registro (RNF-10, aplicado al alta de transacciones).
- NFR-03: Usabilidad — mientras la transacción se está guardando, el formulario debe mostrar el indicador de carga circular con el color #376BCB definido en RNF-12, girando en animación continua hasta que la operación finaliza.
- NFR-04: Usabilidad — la interfaz debe ofrecer modo claro y modo oscuro para toda la interfaz, aplicando modo oscuro por defecto al cargar la aplicación, y debe permitir al usuario alternar entre ambos modos en cualquier momento (RNF-11).

## Acceptance Criteria

- AC-01: WHEN el usuario completa el formulario de transacción con tipo egreso, monto, fuente, moneda, categoría, fecha y descripción válidos y confirma, THE system SHALL guardar la transacción y reducir el monto de la fuente en esa moneda exactamente en el monto ingresado. (covers FR-01, FR-04, FR-05, FR-06, FR-07, FR-08, FR-12)
- AC-02: WHEN el usuario completa el formulario de transacción con tipo ingreso, monto, fuente, moneda, categoría, fecha y descripción válidos y confirma, THE system SHALL guardar la transacción e incrementar el monto de la fuente en esa moneda exactamente en el monto ingresado. (covers FR-02, FR-04, FR-05, FR-06, FR-07, FR-08, FR-12)
- AC-03: WHEN se registra una transacción en una moneda determinada, THE system SHALL dejar sin cambios el monto de la fuente en la otra moneda. (covers FR-12)
- AC-04: IF el usuario intenta guardar la transacción sin ingresar un monto, THEN THE system SHALL rechazar el guardado y mostrar un mensaje de error indicando que el monto es obligatorio. (covers FR-03, FR-10)
- AC-05: IF el monto ingresado es menor o igual a cero, THEN THE system SHALL rechazar el guardado y mostrar un mensaje de error indicando que el monto debe ser mayor a cero. (covers FR-09)
- AC-06: IF falta la fuente, la moneda, la categoría, la fecha o la descripción al intentar guardar, THEN THE system SHALL rechazar el guardado y mostrar un mensaje de error indicando cuál campo obligatorio falta. (covers FR-04, FR-05, FR-06, FR-07, FR-08, FR-10)
- AC-07: IF la fuente de dinero o la categoría indicadas no pertenecen al usuario autenticado, THEN THE system SHALL rechazar la operación con un código de error 403 y no registrar la transacción. (covers NFR-02)
- AC-08: IF el guardado de la transacción falla por un error del servidor, THEN THE system SHALL mostrar un mensaje de error explícito y conservar en el formulario los datos ya ingresados por el usuario. (covers FR-11)
- AC-09: WHEN el usuario ingresa la fecha de la transacción, THE system SHALL aceptar únicamente valores en formato DD-MM-YYYY y rechazar cualquier otro formato. (covers FR-07)
- AC-10: WHILE la transacción se está guardando, THE system SHALL mostrar el indicador de carga circular definido en RNF-12 hasta que la operación finaliza. (covers NFR-01, NFR-03)
- AC-11: WHEN el usuario carga la aplicación por primera vez, THE system SHALL mostrar toda la interfaz en modo oscuro por defecto. (covers NFR-04)
- AC-12: WHEN el usuario alterna el selector de modo claro/oscuro, THE system SHALL cambiar la interfaz completa al modo seleccionado. (covers NFR-04)

## Out of Scope

- Alta, edición o eliminación de fuentes de dinero (RF-08 a RF-13) — se usan fuentes precargadas vía datos semilla.
- Alta de categorías (RF-15 a RF-17) — se usan categorías precargadas vía datos semilla.
- Edición y eliminación de transacciones existentes (RF-26, RF-27).
- Listado, filtros por período y paginación de transacciones (RF-33 a RF-37).
- Visualización de saldos por fuente y saldo total consolidado (RF-31, RF-32).
- Gráficos de gastos (RF-38 a RF-40).
- Conversor de divisas (RF-41 a RF-47).
- Autenticación real (registro y login con usuario/contraseña, passkeys — RF-01 a RF-07): se usa un usuario semilla fijo en la base de datos hasta que se implemente esa feature.

## Risks and Mitigations

- Riesgo: al no existir autenticación real todavía, el "usuario autenticado" de esta feature es un usuario semilla fijo simulando la sesión. Mitigación: la verificación de pertenencia (NFR-02) se implementa igual contra ese usuario semilla, de modo que la lógica de autorización no cambia cuando se incorpore la autenticación real; se deja documentado en el código el punto donde el usuario semilla debe reemplazarse por el usuario de la sesión real.
- Riesgo: sin una pantalla para dar de alta fuentes de dinero y categorías, el formulario de transacción puede quedar con selects vacíos si no se cargan datos semilla. Mitigación: incluir un script de seed con al menos una fuente de dinero y una categoría de ejemplo.

## Dependencies

- Requiere un usuario semilla fijo en la base de datos para representar al "usuario autenticado" (ver Risks) — no depende de la feature de autenticación (RF-01 a RF-07), que todavía no existe.
- Requiere datos semilla de al menos una fuente de dinero y una categoría, dado que las features de alta de fuentes de dinero (RF-08 a RF-14) y de categorías (RF-15 a RF-17) todavía no están implementadas.
- Depende del modelo de datos de fuente de dinero (montos en ARS y USD) para poder aplicar el recálculo de FR-12.
