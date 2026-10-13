/**
 * @fileoverview F2 · El perfil fiscal es de la empresa, no del tenant.
 * @module Contracts/Company
 *
 * El emisor de un CFDI (RFC, razón social, régimen y CP de expedición) vivía en cinco claves de
 * `tenant_settings` (`cfdi.issuer.*`), un valor por tenant: con eso un tenant no podía tener dos
 * RFC. Desde F2 vive en `companies` y un documento lo resuelve por su sucursal: sucursal → empresa
 * → perfil fiscal, la misma cadena con la que Contabilidad decide el libro.
 *
 * Plan: docs `producto/plan-empresas-y-lineas-de-negocio.md` § F2. Gemelo en el escritorio:
 * `Pittaj.Domain/Organization/PerfilFiscal.cs`.
 */
import { z } from 'zod';

/** Clave del catálogo `c_RegimenFiscal` del SAT (601, 612, 626…). */
export const regimenFiscalSchema = z
    .string()
    .trim()
    .regex(/^\d{3}$/, 'El régimen fiscal es la clave de tres dígitos del SAT (601, 612, 626…)')
    .nullish();

/** Código postal del lugar de expedición (`c_CodigoPostal`): cinco dígitos. */
export const codigoPostalSchema = z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'El código postal son cinco dígitos')
    .nullish();

/**
 * Las claves de `tenant_settings` que F2 retiró: la migración 0153 las copió a la empresa por
 * omisión y las borró. La nube ya no las acepta (un cliente viejo las volvería a crear y nadie
 * las leería): se descartan al guardar y al sincronizar.
 */
export const CLAVES_FISCALES_RETIRADAS = [
    'cfdi.issuer.rfc',
    'cfdi.issuer.name',
    'cfdi.issuer.regime',
    'cfdi.expedition.zip',
    'business.rfc',
] as const;

/** RFC y CP de ejemplo que traía el formulario viejo: capturados, pero no configurados. */
const RFC_DE_EJEMPLO = 'XAXX010101000';
const CP_DE_EJEMPLO = '00000';

/** Lo que hace falta de la empresa. */
export interface EmpresaConPerfil {
    readonly taxId?: string | null;
    readonly legalName?: string | null;
    readonly taxRegime?: string | null;
    readonly expeditionZip?: string | null;
}

/** El emisor listo para un CFDI. */
export interface PerfilFiscal {
    readonly rfc: string;
    readonly razonSocial: string;
    readonly regimen: string;
    readonly cp: string;
}

export type CampoDelPerfilFiscal = 'rfc' | 'razonSocial' | 'regimen' | 'cp';

const limpio = (v: string | null | undefined) => (v ?? '').trim();

/** Lo que le falta a la empresa para timbrar, en el orden del formulario. Vacío = completo. */
export function faltanDelPerfilFiscal(e: EmpresaConPerfil | null | undefined): CampoDelPerfilFiscal[] {
    const rfc = limpio(e?.taxId).toUpperCase();
    const cp = limpio(e?.expeditionZip);
    const faltan: CampoDelPerfilFiscal[] = [];
    if (!rfc || rfc === RFC_DE_EJEMPLO) faltan.push('rfc');
    if (!limpio(e?.legalName)) faltan.push('razonSocial');
    if (!limpio(e?.taxRegime)) faltan.push('regimen');
    if (!cp || cp === CP_DE_EJEMPLO) faltan.push('cp');
    return faltan;
}

/**
 * El perfil para timbrar, o `null` si falta algo: sin los cuatro datos el PAC no sella y el
 * timbre se perdería. RFC y razón social van en mayúsculas, como los pide el SAT (CFDI 4.0).
 */
export function perfilFiscalDe(e: EmpresaConPerfil | null | undefined): PerfilFiscal | null {
    if (!e || faltanDelPerfilFiscal(e).length > 0) return null;
    return {
        rfc: limpio(e.taxId).toUpperCase(),
        razonSocial: limpio(e.legalName).toUpperCase(),
        regimen: limpio(e.taxRegime),
        cp: limpio(e.expeditionZip),
    };
}
