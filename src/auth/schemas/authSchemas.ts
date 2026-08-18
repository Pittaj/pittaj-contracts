/**
 * @fileoverview Schemas de validación Zod para rutas de Auth
 * @module Auth/Infrastructure/Api/Routes
 */

import { z } from 'zod';

/** Schema para login (el cliente envía Argon2id pre-hash). */
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    clientHash: z.string().length(64, 'clientHash debe ser un hash hex de 64 caracteres'),
    deviceId: z.string().uuid().optional(),
});

/** Schema para registro (el cliente envía Argon2id pre-hash + salt). */
export const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    clientHash: z.string().length(64, 'clientHash debe ser un hash hex de 64 caracteres'),
    salt: z.string().length(32, 'salt debe ser hex de 32 caracteres (16 bytes)'),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    fullName: z.string().min(1).max(200).optional(),
    tenantId: z.string().uuid().optional(),
});

/** Schema para logout. */
export const logoutSchema = z.object({
    allSessions: z.boolean().optional().default(false),
});

/** Schema para solicitud de password reset. */
export const passwordResetRequestSchema = z.object({
    email: z.string().email('Email inválido'),
});

/** Schema para confirmación de password reset (pre-hash del cliente). */
export const passwordResetConfirmSchema = z.object({
    token: z.string().min(1, 'Token es requerido'),
    clientHash: z.string().length(64, 'clientHash debe ser un hash hex de 64 caracteres'),
    salt: z.string().length(32, 'salt debe ser hex de 32 caracteres (16 bytes)'),
});

/** Schema para verificación de email. */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Token de verificación requerido'),
});

/** Schema para reenvío de verificación. */
export const resendVerificationSchema = z.object({
    email: z.string().email('Email inválido'),
});

/** Schema para cambio de contraseña (el cliente envía Argon2id pre-hash). */
export const changePasswordSchema = z.object({
    currentClientHash: z.string().length(64, 'currentClientHash debe ser un hash hex de 64 caracteres'),
    newClientHash: z.string().length(64, 'newClientHash debe ser un hash hex de 64 caracteres'),
    newSalt: z.string().length(32, 'newSalt debe ser hex de 32 caracteres (16 bytes)'),
});

/** Schema para verificar credenciales de un supervisor (autorización puntual, sin crear sesión). */
export const verifyCredentialsSchema = z.object({
    email: z.string().email('Email inválido'),
    clientHash: z.string().length(64, 'clientHash debe ser un hash hex de 64 caracteres'),
    /** Permiso requerido; si se envía, el usuario verificado debe poseerlo. */
    permission: z.string().max(120).optional(),
});


/** Schema para revocar una sesión específica. */
export const revokeSessionSchema = z.object({
    sessionId: z.string().uuid('ID de sesión inválido'),
});

/** Schema para validar :sessionId en path params. */
export const sessionIdParamSchema = z.object({
    sessionId: z.string().uuid('El sessionId debe ser un UUID válido'),
});

/**
 * Generar un código para vincular una caja.
 *
 * La identidad NO viaja aquí: sale del token. Aceptarla del cuerpo sería
 * dejar que cualquiera con sesión emita códigos a nombre de otro.
 */
export const createDeviceLinkCodeSchema = z.object({
    locationId: z.string().uuid('La sucursal no es válida').optional(),
    deviceName: z.string().max(120, 'El nombre del equipo es muy largo').optional(),
    origin: z.enum(['browser', 'panel']).optional(),
});

/** Canjear el código desde la caja. Público: el código ES la credencial. */
export const redeemDeviceLinkCodeSchema = z.object({
    // Se acepta con guiones, espacios y en minúsculas: el usuario lo teclea a
    // mano, muchas veces dictado por teléfono. La normalización va en el dominio.
    code: z.string().min(8, 'El código está incompleto').max(20, 'El código es muy largo'),
    deviceId: z.string().min(1, 'Falta el identificador del equipo').max(64),
    deviceName: z.string().max(120).optional(),
});
