/**
 * @fileoverview (2.99.0) Tanda 3 de plan-efectivo: seguimiento del efectivo, corte con hora y acotado por sucursal.
 *
 * **Seguimiento.** De dónde vino y a dónde fue cada parte de un corte, una recolección o un depósito, y qué falta por
 * ubicar. No se guarda ninguna liga: se deriva de los movimientos de Bancos siguiendo el efectivo **primero lo más
 * viejo** (FIFO) por cada lugar. Cada entrada a un lugar que no viene de otro lugar de efectivo (la entrega de un corte,
 * un retiro del cajón, un cobro) abre un **lote** con su origen; cada salida consume lotes de ese lugar. Si la salida
 * es un traspaso a otro lugar de efectivo, los pedazos viajan con su camino; si no, ahí terminan (depositado, pagado,
 * retiro del dueño, faltante…). Lo que queda en un lugar al final sigue ahí.
 *
 * La nube y el escritorio llaman a esta misma cuenta (espejo C#: `SeguimientoDelEfectivo.cs`, mismos casos).
 */

import type {
  CorteSinDeposito,
  DiferenciaDeCorte,
  LugarParaReporte,
  MovimientoParaReporte,
  RetiroDelCajon,
} from './reportesDeEfectivo.js';

const c = (n: number): number => Math.round(n * 100);
const p = (centavos: number): number => centavos / 100;

// ── Corte con hora ──────────────────────────────────────────────────────────

/**
 * Deja fuera lo registrado el día del corte después de `instante` (ISO). Los movimientos sin `momento` del día del
 * corte se quedan: sin hora no se puede saber, y quitar efectivo que sí estaba sería peor que contar uno de más.
 */
export function recortarAlInstante<M extends MovimientoParaReporte>(
  movimientos: readonly M[],
  alCorte: string,
  instante: string | null | undefined,
): M[] {
  if (!instante) return [...movimientos];
  const limite = Date.parse(instante);
  return movimientos.filter((m) => m.date !== alCorte || !m.momento || Date.parse(m.momento) <= limite);
}

// ── Acotado por sucursal ────────────────────────────────────────────────────

export interface DatosDeEfectivo {
  readonly lugares: readonly LugarParaReporte[];
  readonly movimientos: readonly MovimientoParaReporte[];
  readonly cortes: readonly DiferenciaDeCorte[];
  readonly delCajon: readonly RetiroDelCajon[];
  readonly cortesSinDeposito: readonly CorteSinDeposito[];
}

/**
 * Lo de una sucursal: sus lugares (caja fuerte, cajas chicas, efectivo general), sus movimientos, la pierna de banco de
 * los depósitos que salieron de ellos, sus cortes y sus retiros del cajón. **«En manos de» no es de una sucursal** —una
 * persona trae efectivo de varias— y queda fuera del acotado; se ve sin filtro.
 */
export function acotarASucursal(datos: DatosDeEfectivo, locationId: string | null | undefined, sucursalDelCorte?: (closureId: string) => string | null): DatosDeEfectivo {
  if (!locationId) return datos;
  const lugares = datos.lugares.filter((l) => l.locationId === locationId);
  const ids = new Set(lugares.map((l) => l.id));
  const traspasos = new Set(datos.movimientos.filter((m) => ids.has(m.accountId) && m.transferId).map((m) => m.transferId!));
  const efectivo = new Set(datos.lugares.map((l) => l.id));
  return {
    lugares,
    movimientos: datos.movimientos.filter(
      (m) => ids.has(m.accountId) || (!efectivo.has(m.accountId) && m.transferId != null && traspasos.has(m.transferId)),
    ),
    cortes: datos.cortes.filter((x) => x.locationId === locationId),
    delCajon: datos.delCajon.filter((x) => x.locationId === locationId),
    cortesSinDeposito: sucursalDelCorte ? datos.cortesSinDeposito.filter((x) => sucursalDelCorte(x.closureId) === locationId) : datos.cortesSinDeposito,
  };
}

// ── Seguimiento ─────────────────────────────────────────────────────────────

export type DestinoDelEfectivo =
  /** Sigue en un lugar de efectivo (por ubicar: todavía no llega al banco ni se gastó). */
  | 'EN_LUGAR'
  /** Salió al banco en un depósito; `confirmado` dice si el banco ya lo reconoció. */
  | 'DEPOSITADO'
  | 'PAGO_A_PROVEEDOR'
  | 'RETIRO_DEL_DUENO'
  /** Diferencia de un arqueo a cargo de alguien. */
  | 'FALTANTE'
  /** Cualquier otra salida (un gasto, otro traspaso a una cuenta que no es de efectivo). */
  | 'OTRA_SALIDA';

export interface PasoDelEfectivo {
  readonly transferId: string;
  /** COLLECTION · DEPOSIT · REPLENISHMENT · TRANSFER */
  readonly kind: string | null;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly desdeId: string;
  readonly haciaId: string;
}

/** Un pedazo de efectivo con su origen, su camino y dónde terminó. */
export interface TramoDelEfectivo {
  /** El movimiento que lo hizo entrar a un lugar de efectivo (p. ej. la entrega del corte a la caja fuerte). */
  readonly origenId: string;
  readonly origenLugarId: string;
  /** YYYY-MM-DD */
  readonly origenFecha: string;
  readonly amount: number;
  readonly camino: readonly PasoDelEfectivo[];
  readonly destino: DestinoDelEfectivo;
  /** El lugar donde sigue (`EN_LUGAR`) o de donde salió. */
  readonly lugarId: string;
  /** El movimiento de salida (null si sigue en el lugar). */
  readonly salidaId: string | null;
  readonly salidaFecha: string | null;
  /** Solo `DEPOSITADO`: el banco ya lo confirmó. */
  readonly confirmado: boolean | null;
  /** Solo `FALTANTE`: a cargo de quién. */
  readonly quien: string | null;
}

export interface SeguimientoDelEfectivo {
  readonly tramos: readonly TramoDelEfectivo[];
  /** Salidas que no encontraron efectivo de dónde salir (el lugar estaba en cero): un registro que falta o un arqueo pendiente. */
  readonly sinOrigen: readonly { readonly salidaId: string; readonly lugarId: string; readonly date: string; readonly amount: number }[];
  /**
   * Tanda 5: la diferencia que el banco reportó al conciliar cada depósito (el `FALTANTE_A_CARGO` que nace ligado a él).
   * `amount` negativo es faltante (a cargo de `quien`); positivo, sobrante.
   */
  readonly diferenciasDeDeposito: readonly { readonly transferId: string; readonly movimientoId: string; readonly date: string; readonly amount: number; readonly quien: string | null }[];
}

interface Lote {
  origenId: string;
  origenLugarId: string;
  origenFecha: string;
  centavos: number;
  camino: PasoDelEfectivo[];
}

const DESTINO_POR_CATEGORIA: Record<string, DestinoDelEfectivo> = {
  PAGO_PROVEEDOR: 'PAGO_A_PROVEEDOR',
  PRESTAMO_A_SOCIO: 'RETIRO_DEL_DUENO',
  REPARTO_UTILIDADES: 'RETIRO_DEL_DUENO',
  FALTANTE_A_CARGO: 'FALTANTE',
};

const ordenar = (a: MovimientoParaReporte, b: MovimientoParaReporte): number => {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ma = a.momento ? Date.parse(a.momento) : null;
  const mb = b.momento ? Date.parse(b.momento) : null;
  if (ma != null && mb != null && ma !== mb) return ma - mb;
  // Sin hora, las entradas del día antes que las salidas: un día que cuadra no debe parecer en negativo.
  if (a.direction !== b.direction) return a.direction === 'IN' ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

/** Sigue todo el efectivo de los lugares hasta donde está hoy. */
export function seguimientoDelEfectivo(
  lugares: readonly LugarParaReporte[],
  movimientos: readonly MovimientoParaReporte[],
): SeguimientoDelEfectivo {
  const efectivo = new Set(lugares.map((l) => l.id));
  const vivos = movimientos.filter((m) => m.status !== 'VOID');
  const piernas = new Map<string, MovimientoParaReporte[]>();
  for (const m of vivos) if (m.transferId) piernas.set(m.transferId, [...(piernas.get(m.transferId) ?? []), m]);
  const otraPierna = (m: MovimientoParaReporte) => piernas.get(m.transferId ?? '')?.find((x) => x.id !== m.id) ?? null;

  const colas = new Map<string, Lote[]>();
  const cola = (id: string) => colas.get(id) ?? (colas.set(id, []), colas.get(id)!);
  const tramos: TramoDelEfectivo[] = [];
  const sinOrigen: { salidaId: string; lugarId: string; date: string; amount: number }[] = [];

  // El saldo de apertura es un lote más, con el lugar como origen.
  for (const l of lugares)
    if (c(l.openingBalance) > 0)
      cola(l.id).push({ origenId: `apertura:${l.id}`, origenLugarId: l.id, origenFecha: l.openingDate, centavos: c(l.openingBalance), camino: [] });

  for (const m of [...vivos].filter((x) => efectivo.has(x.accountId)).sort(ordenar)) {
    const otra = otraPierna(m);
    if (m.direction === 'IN') {
      // La entrada de un traspaso entre lugares la pone la salida (con el camino); aquí no abre lote.
      if (otra && efectivo.has(otra.accountId)) continue;
      cola(m.accountId).push({ origenId: m.id, origenLugarId: m.accountId, origenFecha: m.date, centavos: c(m.amount), camino: [] });
      continue;
    }
    let falta = c(m.amount);
    const q = cola(m.accountId);
    while (falta > 0 && q.length > 0) {
      const lote = q[0]!;
      const toma = Math.min(falta, lote.centavos);
      lote.centavos -= toma;
      falta -= toma;
      if (lote.centavos === 0) q.shift();
      if (otra && efectivo.has(otra.accountId)) {
        cola(otra.accountId).push({
          origenId: lote.origenId,
          origenLugarId: lote.origenLugarId,
          origenFecha: lote.origenFecha,
          centavos: toma,
          camino: [...lote.camino, { transferId: m.transferId!, kind: m.transferKind, date: m.date, desdeId: m.accountId, haciaId: otra.accountId }],
        });
        continue;
      }
      const deposito = m.transferKind === 'DEPOSIT' && otra != null;
      const camino = otra ? [...lote.camino, { transferId: m.transferId!, kind: m.transferKind, date: m.date, desdeId: m.accountId, haciaId: otra.accountId }] : lote.camino;
      const destino: DestinoDelEfectivo = deposito ? 'DEPOSITADO' : (m.categoryCode && DESTINO_POR_CATEGORIA[m.categoryCode]) || 'OTRA_SALIDA';
      tramos.push({
        origenId: lote.origenId,
        origenLugarId: lote.origenLugarId,
        origenFecha: lote.origenFecha,
        amount: p(toma),
        camino,
        destino,
        lugarId: m.accountId,
        salidaId: m.id,
        salidaFecha: m.date,
        confirmado: deposito ? otra!.status !== 'PENDING' : null,
        quien: destino === 'FALTANTE' ? m.counterpartyName ?? null : null,
      });
    }
    if (falta > 0) sinOrigen.push({ salidaId: m.id, lugarId: m.accountId, date: m.date, amount: p(falta) });
  }

  for (const [lugarId, q] of colas)
    for (const lote of q)
      if (lote.centavos > 0)
        tramos.push({
          origenId: lote.origenId,
          origenLugarId: lote.origenLugarId,
          origenFecha: lote.origenFecha,
          amount: p(lote.centavos),
          camino: lote.camino,
          destino: 'EN_LUGAR',
          lugarId,
          salidaId: null,
          salidaFecha: null,
          confirmado: null,
          quien: null,
        });

  const diferenciasDeDeposito = vivos
    .filter((m) => m.categoryCode === 'FALTANTE_A_CARGO' && m.sourceType === 'TRANSFER' && m.sourceId && !efectivo.has(m.accountId))
    .map((m) => ({
      transferId: m.sourceId!,
      movimientoId: m.id,
      date: m.date,
      amount: m.direction === 'IN' ? m.amount : -m.amount,
      quien: m.counterpartyName ?? null,
    }));

  return { tramos, sinOrigen, diferenciasDeDeposito };
}

export interface ResumenDelSeguimiento {
  readonly amount: number;
  readonly tramos: readonly TramoDelEfectivo[];
  readonly depositado: number;
  readonly depositadoSinConfirmar: number;
  readonly gastado: number;
  readonly faltantes: number;
  /** Sigue en algún lugar de efectivo: lo que falta por llevar al banco o gastar. */
  readonly porUbicar: number;
  /**
   * Tanda 5: solo para un depósito, lo que el banco reportó distinto al conciliarlo (negativo = faltante). null para
   * lo demás: un corte o una recolección pueden repartirse en varios depósitos.
   */
  readonly diferenciaAlConciliar: number | null;
}

const resumir = (tramos: readonly TramoDelEfectivo[]): ResumenDelSeguimiento => {
  const suma = (f: (t: TramoDelEfectivo) => boolean) => p(tramos.filter(f).reduce((s, t) => s + c(t.amount), 0));
  return {
    amount: suma(() => true),
    tramos,
    depositado: suma((t) => t.destino === 'DEPOSITADO' && t.confirmado === true),
    depositadoSinConfirmar: suma((t) => t.destino === 'DEPOSITADO' && t.confirmado !== true),
    gastado: suma((t) => t.destino === 'PAGO_A_PROVEEDOR' || t.destino === 'RETIRO_DEL_DUENO' || t.destino === 'OTRA_SALIDA'),
    faltantes: suma((t) => t.destino === 'FALTANTE'),
    porUbicar: suma((t) => t.destino === 'EN_LUGAR'),
    diferenciaAlConciliar: null,
  };
};

/** Lo que pasó con el efectivo que entró con un movimiento (p. ej. la entrega de un corte a la caja fuerte). */
export function seguimientoDeUnOrigen(s: SeguimientoDelEfectivo, origenId: string): ResumenDelSeguimiento {
  return resumir(s.tramos.filter((t) => t.origenId === origenId));
}

/** Lo que pasó con el efectivo que viajó en un traspaso (una recolección o un depósito): de dónde vino y a dónde fue. */
export function seguimientoDeUnTraspaso(s: SeguimientoDelEfectivo, transferId: string): ResumenDelSeguimiento {
  const resumen = resumir(s.tramos.filter((t) => t.camino.some((x) => x.transferId === transferId)));
  const diferencias = (s.diferenciasDeDeposito ?? []).filter((d) => d.transferId === transferId);
  return diferencias.length === 0 ? resumen : { ...resumen, diferenciaAlConciliar: p(diferencias.reduce((t, d) => t + c(d.amount), 0)) };
}

// ── Depósitos del banco sin origen ──────────────────────────────────────────

/** Una línea de un estado de cuenta. */
export interface LineaDelBanco {
  readonly id: string;
  readonly accountId: string;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly description: string;
  /** Con signo: positivo abona. */
  readonly amount: number;
  /** UNMATCHED · SUGGESTED · MATCHED · CREATED */
  readonly matchStatus: string;
}

const PARECE_EFECTIVO = /EFECTIVO|EFVO|EFE\b|DEP(?:OSITO)?\.?\s*(?:EN\s*)?(?:EFE|VENT)|VENTANILLA|PRACTICAJA|CAJERO RECEPTOR|\bATM\b/i;

/** ¿El concepto del banco dice que entró efectivo? */
export function pareceDepositoDeEfectivo(descripcion: string): boolean {
  return PARECE_EFECTIVO.test(descripcion);
}

/**
 * Lo que el banco dice que entró en efectivo y nadie ha ligado a un depósito de Pittaj: efectivo que alguien llevó
 * sin registrar de dónde salió.
 */
export function depositosDelBancoSinOrigen(lineas: readonly LineaDelBanco[], alCorte: string) {
  return lineas
    .filter((l) => l.amount > 0 && l.date <= alCorte && (l.matchStatus === 'UNMATCHED' || l.matchStatus === 'SUGGESTED') && pareceDepositoDeEfectivo(l.description))
    .map((l) => ({ id: l.id, accountId: l.accountId, date: l.date, description: l.description, amount: l.amount }))
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));
}
