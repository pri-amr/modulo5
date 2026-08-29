# ADR-007: El breakpoint de 1200px del ancho de la tarjeta se declara en `rem`, no en `px`

| Field | Value |
|-------|-------|
| Date | 2026-08-29 |
| Ticket | FEAT-007 |
| Status | Accepted |

## Context

FR-12 pide que la tarjeta de registro mida 70% del ancho entre 640px y 1199px, y 40% de 1200px en
adelante. El tramo del 70% se expresa con el prefijo `sm:`, que en Tailwind 4 vale `40rem`. El corte
de 1200px no existe en la escala de breakpoints del proyecto (640/768/1024/1280/1536) y hay que
declararlo.

La redacción obvia, `sm:w-[70%] min-[1200px]:w-[40%]`, **no funciona**. Tailwind 4 ordena las
variantes `min-width` por valor numérico, pero no sabe comparar unidades distintas: `1200px` y
`40rem` no son comparables, así que el bucket de px se emite antes que el de rem. Compilado con el
`tailwindcss` instalado en el proyecto:

```
sm:w-[70%] + min-[1200px]:w-[40%]  ->  @media order: ["1200px", "40rem"]
sm:w-[70%] + min-[75rem]:w-[40%]   ->  @media order: ["40rem",  "75rem"]
```

A partir de 1200px matchean las dos reglas y tienen la misma especificidad (una clase cada una), así
que gana la última emitida. Con la variante en px eso es `sm:w-[70%]`: la tarjeta quedaría al 70% en
todo el rango y el 40% sería letra muerta. El defecto es silencioso — no hay error de compilación,
y un test que verifique presencia de clases pasa en verde igual.

## Options considered

### Option 1: `sm:w-[70%] min-[1200px]:w-[40%]`, la traducción literal de FR-12
- **Pros:** el número del requisito aparece tal cual en el código, sin conversión que revisar.
- **Cons:** no cumple el requisito. Es el caso medido arriba.

### Option 2: Breakpoint nombrado en la config **en px** (`--breakpoint-wide: 1200px` y variante `wide:`)
- **Pros:** da nombre semántico al corte y lo hace reutilizable en otras pantallas.
- **Cons:** **no arregla nada.** Se verificó: declarado en px produce exactamente el mismo orden
  defectuoso. El determinante es la unidad, no si la variante es arbitraria o nombrada — de ahí sale
  la Option 4, que es esta misma idea con la unidad correcta. Además agrega configuración compartida
  para un único consumidor.

### Option 3: `min-[640px]:w-[70%] min-[1200px]:w-[40%]`, ambos tramos en px
- **Pros:** el orden es correcto porque las dos unidades coinciden; los dos números del requisito
  aparecen literalmente.
- **Cons:** desacopla el ancho de la tarjeta del `sm:` que usan los paneles internos del mismo
  componente (`sm:flex`, `sm:w-1/2`). Si alguien tocara la escala de breakpoints, el ancho externo y
  la proporción interna dejarían de anclar al mismo corte sin que nada lo señale.

### Option 4: Breakpoint nombrado **en rem** (`--breakpoint-wide: 75rem` y variante `wide:`)
- **Pros:** el orden es correcto, porque el determinante es la unidad; suma nombre semántico y
  reutilización, que es lo único que la Option 2 aportaba.
- **Cons:** agrega configuración compartida para un único consumidor, y el nombre no dice de qué
  unidad es — quien lo reutilice puede redeclararlo en px sin saber que ahí está el defecto.

### Option 5: Rangos mutuamente excluyentes (`sm:max-[74.99rem]:w-[70%] min-[75rem]:w-[40%]`)
- **Pros:** elimina la clase entera de fragilidad: si las dos media queries nunca matchean a la vez,
  el orden de emisión deja de importar y el footgun desaparece de raíz.
- **Cons:** introduce un `74.99rem` que existe solo para no tocar el borde, y encadena tres
  variantes sobre una clase; es más difícil de leer que el problema que evita.

### Option 6: `sm:w-[70%] min-[75rem]:w-[40%]`
- **Pros:** orden correcto; conserva `sm:` y con él la coherencia con los paneles internos; `75rem`
  son 1200px con el font-size inicial por defecto de 16px.
- **Cons:** el número del requisito no aparece literal, hace falta un comentario que lo explique; y
  el corte pasa a ser relativo al tamaño de fuente del usuario, no exactamente 1200 px CSS.

## Decision

Opción 6. El orden de emisión es correcto, y la coherencia con `sm:` importa: los tres anchos de
`AuthLayout` — panel del ícono, panel de contenido y tarjeta — anclan al mismo corte de 640px, que
es lo que hace que el layout se comporte como una unidad. Se prefiere sobre la Option 4, que también
funciona, porque un breakpoint nombrado para un único consumidor invita a reutilizarlo sin que su
nombre advierta que la unidad es lo que lo hace correcto; y sobre la Option 5 porque el `74.99rem`
cuesta más lectura de la que ahorra.

La consecuencia de que el corte sea relativo a la fuente se acepta a conciencia, y de hecho es
coherente: `sm:` ya es `40rem`, así que toda la pantalla responde igual al zoom por tamaño de fuente.
Un usuario con fuente base más grande ve el salto **más tarde**, en más píxeles CSS — con un
font-size inicial de 20px, `75rem` son 1500px — así que la tarjeta se queda en el 70% durante más
rango. Eso es lo deseable: cuando la fuente es más grande, el contenido necesita más ancho relativo
para respirar, y el tramo ancho es justamente el que se lo da.

Vale precisar el mecanismo, porque es fácil registrarlo al revés: dentro de una `@media`, `rem` se
resuelve contra el font-size **inicial** del navegador, no contra un `font-size` que el proyecto
ponga en `:root`. Que `globals.css` no lo redefina es cierto pero irrelevante al breakpoint — lo
único que mueve el corte es la preferencia de tamaño de fuente del usuario.

El JSX lleva un comentario de una línea explicando por qué `75rem` y no `1200px`. Sin él, el próximo
lector "simplifica" al número del requisito y reintroduce el defecto en silencio — y el comentario
cae dentro de lo que `AGENTS.md` permite, que es explicar un invariante sutil.

Esta decisión se registra por separado y no colgada del precedente de ADR-005 (`rounded-[1rem]`) y
ADR-006 (`z-[100]`). Esos dos son sobre **valores de utilidad**, que no participan del ordenamiento
de variantes; un breakpoint sí. Invocar ese precedente acá fue lo que hizo parecer resuelto un
riesgo que no lo estaba: el spec y el PRD daban por mitigada la elección del valor arbitrario con un
argumento que no aplicaba al caso.

## Consequences

- `frontend/src/components/AuthLayout.tsx`: `auth-layout-card` pasa de `sm:w-[40%]` a
  `sm:w-[70%] min-[75rem]:w-[40%]`, con el comentario del invariante.
- Lo que atrapa la vuelta a px es la aserción **positiva** sobre `min-[75rem]:w-[40%]`, que
  desaparece ante cualquier reemplazo — `min-[1200px]:w-[40%]`, `min-[1200px]:w-2/5`, `xl:w-[40%]`,
  un breakpoint nombrado en px. El test conserva además una aserción negativa sobre la grafía en px,
  como documentación de cuál es el defecto; no es el guard, y su único disparo propio (agregar la px
  conservando la rem) describe un caso que sí se comporta bien.
- El corte real depende del font-size inicial del navegador. Con el valor por defecto de 16px cae en
  1200px, que es lo que pide FR-12; con una fuente base mayor cae más tarde, en más píxeles CSS.
  Aceptado.
- Queda como criterio general del proyecto, aunque ningún mecanismo lo imponga: cuando convivan dos
  variantes `min-width` sobre la misma propiedad, ambas se declaran en la misma unidad. Mezclarlas
  produce un orden de cascada que no se corresponde con el orden numérico aparente.
