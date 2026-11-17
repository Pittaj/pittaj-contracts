/**
 * @fileoverview Los lugares de efectivo (E1 de plan-efectivo): cómo se llaman y qué id tienen.
 *
 * La caja fuerte de una sucursal y el efectivo «en manos de» una persona los crea el sistema, y
 * pueden nacer en dos lados: en la nube (al dar de alta la sucursal, al recoger) y en el escritorio
 * sin internet. Para que los dos creen **la misma** cuenta sin hablarse, el id se deriva de lo que
 * la identifica: `md5(semilla)` con forma de uuid. Es lo único que Postgres, Node y .NET calculan
 * igual sin código propio (`md5(...)::uuid` en SQL, `MD5` en C#), y por eso se eligió.
 *
 * Aquí viven solo las semillas: el md5 lo pone cada plataforma (este paquete corre también en el
 * navegador, que no trae md5).
 */

/** Semilla del id de la caja fuerte de una sucursal. */
export const semillaDeCajaFuerte = (tenantId: string, locationId: string): string =>
  `cash-safe:${tenantId}:${locationId}`;

/** Semilla del id del efectivo «en manos de» una persona. */
export const semillaDeEfectivoEnManosDe = (tenantId: string, userId: string): string =>
  `cash-custody:${tenantId}:${userId}`;

/** Un hash md5 en hexadecimal (32 caracteres) con forma de uuid, como lo hace `::uuid` en Postgres. */
export function uuidDeMd5(hex: string): string {
  const h = hex.toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) throw new Error('Se esperaba un md5 en hexadecimal.');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Cómo se lee el rol de una cuenta de efectivo. */
export const ETIQUETA_DEL_ROL_DE_EFECTIVO: Record<string, string> = {
  GENERAL: 'Efectivo',
  SAFE: 'Caja fuerte',
  PETTY: 'Caja chica',
  CUSTODY: 'En manos de',
};

/** Las cuentas que crea el sistema no se dan de alta ni se archivan a mano. */
export const esLugarDelSistema = (cashRole: string | null | undefined): boolean =>
  cashRole === 'SAFE' || cashRole === 'CUSTODY';

/** Cuentas contables por omisión de cada lugar (E1). La caja chica ya existía: 101-01. */
export const CUENTA_DEL_LUGAR_DE_EFECTIVO: Record<'SAFE' | 'PETTY' | 'CUSTODY', string> = {
  SAFE: '101-03',
  PETTY: '101-01',
  CUSTODY: '103-05',
};
