/**
 * @fileoverview Schemas Zod para formularios del frontend (pre-hash).
 *
 * Estos schemas validan la entrada del usuario en el navegador,
 * antes de que se aplique Argon2id.
 * Los schemas de API (loginSchema, registerSchema, etc.) validan el payload
 * post-hash que se envía al servidor.
 */

import { z } from 'zod';

/** Schema de formulario de login (pre-hash). */
export const loginFormSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Ingresa tu contraseña'),
});
export type LoginFormData = z.infer<typeof loginFormSchema>;

/** Schema de formulario de registro (pre-hash). */
export const registerFormSchema = z
    .object({
        fullName: z.string().min(2, 'Ingresa tu nombre completo'),
        email: z.string().email('Email inválido'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        confirmPassword: z.string(),
        acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });
export type RegisterFormData = z.infer<typeof registerFormSchema>;

/** Schema de formulario de restablecimiento de contraseña (pre-hash). */
export const resetPasswordFormSchema = z
    .object({
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

/** Schema de formulario de cambio de contraseña (pre-hash). */
export const changePasswordFormSchema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
        newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmNewPassword'],
    });
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

/** Schema de formulario de cambio obligatorio de contraseña en primer login (pre-hash). */
export const forceChangePasswordFormSchema = z
    .object({
        newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmNewPassword'],
    });
export type ForceChangePasswordFormData = z.infer<typeof forceChangePasswordFormSchema>;
