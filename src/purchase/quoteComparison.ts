/**
 * @fileoverview Comparar lo que cotizaron: el mejor precio, los totales y lo que te ahorras.
 * @module Contracts/Purchase/QuoteComparison
 *
 * ── Por qué esto vive en contracts ──
 *
 * Espejo literal de `Pittaj.Domain.Purchasing.QuoteComparison` del escritorio, como `purchaseState`
 * y `reposicion`. **La comparación es todo el módulo**: si las dos puntas marcaran distinto el mejor
 * precio, cotizar dejaría de servir en las dos.
 *
 * ── Y el número del que estoy más convencido ──
 *
 * **El ahorro va junto al número de entregas.** Los ERP grandes te dan la tabla y te dejan solo; en
 * una tienda, partir una compra en tres entregas por noventa pesos casi nunca vale la pena, y
 * decirlo es más útil que marcar el mejor precio y callar.
 */

/** Un renglón de la solicitud: qué y cuánto. Sin precio — el precio es lo que se pregunta. */
export interface QuoteLineInput {
    readonly productId: string;
    readonly productName: string;
    readonly quantity: number;
}

/** Lo que un proveedor contestó de un renglón. */
export interface QuotedPrice {
    readonly productId: string;
    readonly unitPrice: number;
}

/** La respuesta de un proveedor. */
export interface QuoteResponseInput {
    readonly supplierId: string;
    readonly supplierName: string;
    /**
     * Dijo que no va a cotizar.
     *
     * Pasa la mitad de las veces, y sin registrarlo la solicitud se queda esperando para siempre en
     * «1 de 3». Su columna **se queda en su sitio, apagada**: esconderla haría que la comparación
     * pareciera de dos proveedores cuando se le preguntó a tres, y esa diferencia es justo lo que
     * hay que recordar la próxima vez que se elija a quién pedirle.
     */
    readonly declined: boolean;
    /** Hasta cuándo sostiene el precio. Nulo = no lo dijo. */
    readonly validUntil: Date | null;
    readonly prices: readonly QuotedPrice[];
}

/** Lo que cuesta un renglón con un proveedor concreto. */
export interface CeldaDeComparacion {
    readonly supplierId: string;
    readonly unitPrice: number | null;
    readonly amount: number;
    /** El más barato de la fila. Empate: gana el primero, que es a quien se preguntó antes. */
    readonly esMejor: boolean;
}

export interface FilaDeComparacion {
    readonly productId: string;
    readonly productName: string;
    readonly quantity: number;
    readonly celdas: readonly CeldaDeComparacion[];
    /** Quién lo tiene más barato. Nulo si nadie cotizó ese renglón. */
    readonly mejorSupplierId: string | null;
}

export interface TotalDeProveedor {
    readonly supplierId: string;
    readonly supplierName: string;
    readonly declined: boolean;
    /**
     * Lo que costaría comprarle TODO a él.
     *
     * `null` cuando no cotizó todos los renglones: un total parcial presentado como total invita a
     * compararlo con los completos y a elegir al que menos cotizó.
     */
    readonly totalTodo: number | null;
    /** Lo que costaría comprarle solo los renglones en los que gana. */
    readonly totalSeleccionado: number;
    /** Cuántos renglones gana. Cero = no entra en el reparto. */
    readonly renglonesGanados: number;
}

export interface ComparacionDeCotizacion {
    readonly filas: readonly FilaDeComparacion[];
    readonly totales: readonly TotalDeProveedor[];

    /** Lo que cuesta partir la compra por el mejor precio de cada renglón. */
    readonly totalPartiendo: number;
    /** El mejor total comprándole todo a uno solo, y a quién. */
    readonly mejorTotalUnico: number | null;
    readonly mejorProveedorUnicoId: string | null;
    /**
     * Lo que te ahorras al partir, contra comprarle todo al mejor.
     *
     * Puede ser cero: cuando el mejor de uno solo también gana todos los renglones, partir no
     * ahorra nada — y decirlo evita tres entregas por gusto.
     */
    readonly ahorroAlPartir: number;
    /** En cuántas entregas se convierte. Es la mitad de la decisión. */
    readonly entregasAlPartir: number;
}

/** Un céntimo. Por debajo de esto, dos precios son el mismo precio. */
const EPS = 0.005;

/**
 * La comparación entera.
 *
 * ⚠️ Los importes se calculan **cantidad × precio unitario cotizado**, sin impuestos: una cotización
 * no es un documento fiscal y meter IVA aquí haría que el total no cuadrara con la orden que
 * después se crea, que sí lo calcula a su manera.
 */
export function compararCotizacion(
    lines: readonly QuoteLineInput[],
    responses: readonly QuoteResponseInput[]
): ComparacionDeCotizacion {
    const activas = responses.filter((r) => !r.declined);

    const filas: FilaDeComparacion[] = lines.map((linea) => {
        const precios = new Map<string, number>();
        for (const r of activas) {
            const p = r.prices.find((x) => x.productId === linea.productId);
            if (p && p.unitPrice > 0) precios.set(r.supplierId, p.unitPrice);
        }

        let mejorId: string | null = null;
        let mejorPrecio = Number.POSITIVE_INFINITY;
        // Se recorre en el orden de las respuestas: en un empate gana el primero, que es a quien se
        // le preguntó antes. Cualquier otro criterio sería inventar una preferencia que nadie dio.
        for (const r of responses) {
            const precio = precios.get(r.supplierId);
            if (precio === undefined) continue;
            if (precio < mejorPrecio - EPS) {
                mejorPrecio = precio;
                mejorId = r.supplierId;
            }
        }

        return {
            productId: linea.productId,
            productName: linea.productName,
            quantity: linea.quantity,
            mejorSupplierId: mejorId,
            celdas: responses.map((r) => {
                const precio = precios.get(r.supplierId) ?? null;
                return {
                    supplierId: r.supplierId,
                    unitPrice: precio,
                    amount: precio === null ? 0 : redondear(precio * linea.quantity),
                    esMejor: mejorId === r.supplierId,
                };
            }),
        };
    });

    const totales: TotalDeProveedor[] = responses.map((r) => {
        const suyas = filas.map((f) => f.celdas.find((c) => c.supplierId === r.supplierId)!);
        const cotizoTodo = !r.declined && suyas.every((c) => c.unitPrice !== null);

        return {
            supplierId: r.supplierId,
            supplierName: r.supplierName,
            declined: r.declined,
            totalTodo: cotizoTodo ? redondear(suyas.reduce((acc, c) => acc + c.amount, 0)) : null,
            totalSeleccionado: redondear(
                suyas.filter((c) => c.esMejor).reduce((acc, c) => acc + c.amount, 0)
            ),
            renglonesGanados: suyas.filter((c) => c.esMejor).length,
        };
    });

    const totalPartiendo = redondear(totales.reduce((acc, t) => acc + t.totalSeleccionado, 0));

    // El mejor de uno solo: solo cuentan los que cotizaron TODO. Comparar contra uno que cotizó la
    // mitad diría que comprarle a él es más barato, cuando es que le falta la otra mitad.
    let mejorTotalUnico: number | null = null;
    let mejorProveedorUnicoId: string | null = null;
    for (const t of totales) {
        if (t.totalTodo === null) continue;
        if (mejorTotalUnico === null || t.totalTodo < mejorTotalUnico - EPS) {
            mejorTotalUnico = t.totalTodo;
            mejorProveedorUnicoId = t.supplierId;
        }
    }

    return {
        filas,
        totales,
        totalPartiendo,
        mejorTotalUnico,
        mejorProveedorUnicoId,
        ahorroAlPartir:
            mejorTotalUnico === null ? 0 : Math.max(0, redondear(mejorTotalUnico - totalPartiendo)),
        // Cuántos proveedores ganan al menos un renglón: es en cuántas entregas se convierte, y sin
        // ese número el ahorro no se puede juzgar.
        entregasAlPartir: totales.filter((t) => t.renglonesGanados > 0).length,
    };
}

/** Cuántos contestaron de cuántos se preguntó. La columna que se mira en la lista. */
export function respuestasRecibidas(responses: readonly QuoteResponseInput[]): {
    readonly contestaron: number;
    readonly invitados: number;
} {
    return {
        // El que dijo «no voy a cotizar» CUENTA como contestado: el pendiente está cerrado, y es
        // información sobre el proveedor. Lo que no cuenta es quien no dijo nada.
        contestaron: responses.filter((r) => r.declined || r.prices.length > 0).length,
        invitados: responses.length,
    };
}

/**
 * ¿Se venció alguna respuesta?
 *
 * **No es un estado guardado**: sale de comparar la fecha de cada respuesta con hoy. Guardarlo
 * obligaría a un proceso que lo actualice, y ese proceso es el que un día no corre.
 *
 * Una cotización vencida no es un dato viejo: es tener que volver a pedir precios y empezar de cero.
 */
export function estaVencida(responses: readonly QuoteResponseInput[], hoy: Date): boolean {
    return responses.some(
        (r) => !r.declined && r.validUntil !== null && r.validUntil.getTime() < hoy.getTime()
    );
}

function redondear(n: number): number {
    return Number(n.toFixed(2));
}
