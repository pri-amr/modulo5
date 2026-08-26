# PRD FEAT-005: Registro de usuario con usuario y contraseña (sin passkeys)

| Field | Value |
|-------|-------|
| Ticket | FEAT-005 |
| Tracker | none |
| Date | 2026-08-25 |
| PRD loops | 0 |
| Loops since last human decision | 0 |

## Context and Problem

Hoy no existe ningún mecanismo real para dar de alta usuarios: el backend resuelve toda petición
contra un usuario semilla fijo (`resolveSeedUser`), documentado como riesgo aceptado (R1) en
`docs/daw/security/threat-FEAT-001.md` hasta que se implemente el ticket de autenticación.

El PRD base (`docs/daw/prd/PRD.md`, RF-01) exige que el usuario elija su método de autenticación al
registrarse, y su nota de implementación establece que la primera etapa de entrega construye la
aplicación completa usando exclusivamente usuario y contraseña, sin passkeys.

Este ticket construye el flujo de alta de cuenta (registro) con email y contraseña: el primer paso
hacia una autenticación real. El login (autenticación con esas credenciales, RF-02–RF-04 del PRD
base) queda fuera de este ticket y se implementa a continuación, una vez que existen cuentas reales
para autenticar.

## Goals

- Permitir que un visitante sin cuenta cree una propia con email y contraseña, sin depender del
  usuario semilla.
- Sentar la base de datos de usuarios (colección `User` con email y contraseña hasheada) sobre la
  que se construirá el login.
- Cumplir el estándar de seguridad de hasheo de contraseñas exigido por el PRD base (RNF-01).

## Functional Requirements

- FR-01: El sistema debe permitir a un visitante sin cuenta crear una cuenta indicando email,
  nombre, contraseña y confirmación de contraseña.
- FR-02: El sistema debe validar que no exista ya una cuenta registrada con el mismo email
  (comparación insensible a mayúsculas/minúsculas) antes de permitir el alta.
- FR-03: El sistema debe validar que el email ingresado tenga un formato de email válido antes de
  permitir el alta.
- FR-04: El sistema debe validar que la contraseña ingresada tenga como mínimo 8 caracteres antes de
  permitir el alta.
- FR-05: El sistema debe validar que el campo "confirmar contraseña" coincida exactamente con el
  campo "contraseña" antes de permitir el alta.
- FR-06: El sistema debe requerir que el email, el nombre, la contraseña y la confirmación de
  contraseña estén completos antes de permitir el alta de la cuenta.
- FR-07: El sistema debe redirigir al visitante a la pantalla de inicio de sesión (`/login`) una vez
  creada la cuenta exitosamente.
- FR-08: El sistema debe mostrar un mensaje de error si el guardado de la cuenta falla tras pasar
  todas las validaciones, sin perder los datos ingresados por el usuario en el formulario.

## Non-Functional Requirements

- NFR-01: El sistema debe hashear la contraseña de la cuenta con bcrypt con un factor de costo ≥ 12
  (o argon2id con parámetros equivalentes o superiores a los recomendados por OWASP) antes de
  almacenarla; la contraseña en texto plano no debe persistirse en ningún medio.

## Acceptance Criteria

- AC-01 (FR-01, FR-07): WHEN un visitante sin cuenta completa el formulario de registro con un email
  con formato válido y no registrado previamente, un nombre, una contraseña de al menos 8 caracteres
  y una confirmación de contraseña idéntica, y confirma el alta, THE sistema SHALL crear la cuenta
  con el email, el nombre y la contraseña hasheada, y redirigir al visitante a la pantalla de login.
- AC-02 (FR-02): IF el email ingresado ya pertenece a una cuenta existente (sin distinguir mayúsculas
  de minúsculas), THEN THE sistema SHALL impedir el alta y mostrar un mensaje indicando que ya existe
  una cuenta registrada con ese email.
- AC-03 (FR-03): IF el email ingresado no tiene un formato de email válido, THEN THE sistema SHALL
  impedir el alta y mostrar un mensaje indicando que el email no es válido.
- AC-04 (FR-04): IF la contraseña ingresada tiene menos de 8 caracteres, THEN THE sistema SHALL
  impedir el alta y mostrar un mensaje indicando que la contraseña debe tener al menos 8 caracteres.
- AC-05 (FR-05): IF el campo "confirmar contraseña" no coincide exactamente con el campo
  "contraseña", THEN THE sistema SHALL impedir el alta y mostrar un mensaje indicando que las
  contraseñas no coinciden.
- AC-06 (FR-06): IF el visitante intenta confirmar el alta sin completar el email, el nombre, la
  contraseña o la confirmación de contraseña, THEN THE sistema SHALL impedir el alta y mostrar un
  mensaje indicando cuál campo obligatorio falta.
- AC-07 (FR-08): IF el guardado de la cuenta falla (por ejemplo, error de red o de base de datos)
  después de que todos los campos pasaron las validaciones, THEN THE sistema SHALL mostrar un
  mensaje de error y mantener los datos ingresados por el visitante en el formulario.

## Out of Scope

- Login / autenticación con las credenciales creadas (RF-02–RF-04 del PRD base): es el ticket
  siguiente. Este ticket solo crea la ruta `/login` como placeholder, sin formulario funcional.
- Login automático (creación de sesión) inmediatamente después de un registro exitoso: el usuario
  recién registrado debe iniciar sesión por separado.
- Passkeys / WebAuthn como método de registro alternativo (se incorporan en una etapa posterior,
  según la nota de implementación del PRD base).
- Verificación de email (envío de mail de confirmación o link de activación): la cuenta queda activa
  de inmediato al registrarse, en línea con la exclusión de notificaciones por email/SMS/push del
  PRD base.
- Recuperación de contraseña ("olvidé mi contraseña").
- Edición de perfil o cambio de contraseña posterior al registro.
- Exigencia de complejidad de contraseña más allá de la longitud mínima (mayúsculas, números,
  símbolos).
- Bloqueo de cuenta o limitación de intentos (rate limiting) sobre el endpoint de registro.
- Panel de administración de usuarios.

## Risks and Mitigations

| Riesgo | Mitigación |
|---|---|
| El riesgo aceptado R1 (`docs/daw/security/threat-FEAT-001.md`): toda petición actúa como el usuario semilla, sin verificación de identidad | Este ticket NO lo cierra: solo agrega el mecanismo de alta de cuentas. El riesgo se cierra cuando el ticket de login reemplace `resolveSeedUser` por sesiones reales. |
| Variantes de mayúsculas/minúsculas en el email podrían burlar la validación de duplicados si la comparación fuera sensible a mayúsculas | FR-02 exige normalizar el email a minúsculas antes de comparar y de almacenar |
| Contraseñas débiles que cumplen la longitud mínima pero son fácilmente adivinables | Riesgo aceptado explícitamente: el PRD base no exige complejidad adicional; queda fuera de alcance (ver Out of Scope) |

## Dependencies

- Modelo `User` existente (`backend/src/domain/entities/User.ts`, `backend/src/infrastructure/models/UserModel.ts`),
  que hoy solo define `name` y deberá extenderse con email y contraseña hasheada.
- Ruta `/login` (placeholder, sin formulario funcional) como destino del redirect de FR-07; el
  ticket de login la reemplaza por la pantalla real.
- RNF-01 y la nota de implementación de RF-01 del PRD base (`docs/daw/prd/PRD.md`).
