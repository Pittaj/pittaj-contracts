/** D1 · Un CFDI emitido en otro sistema, a renglones de venta sin caja. */
import { describe, expect, it } from 'vitest';
import { leerComprobanteEmitido, leerConceptosEmitidos, renglonesDelCfdiEmitido } from '../../src/direct-sale/index.js';

const comprobante = (atributos: string, conceptos: string, extra = '') => `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="A" Folio="77" Fecha="2026-10-20T13:15:00"
  Moneda="MXN" TipoDeComprobante="I" Exportacion="01" LugarExpedicion="72000" ${atributos}>
  <cfdi:Emisor Rfc="ABA010101AB1" Nombre="ABARROTES" RegimenFiscal="626"/>
  <cfdi:Receptor Rfc="CLI010101AB2" Nombre="CLIENTE &amp; CIA" DomicilioFiscalReceptor="72000" RegimenFiscalReceptor="601" UsoCFDI="G01"/>
  <cfdi:Conceptos>${conceptos}</cfdi:Conceptos>${extra}
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="0a1b2c3d-1111-4222-8333-444455556666" FechaTimbrado="2026-10-20T13:15:09"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const iva16 = (base: string, imp: string) =>
    `<cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="${base}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${imp}"/></cfdi:Traslados></cfdi:Impuestos>`;

const leer = (xml: string) => renglonesDelCfdiEmitido(leerComprobanteEmitido(xml), xml);

describe('leerConceptosEmitidos', () => {
    it('lee cantidad, precio, descuento y el traslado de cada concepto', () => {
        const xml = comprobante(
            'SubTotal="200.00" Descuento="20.00" Total="208.80" MetodoPago="PUE" FormaPago="01"',
            `<cfdi:Concepto ClaveProdServ="50181900" Cantidad="2" ClaveUnidad="H87" Unidad="Pieza" Descripcion="Pan &amp; dulce" ValorUnitario="100.00" Importe="200.00" Descuento="20.00" ObjetoImp="02">${iva16('180.00', '28.80')}</cfdi:Concepto>`,
        );
        expect(leerConceptosEmitidos(xml)).toEqual([
            {
                claveProdServ: '50181900',
                claveUnidad: 'H87',
                unidad: 'Pieza',
                descripcion: 'Pan & dulce',
                cantidad: 2,
                valorUnitario: 100,
                importe: 200,
                descuento: 20,
                objetoImp: '02',
                traslados: [{ impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16 }],
                retenciones: 0,
            },
        ]);
    });
});

describe('renglonesDelCfdiEmitido', () => {
    it('copia los conceptos y cuadra con el total timbrado (IVA, tasa 0 y no objeto juntos)', () => {
        const xml = comprobante(
            'SubTotal="350.00" Total="366.00" MetodoPago="PPD" FormaPago="99"',
            `<cfdi:Concepto ClaveProdServ="50181900" Cantidad="1" ClaveUnidad="H87" Descripcion="Pastel" ValorUnitario="100.00" Importe="100.00" ObjetoImp="02">${iva16('100.00', '16.00')}</cfdi:Concepto>
             <cfdi:Concepto ClaveProdServ="50221100" Cantidad="2" ClaveUnidad="KGM" Descripcion="Tortilla" ValorUnitario="50.00" Importe="100.00" ObjetoImp="02"><cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="100.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.000000" Importe="0.00"/></cfdi:Traslados></cfdi:Impuestos></cfdi:Concepto>
             <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicio" ValorUnitario="150.00" Importe="150.00" ObjetoImp="01"/>`,
        );
        const r = leer(xml);
        expect('renglones' in r && r.renglones.map((l) => [l.tax, l.taxRate, l.quantity, l.unitPrice])).toEqual([
            ['IVA', 0.16, 1, 100],
            ['ZERO', undefined, 2, 50],
            ['NOT_OBJECT', undefined, 1, 150],
        ]);
    });

    it('si el redondeo del emisor no da con cantidad × precio, usa el importe neto del concepto', () => {
        // El emisor muestra el precio con dos decimales (33.33) pero su importe es 100.00: 3 × 33.33 = 99.99 no cuadra.
        const xml = comprobante(
            'SubTotal="100.00" Total="116.00" MetodoPago="PUE" FormaPago="03"',
            `<cfdi:Concepto ClaveProdServ="50181900" Cantidad="3" ClaveUnidad="H87" Descripcion="Bolillo" ValorUnitario="33.33" Importe="100.00" ObjetoImp="02">${iva16('100.00', '16.00')}</cfdi:Concepto>`,
        );
        const r = leer(xml);
        expect('renglones' in r && r.renglones[0]).toMatchObject({ quantity: 1, unitPrice: 100, tax: 'IVA' });
    });

    it('rechaza con su motivo lo que la venta sin caja todavía no lleva: IEPS y retenciones', () => {
        const ieps = comprobante(
            'SubTotal="100.00" Total="124.08" MetodoPago="PUE" FormaPago="01"',
            `<cfdi:Concepto ClaveProdServ="50202306" Cantidad="1" ClaveUnidad="H87" Descripcion="Refresco" ValorUnitario="100.00" Importe="100.00" ObjetoImp="02"><cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="100.00" Impuesto="003" TipoFactor="Tasa" TasaOCuota="0.080000" Importe="8.00"/><cfdi:Traslado Base="108.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="17.28"/></cfdi:Traslados></cfdi:Impuestos></cfdi:Concepto>`,
        );
        expect(leer(ieps)).toEqual({ motivos: [expect.stringContaining('trae IEPS')] });

        const retencion = comprobante(
            'SubTotal="1000.00" Total="1147.50" MetodoPago="PPD" FormaPago="99"',
            `<cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="E48" Descripcion="Honorarios" ValorUnitario="1000.00" Importe="1000.00" ObjetoImp="02"><cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="1000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="160.00"/></cfdi:Traslados><cfdi:Retenciones><cfdi:Retencion Base="1000.00" Impuesto="001" TipoFactor="Tasa" TasaOCuota="0.012500" Importe="12.50"/></cfdi:Retenciones></cfdi:Impuestos></cfdi:Concepto>`,
        );
        expect(leer(retencion)).toEqual({ motivos: [expect.stringContaining('retenciones')] });
    });

    it('nómina, egresos y otra moneda dicen a dónde van o por qué no entran', () => {
        const base = (tipo: string, moneda = 'MXN') =>
            comprobante(`SubTotal="10.00" Total="10.00"`, `<cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="E48" Descripcion="x" ValorUnitario="10.00" Importe="10.00" ObjetoImp="01"/>`)
                .replace('TipoDeComprobante="I"', `TipoDeComprobante="${tipo}"`)
                .replace('Moneda="MXN"', `Moneda="${moneda}"`);
        expect(leer(base('N'))).toEqual({ motivos: [expect.stringContaining('Contabilidad (C4)')] });
        expect(leer(base('E'))).toEqual({ motivos: [expect.stringContaining('nota de crédito')] });
        expect(leer(base('I', 'USD'))).toEqual({ motivos: [expect.stringContaining('USD')] });
    });

    it('lee la fecha del comprobante para fechar la venta y el cobro', () => {
        const xml = comprobante('SubTotal="10.00" Total="10.00"', '');
        expect(leerComprobanteEmitido(xml).fecha).toBe('2026-10-20T13:15:00');
    });
});
