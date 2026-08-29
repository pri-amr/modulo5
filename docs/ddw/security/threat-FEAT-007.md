# Threat model FEAT-007: Ajustes visuales de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-007 |
| Spec | docs/ddw/specs/spec-FEAT-007.md |
| Tier | FEATURE |
| Date | 2026-08-27 |

## Components

| Component | Source in the spec |
|---|---|
| `frontend/src/components/AuthLayout.tsx` (modificado) | Block 1 y Block 4 |
| `frontend/src/components/RegisterForm.tsx` (modificado) | Block 2 |
| `frontend/src/components/Loader.tsx` (modificado) | Block 3 |
| `frontend/src/app/globals.css` (modificado — token `--color-overlay`) | Block 3 |
| `frontend/tailwind.config.ts` (modificado — color `overlay`) | Block 3 |

## Trust boundaries

- Browser → API (`POST /api/register`, invocado desde `useRegisterUser.ts`): sin cambios en este
  ticket — ningún bloque toca el hook ni la llamada al backend, solo el layout/estilo visual
  alrededor del formulario y del indicador de carga.
- No se agregan límites de confianza nuevos: los tres componentes tocados son puramente
  presentacionales (layout, CSS, posicionamiento), ejecutan enteramente en el cliente y no leen ni
  escriben ningún dato nuevo.

## STRIDE analysis

### `frontend/src/components/AuthLayout.tsx` (modificado)

- **Spoofing:** no aplica — sigue sin manejar identidad ni autenticación.
- **Tampering:** no aplica — los cambios son de proporción de ancho interna (`w-2/5`→`sm:w-1/2`),
  radio de borde, y ancho externo de la tarjeta (`sm:w-[40%]`→`sm:w-[70%] min-[75rem]:w-[40%]`,
  Block 4), todos valores estáticos en el JSX, sin interpolación de props externas ni de datos.
- **Repudiation:** no aplica — sigue sin ejecutar ninguna acción que requiera auditoría.
- **Information Disclosure:** no aplica — sigue renderizando únicamente `children`, sin acceder a
  ningún dato nuevo.
- **Denial of Service:** no aplica — cambio de clases CSS estáticas, sin procesamiento nuevo.
- **Elevation of Privilege:** no aplica — sin control de acceso involucrado en un componente de
  layout.

### `frontend/src/components/RegisterForm.tsx` (modificado)

- **Spoofing:** sin cambio — el formulario sigue sin implementar autenticación propia.
- **Tampering:** sin cambio — los cambios (ancho fijo del `<form>`, agrupación de espaciado,
  centrado del botón, radios de borde) son de layout y CSS; no tocan `name`/`id` de los campos, el
  payload enviado, ni la lógica de `useRegisterUser` (no modificado en este ticket).
- **Repudiation:** sin cambio — no ejecuta ninguna acción nueva que requiera auditoría.
- **Information Disclosure:** el único punto a revisar es que el banner de error ahora hace `wrap`
  de su texto en vez de expandir el contenedor. El texto que se muestra sigue siendo exactamente el
  mismo `error` que ya devolvía `useRegisterUser` en FEAT-006 (sin cambios de contenido, solo de
  cómo se ajusta visualmente) — no hay dato nuevo expuesto ni riesgo de que el wrap oculte o trunque
  información: el texto sigue completo, solo distribuido en más líneas si no entra en una.
- **Denial of Service:** no aplica — cambio de layout/CSS, sin procesamiento nuevo.
- **Elevation of Privilege:** no aplica.

### `frontend/src/components/Loader.tsx` (modificado)

- **Spoofing:** no aplica — el indicador de carga no maneja identidad.
- **Tampering:** no aplica — el cambio (overlay `fixed inset-0` con fondo semitransparente) es
  markup y CSS estático, sin interpolación de datos externos.
- **Repudiation:** no aplica — no ejecuta ninguna acción que requiera auditoría.
- **Information Disclosure:** no aplica — el overlay no renderiza ningún dato nuevo, solo bloquea
  visualmente la pantalla mientras `visible` es verdadero; no expone información adicional a la que
  ya estaba en pantalla antes de la carga.
- **Denial of Service:** el único punto a revisar es de UX, no de seguridad: al ser un overlay que
  cubre toda la pantalla mientras `visible` es `true`, el usuario no puede interactuar con nada
  detrás durante la carga (bloqueo intencional del formulario mientras se procesa el submit, mismo
  comportamiento que ya tenían los inputs con `disabled={loading}` en FEAT-005/006, solo que ahora
  visualmente cubre toda la pantalla en vez de solo los campos). No es un vector de ataque: es el
  comportamiento esperado de un estado de carga, y `visible` sigue controlado enteramente por el
  estado `loading` del propio formulario, sin input del usuario que pueda forzarlo a quedar
  encendido indefinidamente más allá de lo que ya permitía el `disabled` existente.
- **Elevation of Privilege:** no aplica — sin control de acceso involucrado.

### `frontend/src/app/globals.css` (modificado — token `--color-overlay`) y `frontend/tailwind.config.ts` (modificado — color `overlay`)

Se analizan juntos porque son el mismo cambio en dos mitades: la declaración del valor y su
exposición como utilidad de Tailwind. Ambos son configuración de estilo, evaluada en tiempo de build.

- **Spoofing:** no aplica — no manejan identidad ni autenticación.
- **Tampering:** el riesgo teórico sería que un valor de color se inyecte desde fuera; no ocurre
  acá. `--color-overlay` es un literal RGB escrito en el archivo, sin interpolación, sin input del
  usuario y sin lectura de ninguna fuente externa. Modificarlo exige commitear al repositorio, que
  es el mismo límite de confianza que ya protege a los otros 10 tokens.
- **Repudiation:** no aplica — no ejecutan ninguna acción auditable en tiempo de ejecución.
- **Information Disclosure:** no aplica — un color de scrim no transporta ni revela ningún dato. El
  overlay tapa contenido, no lo expone.
- **Denial of Service:** no aplica — se resuelven en tiempo de build; no agregan trabajo en tiempo
  de ejecución ni en el cliente ni en el servidor.
- **Elevation of Privilege:** no aplica — sin control de acceso involucrado.

El punto que sí merece registro no es de seguridad sino de robustez, y quedó cubierto: si el token
desapareciera de uno de los dos temas, `bg-overlay/50` resolvería a un color inválido y el overlay
se volvería transparente, degradando el bloqueo visual de R-01 sin ninguna señal de error. Por eso
el Block 3 extiende las allowlists de `globals.test.ts` y `tailwind.config.test.ts`, que son de
inclusión y hasta entonces no cubrían el token nuevo.

## Data classification

| Data | Class | At rest | In transit |
|---|---|---|---|
| Clave ingresada en el formulario | credentials | sin cambios respecto de FEAT-005/FEAT-006: hasheada con bcrypt en el backend, nunca en texto plano | sin cambios: TLS, no tocado en este ticket |
| Email ingresado en el formulario | PII | sin cambios respecto de FEAT-005/FEAT-006 | sin cambios |
| Mensaje del banner de error | público (texto de UI, ya existente desde FEAT-006) | no se persiste | no aplica (no viaja, se muestra localmente) |

Ningún dato nuevo: los tres componentes tocados son presentacionales (layout/CSS) y no introducen,
transforman ni exponen ningún campo que no estuviera ya cubierto por la clasificación de
FEAT-005/FEAT-006 — este ticket no cambia cómo se manejan.

## Risks and mitigations

| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | El overlay de `Loader.tsx` queda con un `z-index` insuficiente y no cubre realmente algún elemento con posicionamiento propio (ej. si en el futuro se agrega algo con `position: fixed` y z-index mayor), dejando controles clickeables "debajo" del overlay durante la carga | E (bypass del bloqueo de interacción esperado, no una escalada de privilegios real) | Low | Low | **Mitigado.** El overlay usa `z-[100]`, estrictamente superior al `z-50` de `ThemeToggle.tsx`, el único otro elemento con posicionamiento fijo de la aplicación; la precedencia ya no depende del orden del DOM. La convención de capas queda escrita en ADR-006 (`z-[100]` para lo que cubre la interfaz, `z-50` para el chrome persistente) y afirmada por los tests de ambos componentes. La primera versión del spec decía `z-50`, empatando con `ThemeToggle`, lo que dejaba esta mitigación cumplida solo a medias — corregido en la revisión del spec |
| R-02 | Durante la carga, el botón de `ThemeToggle` sigue siendo alcanzable con Tab por debajo del overlay: se lo puede activar y cambiar el tema con la pantalla tapada | E (bypass del bloqueo de interacción por vía de teclado, no una escalada de privilegios real) | Low | Low | **Aceptado, no mitigado en este ticket.** Los formularios que consumen `Loader` ya deshabilitan todos sus controles durante la carga (`disabled={loading}` en `RegisterForm` y `TransactionForm`), así que el único elemento focusable bajo el scrim es el toggle de tema, cuyo efecto es puramente cosmético y reversible. Cerrarlo de verdad pide `inert` o un focus trap sobre el contenedor de la app, patrón que el proyecto no usa en ningún otro lado y que excede el alcance de un ticket visual. Registrado en ADR-006 con ticket de seguimiento |

Ningún riesgo alcanza CRITICAL o HIGH: el ticket es 100% cosmético/layout, no toca autenticación,
autorización, datos sensibles, ni agrega superficie de red o de dependencias.

El Block 4 (ancho responsive de la tarjeta) no introduce ningún riesgo: cambia una clase de ancho
estática en un componente de layout, sin datos, sin estado y sin superficie nueva.

## Supply chain

No se agrega ninguna dependencia nueva. Los componentes modificados no cambian sus imports más allá
de las clases de Tailwind que ya usaban. El token `--color-overlay` agregado en `globals.css` y su
mapeo en `tailwind.config.ts` son configuración local del proyecto, no un paquete externo, y su
adición es puramente aditiva: ningún token existente cambió de valor.

## Availability

Sin vectores de DoS nuevos: los cambios son de markup y CSS estático, sin loops, sin llamadas de red
adicionales ni procesamiento nuevo del lado del cliente o del servidor.
