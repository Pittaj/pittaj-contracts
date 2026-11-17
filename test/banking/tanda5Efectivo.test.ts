import { describe, expect, it } from 'vitest';
import type { LugarParaReporte, MovimientoParaReporte } from '../../src/banking/lugares/reportesDeEfectivo';
import {
  dondeEstaElEfectivo,
  inicioDeLaVentana,
  lugaresDesdeLaVentana,
  porDepositar,
} from '../../src/banking/lugares/reportesDeEfectivo';
import { seguimientoDelEfectivo, seguimientoDeUnOrigen, seguimientoDeUnTraspaso } from '../../src/banking/lugares/seguimientoDelEfectivo';

/** Tanda 5 de plan-efectivo. Los mismos casos que `Tanda5EfectivoTests.cs` del escritorio. */
const lugares: LugarParaReporte[] = [
  { id: 'norte', name: 'Caja fuerte · Norte', cashRole: 'SAFE', openingBalance: 0, openingDate: '2025-01-01', locationId: 'n' },
  { id: 'jose', name: 'En manos de José', cashRole: 'CUSTODY', openingBalance: 0, openingDate: '2025-01-01', locationId: null },
];
const M = (id: string, cuenta: string, date: string, dir: 'IN' | 'OUT', monto: number, x: Partial<MovimientoParaReporte> = {}): MovimientoParaReporte => ({
  id, accountId: cuenta, date, direction: dir, amount: monto, status: 'CLEARED', categoryCode: 'TRASPASO',
  transferKind: null, counterpartyName: null, notes: null, transferId: null, momento: null, sourceType: null, sourceId: null, ...x,
});

describe('la diferencia del depósito queda ligada al depósito', () => {
  const movs = [
    M('corte', 'norte', '2026-11-09', 'IN', 10000, { sourceType: 'CASH_CLOSURE' }),
    M('t1-out', 'norte', '2026-11-10', 'OUT', 10000, { transferId: 't1', transferKind: 'DEPOSIT' }),
    M('t1-in', 'bbva', '2026-11-10', 'IN', 10000, { transferId: 't1', transferKind: 'DEPOSIT' }),
    M('falta', 'bbva', '2026-11-11', 'OUT', 50, { categoryCode: 'FALTANTE_A_CARGO', counterpartyName: 'José', sourceType: 'TRANSFER', sourceId: 't1' }),
  ];
  const s = seguimientoDelEfectivo(lugares, movs);

  it('el depósito dice cuánto reportó de menos el banco y a cargo de quién', () => {
    expect(s.diferenciasDeDeposito).toEqual([{ transferId: 't1', movimientoId: 'falta', date: '2026-11-11', amount: -50, quien: 'José' }]);
    const r = seguimientoDeUnTraspaso(s, 't1');
    expect([r.depositado, r.diferenciaAlConciliar]).toEqual([10000, -50]);
  });

  it('un corte no lleva diferencia propia (se puede repartir en varios depósitos)', () => {
    expect(seguimientoDeUnOrigen(s, 'corte').diferenciaAlConciliar).toBeNull();
  });

  it('un faltante de arqueo (en un lugar de efectivo) no es diferencia de depósito', () => {
    const conArqueo = seguimientoDelEfectivo(lugares, [...movs, M('arqueo', 'norte', '2026-11-12', 'OUT', 10, { categoryCode: 'FALTANTE_A_CARGO', sourceType: 'TRANSFER', sourceId: 't1' })]);
    expect(conArqueo.diferenciasDeDeposito).toHaveLength(1);
  });
});

describe('ventana de lectura', () => {
  it('empieza 400 días antes del periodo (o del corte, si es anterior)', () => {
    expect(inicioDeLaVentana('2026-11-01', '2026-11-30')).toBe('2025-09-27');
    expect(inicioDeLaVentana('2026-11-01', '2026-10-01')).toBe('2025-08-27');
  });

  it('leer desde la ventana da los mismos saldos y la misma antigüedad que leer todo', () => {
    const todo = [
      M('viejo', 'jose', '2025-02-01', 'IN', 700),
      M('viejo-out', 'jose', '2025-03-01', 'OUT', 200),
      M('nuevo', 'jose', '2026-11-10', 'IN', 1000),
      M('nuevo-out', 'jose', '2026-11-12', 'OUT', 300),
      M('anulado', 'jose', '2025-02-02', 'IN', 9999, { status: 'VOID' }),
    ];
    const ventana = inicioDeLaVentana('2026-11-01', '2026-11-30');
    const previos = [{ accountId: 'jose', neto: 500, desde: '2025-02-01' }];
    const acotados = lugaresDesdeLaVentana(lugares, previos);
    const recientes = todo.filter((m) => m.date >= ventana);

    const a = dondeEstaElEfectivo(lugares, todo, '2026-11-30', 30);
    const b = dondeEstaElEfectivo(acotados, recientes, '2026-11-30', 30);
    expect(b.total).toBe(a.total);
    const jose = (d: typeof a) => d.grupos.find((g) => g.rol === 'CUSTODY')!.lugares[0]!;
    expect([jose(b).saldo, jose(b).pendienteDesde]).toEqual([jose(a).saldo, jose(a).pendienteDesde]);

    const pa = porDepositar(lugares, todo, '2026-11-30', 30).enManos[0]!.pendientes;
    const pb = porDepositar(acotados, recientes, '2026-11-30', 30).enManos[0]!.pendientes;
    expect(pb).toEqual(pa);
  });

  it('un lugar sin nada antes de la ventana queda igual', () => {
    expect(lugaresDesdeLaVentana(lugares, [])).toEqual(lugares);
  });
});

describe('el último arqueo de cada lugar', () => {
  it('dice cuándo se contó por última vez y cuándo cuadró', () => {
    const arqueos = [
      { accountId: 'norte', date: '2026-11-01', difference: 0 },
      { accountId: 'norte', date: '2026-11-08', difference: -20 },
      { accountId: 'norte', date: '2026-11-20', difference: 0 },
    ];
    const norte = (alCorte: string) =>
      dondeEstaElEfectivo(lugares, [M('a', 'norte', '2026-10-01', 'IN', 100)], alCorte, 7, arqueos).grupos.find((g) => g.rol === 'SAFE')!.lugares[0]!;
    expect([norte('2026-11-10').ultimoArqueo, norte('2026-11-10').ultimoArqueoQueCuadro]).toEqual(['2026-11-08', '2026-11-01']);
    expect([norte('2026-11-30').ultimoArqueo, norte('2026-11-30').ultimoArqueoQueCuadro]).toEqual(['2026-11-20', '2026-11-20']);
    expect(dondeEstaElEfectivo(lugares, [M('a', 'norte', '2026-10-01', 'IN', 100)], '2026-11-30', 7).grupos[0]!.lugares[0]!.ultimoArqueo).toBeNull();
  });
});
