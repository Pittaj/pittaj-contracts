/**
 * Los mismos casos que `CaducidadesTests` del escritorio (reporte EXPIRY).
 */
import { describe, expect, it } from 'vitest';
import { armarCaducidades, type LoteEnBodega } from '../../src/inventory/index.js';

const lote = (lotId: string, lotNumber: string, expiresAt: string | null, onHand: number, averageCost: number, extra: Partial<LoteEnBodega> = {}): LoteEnBodega => ({
    lotId,
    lotNumber,
    productId: 'leche',
    productCode: 'LEC',
    productName: 'Leche',
    warehouseId: 'alm',
    warehouseName: 'Almacén',
    status: 'AVAILABLE',
    expiresAt,
    onHand,
    averageCost,
    ...extra,
});

describe('armarCaducidades', () => {
    const lotes = [
        lote('l1', 'A1', '2026-11-20', 10, 18.5),
        lote('l2', 'A2', '2026-11-01', 4, 18.5),
        lote('l3', 'A3', '2027-03-01', 6, 18.5),
        lote('l4', 'A4', null, 9, 18.5),
        lote('l5', 'A5', '2026-11-10', 0, 18.5),
        lote('l6', 'Y1', '2026-11-10', 3, 40, { productId: 'yog', productCode: null, productName: 'Yogur', status: 'QUARANTINE' }),
        lote('l1', 'A1', '2026-11-20', 2.5, 20, { warehouseId: 'tda', warehouseName: 'Tienda' }),
    ];

    it('lo que caduca en el horizonte y lo caducado; sin existencia o sin fecha no sale', () => {
        const { rows, totals } = armarCaducidades(lotes, '2026-11-08', 30, true);
        expect(rows.map((r) => `${r.lotNumber}@${r.warehouseName}:${r.daysToExpiry}:${r.status}:${r.onHand}:${r.value}`)).toEqual([
            'A2@Almacén:-7:EXPIRED:4:74',
            'Y1@Almacén:2:QUARANTINE:3:120',
            'A1@Almacén:12:AVAILABLE:10:185',
            'A1@Tienda:12:AVAILABLE:2.5:50',
        ]);
        expect(totals).toEqual({ lots: 3, value: 429, expiredLots: 1, expiredValue: 74 });
    });

    it('sin caducados y con horizonte cero: solo lo que caduca hoy', () => {
        const hoy = armarCaducidades([...lotes, lote('l7', 'H', '2026-11-08', 1, 10)], '2026-11-08', 0, false);
        expect(hoy.rows.map((r) => `${r.lotNumber}:${r.daysToExpiry}`)).toEqual(['H:0']);
        expect(hoy.totals).toEqual({ lots: 1, value: 10, expiredLots: 0, expiredValue: 0 });
    });
});
