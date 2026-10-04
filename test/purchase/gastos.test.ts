/**
 * @fileoverview La lista de gastos y el reporte por concepto × mes (F6.4).
 *
 * Espejo de `ReporteDeGastosTests.cs` del escritorio: el mismo mes, con los mismos filtros, tiene
 * que dar el mismo número en las dos puntas.
 */

import { describe, it, expect } from 'vitest';
import {
    mesesEntre,
    diasDelRango,
    armarListaDeGastos,
    armarGastosPorConcepto,
    type RenglonDeGasto,
    type PartidaDeGasto,
    type ConceptoDelReporte,
} from '../../src/purchase/gastos';
import { getExpensesSchema } from '../../src/purchase/schemas/expenses.schema';

const LUZ = 'aaaaaaaa-0000-4000-8000-000000000001';
const RENTA = 'aaaaaaaa-0000-4000-8000-000000000002';
const OTROS = 'aaaaaaaa-0000-4000-8000-000000000009';
const PAN = 'bbbbbbbb-0000-4000-8000-000000000001';
const ABA = 'bbbbbbbb-0000-4000-8000-000000000002';
const HUE = 'cccccccc-0000-4000-8000-000000000001';
const OBR = 'cccccccc-0000-4000-8000-000000000002';

const CONCEPTOS: ConceptoDelReporte[] = [
    { id: LUZ, name: 'Luz', ledgerAccountCode: '601-03', isSystem: false },
    { id: RENTA, name: 'Renta', ledgerAccountCode: '601-02', isSystem: false },
    { id: OTROS, name: 'Otros gastos', ledgerAccountCode: '601-09', isSystem: true },
];

describe('Los meses', () => {
    it('van de uno a otro, cruzando el año', () => {
        expect(mesesEntre('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    });
    it('al revés no dan nada, y no pasan de 24', () => {
        expect(mesesEntre('2026-09', '2026-08')).toEqual([]);
        expect(mesesEntre('2020-01', '2026-12')).toHaveLength(24);
    });
    it('el rango de días termina en el último del mes, bisiestos incluidos', () => {
        expect(diasDelRango('2028-01', '2028-02')).toEqual({ primero: '2028-01-01', ultimo: '2028-02-29' });
    });
    it('el filtro de la lista acepta «sin concepto»', () => {
        expect(getExpensesSchema.safeParse({ desde: '2026-09', expenseConceptId: 'NONE' }).success).toBe(true);
        expect(getExpensesSchema.safeParse({ desde: '2026-13' }).success).toBe(false);
    });
});

const renglon = (p: Partial<RenglonDeGasto>): RenglonDeGasto => ({
    purchaseId: 'p1',
    purchaseNumber: 'OC-00001',
    status: 'ACTIVE',
    fecha: '2026-09-10',
    supplierId: 's1',
    supplierName: 'CFE',
    locationId: HUE,
    hasCfdi: true,
    dueDate: null,
    total: 1160,
    notas: 0,
    pagado: 0,
    conceptoId: LUZ,
    lineaId: ABA,
    base: 1000,
    ...p,
});

describe('La lista de gastos', () => {
    // La renta: un documento, dos renglones, dos líneas.
    const renta = [
        renglon({ purchaseId: 'r', purchaseNumber: 'OC-00002', supplierName: 'Arrendadora', conceptoId: RENTA, lineaId: ABA, base: 12000, total: 18560, pagado: 18560 }),
        renglon({ purchaseId: 'r', purchaseNumber: 'OC-00002', supplierName: 'Arrendadora', conceptoId: RENTA, lineaId: PAN, base: 4000, total: 18560, pagado: 18560 }),
    ];
    const luz = renglon({ purchaseId: 'l', purchaseNumber: 'OC-00003', total: 1160, pagado: 0, dueDate: '2026-10-12' });
    const ferreteria = renglon({ purchaseId: 'f', purchaseNumber: 'OC-00004', supplierName: 'Ferretería', conceptoId: null, lineaId: null, base: 500, total: 580, pagado: 580 });
    const borrador = renglon({ purchaseId: 'b', purchaseNumber: 'OC-00005', status: 'DRAFT', base: 300, total: 348 });
    const todo = [...renta, luz, ferreteria, borrador];

    it('arma un gasto por documento y los cajones cuentan solo lo vigente', () => {
        const { items, resumen } = armarListaDeGastos(todo, {}, new Date('2026-09-28T12:00:00Z'));
        expect(items).toHaveLength(4);
        expect(resumen.gastado).toBe(17500);
        expect(resumen.documentos).toBe(3);
        expect(resumen.borradores).toBe(1);
        expect(resumen.porPagar).toBe(1160);
        expect(resumen.documentosPorPagar).toBe(1);
        expect(resumen.proximoVencimiento).toBe('2026-10-12');
        expect(resumen.sinConcepto).toBe(1);
        expect(resumen.importeSinConcepto).toBe(500);
        expect(items.find((i) => i.id === 'b')!.saldo).toBe(0);   // un borrador aún no se debe
    });

    it('filtrar por línea enseña solo la parte que le toca', () => {
        const { items, resumen } = armarListaDeGastos(todo, { businessLineId: PAN });
        expect(items.map((i) => i.id)).toEqual(['r']);
        expect(items[0]!.importe).toBe(4000);
        expect(items[0]!.total).toBe(18560);
        expect(items[0]!.businessLineIds).toEqual([ABA, PAN]);
        expect(resumen.gastado).toBe(4000);
    });

    it('«sin concepto» encuentra lo que cae en Otros gastos', () => {
        const { items } = armarListaDeGastos(todo, { expenseConceptId: 'NONE' });
        expect(items.map((i) => i.id)).toEqual(['f']);
    });

    it('busca por folio o proveedor y filtra por sucursal', () => {
        expect(armarListaDeGastos(todo, { search: 'ferre' }).items.map((i) => i.id)).toEqual(['f']);
        expect(armarListaDeGastos(todo, { locationId: OBR }).items).toHaveLength(0);
    });

    it('lo vencido lleva sus días de atraso', () => {
        const { items } = armarListaDeGastos([luz], {}, new Date('2026-10-15T12:00:00Z'));
        expect(items[0]!.diasDeAtraso).toBe(3);
    });
});

const partida = (p: Partial<PartidaDeGasto>): PartidaDeGasto => ({
    fecha: '2026-09-10',
    conceptoId: LUZ,
    lineaId: ABA,
    locationId: HUE,
    importe: 100,
    origen: 'COMPRA',
    ...p,
});

describe('Gastos por concepto', () => {
    const meses = mesesEntre('2026-07', '2026-09');
    const partidas: PartidaDeGasto[] = [
        partida({ fecha: '2026-07-05', importe: 8720 }),
        partida({ fecha: '2026-08-05', importe: 9410 }),
        partida({ fecha: '2026-09-05', importe: 9960 }),
        partida({ fecha: '2026-07-01', conceptoId: RENTA, importe: 16000 }),
        partida({ fecha: '2026-08-01', conceptoId: RENTA, importe: 16000 }),
        partida({ fecha: '2026-09-01', conceptoId: RENTA, importe: 12000 }),
        partida({ fecha: '2026-09-01', conceptoId: RENTA, importe: 4000, lineaId: PAN, locationId: OBR }),
        partida({ fecha: '2026-07-20', conceptoId: null, importe: 2480 }),
        partida({ fecha: '2026-08-20', conceptoId: OTROS, importe: 1640 }),   // el del sistema = Otros
        partida({ fecha: '2026-09-20', conceptoId: 'borrado', importe: 410 }),   // ya no existe = Otros
        partida({ fecha: '2026-09-21', conceptoId: null, importe: 800, origen: 'CAJA' }),
        partida({ fecha: '2026-10-01', importe: 99999 }),                        // fuera del rango
    ];

    it('suma concepto × mes y deja lo no clasificado en Otros gastos', () => {
        const r = armarGastosPorConcepto(partidas, meses, CONCEPTOS);
        expect(r.filas.map((f) => f.nombre)).toEqual(['Renta', 'Luz', 'Otros gastos']);
        const otros = r.filas.find((f) => f.conceptId === null)!;
        expect(otros.importes).toEqual([2480, 1640, 1210]);
        expect(otros.ledgerAccountCode).toBe('601-09');
        expect(r.totales).toEqual([27200, 27050, 27170]);
        expect(r.deCaja).toBe(800);
        expect(r.todoEnOtros).toBe(false);
    });

    it('el cambio es contra el mes anterior y la participación es del último mes', () => {
        const r = armarGastosPorConcepto(partidas, meses, CONCEPTOS);
        const luz = r.filas.find((f) => f.conceptId === LUZ)!;
        expect(luz.cambioPercent).toBe(5.8);
        expect(luz.participacionPercent).toBe(36.7);
    });

    it('avisa de lo que sube tres meses y de Otros gastos que baja', () => {
        const r = armarGastosPorConcepto(partidas, meses, CONCEPTOS);
        expect(r.avisos).toEqual([
            { tipo: 'SUBE', conceptId: LUZ, nombre: 'Luz', cambioPercent: 14.2, desde: '2026-07' },
            { tipo: 'OTROS_BAJA', conceptId: null, nombre: 'Otros gastos', cambioPercent: -51.2, desde: '2026-07' },
        ]);
    });

    it('filtra por línea y por sucursal', () => {
        const pan = armarGastosPorConcepto(partidas, meses, CONCEPTOS, { businessLineId: PAN });
        expect(pan.total).toBe(4000);
        const obrador = armarGastosPorConcepto(partidas, meses, CONCEPTOS, { locationId: OBR });
        expect(obrador.filas.map((f) => f.nombre)).toEqual(['Renta']);
    });

    it('dice cuándo todo está en Otros gastos', () => {
        const r = armarGastosPorConcepto([partida({ conceptoId: null })], meses, CONCEPTOS);
        expect(r.todoEnOtros).toBe(true);
        expect(r.avisos).toEqual([]);
    });
});
