/**
 * @fileoverview Zod schema del alta, la edición y el archivado de una cuenta.
 * @module Contracts/Accounting
 *
 * Existían los tres endpoints y **ninguna validación**: los controladores leían el cuerpo con un
 * `as` y lo pasaban tal cual al dominio. Un campo mal tecleado llegaba como `undefined` y el
 * error que salía hablaba de otra cosa —o de nada—, así que había que leer código para saber qué
 * faltaba.
 *
 * **El catálogo no se borra, se archiva.** Una cuenta con partidas no se puede eliminar sin dejar
 * pólizas apuntando al vacío; archivarla la saca de los selectores y conserva su historial y su
 * saldo. Por eso aquí hay un `active: boolean` y no un `delete`.
 */

import { z } from 'zod';

/** De qué lado suma la cuenta. `D`/`A` del XML de catálogo del Anexo 24. */
export const ACCOUNT_NATURES = ['DEUDORA', 'ACREEDORA'] as const;
export type AccountNatureValue = (typeof ACCOUNT_NATURES)[number];

/**
 * El código es la llave con la que un contador reconoce la cuenta y el que va al XML del SAT.
 * Se aceptan dígitos, puntos y guiones —`102-01`, `102.01`, `1102`— porque las tres formas están
 * en uso y ninguna es más correcta que las otras; lo que no se acepta es texto libre.
 */
const codigo = z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(30, 'El código no puede pasar de 30 caracteres')
    .regex(/^[0-9][0-9.\-]*$/, 'El código empieza con un dígito y solo lleva dígitos, puntos o guiones');

const nombre = z
    .string()
    .trim()
    .min(2, 'El nombre es obligatorio')
    .max(200, 'El nombre no puede pasar de 200 caracteres');

/**
 * El agrupador del SAT. Se deja en texto y no en catálogo cerrado porque el `c_CodAgrup` cambia
 * cuando el SAT publica una versión nueva del Anexo 24, y una lista fija aquí obligaría a
 * desplegar el contrato para poder capturar una cuenta.
 */
const agrupador = z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9]+(\.[0-9]+)*$/, 'El código agrupador va en formato 102.01')
    .nullable()
    .optional();

/** Body de POST /companies/:companyId/chart/accounts. */
export const createLedgerAccountSchema = z.object({
    code: codigo,
    name: nombre,
    /** `null` = cuenta de mayor, sin padre. */
    parentId: z.string().uuid('El padre debe ser un UUID').nullable().optional(),
    /** Si no viene, se hereda del padre. Mandarla contra la del padre es lo que la invierte. */
    nature: z.enum(ACCOUNT_NATURES).optional(),
    satGroupingCode: agrupador,
});

export type CreateLedgerAccountBody = z.infer<typeof createLedgerAccountSchema>;

/**
 * Body de PATCH /chart/accounts/:id.
 *
 * Todo opcional —es un PATCH— pero **algo tiene que venir**: un cuerpo vacío que devuelve 200 sin
 * cambiar nada es un guardado que parece que funcionó.
 */
export const updateLedgerAccountSchema = z
    .object({
        code: codigo.optional(),
        name: nombre.optional(),
        nature: z.enum(ACCOUNT_NATURES).optional(),
        satGroupingCode: agrupador,
    })
    .refine((b) => Object.values(b).some((v) => v !== undefined), {
        message: 'No hay nada que cambiar',
    });

export type UpdateLedgerAccountBody = z.infer<typeof updateLedgerAccountSchema>;

/** Body de POST /chart/accounts/:id/status. `false` archiva. */
export const setLedgerAccountStatusSchema = z.object({
    active: z.boolean(),
});

export type SetLedgerAccountStatusBody = z.infer<typeof setLedgerAccountStatusSchema>;
