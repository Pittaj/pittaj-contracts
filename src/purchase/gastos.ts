/**
 * @fileoverview Las reglas de la lista de gastos y del reporte por concepto × mes (F6.4).
 * @module Contracts/Purchase
 *
 * Funciones puras que usa la nube; el escritorio tiene su gemela (`ReporteDeGastos.cs`) con las
 * mismas pruebas. Si cambias una regla aquí, cámbiala allá: el mismo mes, con los mismos filtros,
 * tiene que dar el mismo número en las dos puntas.
 *
 * ── De dónde sale cada peso ──
 *
 * - **Compras de gasto recibidas** (`kind = EXPENSE`, `status = ACTIVE`): la base sin IVA de cada
 *   renglón, en el mes de su recepción — el mismo mes que su póliza.
 * - **Gasto de caja** (salida de efectivo con motivo `EXPENSE`), solo en el reporte: todavía no
 *   lleva concepto (6.7), así que cae en Otros gastos.
 *
 * La línea de cada peso ya viene resuelta (`resolverLineaDelGasto`); aquí solo se filtra y se suma.
 */

import type {
    AvisoDeGasto,
    ExpenseByConceptResponse,
    ExpenseByConceptRow,
    ExpenseRowResponse,
    ExpensesSummary,
} from './responses/ExpensesResponse.js';
import { MAX_MESES_DEL_REPORTE, SIN_CONCEPTO } from './schemas/expenses.schema.js';
import { diasDeAtraso, saldoDeDocumento } from './cuentasPorPagar.js';

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const r1 = (n: number): number => Math.round((n + Number.EPSILON) * 10) / 10;

/** Nombre y cuenta de la fila de lo no clasificado cuando el catálogo no trae el del sistema. */
export const OTROS_GASTOS = { nombre: 'Otros gastos', ledgerAccountCode: '601-09' } as const;

// ─── Meses ───────────────────────────────────────────────────────────

/** Los meses `YYYY-MM` de `desde` a `hasta`, incluidos. Vacío si vienen al revés; a lo más 24. */
export function mesesEntre(desde: string, hasta: string): string[] {
    const [ay, am] = desde.split('-').map(Number);
    const [by, bm] = hasta.split('-').map(Number);
    const meses: string[] = [];
    let y = ay!;
    let m = am!;
    while ((y < by! || (y === by! && m <= bm!)) && meses.length < MAX_MESES_DEL_REPORTE) {
        meses.push(`${y}-${String(m).padStart(2, '0')}`);
        m += 1;
        if (m > 12) {
            m = 1;
            y += 1;
        }
    }
    return meses;
}

/** Primer y último día (`YYYY-MM-DD`) de un rango de meses. */
export function diasDelRango(desde: string, hasta: string): { primero: string; ultimo: string } {
    const [y, m] = hasta.split('-').map(Number);
    const ultimoDia = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
    return { primero: `${desde}-01`, ultimo: `${hasta}-${String(ultimoDia).padStart(2, '0')}` };
}

// ─── Filtro común ────────────────────────────────────────────────────

/** Sucursal y línea: los ejes del alcance de F7 (6.8). */
export interface FiltroDeGasto {
    readonly locationId?: string | null;
    readonly businessLineId?: string | null;
}

function pasa(f: FiltroDeGasto, sucursal: string | null, linea: string | null): boolean {
    if (f.locationId && sucursal !== f.locationId) return false;
    if (f.businessLineId && linea !== f.businessLineId) return false;
    return true;
}

// ─── La lista ────────────────────────────────────────────────────────

/** Un renglón de una compra de gasto, con lo de su documento al lado. */
export interface RenglonDeGasto {
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly status: 'DRAFT' | 'ACTIVE';
    readonly fecha: string;
    readonly supplierId: string;
    readonly supplierName: string;
    readonly locationId: string | null;
    readonly hasCfdi: boolean;
    readonly dueDate: string | null;
    readonly total: number;
    readonly notas: number;
    readonly pagado: number;
    /** `null` si el renglón no dice concepto o dice el del sistema. */
    readonly conceptoId: string | null;
    /** Ya resuelta. */
    readonly lineaId: string | null;
    /** Subtotal − descuento. */
    readonly base: number;
}

export interface FiltroDeLista extends FiltroDeGasto {
    readonly expenseConceptId?: string | null;
    readonly search?: string | null;
}

/**
 * Agrupa los renglones en gastos, aplica los filtros y arma los cajones.
 *
 * Un documento entra si **alguno** de sus renglones pasa el filtro de concepto y línea, y su
 * importe es la suma de esos renglones: filtrar «Panadería» enseña la parte de la renta que es de
 * Panadería, no la renta entera. La sucursal y la búsqueda son del documento.
 */
export function armarListaDeGastos(
    renglones: readonly RenglonDeGasto[],
    filtro: FiltroDeLista,
    hoy: Date = new Date()
): { items: ExpenseRowResponse[]; resumen: ExpensesSummary } {
    const texto = filtro.search?.trim().toLowerCase() ?? '';
    const porDocumento = new Map<string, RenglonDeGasto[]>();
    for (const r of renglones) {
        const lista = porDocumento.get(r.purchaseId);
        if (lista) lista.push(r);
        else porDocumento.set(r.purchaseId, [r]);
    }

    const items: ExpenseRowResponse[] = [];
    for (const doc of porDocumento.values()) {
        const d = doc[0]!;
        if (filtro.locationId && d.locationId !== filtro.locationId) continue;
        if (
            texto &&
            !d.purchaseNumber.toLowerCase().includes(texto) &&
            !d.supplierName.toLowerCase().includes(texto)
        )
            continue;

        const suyos = doc.filter(
            (r) =>
                (!filtro.businessLineId || r.lineaId === filtro.businessLineId) &&
                (!filtro.expenseConceptId ||
                    (filtro.expenseConceptId === SIN_CONCEPTO
                        ? r.conceptoId === null
                        : r.conceptoId === filtro.expenseConceptId))
        );
        if (suyos.length === 0) continue;

        const { saldo } =
            d.status === 'ACTIVE' ? saldoDeDocumento(d.total, d.notas, d.pagado) : { saldo: 0 };
        items.push({
            id: d.purchaseId,
            purchaseNumber: d.purchaseNumber,
            status: d.status,
            fecha: d.fecha,
            supplierId: d.supplierId,
            supplierName: d.supplierName,
            conceptIds: [...new Set(doc.map((r) => r.conceptoId))],
            businessLineIds: [...new Set(doc.map((r) => r.lineaId))],
            locationId: d.locationId,
            renglones: doc.length,
            hasCfdi: d.hasCfdi,
            dueDate: d.dueDate,
            total: r2(d.total),
            importe: r2(suyos.reduce((s, r) => s + r.base, 0)),
            saldo,
            diasDeAtraso: saldo > 0.009 ? diasDeAtraso(d.dueDate, hoy) : 0,
        });
    }

    // Lo más reciente arriba; el mismo día, el folio más alto.
    items.sort((a, b) =>
        a.fecha === b.fecha ? b.purchaseNumber.localeCompare(a.purchaseNumber) : b.fecha.localeCompare(a.fecha)
    );

    const vigentes = items.filter((i) => i.status === 'ACTIVE');
    const debidos = vigentes.filter((i) => i.saldo > 0.009);
    const sinConcepto = vigentes.filter((i) => i.conceptIds.includes(null));
    const vencimientos = debidos
        .map((i) => i.dueDate)
        .filter((v): v is string => Boolean(v))
        .sort();

    return {
        items,
        resumen: {
            gastado: r2(vigentes.reduce((s, i) => s + i.importe, 0)),
            documentos: vigentes.length,
            borradores: items.length - vigentes.length,
            porPagar: r2(debidos.reduce((s, i) => s + i.saldo, 0)),
            documentosPorPagar: debidos.length,
            proximoVencimiento: vencimientos[0] ?? null,
            sinConcepto: sinConcepto.length,
            importeSinConcepto: r2(
                porDocumentoSinConcepto(renglones, new Set(sinConcepto.map((i) => i.id)))
            ),
        },
    };
}

function porDocumentoSinConcepto(renglones: readonly RenglonDeGasto[], ids: Set<string>): number {
    return renglones
        .filter((r) => ids.has(r.purchaseId) && r.conceptoId === null)
        .reduce((s, r) => s + r.base, 0);
}

// ─── El reporte ──────────────────────────────────────────────────────

/** Un peso gastado, venga de una compra o de la caja. */
export interface PartidaDeGasto {
    /** `YYYY-MM-DD`. */
    readonly fecha: string;
    readonly conceptoId: string | null;
    readonly lineaId: string | null;
    readonly locationId: string | null;
    readonly importe: number;
    readonly origen: 'COMPRA' | 'CAJA';
}

/** Lo que el reporte necesita saber de cada concepto del catálogo. */
export interface ConceptoDelReporte {
    readonly id: string;
    readonly name: string;
    readonly ledgerAccountCode: string;
    readonly isSystem: boolean;
}

const cambio = (antes: number, ahora: number): number | null =>
    antes > 0.009 ? r1(((ahora - antes) / antes) * 100) : null;

/**
 * Concepto × mes. Lo que no tiene concepto, dice el del sistema o nombra uno que ya no está en el
 * catálogo cae en **Otros gastos**: así es como lo contabiliza la póliza.
 */
export function armarGastosPorConcepto(
    partidas: readonly PartidaDeGasto[],
    meses: readonly string[],
    conceptos: readonly ConceptoDelReporte[],
    filtro: FiltroDeGasto = {}
): ExpenseByConceptResponse {
    const catalogo = new Map(conceptos.filter((c) => !c.isSystem).map((c) => [c.id, c]));
    const sistema = conceptos.find((c) => c.isSystem);
    const indice = new Map(meses.map((m, i) => [m, i]));

    const filas = new Map<string, number[]>();
    let deCaja = 0;
    for (const p of partidas) {
        const i = indice.get(p.fecha.slice(0, 7));
        if (i === undefined || !pasa(filtro, p.locationId, p.lineaId)) continue;
        const clave = p.conceptoId && catalogo.has(p.conceptoId) ? p.conceptoId : '';
        const importes = filas.get(clave) ?? meses.map(() => 0);
        importes[i]! += p.importe;
        filas.set(clave, importes);
        if (p.origen === 'CAJA') deCaja += p.importe;
    }

    const totales = meses.map((_, i) => r2([...filas.values()].reduce((s, f) => s + f[i]!, 0)));
    const total = r2(totales.reduce((s, t) => s + t, 0));
    const ultimo = meses.length - 1;
    const totalDelUltimo = totales[ultimo] ?? 0;

    const armadas: ExpenseByConceptRow[] = [...filas.entries()].map(([clave, importes]) => {
        const c = clave ? catalogo.get(clave)! : null;
        const redondos = importes.map(r2);
        const suma = r2(redondos.reduce((s, x) => s + x, 0));
        return {
            conceptId: c?.id ?? null,
            nombre: c?.name ?? sistema?.name ?? OTROS_GASTOS.nombre,
            ledgerAccountCode: c?.ledgerAccountCode ?? sistema?.ledgerAccountCode ?? OTROS_GASTOS.ledgerAccountCode,
            importes: redondos,
            total: suma,
            cambioPercent: ultimo > 0 ? cambio(redondos[ultimo - 1]!, redondos[ultimo]!) : null,
            participacionPercent:
                totalDelUltimo > 0.009
                    ? r1(((redondos[ultimo] ?? 0) / totalDelUltimo) * 100)
                    : total > 0.009
                      ? r1((suma / total) * 100)
                      : 0,
        };
    });
    armadas.sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));

    const otros = armadas.find((f) => f.conceptId === null);
    return {
        meses: [...meses],
        filas: armadas,
        totales,
        total,
        cambioPercent: ultimo > 0 ? cambio(totales[ultimo - 1]!, totales[ultimo]!) : null,
        avisos: avisosDe(armadas, meses),
        todoEnOtros: total > 0.009 && Math.abs((otros?.total ?? 0) - total) < 0.01,
        deCaja: r2(deCaja),
    };
}

/**
 * Tres meses seguidos al alza (sin contar Otros gastos: que suba ahí es falta de clasificar, no
 * que la luz esté más cara), y Otros gastos tres meses a la baja. Los tres que más suben.
 */
function avisosDe(filas: readonly ExpenseByConceptRow[], meses: readonly string[]): AvisoDeGasto[] {
    if (meses.length < 3) return [];
    const u = meses.length - 1;
    const avisos: AvisoDeGasto[] = [];
    for (const f of filas) {
        const [a, b, c] = [f.importes[u - 2]!, f.importes[u - 1]!, f.importes[u]!];
        const pct = cambio(a, c);
        if (pct === null) continue;
        if (f.conceptId !== null && a < b && b < c) {
            avisos.push({ tipo: 'SUBE', conceptId: f.conceptId, nombre: f.nombre, cambioPercent: pct, desde: meses[u - 2]! });
        } else if (f.conceptId === null && a > b && b > c) {
            avisos.push({ tipo: 'OTROS_BAJA', conceptId: null, nombre: f.nombre, cambioPercent: pct, desde: meses[u - 2]! });
        }
    }
    const suben = avisos.filter((x) => x.tipo === 'SUBE').sort((x, y) => y.cambioPercent - x.cambioPercent).slice(0, 3);
    return [...suben, ...avisos.filter((x) => x.tipo === 'OTROS_BAJA')];
}
