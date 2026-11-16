import { describe, expect, it } from 'vitest';
import {
  diferenciasDeEfectivo,
  dondeEstaElEfectivo,
  porDepositar,
  retirosDelDueno,
  type LugarParaReporte,
  type MovimientoParaReporte,
} from '../../src/banking/index.js';

// La semana de la maqueta: dos cajas fuertes, José recoge las dos, paga a un proveedor, el dueño se lleva
// un préstamo y José deposita; el banco aún no confirma.
const lugares: LugarParaReporte[] = [
  { id: 'norte', name: 'Caja fuerte · Norte', cashRole: 'SAFE', openingBalance: 0, openingDate: '2026-11-01', locationId: 'n' },
  { id: 'centro', name: 'Caja fuerte · Centro', cashRole: 'SAFE', openingBalance: 0, openingDate: '2026-11-01', locationId: 'c' },
  { id: 'jose', name: 'En manos de José', cashRole: 'CUSTODY', openingBalance: 0, openingDate: '2026-11-01', locationId: null },
  { id: 'chica', name: 'Caja chica Norte', cashRole: 'PETTY', openingBalance: 2000, openingDate: '2026-11-01', locationId: 'n' },
];
const m = (o: Partial<MovimientoParaReporte> & Pick<MovimientoParaReporte, 'id' | 'accountId' | 'date' | 'direction' | 'amount'>): MovimientoParaReporte => ({
  status: 'CLEARED', categoryCode: 'TRASPASO', transferKind: null, counterpartyName: null, notes: null, ...o,
});
const movs: MovimientoParaReporte[] = [
  m({ id: 'corte-n', accountId: 'norte', date: '2026-11-09', direction: 'IN', amount: 20000 }),
  m({ id: 'corte-c', accountId: 'centro', date: '2026-11-10', direction: 'IN', amount: 25000 }),
  m({ id: 'rec-n-out', accountId: 'norte', date: '2026-11-10', direction: 'OUT', amount: 20000, transferKind: 'COLLECTION' }),
  m({ id: 'rec-n-in', accountId: 'jose', date: '2026-11-10', direction: 'IN', amount: 20000, transferKind: 'COLLECTION' }),
  m({ id: 'rec-c-out', accountId: 'centro', date: '2026-11-11', direction: 'OUT', amount: 25000, transferKind: 'COLLECTION' }),
  m({ id: 'rec-c-in', accountId: 'jose', date: '2026-11-11', direction: 'IN', amount: 25000, transferKind: 'COLLECTION' }),
  m({ id: 'proveedor', accountId: 'jose', date: '2026-11-11', direction: 'OUT', amount: 3000, categoryCode: 'PAGO_PROVEEDOR' }),
  m({ id: 'dueno', accountId: 'jose', date: '2026-11-12', direction: 'OUT', amount: 1650, categoryCode: 'PRESTAMO_A_SOCIO', notes: 'Colegiatura' }),
  m({ id: 'dep-out', accountId: 'jose', date: '2026-11-13', direction: 'OUT', amount: 40350, transferKind: 'DEPOSIT' }),
  m({ id: 'dep-in', accountId: 'bbva', date: '2026-11-13', direction: 'IN', amount: 40350, transferKind: 'DEPOSIT', status: 'PENDING' }),
  m({ id: 'gasto', accountId: 'chica', date: '2026-11-12', direction: 'OUT', amount: 120.5, categoryCode: 'GASTO' }),
  m({ id: 'anulado', accountId: 'chica', date: '2026-11-12', direction: 'OUT', amount: 999, status: 'VOID' }),
  m({ id: 'arqueo', accountId: 'centro', date: '2026-11-14', direction: 'OUT', amount: 100, categoryCode: 'FALTANTE_A_CARGO', counterpartyName: 'Ana' }),
];

describe('E5 · ¿Dónde está el efectivo?', () => {
  it('al 12 nov: José trae lo de las dos cajas menos el proveedor y el dueño', () => {
    const r = dondeEstaElEfectivo(lugares, movs, '2026-11-12', 7);
    expect(r.grupos.map((g) => [g.rol, g.total])).toEqual([
      ['SAFE', 0],
      ['CUSTODY', 40350],
      ['PETTY', 1879.5],
    ]);
    expect(r.total).toBe(42229.5);
    const jose = r.grupos[1]!.lugares[0]!;
    expect(jose).toMatchObject({ saldo: 40350, pendienteDesde: '2026-11-10', diasPendiente: 2, vencido: false });
  });

  it('el corte importa: al 9 nov solo había lo del Norte', () => {
    const r = dondeEstaElEfectivo(lugares, movs, '2026-11-09', 7);
    expect(r.total).toBe(22000);
  });

  it('lo que lleva más días que el ajuste se marca', () => {
    const r = dondeEstaElEfectivo(lugares, movs, '2026-11-12', 1);
    expect(r.grupos[1]!.lugares[0]!.vencido).toBe(true);
  });
});

describe('E5 · Por depositar', () => {
  it('antes del depósito: José, entrada por entrada', () => {
    const r = porDepositar(lugares, movs, '2026-11-12', 7);
    expect(r.enManos).toEqual([
      {
        lugarId: 'jose',
        lugar: 'En manos de José',
        total: 40350,
        pendientes: [
          { date: '2026-11-10', amount: 15350, dias: 2, vencido: false },
          { date: '2026-11-11', amount: 25000, dias: 1, vencido: false },
        ],
      },
    ]);
    expect(r.enTransito).toEqual([]);
  });

  it('después del depósito: nada en manos; el depósito sigue en tránsito', () => {
    const r = porDepositar(lugares, movs, '2026-11-14', 7);
    expect(r.enManos).toEqual([]);
    expect(r.enTransito).toEqual([{ date: '2026-11-13', amount: 40350, dias: 1 }]);
    expect(r.enCajasFuertes).toBe(-100);
    expect(r.total).toBe(40250);
  });
});

describe('E5 · Diferencias y retiros del dueño', () => {
  it('suma faltantes y sobrantes por persona, de arqueos y de cortes', () => {
    const r = diferenciasDeEfectivo(lugares, movs, [
      { date: '2026-11-10', cashierName: 'Ana', difference: -20 },
      { date: '2026-11-11', cashierName: 'Luis', difference: 5.5 },
      { date: '2026-11-11', cashierName: 'Luis', difference: 0 },
    ], '2026-11-01', '2026-11-30');
    expect(r.porPersona).toEqual([
      { quien: 'Ana', origen: 'CUSTODIA', faltantes: 100, sobrantes: 0, neto: -100, veces: 1 },
      { quien: 'Ana', origen: 'CORTE', faltantes: 20, sobrantes: 0, neto: -20, veces: 1 },
      { quien: 'Luis', origen: 'CORTE', faltantes: 0, sobrantes: 5.5, neto: 5.5, veces: 1 },
    ]);
    expect(r.faltantes).toBe(120);
    expect(r.sobrantes).toBe(5.5);
  });

  it('separa préstamo, reparto y lo que salió del cajón', () => {
    const r = retirosDelDueno(lugares, movs, [{ date: '2026-11-11', amount: 500, locationId: 'n', notes: null }], '2026-11-01', '2026-11-30', () => 'Caja Norte');
    expect(r).toMatchObject({ prestamos: 1650, repartos: 0, delCajon: 500, total: 2150 });
    expect(r.renglones.map((x) => [x.date, x.tipo, x.lugar])).toEqual([
      ['2026-11-11', 'DEL_CAJON', 'Caja Norte'],
      ['2026-11-12', 'PRESTAMO', 'En manos de José'],
    ]);
  });
});
