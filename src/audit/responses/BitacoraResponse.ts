/**
 * @fileoverview Una entrada de la Bitácora del negocio (`GET /api/audit-logs/negocio`).
 * @module Contracts/Audit/Responses
 */

import type { OperacionDeBitacora, OrigenDeBitacora } from '../bitacora.js';

/** Algo con nombre. El nombre puede faltar si ya se borró, pero el id se conserva. */
export interface RefDeBitacora {
    readonly id: string;
    readonly nombre: string | null;
}

export interface EntradaDeBitacoraResponse {
    readonly id: string;
    readonly origen: OrigenDeBitacora;
    /** La computadora que lo hizo, si fue una. */
    readonly instalacion: RefDeBitacora | null;
    readonly empresa: RefDeBitacora | null;
    readonly sucursal: RefDeBitacora | null;
    /** El usuario de la web o el operador de la caja. */
    readonly quien: RefDeBitacora | null;
    readonly operacion: OperacionDeBitacora;
    /** La acción cruda (`CREATE`, `ACTIVATE`, `update`…); se lee con `etiquetaDeAccion`. */
    readonly accion: string;
    /** La clave de `TIPOS_DE_BITACORA` (o el nombre crudo si no está en el catálogo). */
    readonly tipo: string;
    readonly entityType: string;
    readonly entityId: string | null;
    /** El diff de los campos, solo en lo que subieron las cajas. Se resume con `resumirCambios`. */
    readonly cambios: string | null;
    /** Cuándo ocurrió. En una caja, cuándo pasó en la máquina, no cuándo llegó a la nube. */
    readonly ocurrio: string;
}

export interface BitacoraPageResponse {
    readonly items: readonly EntradaDeBitacoraResponse[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
}
