/** I7b · Las reservas que pone un documento. Los mismos vectores que `ReservasDeDocumentoTests`. */
import { describe, expect, it } from 'vitest';
import {
    accionDeApartado,
    accionDePedido,
    accionDeTraspaso,
    agruparRenglones,
    planDeReservas,
    semillaDeReserva,
    type RenglonAReservar,
    type ReservaExistente,
} from '../../src/inventory/index.js';

const r = (productId: string, quantity: number, warehouseId = 'w1'): RenglonAReservar => ({ productId, productName: productId, productCode: null, warehouseId, quantity });
const e = (id: string, productId: string, quantity: number, status: ReservaExistente['status'] = 'ACTIVE', warehouseId = 'w1'): ReservaExistente =>
    ({ id, productId, warehouseId, quantity, status });

describe('qué hace cada estado', () => {
    it('apartado, traspaso y pedido', () => {
        expect([accionDeApartado('OPEN'), accionDeApartado('COMPLETED'), accionDeApartado('CANCELLED'), accionDeApartado('EXPIRED')]).toEqual(['RESERVE', 'FULFILL', 'RELEASE', 'RELEASE']);
        expect([accionDeTraspaso('DRAFT'), accionDeTraspaso('SENT'), accionDeTraspaso('RECEIVED'), accionDeTraspaso('CANCELLED')]).toEqual(['RESERVE', 'FULFILL', 'FULFILL', 'RELEASE']);
        expect(['DRAFT', 'QUOTED', 'CONFIRMED', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'].map(accionDePedido))
            .toEqual(['RELEASE', 'RELEASE', 'RESERVE', 'RESERVE', 'RESERVE', 'FULFILL', 'FULFILL', 'FULFILL', 'RELEASE', 'RELEASE']);
    });

    it('la semilla del id', () => {
        expect(semillaDeReserva('LAYAWAY', 'L1', 'p1', 'w1')).toBe('stock:reservation:LAYAWAY:L1:p1:w1');
    });
});

describe('plan de reservas', () => {
    it('agrupa el mismo producto en la misma bodega', () => {
        expect(agruparRenglones([r('p1', 1), r('p1', 2.5), r('p1', 1, 'w2')]).map((x) => [x.productId, x.warehouseId, x.quantity])).toEqual([
            ['p1', 'w1', 3.5],
            ['p1', 'w2', 1],
        ]);
    });

    it('reservar crea lo nuevo, ajusta lo cambiado y deja en cero lo que se quitó, sin cerrar nada', () => {
        const plan = planDeReservas([e('a', 'p1', 2), e('b', 'p2', 1), e('c', 'p3', 4)], [r('p1', 2), r('p2', 3), r('p4', 1), r('p5', 0)], 'RESERVE');
        expect(plan.crear.map((x) => x.productId)).toEqual(['p4']);
        expect(plan.cambiar).toEqual([{ id: 'b', quantity: 3 }, { id: 'c', quantity: 0 }]);
        expect(plan.cerrar).toEqual([]);
    });

    it('una cerrada con la misma clave no se reabre ni se duplica', () => {
        const plan = planDeReservas([e('a', 'p1', 2, 'RELEASED')], [r('p1', 5)], 'RESERVE');
        expect(plan).toEqual({ crear: [], cambiar: [], cerrar: [] });
    });

    it('surtir y liberar cierran solo las activas', () => {
        const ex = [e('a', 'p1', 2), e('b', 'p2', 1, 'RELEASED')];
        expect(planDeReservas(ex, [], 'FULFILL').cerrar).toEqual([{ id: 'a', status: 'FULFILLED' }]);
        expect(planDeReservas(ex, [r('p1', 2)], 'RELEASE').cerrar).toEqual([{ id: 'a', status: 'RELEASED' }]);
    });
});
