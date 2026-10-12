/**
 * @fileoverview Alcance del usuario (F7): sobre QUÉ empresas, sucursales y líneas de negocio actúa.
 *
 * El rol dice qué puede hacer (ver Compras, pagar); el alcance dice sobre qué. Es del usuario, no
 * del rol: un rol «Comprador» sirve al de abarrotes y al de panadería, y lo que cambia es esto.
 *
 * **Vacío es todo** en cada dimensión: el dueño, el contador y cualquier tenant que no use F7.
 * **«Sin línea»** (`SIN_LINEA`) es una opción más de las líneas: una compra cuyos productos no
 * tienen línea no debe desaparecer para el comprador de la tienda, así que al limitar líneas se
 * marca por omisión.
 *
 * Lo filtran el dinero y los documentos; los catálogos (productos, proveedores, conceptos) no.
 * Ver `producto/plan-empresas-y-lineas-de-negocio.md` (F7) en docs. El escritorio tiene la misma
 * regla en `Pittaj.Domain/Identity/Alcance.cs`.
 *
 * @module Contracts/User/Alcance
 */

import { z } from 'zod';

/** El renglón sin línea de negocio, como opción del alcance. */
export const SIN_LINEA = 'NONE' as const;

/** Tope por dimensión: un tenant no tiene doscientas sucursales, y así el JSON no crece sin freno. */
const MAX_POR_DIMENSION = 200;

const ids = z.array(z.string().uuid()).max(MAX_POR_DIMENSION);

/** PUT /api/users/:id/alcance — el alcance completo; cada lista vacía significa «todas». */
export const updateUserScopeSchema = z.object({
    companyIds: ids.default([]),
    locationIds: ids.default([]),
    businessLineIds: z
        .array(z.union([z.string().uuid(), z.literal(SIN_LINEA)]))
        .max(MAX_POR_DIMENSION + 1)
        .default([]),
});

export type UpdateUserScopeInput = z.infer<typeof updateUserScopeSchema>;

/** El alcance de un usuario o de un operador. Listas vacías = sin límite en esa dimensión. */
export interface UserScopePrimitives {
    readonly companyIds: readonly string[];
    readonly locationIds: readonly string[];
    /** Ids de línea, y `SIN_LINEA` si ve lo que no tiene línea. */
    readonly businessLineIds: readonly string[];
}

/** GET /api/users/:id/alcance. */
export interface UserScopeResponse extends UserScopePrimitives {
    readonly userId: string;
    /** Los operadores del escritorio vinculados a este usuario: heredan este alcance. */
    readonly operadoresVinculados: number;
}

/** El alcance que no limita nada. */
export const ALCANCE_COMPLETO: UserScopePrimitives = Object.freeze({
    companyIds: [],
    locationIds: [],
    businessLineIds: [],
});

/** Lo que un documento dice de sí para decidir si se ve. */
export interface DimensionesDelDocumento {
    readonly companyId?: string | null;
    readonly locationId?: string | null;
    /** Las líneas estampadas en sus renglones (null = renglón sin línea). Vacío = sin renglones. */
    readonly businessLineIds?: readonly (string | null)[];
}

/** ¿El alcance limita algo? Un alcance completo no filtra nada, ni toca la base. */
export function esAlcanceCompleto(a: UserScopePrimitives): boolean {
    return a.companyIds.length === 0 && a.locationIds.length === 0 && a.businessLineIds.length === 0;
}

/** ¿Este alcance ve los reportes del libro y fiscales? Piden sucursal y línea completas (F7, regla 5). */
export function veLoContable(a: UserScopePrimitives): boolean {
    return a.locationIds.length === 0 && a.businessLineIds.length === 0;
}

/**
 * ¿El documento entra en el alcance? Un documento se ve **completo o no se ve**: entra si su
 * empresa y su sucursal están en el alcance y **al menos uno** de sus renglones tiene una línea del
 * alcance. No se ocultan renglones sueltos: un total que no cuadra con lo que se ve es peor.
 *
 * Una dimensión que el documento no trae (null) solo la ve quien no está limitado en ella: es la
 * bandeja «Por asignar» del buzón. Un documento sin renglones no se juzga por línea.
 */
export function estaEnAlcance(a: UserScopePrimitives, doc: DimensionesDelDocumento): boolean {
    if (a.companyIds.length > 0 && !(doc.companyId && a.companyIds.includes(doc.companyId))) return false;
    if (a.locationIds.length > 0 && !(doc.locationId && a.locationIds.includes(doc.locationId))) return false;
    const lineas = doc.businessLineIds ?? [];
    if (a.businessLineIds.length > 0 && lineas.length > 0) {
        return lineas.some((l) => a.businessLineIds.includes(l ?? SIN_LINEA));
    }
    return true;
}

/**
 * Limpia un alcance antes de guardarlo: sin duplicados y sin ids que el tenant ya no tiene (una
 * sucursal borrada no debe dejar a nadie «limitado a nada»). Si al limpiar una dimensión que estaba
 * limitada queda vacía, eso sería «todas»: se devuelve `null` para que quien guarda lo rechace.
 */
export function normalizarAlcance(
    a: UserScopePrimitives,
    existentes: { companyIds: readonly string[]; locationIds: readonly string[]; businessLineIds: readonly string[] },
): UserScopePrimitives | null {
    const filtra = (pedidos: readonly string[], validos: readonly string[], extra: readonly string[] = []) => {
        const ok = new Set([...validos, ...extra]);
        return [...new Set(pedidos)].filter((x) => ok.has(x));
    };
    const r = {
        companyIds: filtra(a.companyIds, existentes.companyIds),
        locationIds: filtra(a.locationIds, existentes.locationIds),
        businessLineIds: filtra(a.businessLineIds, existentes.businessLineIds, [SIN_LINEA]),
    };
    const quedoVacia =
        (a.companyIds.length > 0 && r.companyIds.length === 0) ||
        (a.locationIds.length > 0 && r.locationIds.length === 0) ||
        (a.businessLineIds.length > 0 && r.businessLineIds.length === 0);
    return quedoVacia ? null : r;
}
