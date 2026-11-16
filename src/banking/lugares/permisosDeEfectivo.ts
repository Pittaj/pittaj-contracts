/**
 * @fileoverview Tanda 2 de plan-efectivo: qué permiso pide cada acto del efectivo.
 *
 * Hasta aquí recolectar, depositar y reponer pedían el permiso genérico de traspaso, y arquear, el gasto de caja
 * chica y el retiro del dueño, el de registrar un movimiento: quien podía pagar una factura desde el banco podía
 * llevarse el efectivo de la caja fuerte. Ahora cada acto tiene el suyo. La regla es una sola para la nube (las rutas
 * la exigen), la web y el escritorio (los botones la respetan).
 */

export const PERMISOS_DE_EFECTIVO = {
    /** Sacar efectivo de una caja fuerte o de efectivo general y llevárselo («en manos de»). */
    recolectar: 'cash.collect',
    /** Llevar efectivo de un lugar al banco. */
    depositar: 'cash.deposit',
    /** Contar un lugar y dejar la diferencia a cargo de su responsable. */
    arquear: 'cash.count',
    /** Gastar de una caja chica y reponerla. */
    cajaChica: 'cash.petty',
    /**
     * El retiro del dueño (préstamo al socio o reparto) desde un lugar de efectivo. El del cajón NO lo pide: ahí el
     * cajero anota que el dueño se llevó dinero —un hecho que ya pasó— y basta `checkout.withdrawal`.
     */
    retiroDelDueno: 'cash.owner-draw',
} as const;

export type PermisoDeEfectivo = (typeof PERMISOS_DE_EFECTIVO)[keyof typeof PERMISOS_DE_EFECTIVO];

/** Las categorías del retiro del dueño. */
export const CATEGORIAS_DEL_RETIRO_DEL_DUENO = ['PRESTAMO_A_SOCIO', 'REPARTO_UTILIDADES'] as const;

/** Qué permiso pide un traspaso según su tipo. Un traspaso común sigue con el de siempre. */
export function permisoDelTraspaso(kind: string | null | undefined): string {
    switch (kind) {
        case 'COLLECTION':
            return PERMISOS_DE_EFECTIVO.recolectar;
        case 'DEPOSIT':
            return PERMISOS_DE_EFECTIVO.depositar;
        case 'REPLENISHMENT':
            return PERMISOS_DE_EFECTIVO.cajaChica;
        default:
            return 'bank-transfer.create';
    }
}

/**
 * Qué permiso pide registrar un movimiento suelto en una cuenta. El retiro del dueño desde efectivo y la salida de
 * una caja chica tienen el suyo; lo demás, el de siempre.
 */
export function permisoDelMovimiento(m: {
    accountKind: string | null | undefined;
    cashRole: string | null | undefined;
    direction: string | null | undefined;
    categoryCode: string | null | undefined;
}): string {
    if (m.accountKind === 'CASH' && m.direction === 'OUT') {
        if (m.categoryCode && (CATEGORIAS_DEL_RETIRO_DEL_DUENO as readonly string[]).includes(m.categoryCode))
            return PERMISOS_DE_EFECTIVO.retiroDelDueno;
        if (m.cashRole === 'PETTY') return PERMISOS_DE_EFECTIVO.cajaChica;
    }
    return 'bank-transaction.create';
}
