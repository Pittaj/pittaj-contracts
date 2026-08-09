/**
 * @fileoverview Zod schema del alta, la edición y la baja de un activo fijo.
 * @module Contracts/Accounting
 *
 * ## Por qué el tipo es un enum cerrado y la tasa no
 *
 * El **tipo** determina las cinco cuentas contra las que postea el activo
 * (activo, depreciación acumulada, gasto del mes, pérdida y ganancia en venta) y
 * el agrupador del SAT de cada una. Un tipo libre sería una cuenta inventada, y
 * un agrupador inventado **no invalida esa cuenta: invalida el XML entero**.
 *
 * La **tasa** sí es libre dentro de un rango, porque la LISR art. 31 dice que
 * *«el contribuyente podrá aplicar por cientos menores a los autorizados»*. Lo
 * que no puede es aplicar mayores — de ahí el tope de la validación.
 *
 * ## El terreno tiene tasa cero y no es un error de captura
 *
 * Un terreno no se demerita por el uso ni por el tiempo, así que la LISR no le da
 * tasa y el catálogo del SAT no tiene ningún `171.xx` de terrenos. Por eso el
 * mínimo es `0` y no un positivo: **el cero es un valor legítimo y sólo para
 * este tipo**, lo que la API comprueba al dar de alta.
 */

import { z } from 'zod';

/**
 * Los tipos de activo. **Espejo exacto de `FIXED_ASSET_TYPES` del backend**: de
 * cada uno cuelgan cinco cuentas con sus agrupadores oficiales, así que añadir
 * uno aquí sin añadirlo allá da un 400 y no una cuenta nueva.
 */
export const FIXED_ASSET_TYPES = [
    'STORE_EQUIPMENT',
    'COMPUTER',
    'VEHICLE',
    'MACHINERY',
    'LEASEHOLD_IMPROVEMENT',
    'BUILDING',
    'LAND',
] as const;
export type FixedAssetTypeValue = (typeof FIXED_ASSET_TYPES)[number];

/** Estado del activo. `FULLY_DEPRECIATED` lo pone el sistema, no una persona. */
export const FIXED_ASSET_STATUSES = ['ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED'] as const;
export type FixedAssetStatusValue = (typeof FIXED_ASSET_STATUSES)[number];

/**
 * Cómo se va el activo, y **no es la misma etiqueta con distinto nombre**: el
 * desecho deja un peso sin deducir en los registros (LISR art. 31) y la venta
 * saca el activo completo.
 */
export const DISPOSAL_KINDS = ['SALE', 'SCRAP'] as const;
export type DisposalKindValue = (typeof DISPOSAL_KINDS)[number];

/** `YYYY-MM-DD`. Se valida la forma aquí para que el 400 diga qué campo es. */
const fecha = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha va en formato AAAA-MM-DD');

/**
 * El monto original de la inversión. **No es «lo que costó»**: la LISR art. 31
 * mete dentro los fletes, la preparación del sitio, la instalación y el montaje,
 * y deja fuera el IVA.
 */
const moi = z
    .number()
    .positive('El monto original de la inversión tiene que ser mayor que cero')
    .max(999_999_999, 'El monto original de la inversión es demasiado grande');

/**
 * Tasa anual en tanto por uno. `0.30` = 30 %.
 *
 * El tope es `1` porque depreciar más del 100 % anual no significa nada, y hay
 * tasas legítimas de exactamente `1`: la LISR da **100 %** a las adaptaciones
 * para personas con discapacidad (art. 34 fr. XII) y a los semovientes (fr. IX).
 */
const tasa = z
    .number()
    .min(0, 'La tasa no puede ser negativa')
    .max(1, 'La tasa no puede pasar del 100 % anual');

export const createFixedAssetSchema = z.object({
    companyId: z.string().uuid('La empresa es obligatoria'),
    name: z
        .string()
        .trim()
        .min(2, 'El nombre es obligatorio')
        .max(200, 'El nombre no puede pasar de 200 caracteres'),
    description: z.string().trim().max(500).optional(),
    assetType: z.enum(FIXED_ASSET_TYPES, {
        errorMap: () => ({ message: 'El tipo de activo no es uno de los conocidos' }),
    }),
    moi,
    /** Si no viene, el backend pone la de la LISR para ese tipo. */
    annualRate: tasa.optional(),
    acquisitionDate: fecha,
    /**
     * Si no viene, se asume que empezó a usarse el día que se compró, que es lo
     * normal. Cuando no lo es —comprado en diciembre, abierto en enero— importa
     * mucho, porque de esta fecha depende el primer mes que deprecia.
     */
    inServiceDate: fecha.optional(),
    purchaseCfdiUuid: z.string().trim().max(50).optional(),
    locationId: z.string().uuid().optional(),
});

export type CreateFixedAssetRequest = z.infer<typeof createFixedAssetSchema>;

/**
 * La edición **no deja tocar el tipo**, y es a propósito: el tipo determina las
 * cuentas, así que cambiarlo con pólizas ya asentadas dejaría la depreciación de
 * unos meses en una cuenta y la de los siguientes en otra, con la acumulada
 * repartida entre dos sitios y el activo cuadrando igual. Si el tipo estaba mal,
 * se da de baja y se vuelve a dar de alta.
 */
export const updateFixedAssetSchema = z.object({
    name: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    moi: moi.optional(),
    annualRate: tasa.optional(),
    acquisitionDate: fecha.optional(),
    inServiceDate: fecha.optional(),
    purchaseCfdiUuid: z.string().trim().max(50).nullable().optional(),
    locationId: z.string().uuid().nullable().optional(),
});

export type UpdateFixedAssetRequest = z.infer<typeof updateFixedAssetSchema>;

/**
 * La baja.
 *
 * `proceedsAccountId` es obligatorio **en cuanto hay dinero de por medio**: si no
 * se dice dónde entró, el asiento no cuadra sin inventarse una cuenta — y una
 * cuenta inventada en una baja es una ganancia declarada contra el sitio
 * equivocado. Lo comprueba el backend, que es quien sabe si el importe es cero.
 */
export const disposeFixedAssetSchema = z.object({
    kind: z.enum(DISPOSAL_KINDS, {
        errorMap: () => ({ message: 'La baja es por venta (SALE) o por desecho (SCRAP)' }),
    }),
    date: fecha,
    proceeds: z
        .number()
        .min(0, 'Lo cobrado no puede ser negativo')
        .max(999_999_999)
        .default(0),
    proceedsAccountId: z.string().uuid().optional(),
    notes: z.string().trim().max(500).optional(),
});

export type DisposeFixedAssetRequest = z.infer<typeof disposeFixedAssetSchema>;

/** Query del listado. */
export const getFixedAssetsSchema = z.object({
    companyId: z.string().uuid(),
    status: z.enum(FIXED_ASSET_STATUSES).optional(),
    assetType: z.enum(FIXED_ASSET_TYPES).optional(),
    locationId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetFixedAssetsQuery = z.infer<typeof getFixedAssetsSchema>;

/**
 * El barrido mensual de depreciación. Un mes y una empresa: idempotente por
 * `(activo, periodo)`, así que repetirlo no duplica nada.
 */
export const runDepreciationSchema = z.object({
    companyId: z.string().uuid(),
    /** `YYYY-MM`. */
    period: z.string().regex(/^\d{4}-\d{2}$/, 'El periodo va en formato AAAA-MM'),
});

export type RunDepreciationRequest = z.infer<typeof runDepreciationSchema>;
