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
| `frontend/src/components/AuthLayout.tsx` (modificado) | Block 1 |
| `frontend/src/components/RegisterForm.tsx` (modificado) | Block 2 |
| `frontend/src/components/Loader.tsx` (modificado) | Block 3 |

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
- **Tampering:** no aplica — el cambio es de proporción de ancho (`w-2/5`→`sm:w-1/2`) y radio de
  borde, ambos valores estáticos en el JSX, sin interpolación de props externas ni de datos.
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
| R-01 | El overlay de `Loader.tsx` queda con un `z-index` insuficiente y no cubre realmente algún elemento con posicionamiento propio (ej. si en el futuro se agrega algo con `position: fixed` y z-index mayor), dejando controles clickeables "debajo" del overlay durante la carga | E (bypass del bloqueo de interacción esperado, no una escalada de privilegios real) | Low | Low | El spec especifica un `z-index` explícito y alto para el overlay; se documenta en el spec como convención a respetar por futuros componentes con posicionamiento fijo |

Ningún riesgo alcanza CRITICAL o HIGH: el ticket es 100% cosmético/layout, no toca autenticación,
autorización, datos sensibles, ni agrega superficie de red o de dependencias.

## Supply chain

No se agrega ninguna dependencia nueva. Los tres componentes modificados no cambian sus imports más
allá de las clases de Tailwind que ya usaban.

## Availability

Sin vectores de DoS nuevos: los cambios son de markup y CSS estático, sin loops, sin llamadas de red
adicionales ni procesamiento nuevo del lado del cliente o del servidor.
