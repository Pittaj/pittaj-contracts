/**
 * @fileoverview D4 · Cambiar el perfil de uso del negocio.
 * @module Contracts/Suite
 */

import { z } from 'zod';
import { PERFILES_DE_USO } from '../perfiles.js';

/** PUT /api/suite/perfil — cambiar el perfil desde Configuración. Solo cambia qué se ve. */
export const guardarPerfilDeUsoSchema = z.object({
    perfil: z.enum(PERFILES_DE_USO),
});

export type GuardarPerfilDeUsoRequest = z.infer<typeof guardarPerfilDeUsoSchema>;
