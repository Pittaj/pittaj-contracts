/**
 * @fileoverview De quién es el problema cuando una lectura no cuadra.
 * @module Banking/Verdict
 * @version 1.0.0
 *
 * Vive en el contrato porque lo necesitan las dos capas —la web para decidir qué le dice al
 * usuario, el backend para explicar una escalada— y porque **ya nos pasó lo contrario**: la lista
 * de comprobaciones de calidad estaba duplicada, la web se quedó con cinco de siete, y la pantalla
 * anunciaba un fallo del neto de movimientos como «el documento parece de otra cuenta» con la
 * tarjeta de la cuenta diciendo «coincide» justo debajo. Una regla escrita dos veces son dos
 * verdades.
 *
 * ## Por qué existe
 *
 * El muestreo de ocho estados de cuenta reales (2026-08-12) encontró que **el lector acertó en los
 * ocho y nosotros fallamos cinco veredictos**. La suposición que costó los cinco fue dar por hecho
 * que, si la aritmética no cuadra, el equivocado es el lector. Dos de los ocho documentos **no
 * cuadran consigo mismos**: Azteca se desvía $1.29 de sus propios renglones y Rappi cobra $200.88
 * de intereses que no lista como movimiento. A los dos les dijimos «corrige las líneas señaladas»
 * sobre listas que estaban perfectas.
 *
 * Un rojo de más no es gratis: el dueño lo dijo probándolo — **un mensaje de error hace que no te
 * atrevas a importar**, aunque importar sea lo correcto.
 */

import { BANKING_CONSTANTS } from '../constants/bankingConstants.js';

/** Lo mínimo que necesita el clasificador de una comprobación. */
export interface CheckLike {
  readonly check: string;
  /** `null` = no comprobable. NO cuenta como fallo. */
  readonly passed: boolean | null;
}

/**
 * De quién es el problema.
 *
 * El orden importa: se contesta la pregunta más barata de accionar primero.
 */
export type ExtractionVerdictKind =
  /** Todo lo comprobable cuadró. */
  | 'CLEAN'
  /** El documento es de otra cuenta. No lo arregla ningún modelo ni editar líneas. */
  | 'WRONG_ACCOUNT'
  /** La lectura es buena; **el documento no cuadra consigo mismo**. Tampoco se arregla editando. */
  | 'DOCUMENT_INCONSISTENT'
  /**
   * La lectura es buena; **el documento cobra algo que no lista**.
   *
   * Distinto de `DOCUMENT_INCONSISTENT`: ahí el banco se contradice y no hay nada que hacer; aquí
   * el propio resumen **explica** la diferencia con un término concreto, así que hay una acción —
   * agregar ese renglón— y la pantalla la ofrece.
   *
   * Caso real: Rappi declara `Monto de intereses + $200.88` y no lo incluye en el desglose.
   */
  | 'DOCUMENT_INCOMPLETE'
  /** Hay algo que revisar en la lectura. */
  | 'NEEDS_REVIEW';

export interface ExtractionVerdict {
  readonly kind: ExtractionVerdictKind;
  /** Nombres de las que fallaron. */
  readonly failed: readonly string[];
  /** Nombres de las que **no se pudieron** comprobar: el documento no publica el dato. */
  readonly notEvaluated: readonly string[];
  /** Cuántas se pudieron evaluar. */
  readonly evaluated: number;
  /**
   * **Importar siempre está permitido.**
   *
   * Se declara aquí, como un campo, y no se deja implícito: no bloqueamos —el botón solo se
   * deshabilita por datos faltantes— pero el texto decía «corrige las líneas ANTES DE CONFIRMAR» y
   * se leía como una precondición. El permiso existía y estaba escondido, que es peor que
   * bloquear: quien no se atreve no importa, y quien se atreve no sabe si está haciendo algo
   * indebido.
   *
   * Si algún día hubiera un caso que de verdad impida importar, este campo es donde se dice — y
   * habrá que dar la razón, no solo el «no».
   */
  readonly canImport: true;
}

/**
 * La comprobación que decide si el problema es del documento.
 *
 * `SUMMARY_CLOSES` compara el saldo inicial contra los términos del resumen y contra el saldo
 * final **usando solo cifras impresas por el banco**: nuestras líneas no entran en esa cuenta. Si
 * falla, el documento se contradice a sí mismo y **ninguna edición de movimientos puede
 * arreglarlo**.
 */
const DOCUMENT_CHECK = 'SUMMARY_CLOSES';

const QUALITY = new Set<string>(BANKING_CONSTANTS.EXTRACTION_QUALITY_CHECKS);

export interface ClassifyOptions {
  /**
   * `true` si un término del resumen explica la diferencia entera (ver `findMissingSummaryTerm`).
   *
   * Se pasa desde fuera y no se deduce aquí porque hace falta la aritmética de los saldos, que
   * esta función no tiene — y meterla obligaría a arrastrar la extracción completa hasta el
   * clasificador para una sola rama.
   */
  readonly missingTermExplainsGap?: boolean;
}

/** Clasifica una lectura. Pura: mismas comprobaciones, mismo veredicto. */
export function classifyExtraction(
  checks: readonly CheckLike[] | undefined,
  options: ClassifyOptions = {},
): ExtractionVerdict {
  const todas = checks ?? [];
  const failed = todas.filter((c) => c.passed === false).map((c) => c.check);
  const notEvaluated = todas.filter((c) => c.passed === null).map((c) => c.check);
  const evaluated = todas.filter((c) => c.passed !== null).length;

  const base = { failed, notEvaluated, evaluated, canImport: true } as const;

  if (failed.length === 0) return { ...base, kind: 'CLEAN' };

  // La cuenta va primero: si el documento es de otra cuenta, lo demás sobra — se cambia el archivo
  // o se cambia la cuenta, y ninguna de las dos cosas se hace revisando renglones.
  if (failed.every((c) => !QUALITY.has(c))) return { ...base, kind: 'WRONG_ACCOUNT' };

  // El documento contradiciéndose gana sobre «revisar la lectura» AUNQUE haya otros fallos: cuando
  // la ecuación del propio banco no cierra, los demás descuadres son consecuencia de eso, no causa.
  // Es el caso Azteca: fallaban tres comprobaciones y la lectura era impecable.
  if (failed.includes(DOCUMENT_CHECK)) return { ...base, kind: 'DOCUMENT_INCONSISTENT' };

  // El resumen del banco explica el hueco con un término suyo: la lectura no está mal, al documento
  // le falta un renglón. Sin esto, la pantalla se contradecía sola — el encabezado en rojo
  // («revisa la lectura») y la barra de cuadre en ámbar ofreciendo agregar los $200.88 de Rappi.
  if (options.missingTermExplainsGap) return { ...base, kind: 'DOCUMENT_INCOMPLETE' };

  return { ...base, kind: 'NEEDS_REVIEW' };
}

/**
 * `true` si hubo poca evidencia con la que juzgar.
 *
 * Un documento que no publica su resumen ni su conteo puede pasar «las 2 comprobaciones» y verse
 * igual de sano que uno que pasó ocho. **No es lo mismo**, y decir solo el cociente lo esconde.
 * Éste es el verde débil que quedaba vivo después de arreglar los otros.
 */
export function hasWeakEvidence(verdict: ExtractionVerdict): boolean {
  return verdict.kind === 'CLEAN' && verdict.notEvaluated.length >= verdict.evaluated;
}

/** Un término del resumen que el detalle de movimientos no lista. */
export interface MissingSummaryTerm {
  readonly label: string;
  readonly amount: number;
  /** Signo en dirección del DINERO: `1` entra, `-1` sale. */
  readonly direction: 1 | -1;
}

/**
 * El cargo que el documento **cobra pero no lista**, cuando se puede señalar sin adivinar.
 *
 * Caso real (Rappi, abril 2026): el resumen declara `Monto de intereses + $200.88`, el desglose de
 * movimientos no lo incluye, y su propio «Total de cargos» coincide **al centavo** con lo que
 * leímos. La lectura es correcta y aun así el libro quedaría corto $200.88 si se importa tal cual.
 *
 * Ésa es la razón de existir de esta función y hay que decirla: convertir ese caso en un aviso
 * ámbar sin ofrecer el renglón sería peor que el rojo de antes. El rojo al menos frenaba.
 *
 * **Solo señala cuando hay una respuesta única.** Se exige que exactamente UN término del resumen
 * explique la diferencia al centavo; con dos candidatos no se propone nada, porque proponer el
 * equivocado es meter un movimiento inventado en la contabilidad. Y nunca se aplica solo: se
 * propone, el usuario lo ve y lo edita.
 *
 * @param difference - `saldo final declarado − saldo al que llevan los movimientos`, en dirección
 *   del dinero. Es lo que falta por explicar.
 */
export function findMissingSummaryTerm(
  difference: number,
  terms: readonly { readonly label: string; readonly amount: number; readonly sign: 1 | -1 }[],
  nature: 'DEBTOR' | 'CREDITOR',
  epsilon: number = BANKING_CONSTANTS.MONEY_EPSILON,
): MissingSummaryTerm | null {
  if (Math.abs(difference) <= epsilon) return null;

  const signoDeEntrada = nature === 'CREDITOR' ? -1 : 1;

  const candidatos = terms
    .map((t) => ({
      label: t.label,
      amount: t.amount,
      direction: (t.sign === signoDeEntrada ? 1 : -1) as 1 | -1,
    }))
    // El término tiene que explicar la diferencia ENTERA y en la dirección correcta: un cargo que
    // falta deja el saldo alto, no bajo.
    .filter((t) => Math.abs(t.direction * t.amount - difference) <= epsilon);

  return candidatos.length === 1 ? candidatos[0]! : null;
}
