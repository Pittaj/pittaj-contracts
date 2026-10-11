/**
 * D8 · Las reglas del contribuyente de IEPS (LIEPS vigente, DOF 07-11-2025). Los mismos vectores
 * en el escritorio (`IepsDeLaLeyTests`).
 */
import { describe, expect, it } from 'vitest';
import { categoriaDelIepsRecibido, iepsEsAcreditable, iepsSeDesglosa } from '../../src/tax/iepsDeLaLey.js';
import { compraDelComprobante } from '../../src/purchase/comprobanteRecibido.js';
import type { CfdiConceptoInput } from '../../src/purchase/cfdiMatching.js';

describe('art. 4o. · acreditamiento', () => {
    it('acredita la clase que causa, si es de las acreditables', () => {
        expect(iepsEsAcreditable({ categoria: 'G', categoriasQueCausa: ['G'] }).acreditable).toBe(true);
    });
    it('no acredita otra clase aunque sea acreditable (fr. IV, misma clase)', () => {
        expect(iepsEsAcreditable({ categoria: 'D', categoriasQueCausa: ['G'] }).acreditable).toBe(false);
    });
    it('el tabaco (C) no se acredita en la adquisición aunque se cause', () => {
        expect(iepsEsAcreditable({ categoria: 'C', categoriasQueCausa: ['C'] }).acreditable).toBe(false);
    });
    it('sin clase es costo', () => {
        expect(iepsEsAcreditable({ categoria: null, categoriasQueCausa: ['G'] }).acreditable).toBe(false);
    });
});

describe('art. 19, fr. II · desglose en el CFDI', () => {
    it('va dentro del precio salvo que el cliente contribuyente lo pida', () => {
        expect(iepsSeDesglosa({ categoria: 'G', clienteContribuyenteLoSolicita: false })).toBe(false);
        expect(iepsSeDesglosa({ categoria: 'G', clienteContribuyenteLoSolicita: true })).toBe(true);
    });
    it('el tabaco (C) nunca se desglosa', () => {
        expect(iepsSeDesglosa({ categoria: 'C', clienteContribuyenteLoSolicita: true })).toBe(false);
    });
});

describe('la clase de un IEPS recibido sale del catálogo', () => {
    const catalogo = [
        { factor: 'Cuota' as const, tasaOCuota: 1.6451, categoria: 'G' },
        { factor: 'Tasa' as const, tasaOCuota: 0.08, categoria: 'J' },
    ];
    it('por factor y cuota', () => {
        expect(categoriaDelIepsRecibido({ factor: 'Cuota', tasaOCuota: 1.6451 }, catalogo)).toBe('G');
        expect(categoriaDelIepsRecibido({ factor: 'Tasa', tasaOCuota: 0.03 }, catalogo)).toBeNull();
    });
});

describe('D8 · compra con IEPS acreditable', () => {
    // Un refresco: importe 100, IEPS cuota 16.45, IVA 16 % sobre 116.45 = 18.63; total 135.08.
    const refresco: CfdiConceptoInput = {
        claveProdServ: '50202306', claveUnidad: 'H87', noIdentificacion: null, descripcion: 'Refresco',
        cantidad: 10, valorUnitario: 10, importe: 100, descuento: 0, taxRate: 0.16, taxAmount: 18.63,
        iepsAmount: 16.45, iepsFactor: 'Cuota', iepsTasaOCuota: 1.6451,
    };
    const cab = { total: 135.08, trasladoIva: 18.63, retencionIsr: 0, retencionIva: 0, trasladoLocal: 0, retencionLocal: 0 };

    it('sin acreditar, el IEPS es costo', () => {
        const c = compraDelComprobante([refresco], cab);
        expect(c.renglones[0]!.importes.subtotalAmount).toBe(116.45);
        expect(c.total).toBe(135.08);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('acreditable: sale del costo, se queda en el total y va por clase', () => {
        const c = compraDelComprobante([refresco], cab, {
            iepsDelConcepto: (k) => ({ acreditable: k.iepsFactor === 'Cuota', categoria: 'G' }),
        });
        expect(c.renglones[0]!.importes.subtotalAmount).toBe(100);
        expect(c.renglones[0]!.iepsAcreditable).toBe(16.45);
        expect(c.impuestosDelDocumento.iepsAcreditable).toBe(16.45);
        expect(c.iepsAcreditablePorCategoria).toEqual({ G: 16.45 });
        expect(c.total).toBe(135.08);
        expect(c.cuadre.cuadra).toBe(true);
    });
});
