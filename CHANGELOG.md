# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Added

- [FEAT-001] Registro de ingresos y egresos de dinero: formulario de alta de transacción con
  validación de monto, fecha, fuente de dinero y categoría, actualización del balance de la fuente
  correspondiente y manejo de errores con conservación de datos ingresados.
- [FEAT-001] Bootstrap del frontend con Next.js 16 y Tailwind 4.
- [FEAT-001] Tema claro/oscuro con persistencia (Zustand + `persist`), sincronización SSR-safe y
  modo oscuro por defecto.
- [FEAT-002] Tokens semánticos de color respaldados por variables CSS (`globals.css`, `:root` en
  modo oscuro por defecto / `.light` como override) expuestos como paleta de Tailwind, y migración
  del indicador de carga al token de acento en lugar de un color hardcodeado.
- [FEAT-003] Aplicación de los tokens semánticos de tema de FEAT-002 a `layout.tsx`, `ThemeToggle`,
  `page.tsx` y `TransactionForm`: tema oscuro estático desde el primer render del servidor, botón de
  alternancia con estilo consistente en ambos estados, indicador visual de error por campo
  (`border-error`/`border-line`) y unificación del campo Descripción a `<input type="text">` (antes
  `<textarea>`) para recibir las mismas clases que el resto de los inputs.
- [FEAT-004] Prettier compartido (`tabWidth: 4`, sin coma final) resuelto por búsqueda ascendente
  desde `backend/` y `frontend/`, con script `format` en ambos paquetes.
- [FEAT-004] ESLint propio por paquete (flat config, ESLint 9.x): `backend/` con
  `@eslint/js` + `typescript-eslint` recommended + `eslint-plugin-import`; `frontend/` con
  `eslint-config-next` (React/hooks/jsx-a11y/imports incluidos) más el resolver de TypeScript para
  el alias `@/*`. Ambos reportan como error el uso de `any` y el orden de imports; `frontend/`
  además prohíbe `dangerouslySetInnerHTML`. Script `lint` en ambos paquetes. Ningún hook de
  pre-commit ni CI — correrlo queda a criterio de cada desarrollador (riesgo aceptado, ver
  `docs/ddw/security/threat-FEAT-004.md`).
- [FEAT-005] Registro de usuario con email y contraseña (sin passkeys): modelo `User` extendido
  (email único + contraseña hasheada con bcrypt cost 12), endpoint público
  `POST /api/auth/register` con validación Zod, formulario de registro en el frontend
  (`/register`) con redirect a `/login` (placeholder sin formulario funcional) tras el alta
  exitosa. Primer paso hacia la autenticación real que reemplazará al usuario semilla; el login
  queda para el ticket siguiente.
- [FEAT-006] Rediseño visual de la pantalla de registro: nuevo layout `AuthLayout` con tarjeta
  centrada de 40% de ancho en desktop (panel de ícono SVG inline + formulario), que colapsa a solo
  formulario centrado por debajo de 640px; renombre de "Contraseña" a "Clave" en labels y mensajes
  de validación; banner visible (fondo/borde) para el error de alta fallida en vez de texto plano;
  tamaño de fuente y espaciado de campos aumentados. Sin cambios de comportamiento ni de backend.
- [FEAT-007] Ajustes visuales sobre la pantalla de registro de FEAT-006: paneles de ícono y
  formulario al 50/50 (antes 40/60), radio de borde de 1rem en tarjeta, inputs, botón y banner,
  ancho fijo del formulario con separación uniforme de 13px y botón "Crear cuenta" centrado, y
  ancho responsive de la tarjeta — 70% del contenedor entre 640px y 1199px, 40% de 1200px en
  adelante, conservando el techo de `max-w-4xl` y el ancho completo por debajo de 640px. El
  breakpoint se declara en `rem` (`min-[75rem]:`) y no en px: Tailwind 4 ordena las variantes
  `min-width` por valor numérico pero no compara unidades distintas, así que declararlo en px lo
  emitiría antes del `40rem` de `sm:` y el 40% nunca se aplicaría (ver `docs/adr/adr-007-*`). Sin
  cambios de comportamiento ni de backend.
- [FEAT-007] Token semántico `--color-overlay` en `globals.css` (con su variante para tema claro) y
  su mapeo `overlay` en `tailwind.config.ts`, consumido por el scrim del indicador de carga.

### Changed

- [FEAT-007] `Loader` pasa a ser un overlay de pantalla completa (`fixed inset-0` con scrim
  semitransparente y `z-[100]`, por encima del `z-50` de `ThemeToggle`) en lugar de un spinner en
  flujo. Es un componente compartido, así que el cambio también alcanza a la pantalla de
  transacciones (`TransactionForm`) — excepción de alcance intencional y confirmada. Queda
  registrada la limitación conocida de que el toggle de tema sigue siendo alcanzable con Tab por
  debajo del scrim: cerrarlo pide `inert` o un focus trap, patrón que el proyecto no usa
  (ver `docs/adr/adr-006-*` y `docs/ddw/security/threat-FEAT-007.md`, R-02).

### Fixed

- [FEAT-003] Vulnerabilidad High de dependencias (`nanoid <3.3.18`, GHSA-2v37-7h3g-55p8) en el
  frontend, corregida vía override de pnpm.
- [FIX-002] Tests de integración del backend fallando por timeout de arranque de `mongod`
  (`mongodb-memory-server`); se sube el `launchTimeout` a 30000ms en `testDatabase.ts`.
