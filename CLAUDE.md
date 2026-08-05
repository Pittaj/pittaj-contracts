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

Los contratos siguen a la implementación **del escritorio**: desktop manda → contracts → web.

## Compilar y probar es trabajo de Actions

No compiles el proyecto entero ni corras la suite completa en local: **Actions es la autoridad**
sobre si algo compila y pasa (ADR-016). Los fallos que aparecen en local suelen ser del entorno, no
del código, y cuestan media hora de diagnóstico ajeno al problema.

En local, solo lo rápido y acotado: `tsc --noEmit` del paquete tocado y las pruebas **unitarias y
de dominio** del módulo tocado.

Antes de acusar a tu cambio, reproduce el fallo contra la rama base. Si también falla ahí, es
ambiental: repórtalo y sigue.
