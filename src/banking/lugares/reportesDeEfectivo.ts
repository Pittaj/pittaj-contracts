/**
 * @fileoverview (2.96.0) E5 de plan-efectivo: los reportes del efectivo, como cuentas puras.
 *
 * Todo se deriva de los movimientos de Bancos —nada se guarda— y cada reporte acepta una **fecha de
 * corte**. La nube y el escritorio llaman a la misma cuenta con los mismos datos (el escritorio la
 * espeja en `ReportesDeEfectivo.cs` con los mismos casos), así que «¿cuánto efectivo hay?» da lo
 * mismo en las dos puntas.
 *
 * - {@link dondeEstaElEfectivo}: saldo por lugar y por persona al corte, con lo más viejo en manos de alguien.
 * - {@link porDepositar}: lo que sigue sin depositar (con antigüedad) y los depósitos aún en tránsito.
 * - {@link diferenciasDeEfectivo}: faltantes y sobrantes por persona (arqueos, depósitos y cortes de caja).
 * - {@link retirosDelDueno}: lo que el dueño se llevó, por tipo, separado de los gastos.
 */

import { z } from 'zod';
import { asignarFifo, diasEntre } from './movimientosDeEfectivo.js';
import type { SeguimientoDelEfectivo, TramoDelEfectivo } from './seguimientoDelEfectivo.js';

export type RolDeEfectivo = 'SAFE' | 'PETTY' | 'GENERAL' | 'CUSTODY';

/** Una cuenta de efectivo de Bancos. */
export interface LugarParaReporte {
  readonly id: string;
  readonly name: string;
  /** Sin rol = efectivo general. */
  readonly cashRole: RolDeEfectivo | null;
  readonly openingBalance: number;
  /** YYYY-MM-DD */
  readonly openingDate: string;
  readonly locationId: string | null;
}

/** Un movimiento de Bancos (de un lugar de efectivo, o la pierna de banco de un depósito de efectivo). */
export interface MovimientoParaReporte {
  readonly id: string;
  readonly accountId: string;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly direction: 'IN' | 'OUT';
  readonly amount: number;
  /** PENDING · CLEARED · VOID */
  readonly status: string;
  readonly categoryCode: string | null;
  /** Si es pierna de traspaso: TRANSFER · COLLECTION · DEPOSIT · REPLENISHMENT. */
  readonly transferKind: string | null;
  readonly counterpartyName: string | null;
  readonly notes: string | null;
  /** Tanda 3: el traspaso del que es pierna (empareja la salida de un lugar con la entrada del otro). */
  readonly transferId?: string | null;
  /** Tanda 3: cuándo se registró (ISO, UTC). Ordena el día y permite el corte con hora. */
  readonly momento?: string | null;
  /** Tanda 3: de dónde nació (`CASH_CLOSURE` = la entrega de un corte). */
  readonly sourceType?: string | null;
}

/** Un retiro del dueño hecho desde el cajón de la caja (E0: motivo `OWNER_DRAW`). */
export interface RetiroDelCajon {
  /** YYYY-MM-DD */
  readonly date: string;
  readonly amount: number;
  readonly locationId: string | null;
  readonly notes: string | null;
}

/** La diferencia de un corte de caja (contado − esperado del efectivo), con su cajero. */
export interface DiferenciaDeCorte {
  /** YYYY-MM-DD */
  readonly date: string;
  readonly cashierName: string;
  readonly difference: number;
  /** Tanda 3: la sucursal del corte, para acotar por sucursal. */
  readonly locationId?: string | null;
}

const c = (n: number): number => Math.round(n * 100);
const p = (centavos: number): number => centavos / 100;
const vivo = (m: MovimientoParaReporte): boolean => m.status !== 'VOID';
const ORDEN: readonly RolDeEfectivo[] = ['SAFE', 'CUSTODY', 'PETTY', 'GENERAL'];
const rolDe = (l: LugarParaReporte): RolDeEfectivo => l.cashRole ?? 'GENERAL';

// ── ¿Dónde está el efectivo? ────────────────────────────────────────────────

export interface LugarAlCorte {
  readonly id: string;
  readonly name: string;
  readonly saldo: number;
  /** Solo «en manos de»: la fecha de la entrada más vieja que sigue pendiente (FIFO). */
  readonly pendienteDesde: string | null;
  readonly diasPendiente: number | null;
  /** Lleva más días que `diasEnManos`. */
  readonly vencido: boolean;
  /**
   * Tanda 1: el saldo quedó bajo cero. Pasa cuando dos equipos sin red sacan de la misma caja: no se
   * bloquea (sería perder un registro), se avisa para que se arquee.
   */
  readonly negativo: boolean;
}

export interface DondeEstaElEfectivo {
  readonly alCorte: string;
  readonly total: number;
  /** Los lugares que quedaron bajo cero al corte: hay que arquearlos. */
  readonly enNegativo: readonly { readonly id: string; readonly name: string; readonly saldo: number }[];
  readonly grupos: readonly { readonly rol: RolDeEfectivo; readonly total: number; readonly lugares: readonly LugarAlCorte[] }[];
}

/** El saldo de cada lugar al corte (apertura + movimientos no anulados hasta esa fecha). */
export function dondeEstaElEfectivo(
  lugares: readonly LugarParaReporte[],
  movimientos: readonly MovimientoParaReporte[],
  alCorte: string,
  diasEnManos: number,
): DondeEstaElEfectivo {
  const hasta = movimientos.filter((m) => vivo(m) && m.date <= alCorte);
  const grupos = ORDEN.map((rol) => {
    const delRol = lugares
      .filter((l) => rolDe(l) === rol && l.openingDate <= alCorte)
      .map((l): LugarAlCorte => {
        const propios = hasta.filter((m) => m.accountId === l.id);
        const saldo = p(c(l.openingBalance) + propios.reduce((s, m) => s + (m.direction === 'IN' ? c(m.amount) : -c(m.amount)), 0));
        let pendienteDesde: string | null = null;
        if (rol === 'CUSTODY') {
          const fifo = asignarFifo(
            propios.filter((m) => m.direction === 'IN').map((m) => ({ id: m.id, date: m.date, amount: m.amount })),
            propios.filter((m) => m.direction === 'OUT').map((m) => ({ id: m.id, date: m.date, amount: m.amount })),
          );
          const primera = fifo.pendientes[0];
          pendienteDesde = primera ? propios.find((m) => m.id === primera.entradaId)?.date ?? null : null;
        }
        const diasPendiente = pendienteDesde ? diasEntre(pendienteDesde, alCorte) : null;
        return {
          id: l.id,
          name: l.name,
          saldo,
          pendienteDesde,
          diasPendiente,
          vencido: diasPendiente != null && diasPendiente > diasEnManos,
          negativo: c(saldo) < 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { rol, total: p(delRol.reduce((s, l) => s + c(l.saldo), 0)), lugares: delRol };
  }).filter((g) => g.lugares.length > 0);
  const enNegativo = grupos.flatMap((g) => g.lugares.filter((l) => l.negativo).map((l) => ({ id: l.id, name: l.name, saldo: l.saldo })));
  return { alCorte, total: p(grupos.reduce((s, g) => s + c(g.total), 0)), enNegativo, grupos };
}

// ── Por depositar ───────────────────────────────────────────────────────────

export interface PorDepositar {
  readonly alCorte: string;
  /** Lo que sigue en manos de alguien, entrada por entrada (FIFO), con su antigüedad. */
  readonly enManos: readonly {
    readonly lugarId: string;
    readonly lugar: string;
    readonly total: number;
    readonly pendientes: readonly { readonly date: string; readonly amount: number; readonly dias: number; readonly vencido: boolean }[];
  }[];
  /** Lo que hay en cajas fuertes y efectivo general: también espera depósito. */
  readonly enCajasFuertes: number;
  /** Depósitos de efectivo que el banco todavía no confirma (pierna de banco en tránsito). */
  readonly enTransito: readonly { readonly date: string; readonly amount: number; readonly dias: number }[];
  /**
   * Tanda 1: cortes anteriores a E2 (no entregaron a la caja fuerte) cuyo «a depositar» nadie ha
   * ligado a un depósito. Es la parte histórica de 103-01, aparte para que no se confunda con lo de hoy.
   */
  readonly cortesAnteriores: readonly { readonly closureId: string; readonly date: string; readonly amount: number; readonly dias: number }[];
  readonly total: number;
}

/** Un corte anterior a E2 con efectivo a depositar que nadie ligó a un depósito. */
export interface CorteSinDeposito {
  readonly closureId: string;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly amount: number;
}

export function porDepositar(
  lugares: readonly LugarParaReporte[],
  movimientos: readonly MovimientoParaReporte[],
  alCorte: string,
  diasEnManos: number,
  cortesSinDeposito: readonly CorteSinDeposito[] = [],
): PorDepositar {
  const donde = dondeEstaElEfectivo(lugares, movimientos, alCorte, diasEnManos);
  const hasta = movimientos.filter((m) => vivo(m) && m.date <= alCorte);
  const enManos = lugares
    .filter((l) => rolDe(l) === 'CUSTODY' && l.openingDate <= alCorte)
    .map((l) => {
      const propios = hasta.filter((m) => m.accountId === l.id);
      const fifo = asignarFifo(
        propios.filter((m) => m.direction === 'IN').map((m) => ({ id: m.id, date: m.date, amount: m.amount })),
        propios.filter((m) => m.direction === 'OUT').map((m) => ({ id: m.id, date: m.date, amount: m.amount })),
      );
      const pendientes = fifo.pendientes.map((x) => {
        const date = propios.find((m) => m.id === x.entradaId)?.date ?? alCorte;
        const dias = diasEntre(date, alCorte);
        return { date, amount: x.amount, dias, vencido: dias > diasEnManos };
      });
      return { lugarId: l.id, lugar: l.name, total: p(pendientes.reduce((s, x) => s + c(x.amount), 0)), pendientes };
    })
    .filter((x) => x.pendientes.length > 0)
    .sort((a, b) => a.lugar.localeCompare(b.lugar, 'es'));
  const enCajasFuertes = p(
    donde.grupos.filter((g) => g.rol === 'SAFE' || g.rol === 'GENERAL').reduce((s, g) => s + c(g.total), 0),
  );
  const efectivo = new Set(lugares.map((l) => l.id));
  const enTransito = hasta
    .filter((m) => m.transferKind === 'DEPOSIT' && m.direction === 'IN' && !efectivo.has(m.accountId) && m.status === 'PENDING')
    .map((m) => ({ date: m.date, amount: m.amount, dias: diasEntre(m.date, alCorte) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const cortesAnteriores = cortesSinDeposito
    .filter((x) => x.date <= alCorte && c(x.amount) > 0)
    .map((x) => ({ closureId: x.closureId, date: x.date, amount: x.amount, dias: diasEntre(x.date, alCorte) }))
    .sort((a, b) => (a.date === b.date ? (a.closureId < b.closureId ? -1 : 1) : a.date < b.date ? -1 : 1));
  const total = p(
    enManos.reduce((s, x) => s + c(x.total), 0) +
      c(enCajasFuertes) +
      enTransito.reduce((s, x) => s + c(x.amount), 0) +
      cortesAnteriores.reduce((s, x) => s + c(x.amount), 0),
  );
  return { alCorte, enManos, enCajasFuertes, enTransito, cortesAnteriores, total };
}

// ── Diferencias ─────────────────────────────────────────────────────────────

export interface DiferenciasDeEfectivo {
  readonly porPersona: readonly {
    readonly quien: string;
    /** `CUSTODIA` = arqueos y depósitos (113-01); `CORTE` = cortes de caja. */
    readonly origen: 'CUSTODIA' | 'CORTE';
    readonly faltantes: number;
    readonly sobrantes: number;
    /** sobrantes − faltantes: negativo es lo que esa persona debe. */
    readonly neto: number;
    readonly veces: number;
  }[];
  readonly faltantes: number;
  readonly sobrantes: number;
}

/** La categoría de sistema de la diferencia a cargo de alguien (contracts: `FALTANTE_A_CARGO_CATEGORY_CODE`). */
const FALTANTE = 'FALTANTE_A_CARGO';

export function diferenciasDeEfectivo(
  lugares: readonly LugarParaReporte[],
  movimientos: readonly MovimientoParaReporte[],
  cortes: readonly DiferenciaDeCorte[],
  desde: string,
  hasta: string,
): DiferenciasDeEfectivo {
  const nombre = new Map(lugares.map((l) => [l.id, l.name]));
  const acc = new Map<string, { quien: string; origen: 'CUSTODIA' | 'CORTE'; f: number; s: number; veces: number }>();
  const sumar = (quien: string, origen: 'CUSTODIA' | 'CORTE', centavos: number) => {
    const k = `${origen}|${quien}`;
    const r = acc.get(k) ?? { quien, origen, f: 0, s: 0, veces: 0 };
    if (centavos < 0) r.f += -centavos;
    else r.s += centavos;
    r.veces++;
    acc.set(k, r);
  };
  for (const m of movimientos) {
    if (!vivo(m) || m.categoryCode !== FALTANTE || m.date < desde || m.date > hasta) continue;
    const quien = m.counterpartyName ?? nombre.get(m.accountId) ?? 'Sin responsable';
    sumar(quien, 'CUSTODIA', m.direction === 'IN' ? c(m.amount) : -c(m.amount));
  }
  for (const d of cortes) {
    if (d.date < desde || d.date > hasta || c(d.difference) === 0) continue;
    sumar(d.cashierName || 'Sin cajero', 'CORTE', c(d.difference));
  }
  const porPersona = [...acc.values()]
    .map((r) => ({ quien: r.quien, origen: r.origen, faltantes: p(r.f), sobrantes: p(r.s), neto: p(r.s - r.f), veces: r.veces }))
    .sort((a, b) => a.neto - b.neto || a.quien.localeCompare(b.quien, 'es'));
  return {
    porPersona,
    faltantes: p(porPersona.reduce((s, r) => s + c(r.faltantes), 0)),
    sobrantes: p(porPersona.reduce((s, r) => s + c(r.sobrantes), 0)),
  };
}

// ── Retiros del dueño ───────────────────────────────────────────────────────

export type TipoDeRetiroDelDueno = 'PRESTAMO' | 'REPARTO' | 'DEL_CAJON';

export interface RetirosDelDueno {
  readonly renglones: readonly { readonly date: string; readonly tipo: TipoDeRetiroDelDueno; readonly amount: number; readonly lugar: string; readonly notes: string | null }[];
  readonly prestamos: number;
  readonly repartos: number;
  /** Del cajón (E0): préstamo al socio, pero sin pasar por un lugar de Bancos. */
  readonly delCajon: number;
  readonly total: number;
}

const TIPO_POR_CATEGORIA: Record<string, TipoDeRetiroDelDueno> = {
  PRESTAMO_A_SOCIO: 'PRESTAMO',
  REPARTO_UTILIDADES: 'REPARTO',
};

export function retirosDelDueno(
  lugares: readonly LugarParaReporte[],
  movimientos: readonly MovimientoParaReporte[],
  delCajon: readonly RetiroDelCajon[],
  desde: string,
  hasta: string,
  nombreDeSucursal: (locationId: string | null) => string = () => 'Caja',
): RetirosDelDueno {
  const nombre = new Map(lugares.map((l) => [l.id, l.name]));
  const renglones = [
    ...movimientos
      .filter((m) => vivo(m) && m.direction === 'OUT' && m.categoryCode && TIPO_POR_CATEGORIA[m.categoryCode] && m.date >= desde && m.date <= hasta)
      .map((m) => ({ date: m.date, tipo: TIPO_POR_CATEGORIA[m.categoryCode!]!, amount: m.amount, lugar: nombre.get(m.accountId) ?? 'Bancos', notes: m.notes })),
    ...delCajon
      .filter((r) => r.date >= desde && r.date <= hasta)
      .map((r) => ({ date: r.date, tipo: 'DEL_CAJON' as const, amount: r.amount, lugar: nombreDeSucursal(r.locationId), notes: r.notes })),
  ].sort((a, b) => (a.date === b.date ? a.lugar.localeCompare(b.lugar, 'es') : a.date < b.date ? -1 : 1));
  const suma = (t: TipoDeRetiroDelDueno) => p(renglones.filter((r) => r.tipo === t).reduce((s, r) => s + c(r.amount), 0));
  const prestamos = suma('PRESTAMO');
  const repartos = suma('REPARTO');
  const cajon = suma('DEL_CAJON');
  return { renglones, prestamos, repartos, delCajon: cajon, total: p(c(prestamos) + c(repartos) + c(cajon)) };
}

// ── La respuesta del endpoint ───────────────────────────────────────────────

/** Un corte, una recolección o un depósito del periodo, para abrir su seguimiento. */
export interface DocumentoDeSeguimiento {
  readonly tipo: 'CORTE' | 'RECOLECCION' | 'DEPOSITO';
  /** Para un corte, el movimiento de su entrega (origen); para los otros, el traspaso. */
  readonly id: string;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly amount: number;
  /** Corte: a dónde entró. Recolección y depósito: de dónde salió. */
  readonly lugar: string;
  readonly quien: string | null;
}

/** Tanda 3: los documentos del periodo y los tramos que los tocan (el resumen lo hace `seguimientoDeUnOrigen`/`DeUnTraspaso`). */
export function seguimientoDelPeriodo(
  lugares: readonly LugarParaReporte[],
  movimientos: readonly MovimientoParaReporte[],
  seguimiento: SeguimientoDelEfectivo,
  desde: string,
  hasta: string,
): { readonly documentos: readonly DocumentoDeSeguimiento[]; readonly tramos: readonly TramoDelEfectivo[] } {
  const nombre = new Map(lugares.map((l) => [l.id, l.name]));
  const efectivo = new Set(lugares.map((l) => l.id));
  const enPeriodo = movimientos.filter((m) => vivo(m) && efectivo.has(m.accountId) && m.date >= desde && m.date <= hasta);
  const documentos: DocumentoDeSeguimiento[] = [
    ...enPeriodo
      .filter((m) => m.direction === 'IN' && m.sourceType === 'CASH_CLOSURE')
      .map((m) => ({ tipo: 'CORTE' as const, id: m.id, date: m.date, amount: m.amount, lugar: nombre.get(m.accountId) ?? '', quien: null })),
    ...enPeriodo
      .filter((m) => m.direction === 'OUT' && m.transferId && (m.transferKind === 'COLLECTION' || m.transferKind === 'DEPOSIT'))
      .map((m) => ({
        tipo: m.transferKind === 'COLLECTION' ? ('RECOLECCION' as const) : ('DEPOSITO' as const),
        id: m.transferId!,
        date: m.date,
        amount: m.amount,
        lugar: nombre.get(m.accountId) ?? '',
        quien: m.counterpartyName,
      })),
  ].sort((a, b) => (a.date === b.date ? (a.tipo < b.tipo ? -1 : 1) : a.date > b.date ? -1 : 1));
  const origenes = new Set(documentos.filter((d) => d.tipo === 'CORTE').map((d) => d.id));
  const traspasos = new Set(documentos.filter((d) => d.tipo !== 'CORTE').map((d) => d.id));
  const tramos = seguimiento.tramos.filter((t) => origenes.has(t.origenId) || t.camino.some((x) => traspasos.has(x.transferId)));
  return { documentos, tramos };
}

/** GET /api/bank-reports/cash?asOf=&from=&to= — los cuatro reportes de una vez. */
export interface CashReportsResponse {
  readonly dondeEsta: DondeEstaElEfectivo;
  readonly porDepositar: PorDepositar;
  readonly diferencias: DiferenciasDeEfectivo;
  readonly retirosDelDueno: RetirosDelDueno;
  readonly desde: string;
  readonly hasta: string;
  /** Tanda 3: seguimiento de los cortes, recolecciones y depósitos del periodo. */
  readonly seguimiento: {
    readonly documentos: readonly DocumentoDeSeguimiento[];
    readonly tramos: readonly TramoDelEfectivo[];
    readonly sinOrigen: SeguimientoDelEfectivo['sinOrigen'];
  };
  /** Tanda 3: lo que el banco dice que entró en efectivo y nadie ligó a un depósito. */
  readonly depositosSinOrigen: readonly { readonly id: string; readonly accountId: string; readonly date: string; readonly description: string; readonly amount: number }[];
  /** Tanda 3: el instante del corte, si se pidió con hora. */
  readonly alInstante: string | null;
  /** Tanda 3: la sucursal a la que se acotó (null = todas). Sin «en manos de» cuando hay sucursal. */
  readonly locationId: string | null;
}


const fechaCivil = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Query de GET /api/bank-reports/cash. Sin fechas: corte hoy y el mes en curso. */
export const getCashReportsSchema = z.object({
  asOf: fechaCivil.optional(),
  from: fechaCivil.optional(),
  to: fechaCivil.optional(),
  /** Tanda 3: el corte con hora, como instante ISO (el cliente lo arma en su zona). */
  asOfInstant: z.string().datetime({ offset: true }).optional(),
  /** Tanda 3: acotar a una sucursal. */
  locationId: z.string().uuid().optional(),
});
