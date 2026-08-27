# Threat model FEAT-006: Rediseño visual de la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-006 |
| Spec | docs/ddw/specs/spec-FEAT-006.md |
| Tier | FEATURE |
| Date | 2026-08-27 |

## Components

| Component | Source in the spec |
|---|---|
| `frontend/src/components/AuthLayout.tsx` (nuevo) | Block 1 |
| `frontend/src/app/register/page.tsx` (modificado) | Block 1 |
| `frontend/src/components/RegisterForm.tsx` (modificado) | Block 2 |
| `frontend/src/components/FormField.tsx` (modificado) | Block 2 |
| `frontend/src/hooks/useRegisterUser.ts` (modificado) | Block 2 |

## Trust boundaries

- Browser → API (`POST /api/register` vía axios, invocado desde `useRegisterUser.ts`): sin cambios
  en este ticket — el mismo límite de confianza que estableció FEAT-005, con el mismo contrato de
  request/response. Este ticket no modifica el payload enviado ni la respuesta interpretada, solo el
  texto mostrado al usuario a partir de esa respuesta.
- No se agregan nuevos límites de confianza: `AuthLayout.tsx` y el banner de error son puramente
  presentacionales, ejecutan enteramente en el cliente y no leen ni escriben ningún dato que no
  estuviera ya en el estado del formulario (`useRegisterUser.ts`).

## STRIDE analysis

### `frontend/src/components/AuthLayout.tsx` (nuevo)

- **Spoofing:** no aplica — el componente no maneja identidad ni autenticación, es un contenedor de
  layout con markup estático (ícono SVG inline fijo) y `children`.
- **Tampering:** no aplica — no procesa ni transforma datos; el SVG es contenido estático embebido en
  el bundle, no interpolado desde ninguna fuente externa o input del usuario.
- **Repudiation:** no aplica — no ejecuta ninguna acción que requiera auditoría (no hace fetch, no
  muta estado).
- **Information Disclosure:** no aplica — no renderiza ningún dato del usuario ni de la sesión; su
  única entrada es `children` (el propio contenido de la pantalla de registro, que ya se
  renderizaba sin este wrapper).
- **Denial of Service:** no aplica — es markup estático, sin lógica costosa ni loops sobre datos
  externos.
- **Elevation of Privilege:** no aplica — no hay ningún control de acceso ni verificación de permisos
  involucrado en un componente de layout.

### `frontend/src/app/register/page.tsx` (modificado)

- **Spoofing:** sin cambio respecto de FEAT-005 — la página server-side sigue sin implementar
  autenticación propia.
- **Tampering:** sin cambio — sigue haciendo dynamic import de `RegisterForm` (client component) sin
  lógica de negocio propia; el único cambio es envolver el contenido existente en `AuthLayout`, sin
  tocar ningún dato.
- **Repudiation:** sin cambio — la página no ejecuta ninguna acción propia que requiera auditoría.
- **Information Disclosure:** no aplica — la página no expone ningún dato nuevo; sigue sin acceder a
  sesión ni a datos de usuario (es la pantalla de alta, previa a tener cuenta).
- **Denial of Service:** sin cambio — sin procesamiento nuevo, solo composición de componentes.
- **Elevation of Privilege:** no aplica — sin control de acceso involucrado en esta página.

### `frontend/src/components/RegisterForm.tsx` (modificado)

- **Spoofing:** sin cambio respecto de FEAT-005 — el formulario sigue sin implementar autenticación
  propia (es alta de cuenta, no login).
- **Tampering:** sin cambio — el envío sigue yendo por el mismo hook (`useRegisterUser`) que ya
  serializa y envía los valores del formulario; renombrar los labels visibles ("Clave"/"Confirmar
  clave") no toca los `name`/`id` de los campos (`password`, `confirmPassword`) ni el payload
  enviado al backend.
- **Repudiation:** sin cambio — el logging de intentos de registro (si existe) vive en el backend,
  fuera de este ticket.
- **Information Disclosure:** el punto nuevo a revisar es el banner de error (reemplaza
  `<p role="alert">{error}</p>` por un banner con fondo/borde). **El mensaje mostrado es exactamente
  el mismo texto que ya devolvía `useRegisterUser` en FEAT-005** (ej. "ya existe una cuenta
  registrada con ese email") — este ticket solo cambia el contenedor visual, no genera, amplía ni
  agrega ningún dato nuevo al mensaje. No hay riesgo nuevo de disclosure: el `role="alert"` (ya
  presente) se conserva, y el contenido sigue siendo el que el backend/hook ya decidía mostrar.
- **Denial of Service:** no aplica — cambio puramente de estilo/CSS, sin nuevo procesamiento.
- **Elevation of Privilege:** no aplica.

### `frontend/src/components/FormField.tsx` (modificado)

- **Spoofing:** no aplica — el cambio agrega la prop `labelSize` para el tamaño de fuente del label
  (`text-sm` → `text-base`), sin identidad ni autenticación involucrada.
- **Tampering:** no aplica — `labelSize` es una unión de dos literales (`"sm" | "base"`) tipada por
  TypeScript, no un valor libre que pueda alterarse en runtime.
- **Repudiation:** no aplica — el componente no ejecuta ninguna acción que requiera auditoría.
- **Information Disclosure:** no aplica — no toca el manejo de `error` (que ya se mostraba con
  `role="alert"` y estilo `text-error`, sin cambios en este ticket) ni ningún dato de usuario.
- **Denial of Service:** no aplica — cambio puramente de estilo/CSS.
- **Elevation of Privilege:** no aplica — sin control de acceso involucrado.

### `frontend/src/hooks/useRegisterUser.ts` (modificado)

- **Spoofing:** sin cambio — la lógica de validación (yup) y la llamada al servicio de registro no
  cambian en este ticket.
- **Tampering:** sin cambio — las reglas (mínimo 8 caracteres, campo requerido, coincidencia de
  confirmación) no cambian; solo cambia el *texto* de los mensajes de error ya existentes
  ("contraseña" → "clave").
- **Repudiation:** sin cambio — el logging del intento de registro (si existe) vive en el backend,
  fuera de este ticket.
- **Information Disclosure:** no aplica — los mensajes de validación no exponen información nueva
  (siguen sin confirmar/negar duplicados de forma distinta a como ya lo hacía FEAT-005 — ese
  comportamiento, incluido el mensaje de email duplicado, no es parte de este ticket).
- **Denial of Service:** sin cambio — sin procesamiento nuevo, mismo costo de validación que
  FEAT-005.
- **Elevation of Privilege:** no aplica — sin control de acceso involucrado en este hook.

## Data classification

| Data | Class | At rest | In transit |
|---|---|---|---|
| Clave (contraseña) ingresada en el formulario | credentials | sin cambios respecto de FEAT-005: hasheada con bcrypt en el backend antes de persistir, nunca se guarda en texto plano en el cliente ni en el servidor | sin cambios: TLS, sin tocar en este ticket |
| Email ingresado en el formulario | PII | sin cambios respecto de FEAT-005 | sin cambios |
| Mensaje de error mostrado en el banner | público (texto de UI, ya existente) | no se persiste — vive solo en el estado del componente durante el render | no aplica (no viaja, se muestra localmente) |

No hay ningún dato nuevo clasificado por este ticket: reutiliza exactamente los mismos campos y el
mismo manejo de credenciales que FEAT-005, que ya especificaba bcrypt (NFR-01 de FEAT-005) y no se
toca aquí.

## Risks and mitigations

| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | El banner de error nuevo (fondo/borde con `--color-error`) se implementa con un contraste insuficiente entre texto y fondo, dificultando que un usuario con baja visión lea el mensaje de error (incluido el de credenciales/duplicado de cuenta) | I (el usuario no logra percibir la información que el sistema ya intenta comunicarle) | Medium | Low | NFR-01 del PRD exige contraste ≥4.5:1 (WCAG AA); se verifica manualmente en el bloque 2 antes de cerrarlo (ver spec) |
| R-02 | El ícono SVG inline se escribe con contenido dinámico o interpolado en vez de estático, abriendo una vía de XSS si en el futuro alguien lo reemplaza por contenido no confiable | T / I | Low | Low | El SVG del bloque 1 es un literal estático embebido en el componente, sin interpolación de props ni de datos externos — se documenta explícitamente en el spec para que una futura modificación no introduzca interpolación sin querer |

Ningún riesgo alcanza CRITICAL o HIGH: el cambio no toca autenticación, autorización, manejo de datos
sensibles más allá de lo que ya cubría FEAT-005, ni agrega superficie de red o de dependencias
(ADR-004).

## Supply chain

No se agrega ninguna dependencia nueva (ADR-004: SVG inline en vez de instalar una librería de
íconos). No hay superficie de cadena de suministro nueva que analizar en este ticket.

## Availability

Sin vectores de DoS nuevos: los cambios son de markup y CSS estático, sin loops, sin llamadas de red
adicionales ni procesamiento nuevo del lado del cliente o del servidor.
