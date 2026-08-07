/**
 * @fileoverview Progreso de la guía de primeros pasos (GET /api/onboarding/guia).
 *
 * Cada bandera se calcula mirando si el dato existe, no leyendo un progreso guardado: así la guía
 * no puede mentir, y da igual por dónde entró el dato (un producto importado en bloque cuenta
 * igual que uno capturado a mano).
 *
 * No incluye impresora ni báscula: son ajustes locales de cada instalación y la nube no los ve.
 * Un paso que no se puede verificar rompe lo único que hace útil a esta guía.
 */
export interface StartupGuideResponse {
    readonly tieneProductos: boolean;
    /** Alguna categoría propia; la sembrada por el alta no cuenta. */
    readonly tieneCategoriasPropias: boolean;
    readonly tieneSesiones: boolean;
    readonly tieneVentas: boolean;
    readonly tieneCortes: boolean;
    readonly tieneMovimientosInventario: boolean;
    readonly tieneProveedores: boolean;
    readonly tieneCompras: boolean;
    /** Más de un usuario: el dueño ya cuenta, el equipo empieza en el segundo. */
    readonly tieneEquipo: boolean;
    readonly tieneDatosFiscales: boolean;
}
