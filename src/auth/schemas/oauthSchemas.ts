/**
 * @fileoverview Schemas de validación Zod para rutas OAuth.
 * @module Auth/Infrastructure/Api/Schemas
 */

import { z } from 'zod';

/** Proveedores OAuth soportados. */
const SUPPORTED_PROVIDERS = ['google', 'microsoft'] as const;

/** Schema para parámetros de ruta de OAuth initiate (:provider). */
export const oauthInitiateParamSchema = z.object({
    provider: z.enum(SUPPORTED_PROVIDERS, {
        errorMap: () => ({ message: 'Proveedor OAuth no soportado. Use: google o microsoft' }),
    }),
});

/** Schema para query params de OAuth initiate (?redirect=URL). */
export const oauthInitiateQuerySchema = z.object({
    redirect: z
        .string()
        .url('URL de redirect inválida')
        .min(1, 'URL de redirect es requerida'),
});

/** Schema para query params del callback OAuth. */
export const oauthCallbackQuerySchema = z.object({
    code: z.string().min(1, 'Authorization code es requerido'),
    state: z.string().min(1, 'State es requerido'),
});
