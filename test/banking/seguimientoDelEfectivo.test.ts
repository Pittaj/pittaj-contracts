import { describe, expect, it } from 'vitest';
import type { LugarParaReporte, MovimientoParaReporte } from '../../src/banking/lugares/reportesDeEfectivo';
import { seguimientoDelPeriodo } from '../../src/banking/lugares/reportesDeEfectivo';
import {
  acotarASucursal,
  depositosDelBancoSinOrigen,
  recortarAlInstante,
  seguimientoDelEfectivo,
  seguimientoDeUnOrigen,
  seguimientoDeUnTraspaso,
} from '../../src/banking/lugares/seguimientoDelEfectivo';

/** Tanda 3. Los mismos casos que `SeguimientoDelEfectivoTests.cs` del escritorio. */
const D = (dia: number) => `2026-11-${String(dia).padStart(2, '0')}`;
const lugares: LugarParaReporte[] = [
  { id: 'norte', name: 'Caja fuerte · Norte', cashRole: 'SAFE', openingBalance: 0, openingDate: D(1), locationId: 'n' },
  { id: 'centro', name: 'Caja fuerte · Centro', cashRole: 'SAFE', openingBalance: 0, openingDate: D(1), locationId: 'c' },
  { id: 'jose', name: 'En manos de José', cashRole: 'CUSTODY', openingBalance: 0, openingDate: D(1), locationId: null },
];
const M = (id: string, cuenta: string, dia: number, dir: 'IN' | 'OUT', monto: number, x: Partial<MovimientoParaReporte> = {}): MovimientoParaReporte => ({
  id, accountId: cuenta, date: D(dia), direction: dir, amount: monto, status: 'CLEARED', categoryCode: 'TRASPASO',
  transferKind: null, counterpartyName: null, notes: null, transferId: null, momento: null, sourceType: null, ...x,
});
const movs: MovimientoParaReporte[] = [
  M('corte-n', 'norte', 9, 'IN', 20000, { sourceType: 'CASH_CLOSURE' }),
  M('corte-c', 'centro', 10, 'IN', 25000, { sourceType: 'CASH_CLOSURE' }),
  M('t1-out', 'norte', 10, 'OUT', 20000, { transferId: 't1', transferKind: 'COLLECTION', counterpartyName: 'José' }),
  M('t1-in', 'jose', 10, 'IN', 20000, { transferId: 't1', transferKind: 'COLLECTION' }),
  M('t2-out', 'centro', 11, 'OUT', 25000, { transferId: 't2', transferKind: 'COLLECTION' }),
  M('t2-in', 'jose', 11, 'IN', 25000, { transferId: 't2', transferKind: 'COLLECTION' }),
  M('proveedor', 'jose', 11, 'OUT', 3000, { categoryCode: 'PAGO_PROVEEDOR' }),
  M('dueno', 'jose', 12, 'OUT', 1650, { categoryCode: 'PRESTAMO_A_SOCIO' }),
  M('t3-out', 'jose', 13, 'OUT', 40000, { transferId: 't3', transferKind: 'DEPOSIT' }),
  M('t3-in', 'bbva', 13, 'IN', 40000, { transferId: 't3', transferKind: 'DEPOSIT' }),
  M('arqueo', 'centro', 14, 'OUT', 100, { categoryCode: 'FALTANTE_A_CARGO', counterpartyName: 'Ana' }),
];

describe('seguimiento del efectivo (tanda 3)', () => {
  const s = seguimientoDelEfectivo(lugares, movs);

  it('el corte del Centro: casi todo depositado y confirmado, 350 siguen en manos de José', () => {
    const r = seguimientoDeUnOrigen(s, 'corte-c');
    expect([r.amount, r.depositado, r.depositadoSinConfirmar, r.gastado, r.porUbicar]).toEqual([25000, 24650, 0, 0, 350]);
    expect(r.tramos.find((t) => t.destino === 'EN_LUGAR')?.lugarId).toBe('jose');
  });

  it('la recolección del Norte: lo que se pagó, el retiro del dueño y lo depositado', () => {
    const r = seguimientoDeUnTraspaso(s, 't1');
    expect([r.amount, r.gastado, r.depositado, r.porUbicar]).toEqual([20000, 4650, 15350, 0]);
    expect(r.tramos.map((t) => t.destino).sort()).toEqual(['DEPOSITADO', 'PAGO_A_PROVEEDOR', 'RETIRO_DEL_DUENO']);
  });

  it('el depósito: de qué cortes salió', () => {
    const r = seguimientoDeUnTraspaso(s, 't3');
    expect(r.tramos.map((t) => [t.origenId, t.amount])).toEqual([['corte-n', 15350], ['corte-c', 24650]]);
    const sinConfirmar = seguimientoDeUnTraspaso(seguimientoDelEfectivo(lugares, movs.map((m) => (m.id === 't3-in' ? { ...m, status: 'PENDING' } : m))), 't3');
    expect([sinConfirmar.depositado, sinConfirmar.depositadoSinConfirmar]).toEqual([0, 40000]);
  });

  it('una salida sin efectivo de dónde salir queda sin origen', () => {
    expect(s.sinOrigen).toEqual([{ salidaId: 'arqueo', lugarId: 'centro', date: D(14), amount: 100 }]);
  });

  it('los documentos del periodo: dos cortes, dos recolecciones y un depósito', () => {
    const r = seguimientoDelPeriodo(lugares, movs, s, D(1), D(30));
    expect(r.documentos.map((d) => `${d.tipo}:${d.id}`)).toEqual(['DEPOSITO:t3', 'RECOLECCION:t2', 'CORTE:corte-c', 'RECOLECCION:t1', 'CORTE:corte-n']);
    expect(seguimientoDelPeriodo(lugares, movs, s, D(13), D(13)).documentos.map((d) => d.id)).toEqual(['t3']);
  });

  it('corte con hora: lo registrado después del instante, ese día, no cuenta', () => {
    const conHora = [
      M('a', 'norte', 9, 'IN', 1, { momento: '2026-11-09T15:00:00Z' }),
      M('b', 'norte', 9, 'IN', 2, { momento: '2026-11-09T19:00:00Z' }),
      M('c', 'norte', 9, 'IN', 4),
      M('d', 'norte', 8, 'IN', 8, { momento: '2026-11-08T23:00:00Z' }),
    ];
    expect(recortarAlInstante(conHora, D(9), '2026-11-09T17:00:00Z').map((m) => m.id)).toEqual(['a', 'c', 'd']);
    expect(recortarAlInstante(conHora, D(9), null)).toHaveLength(4);
  });

  it('acotar a una sucursal: sus lugares, sus depósitos y sin «en manos de»', () => {
    const conDeposito = [...movs, M('t4-out', 'norte', 15, 'OUT', 10, { transferId: 't4', transferKind: 'DEPOSIT' }), M('t4-in', 'bbva', 15, 'IN', 10, { transferId: 't4', transferKind: 'DEPOSIT' })];
    const r = acotarASucursal({ lugares, movimientos: conDeposito, cortes: [{ date: D(9), cashierName: 'Ana', difference: -1, locationId: 'n' }, { date: D(9), cashierName: 'Luis', difference: 1, locationId: 'c' }], delCajon: [], cortesSinDeposito: [] }, 'n');
    expect(r.lugares.map((l) => l.id)).toEqual(['norte']);
    expect(r.movimientos.map((m) => m.id)).toEqual(['corte-n', 't1-out', 't4-out', 't4-in']);
    expect(r.cortes.map((x) => x.cashierName)).toEqual(['Ana']);
  });

  it('depósitos del banco sin origen: efectivo que llegó y nadie ligó', () => {
    const r = depositosDelBancoSinOrigen(
      [
        { id: '1', accountId: 'bbva', date: D(5), description: 'DEPOSITO EN EFECTIVO SUC 123', amount: 5000, matchStatus: 'UNMATCHED' },
        { id: '2', accountId: 'bbva', date: D(6), description: 'DEP EFECTIVO PRACTICAJA', amount: 800, matchStatus: 'MATCHED' },
        { id: '3', accountId: 'bbva', date: D(6), description: 'SPEI RECIBIDO CLIENTE', amount: 900, matchStatus: 'UNMATCHED' },
        { id: '4', accountId: 'bbva', date: D(7), description: 'DEPOSITO VENTANILLA', amount: 300, matchStatus: 'SUGGESTED' },
        { id: '5', accountId: 'bbva', date: D(20), description: 'DEPOSITO EN EFECTIVO', amount: 1, matchStatus: 'UNMATCHED' },
      ],
      D(14),
    );
    expect(r.map((x) => x.id)).toEqual(['1', '4']);
  });
});
