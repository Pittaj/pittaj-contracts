/** (2.84.0) Las alertas de inventario por correo: resumen diario o una por alerta nueva. */
import { describe, expect, it } from 'vitest';
import { avisosPorCorreo, RENGLONES_DEL_RESUMEN, type AlertaParaCorreo } from '../../src/inventory/schemas/inventoryAlert.schema.js';

const ahora = new Date('2026-11-08T11:00:00Z');
const a = (id: string, severity: AlertaParaCorreo['severity'], valueAtRisk: number, since: string, kind: AlertaParaCorreo['kind'] = 'LOW_STOCK'): AlertaParaCorreo => ({
    id, kind, severity, message: `msg ${id}`, valueAtRisk, since,
});

describe('avisosPorCorreo', () => {
    const alertas = [
        a('b', 'MEDIUM', 50, '2026-11-01T00:00:00Z'),
        a('a', 'HIGH', 10, '2026-11-08T03:00:00Z', 'NEGATIVE'),
        a('c', 'MEDIUM', 900, '2026-11-07T20:00:00Z'),
    ];
    it('resumen: uno, lo grave primero y luego lo que más vale', () => {
        expect(avisosPorCorreo(alertas, true, ahora)).toEqual([{
            asunto: 'Inventario: 3 alertas sin revisar (1 grave)',
            renglones: ['Existencia baja: 2 · En negativo: 1', 'msg a', 'msg c', 'msg b'],
            total: 3,
        }]);
        expect(avisosPorCorreo([], true, ahora)).toEqual([]);
    });
    it('uno por alerta: solo lo que apareció en las últimas 24 horas', () => {
        expect(avisosPorCorreo(alertas, false, ahora).map((x) => x.asunto)).toEqual(['Inventario: msg a', 'Inventario: msg c']);
    });
    it('un resumen largo dice cuántas más', () => {
        const muchas = Array.from({ length: RENGLONES_DEL_RESUMEN + 3 }, (_, i) => a(`x${String(i).padStart(2, '0')}`, 'LOW', 0, '2026-11-01T00:00:00Z'));
        const r = avisosPorCorreo(muchas, true, ahora)[0]!;
        expect(r.renglones.at(-1)).toBe('y 3 más');
        expect(r.renglones).toHaveLength(RENGLONES_DEL_RESUMEN + 2);
    });
});
