/**
 * @fileoverview Visibilidad de la suite: qué apps y módulos ve un negocio.
 * @module Contracts/Suite
 *
 * Tres preguntas distintas, tres respuestas distintas, y se aplican en cadena:
 *
 * - **¿Existe esta app para este negocio?** → visibilidad (esto). Si no, no aparece en ningún
 *   sitio: ni lanzador, ni barra, ni búsqueda; la URL manda al lanzador.
 * - **¿La contrató?** → licencia (`requiredCapability`). Si no, aparece con candado.
 * - **¿Puede esta persona?** → permisos. Si no, ese usuario no la ve.
 *
 * Oculto no es candado: lo que no está en la beta no se anuncia.
 *
 * El modelo es «todo se ve salvo lo apagado»: `apps` y `modulos` solo listan lo que va en `false`
 * (y, por claridad al editar, lo que se volvió a encender en `true`). Una clave ausente se ve.
 * Así el catálogo puede crecer sin que cada tenant tenga que enterarse.
 *
 * Dos niveles: el **predeterminado de la plataforma** (lo que ve un negocio nuevo) y el
 * **override por tenant** (`modo: 'personalizado'`), que lo sustituye entero — no se mezclan, para
 * que lo que ve un tenant sea siempre UNA lista que se puede leer en el backoffice sin calcular.
 */

import { z } from 'zod';
import { APP_IDS, CLAVES_DE_MODULO } from '../catalogo.js';

const ERROR_MESSAGES = {
    APP_DESCONOCIDA: 'App desconocida',
    MODULO_DESCONOCIDO: 'Módulo desconocido',
} as const;

const appsSchema = z
    .record(z.string(), z.boolean())
    .refine((r) => Object.keys(r).every((k) => (APP_IDS as readonly string[]).includes(k)), {
        message: ERROR_MESSAGES.APP_DESCONOCIDA,
    });

const modulosSchema = z
    .record(z.string(), z.boolean())
    .refine((r) => Object.keys(r).every((k) => CLAVES_DE_MODULO.includes(k)), {
        message: ERROR_MESSAGES.MODULO_DESCONOCIDO,
    });

/** Una lista de visibilidad: qué apps y qué módulos (`<appId>/<ruta>`) van apagados. */
export const visibilidadSchema = z
    .object({
        apps: appsSchema.default({}),
        modulos: modulosSchema.default({}),
    })
    .strict();

export type Visibilidad = z.infer<typeof visibilidadSchema>;

/** PUT /api/admin/suite/visibilidad — el predeterminado de la plataforma. */
export const guardarVisibilidadPredeterminadaSchema = visibilidadSchema;

/** PUT /api/admin/tenants/:id/suite/visibilidad — el override de un tenant. */
export const guardarVisibilidadDeTenantSchema = z
    .object({
        /** `predeterminado` = sigue a la plataforma (se ignoran apps/modulos); `personalizado` = su propia lista. */
        modo: z.enum(['predeterminado', 'personalizado']),
        apps: appsSchema.default({}),
        modulos: modulosSchema.default({}),
    })
    .strict();

export type GuardarVisibilidadDeTenantRequest = z.infer<typeof guardarVisibilidadDeTenantSchema>;

export const SUITE_VISIBILIDAD_ERROR_MESSAGES = ERROR_MESSAGES;
