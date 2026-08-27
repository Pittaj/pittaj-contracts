# Trabajo coordinado entre agentes

Aquí trabajamos **varios agentes en paralelo** sobre los mismos repos. Estas reglas existen porque ya
nos hemos tropezado: dos migraciones con el mismo número, un archivo reescrito por los dos a la vez,
un setting renombrado que el otro seguía usando por el nombre viejo.

## Feed de cambios — leer antes, publicar después

La documentación vive en el repo `Pittaj/docs` (se publica en docs.pittaj.com).

**Antes de empezar**, lee `docs/feed/` (últimos días). Es lo que evita el choque.

**Al terminar cada iteración**, crea **un archivo nuevo**:

```
docs/feed/AAAA-MM-DD-HHMM-tema-corto.md
```

Un archivo por entrada, siempre — nunca edites uno ajeno ni anexes al de otro. El protocolo, qué
poner y la plantilla están en `docs/feed/index.md`.

Publica lo que le sirve al de al lado, no lo que hiciste: **números y nombres que tomaste**
(migraciones, rutas, tablas, settings), **archivos calientes que tocaste**, **renombres y borrados**,
**lo que aplicaste a producción** y **las trampas que te comiste**.

## Reglas propias de este repo

Este repo lo consumen backend y frontend por `file:`. Tras cambiarlo hay que **reinstalar** en el
consumidor para que vea lo nuevo; si algo "no compila con lo que acabas de exportar", suele ser eso.

**Un contrato es de las dos plataformas, no de una.** Desde el 2026-08-26 manda
`arquitectura/paridad-de-plataformas.md` (docs): el usuario hace lo mismo esté donde esté, y un
tipo que solo sirve a una punta es trabajo a medias. Ninguna de las cuatro excepciones legítimas
—e.firma/CSD, periféricos, identidad del dispositivo, operador local— se resuelve con un contrato
compartido, así que **en la práctica no hay tipo de este repo que sea «solo web» o «solo
escritorio»**.

> Aquí vivía la regla contraria —«desktop manda → contracts → web»— hasta el 2026-08-27. Describía
> el reparto por dominio que se retiró, y por sí sola llevó a planear un módulo entero como
> solo-nube. Si la ves citada en un spec o en un encabezado de archivo, está muerta: lo que vale es
> el mandato de paridad.

Quien escriba primero da igual; lo que no da igual es que el tipo contemple los dos orígenes. En
concreto: identidad generada en origen (ids sync-ready con `deviceId`), `version` para concurrencia
optimista en lo editable, y las cantidades acumuladas **fuera** del contrato de escritura — se
derivan de sus movimientos (§4 del mandato).

## Compilar y probar es trabajo de Actions

No compiles el proyecto entero ni corras la suite completa en local: **Actions es la autoridad**
sobre si algo compila y pasa (ADR-017). Los fallos que aparecen en local suelen ser del entorno, no
del código, y cuestan media hora de diagnóstico ajeno al problema.

En local, solo lo rápido y acotado: `tsc --noEmit` del paquete tocado y las pruebas **unitarias y
de dominio** del módulo tocado.

Antes de acusar a tu cambio, reproduce el fallo contra la rama base. Si también falla ahí, es
ambiental: repórtalo y sigue.
