/**
 * @fileoverview Datos fiscales del receptor exigidos por el CFDI 4.0
 * @module CustomerFiscalProfilePrimitives
 * @version 1.0.0
 */

export interface CustomerFiscalProfilePrimitives {
    /** Clave del régimen fiscal del receptor (catálogo c_RegimenFiscal del SAT). */
    readonly fiscalRegime: string;
    /** Clave del uso del CFDI (catálogo c_UsoCFDI del SAT), ej. G03. */
    readonly cfdiUse: string;
    /** Código postal del domicilio fiscal del receptor (5 dígitos). */
    readonly taxZipCode: string;
}
