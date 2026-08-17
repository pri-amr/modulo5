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

### Fixed

- [FEAT-003] Vulnerabilidad High de dependencias (`nanoid <3.3.18`, GHSA-2v37-7h3g-55p8) en el
  frontend, corregida vía override de pnpm.
