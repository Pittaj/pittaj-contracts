import type { SaleLineBasePrimitives } from '../../shared/index.js';

export interface SalesOrderLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
  /**
   * El precio unitario ya incluía el impuesto (true) o se suma aparte (false).
   *
   * **El campo viajaba sin estar declarado** (BUG-042). Es campo propio de `SalesOrderLine` desde
   * BUG-011 y `SalesOrderResponseMapper` pasa el primitivo entero (`lines: p.lines`), así que
   * llegaba a la respuesta igual — pero el tipo decía que no existía. Eso dejaba abierta la peor
   * puerta: que alguien «ordenara» `toPrimitives()` para que cuadrara con este tipo y **borrara el
   * campo sin que nada se pusiera rojo**. Ese día vuelven BUG-011 y BUG-039, y el cliente paga el
   * IVA dos veces.
   *
   * Espejo de `PosTicketLinePrimitives`, que lo declara desde el principio.
   */
  readonly taxIncluded: boolean;
}
