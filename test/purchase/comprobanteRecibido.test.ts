/**
 * D1 · Del CFDI recibido a la compra. Cada caso es una celda de la matriz de
 * `producto/plan-comprobantes-que-cuadran.md` (docs). **Los mismos vectores** corren en el
 * escritorio (`ComprobanteRecibidoTests.cs`): si uno cambia aquí, cambia allá.
 */
import { describe, expect, it } from 'vitest';
import {
    compraDelComprobante,
    cuadreConElComprobante,
    renglonDelCfdi,
    totalNetoDeLaCompra,
    type CabeceraDelComprobante,
} from '../../src/purchase/comprobanteRecibido';
import type { CfdiConceptoInput } from '../../src/purchase/cfdiMatching';

const concepto = (c: Partial<CfdiConceptoInput>): CfdiConceptoInput => ({
    claveProdServ: '01010101',
    claveUnidad: 'H87',
    noIdentificacion: null,
    descripcion: 'X',
    cantidad: 1,
    valorUnitario: c.importe ?? 0,
    importe: 0,
    descuento: 0,
    taxRate: 0,
    ...c,
});

const cabecera = (c: Partial<CabeceraDelComprobante>): CabeceraDelComprobante => ({
    total: 0,
    trasladoIva: 0,
    retencionIsr: 0,
    retencionIva: 0,
    trasladoLocal: 0,
    retencionLocal: 0,
    ...c,
});

describe('D1 · renglonDelCfdi', () => {
    it('Telmex: el IEPS 3 % entra al costo y el IVA sale sobre importe + IEPS', () => {
        // CFDI real FMM-140426080049939: importe 328.44, IEPS 6.90 (base 229.98), IVA 53.65 (base 335.34).
        const r = renglonDelCfdi(
            concepto({ importe: 328.44, valorUnitario: 328.44, taxRate: 0.16, taxAmount: 53.65, iepsAmount: 6.9 })
        );
        expect(r.importes).toEqual({
            subtotalAmount: 335.34,
            discountAmount: 0,
            taxBaseAmount: 335.34,
            taxAmount: 53.65,
            totalAmount: 388.99,
        });
        expect(r.taxPercent).toBe(0.16);
        expect(r.iepsAlCosto).toBe(6.9);
    });

    it('con IEPS acreditable (D8) el IEPS no es costo y la tasa queda efectiva', () => {
        const r = renglonDelCfdi(
            concepto({ importe: 328.44, taxRate: 0.16, taxAmount: 53.65, iepsAmount: 6.9 }),
            { iepsAcreditable: true }
        );
        expect(r.importes.subtotalAmount).toBe(328.44);
        expect(r.importes.taxAmount).toBe(53.65);
        expect(r.iepsAlCosto).toBe(0);
        expect(r.taxPercent).toBe(0.163348);
    });

    it('gasolina: sin nodo de IEPS, el IVA del concepto con tasa efectiva', () => {
        const r = renglonDelCfdi(
            concepto({ cantidad: 25.010421, valorUnitario: 20.762606, importe: 519.281505, taxRate: 0.16, taxAmount: 80.718495 })
        );
        expect(r.importes.subtotalAmount).toBe(519.28);
        expect(r.importes.taxAmount).toBe(80.72);
        expect(r.importes.totalAmount).toBe(600);
        expect(r.taxPercent).toBe(0.155446);
        expect(r.unitCost).toBe(20.7625);
    });

    it('refresco con IEPS por cuota: la cuota es costo', () => {
        // 24 latas × 9.50; IEPS cuota 1.6451 $/L × 8.52 L = 14.02; IVA 16 % sobre 228 + 14.02.
        const r = renglonDelCfdi(
            concepto({ cantidad: 24, valorUnitario: 9.5, importe: 228, taxRate: 0.16, taxAmount: 38.72, iepsAmount: 14.02 })
        );
        expect(r.importes.subtotalAmount).toBe(242.02);
        expect(r.importes.taxAmount).toBe(38.72);
        expect(r.importes.totalAmount).toBe(280.74);
        expect(r.unitCost).toBe(10.0842);
    });

    it('descuento por renglón: el importe exacto, no un porcentaje redondeado', () => {
        // 1.08 % redondeado a dos decimales habría dado 13.33 en vez de 13.37.
        const r = renglonDelCfdi(concepto({ importe: 1234.56, descuento: 13.37, taxRate: 0.16, taxAmount: 195.39 }));
        expect(r.importes.discountAmount).toBe(13.37);
        expect(r.importes.taxBaseAmount).toBe(1221.19);
        expect(r.importes.totalAmount).toBe(1416.58);
    });

    it('exento o tasa 0: sin IVA', () => {
        const r = renglonDelCfdi(concepto({ importe: 100, taxRate: 0, taxAmount: null }));
        expect(r.importes.taxAmount).toBe(0);
        expect(r.taxPercent).toBe(0);
    });

    it('sin el importe del IVA (una punta vieja): la tasa sobre importe − descuento + IEPS', () => {
        const r = renglonDelCfdi(concepto({ importe: 328.44, taxRate: 0.16, iepsAmount: 6.9 }));
        expect(r.importes.taxAmount).toBe(53.65);
    });
});

describe('D1 · compraDelComprobante: el total de la compra es el del CFDI', () => {
    it('Telmex da 388.99', () => {
        const c = compraDelComprobante(
            [concepto({ importe: 328.44, taxRate: 0.16, taxAmount: 53.65, iepsAmount: 6.9 })],
            cabecera({ total: 388.99, trasladoIva: 53.65 })
        );
        expect(c.total).toBe(388.99);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('mayorista: 0 % y 16 % en la misma factura', () => {
        const c = compraDelComprobante(
            [
                concepto({ descripcion: 'FRIJOL 1K', cantidad: 10, importe: 320, taxRate: 0, taxAmount: null }),
                concepto({ descripcion: 'ACEITE 1L', cantidad: 12, importe: 456, taxRate: 0.16, taxAmount: 72.96 }),
            ],
            cabecera({ total: 848.96, trasladoIva: 72.96 })
        );
        expect(c.renglones.map((r) => r.importes.taxAmount)).toEqual([0, 72.96]);
        expect(c.total).toBe(848.96);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('flete con retención de IVA 4 %: se le debe menos de lo que suman los renglones', () => {
        const c = compraDelComprobante(
            [concepto({ importe: 1000, taxRate: 0.16, taxAmount: 160 })],
            cabecera({ total: 1120, trasladoIva: 160, retencionIva: 40 })
        );
        expect(c.renglones[0]!.importes.totalAmount).toBe(1160);
        expect(c.total).toBe(1120);
        expect(c.impuestosDelDocumento.retencionIva).toBe(40);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('arrendamiento de persona física: retiene 10 % de ISR y 2/3 del IVA', () => {
        const c = compraDelComprobante(
            [concepto({ importe: 10000, taxRate: 0.16, taxAmount: 1600 })],
            cabecera({ total: 9533.33, trasladoIva: 1600, retencionIsr: 1000, retencionIva: 1066.67 })
        );
        expect(c.total).toBe(9533.33);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('hospedaje con 3 % de ISH (implocal): el impuesto local suma al total', () => {
        const c = compraDelComprobante(
            [concepto({ importe: 1500, taxRate: 0.16, taxAmount: 240 })],
            cabecera({ total: 1785, trasladoIva: 240, trasladoLocal: 45 })
        );
        expect(c.total).toBe(1785);
        expect(c.impuestosDelDocumento.trasladoLocal).toBe(45);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('en dólares: todo a pesos con el TipoCambio del CFDI, y guarda el original', () => {
        const c = compraDelComprobante(
            [concepto({ importe: 20, valorUnitario: 20, taxRate: 0.16, taxAmount: 3.2 })],
            cabecera({ total: 23.2, trasladoIva: 3.2, moneda: 'USD', tipoCambio: 18.4321 })
        );
        expect(c.renglones[0]!.importes.subtotalAmount).toBe(368.64);
        expect(c.renglones[0]!.importes.taxAmount).toBe(58.98);
        expect(c.totalDelComprobante).toBe(427.62);
        expect(c.total).toBe(427.62);
        expect(c.monedaOriginal).toEqual({ foreignCurrency: 'USD', foreignTotal: 23.2 });
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('en dólares sin TipoCambio: no se convierte', () => {
        const c = compraDelComprobante([concepto({ importe: 20 })], cabecera({ total: 20, moneda: 'USD' }));
        expect(c.cuadre.cuadra).toBe(false);
        expect(c.cuadre.motivo).toMatch(/tipo de cambio/);
    });

    it('el redondeo entre conceptos y cabecera va al renglón mayor', () => {
        // Tres conceptos de 0.333 de IVA cada uno: los conceptos suman 0.99 (0.33 × 3), la cabecera dice 1.00.
        const c = compraDelComprobante(
            [
                concepto({ importe: 2.08, taxRate: 0.16, taxAmount: 0.333 }),
                concepto({ importe: 2.08, taxRate: 0.16, taxAmount: 0.333 }),
                concepto({ importe: 2.09, taxRate: 0.16, taxAmount: 0.334 }),
            ],
            cabecera({ total: 7.25, trasladoIva: 1 })
        );
        expect(c.renglones.reduce((a, r) => a + r.importes.taxAmount, 0)).toBeCloseTo(1, 10);
        expect(c.total).toBe(7.25);
        expect(c.cuadre.cuadra).toBe(true);
    });

    it('un impuesto que Pittaj no leyó: no cuadra y dice cuánto', () => {
        // El XML trae un ISH que el lector no pasó: la compra suma 1740, el CFDI 1785.
        const c = compraDelComprobante(
            [concepto({ importe: 1500, taxRate: 0.16, taxAmount: 240 })],
            cabecera({ total: 1785, trasladoIva: 240 })
        );
        expect(c.cuadre).toMatchObject({ cuadra: false, diferencia: -45 });
        expect(c.cuadre.motivo).toMatch(/faltan 45\.00/);
    });
});

describe('D1 · totalNetoDeLaCompra y cuadre', () => {
    it('resta retenciones y locales retenidos, suma locales trasladados', () => {
        expect(totalNetoDeLaCompra(1160, { retencionIsr: 100, retencionIva: 106.67, trasladoLocal: 10, retencionLocal: 5 })).toBe(958.33);
        expect(totalNetoDeLaCompra(1160)).toBe(1160);
    });

    it('un centavo de diferencia cuadra; dos no', () => {
        expect(cuadreConElComprobante(100.01, 100).cuadra).toBe(true);
        expect(cuadreConElComprobante(100.02, 100).cuadra).toBe(false);
    });
});

describe('D1 · conciliar contra compras capturadas', () => {
    it('el flete de 1,160 con 40 de retención cuadra con su CFDI de 1,120', async () => {
        const { totalDeRenglonesDelComprobante } = await import('../../src/purchase/comprobanteRecibido');
        expect(totalDeRenglonesDelComprobante({ total: 1120, retencionIva: 40 })).toBe(1160);
        expect(totalDeRenglonesDelComprobante({ total: 1785, trasladoLocal: 45 })).toBe(1740);
    });

    it('una factura, tres remisiones: la retención se reparte y suma exacta', async () => {
        const { repartirImpuestosDelDocumento } = await import('../../src/purchase/comprobanteRecibido');
        const partes = repartirImpuestosDelDocumento(
            { retencionIsr: 0, retencionIva: 100, trasladoLocal: 0, retencionLocal: 0 },
            [1, 1, 1]
        );
        expect(partes.map((p) => p.retencionIva)).toEqual([33.34, 33.33, 33.33]);
        expect(repartirImpuestosDelDocumento({ retencionIsr: 10, retencionIva: 0, trasladoLocal: 0, retencionLocal: 0 }, [500])[0]!.retencionIsr).toBe(10);
    });
});
