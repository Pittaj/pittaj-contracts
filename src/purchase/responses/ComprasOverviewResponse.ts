/**
 * @fileoverview El panorama de Compras: lo que enseña la portada de la app.
 *
 * Una sola consulta para toda la pantalla. Antes la web armaba su inicio con tres listados sueltos
 * y por eso solo podía enseñar conteos; el escritorio ya pedía un panorama entero. Esto iguala las
 * dos por arriba.
 *
 * ⚠️ **Los números vienen crudos.** Qué se convierte en alerta, con qué severidad y en qué orden lo
 * decide `evaluarAtencion` de `comprasAtencion.ts`, que comparten las dos plataformas.
 */

import type { DatosDeAtencion } from '../comprasAtencion.js';

/** Lo comprado de verdad —recibido— en el periodo, contra el bloque anterior de los mismos días. */
export interface CompradoDelPeriodo {
    readonly total: number;
    readonly compras: number;
    readonly promedio: number;
    /**
     * El MISMO número de días inmediatamente anteriores, no el mes pasado completo: con el mes en
     * curso, comparar 20 días contra 31 no dice nada.
     */
    readonly totalPrevio: number;
    /** Variación porcentual contra el previo. `null` si el previo fue cero: no hay +100 % que valga. */
    readonly variacion: number | null;
}

/**
 * Dinero ya prometido que todavía no entró al inventario.
 *
 * Es la cifra que faltaba en las dos plataformas y la que todos los sistemas grandes enseñan:
 * comprado dice lo que ya pasó, comprometido dice lo que te va a pasar.
 */
export interface ComprometidoSinRecibir {
    readonly total: number;
    readonly borradores: number;
    readonly entregasParciales: number;
}

/** Cuánto pesa un proveedor en lo comprado del periodo. */
export interface ConcentracionDeProveedor {
    readonly supplierId: string;
    readonly supplierName: string;
    readonly total: number;
    /** 0-100. Sobre el total comprado del periodo. */
    readonly porcentaje: number;
}

/** Un producto que cambió de precio con el mismo proveedor. */
export interface CambioDePrecio {
    readonly productId: string;
    readonly productName: string;
    readonly supplierId: string;
    readonly supplierName: string;
    readonly costoAnterior: number;
    readonly costoActual: number;
    /** Porcentaje firmado: positivo subió, negativo bajó. */
    readonly variacion: number;
    /** Fecha de la compra en que cambió (ISO). */
    readonly fecha: string;
}

export interface ComprasOverviewResponse {
    /** Ventana del periodo en ISO, ya resuelta por el servidor. */
    readonly desde: string;
    readonly hasta: string;

    readonly comprado: CompradoDelPeriodo;
    readonly comprometido: ComprometidoSinRecibir;

    readonly proveedores: number;
    /** Los que más pesan, con «otros» agrupado al final por el servidor. */
    readonly concentracion: readonly ConcentracionDeProveedor[];

    /**
     * Lo que subió (y lo que bajó) contra la compra anterior al mismo proveedor.
     *
     * Sale del mismo dato que alimenta la captura de cotizaciones: el último costo por producto y
     * proveedor. Aquí convierte la portada en un detector de aumentos sin pedirle nada al usuario.
     */
    readonly cambiosDePrecio: readonly CambioDePrecio[];

    /** Los números crudos de lo que requiere atención. Ver `evaluarAtencion`. */
    readonly atencion: DatosDeAtencion;

    /** Cuándo fue la última compra registrada (ISO), o `null` si no hay ninguna. */
    readonly ultimaCompra: string | null;
}
