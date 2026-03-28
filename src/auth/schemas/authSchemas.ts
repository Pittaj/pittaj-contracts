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
