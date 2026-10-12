/**
 * @fileoverview Acceso a la web de un usuario creado desde Organización → Usuarios.
 *
 * El login de la web nunca manda la contraseña: el cliente deriva `clientHash = Argon2id(password,
 * salt)` y el servidor guarda `SHA-256(clientHash)` (ver `ui-auth/lib/crypto.ts` y
 * `Sha256PasswordHasher`). Para que la persona que el dueño da de alta pueda entrar con esa misma
 * contraseña, quien la captura deriva el par igual que el registro y lo manda aquí. Sin esto el
 * usuario existía en `users` pero no en `auth_identities`, y el login le respondía «credenciales
 * inválidas» para siempre.
 *
 * @module Contracts/User
 */

import { z } from 'zod';

export const accesoWebSchema = z.object({
    /** Salt de 16 bytes en hex (el mismo formato que `generateSalt` del cliente). */
    salt: z.string().regex(/^[0-9a-f]{32}$/i, 'Salt inválido'),
    /** Argon2id(password, salt) en hex, 32 bytes. */
    clientHash: z.string().regex(/^[0-9a-f]{64}$/i, 'Hash inválido'),
});

export type AccesoWebInput = z.infer<typeof accesoWebSchema>;
