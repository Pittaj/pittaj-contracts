/**
 * @fileoverview El orden de lo que requiere atención en Compras.
 *
 * Lo que se prueba aquí no es aritmética: es **qué se hace primero en el negocio**. Si esta lista
 * ordena mal, alguien paga tarde una factura o deja de reponer lo que se está acabando — y no se
 * entera, porque la pantalla se veía bien.
 *
 * Espejo de `ComprasAtencionTests.cs` del escritorio.
 */

import { describe, it, expect } from 'vitest';
import {
    evaluarAtencion,
    ordenarAtencion,
    resumirAtencion,
    type AlertaDeCompras,
    type DatosDeAtencion,
} from '../../src/purchase/comprasAtencion';

/** Un negocio en marcha, con de todo. */
const CON_DE_TODO: DatosDeAtencion = {
    recibidoSinFactura: { compras: 9, ivaEnRiesgo: 3847.2 },
    bajoMinimo: { productos: 23, criticos: 6, importeSugerido: 18400 },
    borradores: { compras: 4, importe: 12930, diasDelMasViejo: 11 },
    entregasParciales: { entregas: 2, renglones: 7 },
    peticiones: { pendientes: 5, diasDeLaMasVieja: 3, conExistenciaEnOtras: 4 },
    cotizaciones: { sinResponder: 1, vencidas: 0, diasDeLaMasVieja: 6 },
    proveedores: 14,
    comprasDelMes: 38,
};

function alerta(p: Partial<AlertaDeCompras>): AlertaDeCompras {
    return {
        tipo: 'BORRADORES_DETENIDOS',
        severidad: 'ATENCION',
        cantidad: 1,
        importe: null,
        dias: null,
        matiz: null,
        ...p,
    };
}

describe('Qué se convierte en alerta', () => {
    it('lo que vale cero no genera renglón', () => {
        // Una lista que dice «0 compras sin factura» gasta la única zona donde se mira cuando algo
        // va mal.
        const alertas = evaluarAtencion({
            recibidoSinFactura: { compras: 0, ivaEnRiesgo: 0 },
            borradores: { compras: 0, importe: 0, diasDelMasViejo: null },
            proveedores: 14,
            comprasDelMes: 38,
        });

        expect(alertas).toHaveLength(0);
    });

    it('lo que no existe todavía tampoco', () => {
        // Las dos de pago llegan nulas hasta que exista Cuentas por Pagar.
        const alertas = evaluarAtencion({ ...CON_DE_TODO, porPagarPronto: null, vencido: null });

        expect(alertas.some((a) => a.tipo === 'POR_PAGAR_PRONTO')).toBe(false);
        expect(alertas.some((a) => a.tipo === 'VENCIDO')).toBe(false);
    });

    it('y aparecen solas el día que el servidor las mande', () => {
        const alertas = evaluarAtencion({
            ...CON_DE_TODO,
            vencido: { facturas: 2, importe: 5000, diasDelMasViejo: 12 },
        });

        expect(alertas[0]!.tipo).toBe('VENCIDO');
    });
});

describe('Severidad', () => {
    it('el IVA en riesgo es SIEMPRE crítico', () => {
        // No se recupera solo, y cada mes lo aleja de la declaración en la que cabía.
        const [a] = evaluarAtencion({ recibidoSinFactura: { compras: 1, ivaEnRiesgo: 12 } });
        expect(a!.severidad).toBe('CRITICA');
    });

    it('bajo mínimo solo es crítico si algo se acaba antes de que llegue el pedido', () => {
        const holgado = evaluarAtencion({
            bajoMinimo: { productos: 23, criticos: 0, importeSugerido: 18400 },
        });
        expect(holgado[0]!.severidad).toBe('ATENCION');

        const urgente = evaluarAtencion({
            bajoMinimo: { productos: 23, criticos: 6, importeSugerido: 18400 },
        });
        expect(urgente[0]!.severidad).toBe('CRITICA');
    });

    it('un borrador se vuelve crítico a los 7 días', () => {
        const nuevo = evaluarAtencion({
            borradores: { compras: 1, importe: 100, diasDelMasViejo: 6 },
        });
        expect(nuevo[0]!.severidad).toBe('ATENCION');

        const viejo = evaluarAtencion({
            borradores: { compras: 1, importe: 100, diasDelMasViejo: 7 },
        });
        expect(viejo[0]!.severidad).toBe('CRITICA');
    });

    it('una cotización vencida sube de INFO a ATENCION', () => {
        // No es un dato viejo: es volver a pedir precios desde cero.
        const esperando = evaluarAtencion({
            cotizaciones: { sinResponder: 2, vencidas: 0, diasDeLaMasVieja: 3 },
        });
        expect(esperando[0]!.severidad).toBe('INFO');

        const vencida = evaluarAtencion({
            cotizaciones: { sinResponder: 1, vencidas: 1, diasDeLaMasVieja: 9 },
        });
        expect(vencida[0]!.severidad).toBe('ATENCION');
    });
});

describe('El orden', () => {
    it('la severidad manda sobre el dinero', () => {
        // 🔴 Si el importe ganara, una alerta grande y tranquila taparía una pequeña y urgente.
        const orden = ordenarAtencion([
            alerta({ tipo: 'BORRADORES_DETENIDOS', severidad: 'ATENCION', importe: 900000 }),
            alerta({ tipo: 'RECIBIDO_SIN_FACTURA', severidad: 'CRITICA', importe: 10 }),
        ]);

        expect(orden[0]!.tipo).toBe('RECIBIDO_SIN_FACTURA');
    });

    it('un importe grande NO tapa a uno que se pierde para siempre', () => {
        // 🔴 El fallo que encontró esta prueba: ordenando por importe, «$12,930 detenidos en
        // borradores» quedaba encima de «$3,847 de IVA que no vas a poder acreditar». El borrador
        // se resuelve recibiéndolo; el IVA no vuelve.
        const orden = ordenarAtencion([
            alerta({ tipo: 'BORRADORES_DETENIDOS', severidad: 'CRITICA', importe: 12930 }),
            alerta({ tipo: 'RECIBIDO_SIN_FACTURA', severidad: 'CRITICA', importe: 3847 }),
        ]);

        expect(orden[0]!.tipo).toBe('RECIBIDO_SIN_FACTURA');
    });

    it('el importe solo desempata entre alertas del MISMO tipo', () => {
        const orden = ordenarAtencion([
            alerta({ tipo: 'BAJO_MINIMO', severidad: 'CRITICA', importe: 100 }),
            alerta({ tipo: 'BAJO_MINIMO', severidad: 'CRITICA', importe: 900 }),
        ]);

        expect(orden[0]!.importe).toBe(900);
    });

    it('a igualdad de severidad, manda el peso del tipo', () => {
        const orden = ordenarAtencion([
            alerta({ tipo: 'COTIZACIONES_SIN_RESPUESTA', severidad: 'INFO', importe: null }),
            alerta({ tipo: 'PETICIONES_SIN_ATENDER', severidad: 'INFO', importe: null }),
        ]);

        expect(orden[0]!.tipo).toBe('PETICIONES_SIN_ATENDER');
    });

    it('con datos reales, arriba va lo que no vuelve', () => {
        const alertas = evaluarAtencion(CON_DE_TODO);

        expect(alertas.map((a) => a.tipo)).toEqual([
            // Las tres críticas, por lo que se pierde si nadie hace nada.
            'RECIBIDO_SIN_FACTURA',
            'BAJO_MINIMO',
            'BORRADORES_DETENIDOS',
            // Y lo demás, por peso.
            'ENTREGAS_PARCIALES',
            'PETICIONES_SIN_ATENDER',
            'COTIZACIONES_SIN_RESPUESTA',
        ]);
    });
});

describe('Los vacíos de estreno', () => {
    it('«sin proveedores» solo cuando no hay NADA más que decir', () => {
        // Apilarlo con alertas de verdad haría parecer que el negocio nuevo va mal.
        const solo = evaluarAtencion({ proveedores: 0, comprasDelMes: 0 });
        expect(solo).toHaveLength(1);
        expect(solo[0]!.tipo).toBe('SIN_PROVEEDORES');

        const conAlgo = evaluarAtencion({
            proveedores: 0,
            comprasDelMes: 0,
            borradores: { compras: 1, importe: 10, diasDelMasViejo: 1 },
        });
        expect(conAlgo.map((a) => a.tipo)).toEqual(['BORRADORES_DETENIDOS']);
    });

    it('con proveedores pero sin compras, se dice lo segundo', () => {
        const alertas = evaluarAtencion({ proveedores: 3, comprasDelMes: 0 });
        expect(alertas[0]!.tipo).toBe('SIN_MOVIMIENTO');
    });
});

describe('El resumen de la cabecera', () => {
    it('cuenta las críticas aparte', () => {
        const r = resumirAtencion(evaluarAtencion(CON_DE_TODO));
        expect(r.total).toBe(6);
        expect(r.criticas).toBe(3);
    });
});
