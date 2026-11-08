/** Los mismos casos que `SalidaDeLaNotaTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import { posteosDeLaNota, semillaDeMovimientoDeNota, type MovimientoDeNota } from '../../src/supplier-note/index.js';

const N = 'nota-1';
const lineas = [
    { productId: 'aceite', quantity: 3 },
    { productId: 'arroz', quantity: 1.5 },
    { productId: 'aceite', quantity: 2 },
];
const m = (productId: string, direction: 'IN' | 'OUT', quantity: number): MovimientoDeNota => ({ productId, direction, quantity });
const ver = (p: ReturnType<typeof posteosDeLaNota>) => p.map((x) => `${x.productId}:${x.direction}:${x.quantity}:${x.seed}:${x.followsSeed ?? '-'}`);

describe('posteosDeLaNota', () => {
    it('aplicar saca por producto, en el orden de los renglones, con la ronda 0', () => {
        expect(ver(posteosDeLaNota(N, lineas, [], 'OUT'))).toEqual([
            'aceite:OUT:5:stock:supplier-note:nota-1:aceite:OUT:0:-',
            'arroz:OUT:1.5:stock:supplier-note:nota-1:arroz:OUT:0:-',
        ]);
    });

    it('lo que ya salió no vuelve a salir (reintento, o la otra punta ya lo sacó)', () => {
        expect(ver(posteosDeLaNota(N, lineas, [m('aceite', 'OUT', 3), m('aceite', 'OUT', 2)], 'OUT'))).toEqual([
            'arroz:OUT:1.5:stock:supplier-note:nota-1:arroz:OUT:0:-',
        ]);
    });

    it('reabrir regresa lo neto siguiendo a la salida de su ronda; volver a aplicar es la ronda siguiente', () => {
        const fuera = [m('aceite', 'OUT', 5), m('arroz', 'OUT', 1.5)];
        expect(ver(posteosDeLaNota(N, lineas, fuera, 'IN'))).toEqual([
            'aceite:IN:5:stock:supplier-note:nota-1:aceite:IN:0:stock:supplier-note:nota-1:aceite:OUT:0',
            'arroz:IN:1.5:stock:supplier-note:nota-1:arroz:IN:0:stock:supplier-note:nota-1:arroz:OUT:0',
        ]);
        const dentro = [...fuera, m('aceite', 'IN', 5), m('arroz', 'IN', 1.5)];
        expect(posteosDeLaNota(N, lineas, dentro, 'IN')).toEqual([]);
        expect(ver(posteosDeLaNota(N, [{ productId: 'aceite', quantity: 4 }], dentro, 'OUT'))).toEqual([
            'aceite:OUT:4:stock:supplier-note:nota-1:aceite:OUT:5:-',
        ]);
        expect(semillaDeMovimientoDeNota(N, 'p', 'OUT', 0.1 + 0.2)).toBe('stock:supplier-note:nota-1:p:OUT:0.3');
    });
});
