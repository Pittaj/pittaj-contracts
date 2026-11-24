import { describe, expect, it } from 'vitest';
import { createDocumentSeriesSchema, esSerieFiscal, TIPOS_DE_SERIE_INTERNOS } from '../../src/document-series/index.js';
import { SEED_DOCUMENT_SERIES } from '../../src/seed/index.js';

/** Un solo lugar para lo del SAT: la serie de lo que se timbra vive en Fiscal, no en Series y folios. */
describe('series fiscales', () => {
    const base = { id: '00000000-0000-4000-8000-000000000001', serie: 'F', scope: 'GLOBAL', format: 'F-{folio:0000}' };

    it('no se crean series de factura ni de complemento de pago', () => {
        for (const docType of ['INVOICE', 'PAYMENT']) {
            const r = createDocumentSeriesSchema.safeParse({ ...base, docType });
            expect(r.success).toBe(false);
            expect(r.error?.issues[0]?.message).toContain('Fiscal');
        }
        expect(createDocumentSeriesSchema.safeParse({ ...base, docType: 'TICKET' }).success).toBe(true);
        // La nota de crédito interna de una devolución sí numera con su serie.
        expect(createDocumentSeriesSchema.safeParse({ ...base, docType: 'CREDIT_NOTE' }).success).toBe(true);
    });

    it('la lista interna no trae fiscales y la semilla tampoco', () => {
        expect(TIPOS_DE_SERIE_INTERNOS.some(esSerieFiscal)).toBe(false);
        expect(SEED_DOCUMENT_SERIES.some((s) => esSerieFiscal(s.documentType))).toBe(false);
    });
});
