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
