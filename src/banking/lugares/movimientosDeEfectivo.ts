/**
 * @fileoverview E3 de plan-efectivo: recolectar, depositar y saber qué recolección cubre cada salida.
 *
 * **Una recolección y un depósito son traspasos**, no documentos nuevos: el dinero va de una cuenta
 * de efectivo a otra (caja fuerte → «en manos de») o de una de efectivo al banco, y Bancos ya sabe
 * mover dinero entre cuentas con dos piernas y la cuenta puente. Lo único que se agrega es **qué
 * clase de traspaso es** (`kind`), para que la pantalla lo diga y la conciliación sepa que un
 * depósito de efectivo puede llegar con una diferencia que paga quien lo llevó.
 *
 * Nada guarda «cuánto falta por depositar»: se deriva del saldo de la cuenta, y la asignación de
 * qué recolección cubre cada salida se calcula (`asignarFifo`), no se escribe.
 */

/** Qué clase de traspaso es. `TRANSFER` es el de siempre, entre cuentas propias. */
export const TRANSFER_KINDS = ['TRANSFER', 'COLLECTION', 'DEPOSIT'] as const;
export type TransferKind = (typeof TRANSFER_KINDS)[number];

export const ETIQUETA_DEL_TIPO_DE_TRASPASO: Record<TransferKind, string> = {
  TRANSFER: 'Traspaso',
  COLLECTION: 'Recolección',
  DEPOSIT: 'Depósito de efectivo',
};

/**
 * Categoría de sistema de la diferencia de un depósito de efectivo que paga quien lo llevó
 * (113-01 Faltantes de caja por recuperar). `BOTH`: si el banco recibió de más, la misma cuenta
 * baja — se le debe al custodio.
 */
export const FALTANTE_A_CARGO_CATEGORY_CODE = 'FALTANTE_A_CARGO';

/**
 * Cuánto puede diferir lo que el banco dice que recibió de lo que se declaró depositar para que la
 * conciliación aún lo **sugiera**: el 1 % del depósito, entre 2 centavos y $500. Un depósito de
 * $40,350 que llega como $40,300 se sugiere; uno de $500 que llega como $50, no.
 */
export function toleranciaDelDeposito(monto: number): number {
  const uno = Math.round(Math.abs(monto)) / 100;
  return Math.min(500, Math.max(0.02, uno));
}

/** Días de holgura entre la fecha del depósito y la del banco. */
export const DIAS_DE_HOLGURA_DEL_DEPOSITO = 5;

/** Una entrada a un lugar de efectivo (p. ej. una recolección), en orden de llegada. */
export interface EntradaDeEfectivo {
  readonly id: string;
  /** Fecha ISO; desempata por `id`. */
  readonly date: string;
  readonly amount: number;
}

/** Una salida del lugar (depósito, pago, retiro del dueño). */
export interface SalidaDeEfectivo {
  readonly id: string;
  readonly date: string;
  readonly amount: number;
}

/** Cuánto de una entrada cubrió una salida. */
export interface AsignacionFifo {
  readonly entradaId: string;
  readonly salidaId: string;
  readonly amount: number;
}

export interface ResultadoFifo {
  readonly asignaciones: readonly AsignacionFifo[];
  /** Lo que sigue sin salir de cada entrada (solo las que tienen algo). */
  readonly pendientes: readonly { readonly entradaId: string; readonly amount: number }[];
  /** Lo que salió sin entrada que lo cubra (el lugar quedó en negativo). */
  readonly sinCubrir: number;
}

const centavos = (n: number): number => Math.round(n * 100);
const ordenar = <T extends { date: string; id: string }>(xs: readonly T[]): T[] =>
  [...xs].sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.date < b.date ? -1 : 1));

/**
 * Primero en entrar, primero en salir: cada salida se cubre con las entradas más viejas que aún
 * tienen saldo. Responde «este depósito llevó lo de la recolección del Norte y parte de la del
 * Centro» y «de la del Centro quedan $1,200 en manos de José». Pura: el espejo en C# es
 * `AsignacionFifo.Calcular`.
 */
export function asignarFifo(
  entradas: readonly EntradaDeEfectivo[],
  salidas: readonly SalidaDeEfectivo[],
): ResultadoFifo {
  const restos = ordenar(entradas).map((e) => ({ id: e.id, resto: centavos(e.amount) }));
  const asignaciones: AsignacionFifo[] = [];
  let sinCubrir = 0;
  let i = 0;
  for (const s of ordenar(salidas)) {
    let falta = centavos(s.amount);
    while (falta > 0 && i < restos.length) {
      const e = restos[i]!;
      const toma = Math.min(falta, e.resto);
      if (toma > 0) asignaciones.push({ entradaId: e.id, salidaId: s.id, amount: toma / 100 });
      e.resto -= toma;
      falta -= toma;
      if (e.resto === 0) i++;
    }
    sinCubrir += falta;
  }
  return {
    asignaciones,
    pendientes: restos.filter((e) => e.resto > 0).map((e) => ({ entradaId: e.id, amount: e.resto / 100 })),
    sinCubrir: sinCubrir / 100,
  };
}
