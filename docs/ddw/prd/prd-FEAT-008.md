# PRD FEAT-008: Login con usuario y contraseña (sin passkeys), con el mismo diseño que la pantalla de registro

| Field | Value |
|-------|-------|
| Ticket | FEAT-008 |
| Tracker | none |
| Date | 2026-08-31 |
| PRD loops | 1 |
| Loops since last human decision | 0 |

## Context and Problem

FEAT-005 entregó el registro de usuarios: hoy existe una cuenta con `name`, `email` y
`passwordHash` (bcrypt, factor 12), un repositorio con `findByEmail()` y una pantalla de alta que,
al crear la cuenta, redirige a `/login`. Ahí el circuito se corta: `frontend/src/app/login/page.tsx`
es un placeholder que dice "El inicio de sesión estará disponible próximamente", y no existe ningún
endpoint de autenticación ni mecanismo de sesión.

La consecuencia no es sólo que no se pueda entrar. Las rutas de transacciones se autentican con
`backend/src/presentation/middlewares/resolveSeedUser.ts`, un stub que resuelve **siempre** al
usuario semilla, sin importar quién haga la petición. Está declarado como riesgo aceptado R1 en el
threat model de FEAT-005 y su propio comentario dice que "se reemplaza por autenticación real en
otro ticket". Mientras ese stub esté en pie, cualquiera que abra la aplicación opera sobre los datos
del usuario semilla: una cuenta recién registrada no tiene forma de ver ni de crear nada propio, y
RNF-10 del PRD del producto (aislamiento de datos entre usuarios) no se cumple.

Este ticket cierra ese hueco: construye la autenticación real con email y clave, establece la
sesión, protege la ruta de la aplicación, agrega el control para cerrar sesión y retira el stub.
Las passkeys quedan fuera, según la nota de orden de entrega de RF-01–RF-07 del PRD del producto
(`docs/daw/prd/PRD.md`), que manda construir toda la aplicación con usuario y contraseña primero.

## Goals

- Que un usuario registrado pueda entrar a la aplicación con su email y su clave, y que la sesión
  sobreviva a recargar la página.
- Que la pantalla de login sea visualmente indistinguible de la de registro en layout, tipografía,
  espaciado y tratamiento de errores: para el usuario son dos caras de la misma puerta.
- Que la aplicación deje de ser accesible sin autenticarse, y que las transacciones dejen de
  atribuirse al usuario semilla (cierre del riesgo R1 de FEAT-005).
- Que un usuario pueda salir de su sesión sin recurrir a borrar cookies a mano.
- Que un intento fallido de login no revele si el email existe en el sistema.

## Functional Requirements

- FR-01: El sistema debe mostrar en `/login` una pantalla con el mismo layout de tarjeta centrada
  que la pantalla de registro (columna izquierda con el ícono, oculta por debajo de 640px de ancho;
  columna derecha con el título y el formulario), con el título "Iniciar sesión" y un formulario de
  dos campos etiquetados "Email" y "Clave".
- FR-02: El sistema debe aplicar a la pantalla de login los mismos tratamientos visuales que a la de
  registro: labels a 16px, texto de inputs a 18px, 13px de espaciado vertical entre campos
  consecutivos, borde redondeado de 1rem en inputs y en el botón de envío, y el botón de envío
  centrado horizontalmente.
- FR-03: El sistema debe validar en el cliente, antes de enviar la petición, que el email esté
  presente y tenga formato de email y que la clave esté presente; si alguna validación no se
  cumple, debe mostrar el mensaje debajo del campo correspondiente y no debe enviar la petición.
- FR-04: El sistema debe deshabilitar el botón de envío y mostrar el indicador de carga mientras la
  petición de autenticación está en curso.
- FR-05: El sistema debe verificar las credenciales recibidas comparando la clave ingresada contra
  el hash almacenado de la cuenta cuyo email coincide con el ingresado.
- FR-06: El sistema debe responder con el mismo mensaje de error, "Email o clave incorrectos", tanto
  cuando el email ingresado no corresponde a ninguna cuenta como cuando la clave no coincide con la
  de la cuenta.
- FR-07: El sistema debe mostrar el mensaje de error de autenticación fallida dentro del mismo
  banner de alerta que usa la pantalla de registro (fondo, borde y padding en el color de error), y
  debe dejar el formulario habilitado para que el usuario reintente sin recargar la página.
- FR-08: El sistema debe establecer, al verificar correctamente las credenciales, una sesión con una
  duración fija de 7 días contados desde ese momento, que se conserve al recargar la página y al
  navegar entre rutas.
- FR-09: El sistema debe redirigir al usuario a `/` inmediatamente después de una autenticación
  exitosa.
- FR-10: El sistema debe redirigir a `/login` a todo visitante de `/` que no presente una sesión
  válida.
- FR-11: El sistema debe tratar una sesión cuya duración de 7 días ya venció exactamente igual que a
  la ausencia de sesión.
- FR-12: El sistema debe mostrar un control "Cerrar sesión" agrupado con el control de cambio de
  tema dentro de un contenedor común fijo en el extremo superior derecho de la ventana, con
  separación uniforme entre ambos controles, y únicamente cuando hay una sesión válida.
- FR-13: El sistema debe conservar la posición actual del control de cambio de tema (extremo
  superior derecho) cuando no hay sesión válida y el contenedor común contiene sólo ese control.
- FR-14: El sistema debe renderizar el control "Cerrar sesión" con el fondo de la superficie de la
  página y el borde y el texto en el color de error del proyecto, e invertir ese tratamiento cuando
  el puntero está sobre el control: fondo en el color de error y texto en blanco.
- FR-15: El sistema debe eliminar la sesión y redirigir a `/login` cuando el usuario activa el
  control "Cerrar sesión".
- FR-16: El sistema debe atribuir toda transacción creada al usuario de la sesión que envía la
  petición, y no al usuario semilla.
- FR-17: El sistema debe rechazar con estado HTTP 401 toda petición a las rutas de transacciones que
  no presente una sesión válida.
- FR-18: El sistema debe redirigir a `/` a todo visitante que acceda directamente a `/login`
  presentando una sesión válida, sin mostrarle el formulario de login.

## Non-Functional Requirements

- NFR-01: El identificador de sesión debe viajar en una cookie marcada `HttpOnly` y `SameSite` en
  `Lax` o más estricto, con una vigencia máxima de 7 días, de modo que no sea legible desde el
  JavaScript de la página.
- NFR-02: La verificación de la clave debe usar bcrypt con factor de costo ≥ 12, el mismo valor
  exigido por NFR-01 de FEAT-005 y por RNF-01 del PRD del producto.
- NFR-03: La respuesta del endpoint de autenticación no debe incluir el hash de la clave ni ningún
  campo de la cuenta fuera de exactamente 3: identificador, nombre y email.

## Acceptance Criteria

- AC-01 (FR-01): WHEN un usuario visita `/login` en un viewport de 640px de ancho o más, THE sistema
  SHALL mostrar una tarjeta centrada con el ícono en la columna izquierda y el título "Iniciar
  sesión" más un formulario de dos campos, "Email" y "Clave", en la columna derecha.
- AC-02 (FR-01): WHEN un usuario visita `/login` en un viewport de menos de 640px de ancho, THE
  sistema SHALL ocultar la columna del ícono y mostrar únicamente el título y el formulario
  centrados.
- AC-03 (FR-02): WHEN la pantalla de login se renderiza, THE sistema SHALL aplicar 16px a los
  labels, 18px al texto de los inputs, 13px de espaciado vertical entre campos consecutivos, borde
  redondeado de 1rem en inputs y botón, y centrar horizontalmente el botón de envío.
- AC-04 (FR-03): IF el usuario envía el formulario con el email vacío, con un email de formato
  inválido, o con la clave vacía, THEN THE sistema SHALL mostrar el mensaje de validación debajo del
  campo correspondiente y SHALL NOT enviar la petición de autenticación.
- AC-05 (FR-04): WHILE la petición de autenticación está en curso, THE sistema SHALL mantener
  deshabilitado el botón de envío y visible el indicador de carga.
- AC-06 (FR-05, FR-09): WHEN un usuario registrado envía su email y su clave correctos, THE sistema
  SHALL verificar la clave contra el hash almacenado de esa cuenta y SHALL redirigirlo a `/`.
- AC-07 (FR-06, FR-07): IF el email enviado no corresponde a ninguna cuenta, o la clave enviada no
  coincide con la de la cuenta, THEN THE sistema SHALL mostrar el mensaje "Email o clave
  incorrectos" —el mismo texto en ambos casos— dentro del banner de alerta, SHALL dejar el
  formulario habilitado para reintentar, y SHALL NOT redirigir a `/`.
- AC-08 (FR-08): WHEN un usuario se autentica correctamente y luego recarga la página o navega a
  otra ruta, THE sistema SHALL conservar su sesión sin volver a pedirle las credenciales, durante
  los 7 días siguientes al login.
- AC-09 (FR-10): IF un visitante sin sesión válida accede a `/`, THEN THE sistema SHALL redirigirlo
  a `/login` sin renderizar el contenido de `/`.
- AC-10 (FR-11): IF un visitante accede a `/` presentando una sesión establecida hace más de 7 días,
  THEN THE sistema SHALL redirigirlo a `/login` igual que a un visitante sin sesión.
- AC-11 (FR-12, FR-13): WHILE hay una sesión válida, THE sistema SHALL mostrar el control "Cerrar
  sesión" junto al control de cambio de tema en un contenedor común fijo en el extremo superior
  derecho; WHILE no hay sesión válida, THE sistema SHALL mostrar en ese contenedor únicamente el
  control de cambio de tema, en el extremo superior derecho.
- AC-12 (FR-14): WHEN el puntero se posiciona sobre el control "Cerrar sesión", THE sistema SHALL
  cambiar su fondo al color de error y su texto a blanco, partiendo del estado de reposo con fondo
  de superficie y borde y texto en el color de error.
- AC-13 (FR-15): WHEN el usuario activa el control "Cerrar sesión", THE sistema SHALL eliminar la
  sesión y SHALL redirigirlo a `/login`, de modo que un acceso posterior a `/` vuelva a redirigir a
  `/login`.
- AC-14 (FR-16): WHEN un usuario autenticado crea una transacción, THE sistema SHALL asociarla al
  identificador de la cuenta de su sesión, y no al del usuario semilla.
- AC-15 (FR-17): IF una petición a una ruta de transacciones no presenta una sesión válida, THEN THE
  sistema SHALL responder con estado HTTP 401 y SHALL NOT crear ni devolver ninguna transacción.
- AC-19 (FR-18): WHEN un usuario con sesión válida accede directamente a `/login`, THE sistema SHALL
  redirigirlo a `/` sin mostrarle el formulario de login.
- AC-16 (NFR-01): WHEN el sistema establece la sesión, THE sistema SHALL emitir la cookie de sesión
  marcada `HttpOnly` y con `SameSite` en `Lax` o más estricto, con una vigencia máxima de 7 días.
- AC-17 (NFR-02): THE sistema SHALL verificar la clave con bcrypt usando un factor de costo mayor o
  igual a 12.
- AC-18 (NFR-03): WHEN la autenticación es exitosa, THE cuerpo de la respuesta del endpoint de
  autenticación SHALL contener exactamente 3 campos de la cuenta —identificador, nombre y email— y
  SHALL NOT contener el hash de la clave.

## Out of Scope

- Passkeys / WebAuthn (RF-01, RF-02, RF-05–RF-07 del PRD del producto): la nota de orden de entrega
  de ese PRD manda construir toda la aplicación con usuario y contraseña primero, y agregar passkeys
  al final. Este ticket es exclusivamente el método de usuario y contraseña.
- Recuperación de clave olvidada y cambio de clave: no hay flujo de recuperación en v1 (ver
  "Fuera de alcance" del PRD del producto).
- Limitación de intentos de login (rate limiting, bloqueo de cuenta tras N fallos): queda registrado
  como riesgo R1 de este PRD, con ticket propio. Este ticket no lo implementa.
- Renovación de la sesión por uso: la duración es fija desde el login (FR-08), no se reinicia con la
  actividad.
- Recordar la URL que el visitante quiso abrir para devolverlo ahí después del login: la
  redirección post-login es siempre a `/` (FR-09).
- Un dashboard nuevo: RF-03 del PRD del producto habla de "dashboard", pero la ruta `/` de hoy es el
  formulario de transacciones y este ticket no la rediseña, sólo la protege.
- Cambios visuales a la pantalla de registro: este ticket copia su diseño, no lo modifica.
- Migrar las transacciones que hoy pertenecen al usuario semilla a alguna cuenta real: quedan donde
  están (ver supuesto S2).
- Gestión de perfil, listado de sesiones activas, o cierre de sesión en otros dispositivos.

## Supuestos declarados

Ninguno de los dos fue enunciado por el usuario. Se documentan acá en vez de resolverse en silencio;
si alguno es incorrecto, cambia el alcance.

- S1: El control "Cerrar sesión" no se renderiza en `/login` ni en `/register`, porque en esas
  pantallas no hay sesión que cerrar. Es lo que FR-12 formaliza con "únicamente cuando hay una
  sesión válida".
- S2: Las transacciones semilla existentes siguen perteneciendo al usuario semilla. Al retirar el
  stub (FR-16), una cuenta recién registrada arranca sin ninguna transacción visible.

## Risks and Mitigations

| Riesgo | Mitigación |
|---|---|
| R1 · Sin limitación de intentos, el endpoint de autenticación queda expuesto a fuerza bruta sobre las claves de cuentas existentes | Declarado fuera de alcance de forma explícita, no omitido. El factor de costo 12 de bcrypt (NFR-02) impone un piso de tiempo por intento que encarece el ataque, y el mensaje genérico (FR-06) impide descubrir qué emails existen. La limitación de intentos se trata en un ticket propio; el threat model de PLAN debe registrarla como riesgo aceptado con esa condición |
| R2 · `AGENTS.md` declara `next-auth 4 para sesiones del frontend` en su sección Stack, pero next-auth no está instalado en `frontend/package.json`, y el backend es Express con sesión propia. Elegir mal el mecanismo obliga a rehacer la sesión entera | La decisión del mecanismo es de PLAN, no de este PRD: los requisitos de sesión están escritos en términos de comportamiento observable (duración, `HttpOnly`, supervivencia al refresh) para que cualquiera de las dos opciones pueda satisfacerlos. PLAN debe resolverlo con un ADR y, si se aparta de lo que declara `AGENTS.md`, actualizar esa línea |
| R3 · Retirar `resolveSeedUser` (FR-16) toca el módulo de transacciones, que hoy tiene tests que dependen del usuario semilla | El servicio de transacciones ya recibe `userId` como parámetro explícito, precisamente para que este reemplazo no lo toque; el cambio se concentra en el middleware y en las rutas. Los tests de integración que asumen el usuario semilla deben pasar a autenticarse, y eso se planifica como parte del bloque, no como daño colateral |
| R4 · Proteger `/` con redirección puede dejar al usuario en un rebote infinito si la verificación de sesión falla en la propia `/login` | `/login` y `/register` quedan explícitamente fuera de la protección (FR-10 nombra sólo `/`), y AC-09 exige que la redirección ocurra sin renderizar `/` |
| R5 · La cookie `HttpOnly` (NFR-01) no es legible por el JavaScript del frontend, así que la pantalla no puede saber por sí sola si hay sesión para decidir si muestra el control "Cerrar sesión" (FR-12) | El estado de sesión debe llegar al frontend por un canal que no sea leer la cookie; cómo se resuelve es decisión de PLAN. El requisito acá es sólo que el control aparezca cuando hay sesión y no cuando no la hay |

## Dependencies

- **FEAT-005 (registro de usuario con email y clave)**, ya mergeado a `dev`: FR-05 y NFR-02 dependen
  de que la entidad `User` tenga `passwordHash` generado con bcrypt factor 12
  (`backend/src/common/constants/security.ts`) y de que `IUserRepository.findByEmail()` exista.
- **FEAT-006 y FEAT-007 (rediseño de la pantalla de registro)**, ya mergeados a `dev`: FR-01, FR-02 y
  FR-07 dependen de `AuthLayout`, `FormField` (con `labelSize`) y del banner de alerta y el `Loader`
  usados hoy por `RegisterForm`.
- **Módulo de transacciones** (`backend/src/presentation/routes/transaction.routes.ts`,
  `resolveSeedUser.ts`, `CreateTransactionService`): FR-16 y FR-17 lo modifican para que use el
  usuario autenticado. Cierra el riesgo aceptado R1 del threat model de FEAT-005.
- **Control de cambio de tema** (`frontend/src/components/ThemeToggle.tsx`, montado en el layout
  raíz): FR-12 y FR-13 lo agrupan con el control nuevo en un contenedor común, lo que cambia dónde
  se monta.
- **Tokens de color** definidos en `frontend/src/app/globals.css` (`--color-error`, `--color-surface`,
  `--color-bg`, `--color-fg`): FR-14 los reutiliza, no agrega ninguno.
- **PRD del producto** (`docs/daw/prd/PRD.md`): RF-02, RF-03 y RF-04 (autenticación con el método
  elegido, redirección tras el login, error con reintento), AC-01 y AC-02, RNF-01 (bcrypt ≥ 12) y
  RNF-10 (aislamiento de datos entre usuarios).
