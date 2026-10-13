import { describe, expect, it } from 'vitest';
import {
    faltanDelPerfilFiscal,
    perfilFiscalDe,
    updateCompanySchema,
} from '../../src/company/index.js';

const COMPLETA = { taxId: 'goma800101ab1', legalName: ' Ana Gómez ', taxRegime: '612', expeditionZip: '06600' };

describe('F2 · perfil fiscal de la empresa', () => {
    it('completo: RFC y razón social en mayúsculas', () => {
        expect(perfilFiscalDe(COMPLETA)).toEqual({ rfc: 'GOMA800101AB1', razonSocial: 'ANA GÓMEZ', regimen: '612', cp: '06600' });
        expect(faltanDelPerfilFiscal(COMPLETA)).toEqual([]);
    });

    it('le falta algo: no hay perfil y dice qué', () => {
        expect(perfilFiscalDe({ ...COMPLETA, taxRegime: null })).toBeNull();
        expect(faltanDelPerfilFiscal({ taxId: 'GOMA800101AB1' })).toEqual(['razonSocial', 'regimen', 'cp']);
        expect(faltanDelPerfilFiscal(null)).toEqual(['rfc', 'razonSocial', 'regimen', 'cp']);
    });

    it('los valores de ejemplo del formulario viejo no cuentan como capturados', () => {
        expect(faltanDelPerfilFiscal({ ...COMPLETA, taxId: 'XAXX010101000', expeditionZip: '00000' })).toEqual(['rfc', 'cp']);
    });

    it('el contrato de edición valida régimen y CP', () => {
        expect(updateCompanySchema.safeParse({ version: 1, taxRegime: '626', expeditionZip: '72000' }).success).toBe(true);
        expect(updateCompanySchema.safeParse({ version: 1, taxRegime: null, expeditionZip: null }).success).toBe(true);
        expect(updateCompanySchema.safeParse({ version: 1, taxRegime: 'RESICO' }).success).toBe(false);
        expect(updateCompanySchema.safeParse({ version: 1, expeditionZip: '7200' }).success).toBe(false);
    });
});
