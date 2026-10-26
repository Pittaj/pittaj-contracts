/** F3.2 · Leer un CFDI ya timbrado y decidir si es el de la venta. */
import { describe, expect, it } from 'vitest';
import { faltasDelRegistro, leerComprobanteEmitido, stampDirectSaleSchema } from '../../src/direct-sale/index.js';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="SAAS" Folio="1042" Fecha="2026-10-01T10:00:00"
  FormaPago="04" MetodoPago="PUE" SubTotal="1000.00" Moneda="MXN" Total="1160.00" TipoDeComprobante="I" Exportacion="01" LugarExpedicion="72000">
  <cfdi:Emisor Rfc="pit010101ab1" Nombre="PITTAJ &amp; ASOCIADOS" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CLI010101AB2" Nombre="CLIENTE" DomicilioFiscalReceptor="72000" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="6f2c1a8e-1234-4abc-9def-0123456789ab" FechaTimbrado="2026-10-01T10:00:05"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

describe('leerComprobanteEmitido', () => {
    it('lee los atributos sin importar el prefijo', () => {
        expect(leerComprobanteEmitido(XML)).toEqual({
            uuid: '6F2C1A8E-1234-4ABC-9DEF-0123456789AB',
            fechaTimbrado: '2026-10-01T10:00:05',
            fecha: '2026-10-01T10:00:00',
            tipoDeComprobante: 'I',
            version: '4.0',
            serie: 'SAAS',
            folio: '1042',
            moneda: 'MXN',
            metodoPago: 'PUE',
            formaPago: '04',
            total: 1160,
            emisorRfc: 'PIT010101AB1',
            receptorRfc: 'CLI010101AB2',
            usoCfdi: 'G03',
            receptorNombre: 'CLIENTE',
            receptorRegimen: '601',
            receptorCp: '72000',
        });
    });
});

describe('faltasDelRegistro', () => {
    const venta = { total: 1160, emisorRfc: 'PIT010101AB1', receptorRfc: 'cli010101ab2' };

    it('el comprobante de la venta se puede registrar', () => {
        expect(faltasDelRegistro(leerComprobanteEmitido(XML), venta)).toEqual([]);
    });

    it('otro total, otro emisor u otro cliente no', () => {
        const f = faltasDelRegistro(leerComprobanteEmitido(XML), { total: 1000, emisorRfc: 'OTR010101AB1', receptorRfc: 'X010101AB3' });
        expect(f).toHaveLength(3);
    });

    it('sin timbre no es un CFDI registrable', () => {
        const sinTimbre = XML.replace(/<tfd:TimbreFiscalDigital[^>]*\/>/, '');
        expect(faltasDelRegistro(leerComprobanteEmitido(sinTimbre), venta)[0]).toContain('UUID');
    });

    it('si el cliente no tiene RFC en su ficha, no se compara el receptor', () => {
        expect(faltasDelRegistro(leerComprobanteEmitido(XML), { ...venta, receptorRfc: null })).toEqual([]);
    });
});

describe('stampDirectSaleSchema', () => {
    it('PPD por omisión', () => expect(stampDirectSaleSchema.parse({})).toMatchObject({ metodoPago: 'PPD' }));
    it('PUE pide forma real', () => {
        expect(stampDirectSaleSchema.safeParse({ metodoPago: 'PUE' }).success).toBe(false);
        expect(stampDirectSaleSchema.safeParse({ metodoPago: 'PUE', formaPago: '99' }).success).toBe(false);
        expect(stampDirectSaleSchema.safeParse({ metodoPago: 'PUE', formaPago: '03' }).success).toBe(true);
    });
});
