/**
 * @fileoverview La cadena del saldo corrido: una ecuación por renglón, no una para todos.
 * @module Banking/Verdict
 * @version 1.0.0
 *
 * Todo lo demás que se comprueba restringe **sumas**. Y una suma no distingue «bien leído» de «mal
 * leído dos veces»: el muestreo de estados reales encontró dos tarjetas donde los movimientos
 * venían con el signo invertido y el cuadre neto decía «exacto» porque los errores se cancelaban.
 *
 * Cuando el documento imprime su saldo corrido —`saldo[i] = saldo[i−1] + monto[i]`— eso deja de ser
 * posible. Con 85 movimientos hay 85 ecuaciones en vez de una, y cada renglón queda sujeto por su
 * cuenta. Un monto mal leído, un renglón fusionado, uno omitido o un signo al revés rompen la
 * cadena **en el sitio exacto donde ocurren**.
 *
 * ## Por qué vive en el contrato
 *
 * Porque devuelve **cuál renglón** falla, y de eso dependen los dos lados: el backend para
 * explicarlo y la web para señalar esa fila en la tabla de revisión. Escribir el recorrido dos
 * veces sería la misma trampa que ya nos costó una pantalla contradiciéndose sola —
 * `EXTRACTION_QUALITY_CHECKS` duplicada, la web con cinco de siete—. Una regla escrita dos veces
 * son dos verdades.
 *
 * Y hay una razón de más: la web **recalcula mientras el usuario teclea**. Un índice calculado en
 * el backend señalaría la fila equivocada en cuanto se edita o se borra un renglón.
 *
 * ## Lo que NO hace
 *
 * No rellena saldos que no vengan del papel. Un saldo derivado de los propios montos no verifica
 * nada —solo los repite— y una cadena así daría siempre verde. Si el documento no publica la
 * columna, esto no es comprobable, que **no es lo mismo que aprobado**.
 */

import { BANKING_CONSTANTS } from '../constants/bankingConstants.js';

/** Lo mínimo que necesita el recorrido de un renglón. */
export interface ChainLineLike {
  readonly amount: number;
  /** Saldo IMPRESO tras el movimiento. Ausente = el documento no lo publica en este renglón. */
  readonly balance?: number | null;
}

export interface RunningBalanceChainInput {
  readonly openingBalance: number;
  readonly lines: readonly ChainLineLike[];
  /** `'CREDITOR'` = el saldo del documento es una DEUDA (tarjeta): un cargo la sube. */
  readonly nature?: 'DEBTOR' | 'CREDITOR' | null;
}

export interface RunningBalanceChainResult {
  /** `null` = el documento no publica la columna, o la publica en tan pocos renglones que no encadena. */
  readonly passed: boolean | null;
  /** Índice (base 0) del primer renglón donde la cadena se rompe. `null` si no se rompe. */
  readonly firstBrokenIndex: number | null;
  /** Cuántos renglones traen saldo impreso. */
  readonly withBalance: number;
  /** Lo que el saldo anterior más el monto debería dar, en el renglón que falla. */
  readonly expected: number | null;
  /** Lo que el documento imprime en ese renglón. */
  readonly declared: number | null;
}

const VACIO: RunningBalanceChainResult = {
  passed: null,
  firstBrokenIndex: null,
  withBalance: 0,
  expected: null,
  declared: null,
};

/**
 * Recorre la cadena y se detiene en el primer eslabón roto.
 *
 * **Se detiene a propósito.** Un error en el renglón 12 descuadra los 73 siguientes, y enseñarlos
 * todos convierte un fallo en una lista ilegible: lo que hay que revisar es el primero, y los demás
 * se arreglan solos al corregirlo.
 *
 * El saldo inicial declarado sirve de eslabón cero cuando el primer renglón trae saldo: así se caza
 * también un movimiento que falte **al principio**, que de otro modo pasaría desapercibido porque
 * la cadena entre los renglones leídos sería perfectamente consistente.
 */
export function checkRunningBalanceChain(
  input: RunningBalanceChainInput,
  epsilon: number = BANKING_CONSTANTS.MONEY_EPSILON,
): RunningBalanceChainResult {
  const lineas = input.lines;
  const conSaldo = lineas.filter((l) => l.balance !== null && l.balance !== undefined).length;

  // Con menos de dos eslabones no hay cadena que comprobar. No comprobable NO es aprobado.
  if (conSaldo < 2) return { ...VACIO, withBalance: conSaldo };

  // En una tarjeta el saldo del documento es una DEUDA: un cargo (línea negativa, dinero que sale)
  // la SUBE. Es la misma inversión que el cuadre neto, y omitirla haría fallar la cadena entera en
  // cada tarjeta — el error que ya se cometió una vez con el cuadre.
  const signo = input.nature === 'CREDITOR' ? -1 : 1;

  let anterior: number | null = input.openingBalance;

  for (let i = 0; i < lineas.length; i += 1) {
    const linea = lineas[i]!;
    const saldo = linea.balance;

    if (saldo === null || saldo === undefined) {
      // Un hueco rompe el encadenado pero no es un error del renglón: se pierde el eslabón y se
      // sigue desde el siguiente que sí traiga saldo.
      anterior = null;
      continue;
    }

    if (anterior !== null) {
      const esperado = Math.round((anterior + signo * linea.amount) * 100) / 100;
      if (Math.abs(esperado - saldo) > epsilon) {
        return {
          passed: false,
          firstBrokenIndex: i,
          withBalance: conSaldo,
          expected: esperado,
          declared: saldo,
        };
      }
    }

    anterior = saldo;
  }

  return {
    passed: true,
    firstBrokenIndex: null,
    withBalance: conSaldo,
    expected: null,
    declared: null,
  };
}
