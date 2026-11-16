import { describe, expect, it } from 'vitest';
import { aplicaElTopeDeCajaChica } from '../../src/banking/lugares/movimientosDeEfectivo';
import { aperturaEfectiva, dondeEstaElEfectivo, type LugarParaReporte, type MovimientoParaReporte } from '../../src/banking/lugares/reportesDeEfectivo';

/** Tanda 4. Los mismos casos que `ArreglosTanda4Tests.cs` del escritorio. */
describe('arreglos de la tanda 4', () => {
  it('el tope de caja chica es por gasto: no aplica a traspasos, faltantes ni retiros del dueño', () => {
    expect(aplicaElTopeDeCajaChica('GASTO')).toBe(true);
    expect(aplicaElTopeDeCajaChica(null)).toBe(true);
    for (const c of ['TRASPASO', 'FALTANTE_A_CARGO', 'PRESTAMO_A_SOCIO', 'REPARTO_UTILIDADES']) expect(aplicaElTopeDeCajaChica(c)).toBe(false);
  });

  it('la caja fuerte abre desde su primer movimiento si es más viejo que su apertura', () => {
    const caja: LugarParaReporte = { id: 'cf', name: 'Caja fuerte', cashRole: 'SAFE', openingBalance: 0, openingDate: '2026-11-16', locationId: 'n' };
    const movs: MovimientoParaReporte[] = [
      { id: 'a', accountId: 'cf', date: '2026-11-09', direction: 'IN', amount: 500, status: 'CLEARED', categoryCode: 'TRASPASO', transferKind: null, counterpartyName: null, notes: null },
      { id: 'b', accountId: 'cf', date: '2026-11-01', direction: 'IN', amount: 1, status: 'VOID', categoryCode: 'TRASPASO', transferKind: null, counterpartyName: null, notes: null },
    ];
    expect(aperturaEfectiva(caja, movs)).toBe('2026-11-09');
    expect(dondeEstaElEfectivo([caja], movs, '2026-11-10', 7).total).toBe(500);
  });
});
