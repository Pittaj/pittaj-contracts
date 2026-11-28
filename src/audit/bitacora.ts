/**
 * @fileoverview La Bitácora del negocio: lo que se hizo en la web y lo que subieron las
 * instalaciones, en una sola lista (Organización → Auditoría → Bitácora).
 * @module Contracts/Audit
 *
 * Las dos fuentes no nombran igual las cosas:
 * - la web registra el **segmento de la ruta** (`products`, `document-series`) y una acción en
 *   MAYÚSCULAS (`CREATE`, `ACTIVATE`);
 * - la caja registra el **agregado** (`Product`, `PosTicket`) y `create` | `update` | `delete`.
 *
 * Aquí se traducen las dos a una **clave** y a palabras que se leen. Así la web, el escritorio y el
 * backend filtran y muestran igual. Lo que no está en el catálogo se enseña tal cual, sin
 * esconderlo: es un dato real.
 */

/** De dónde vino una entrada. `instalacion` incluye lo que una caja hizo en línea contra la API. */
export const ORIGENES_DE_BITACORA = ['web', 'instalacion'] as const;
export type OrigenDeBitacora = (typeof ORIGENES_DE_BITACORA)[number];

export const OPERACIONES_DE_BITACORA = ['create', 'update', 'delete'] as const;
/** `otra`: acciones de la web que no son alta, cambio ni borrado (activar, predeterminar…). */
export type OperacionDeBitacora = (typeof OPERACIONES_DE_BITACORA)[number] | 'otra';

export interface TipoDeBitacora {
    readonly clave: string;
    readonly etiqueta: string;
    /** Cómo lo nombra la web: el primer segmento de la ruta. */
    readonly web: readonly string[];
    /** Cómo lo nombra la caja: el agregado. */
    readonly instalacion: readonly string[];
}

/** Lo que de verdad aparece en la bitácora, de las dos puntas. El orden es el de los filtros. */
export const TIPOS_DE_BITACORA: readonly TipoDeBitacora[] = [
    { clave: 'producto', etiqueta: 'Productos', web: ['products'], instalacion: ['Product'] },
    { clave: 'ticket', etiqueta: 'Tickets', web: ['pos-tickets'], instalacion: ['PosTicket'] },
    { clave: 'inventario', etiqueta: 'Inventario', web: ['stock-movements', 'stock-adjustments', 'stock-transfers', 'count-plans'], instalacion: ['StockMovement', 'StockAdjustment', 'StockTransfer'] },
    { clave: 'precio', etiqueta: 'Listas de precios', web: ['price-lists'], instalacion: ['PriceList'] },
    { clave: 'promocion', etiqueta: 'Promociones', web: ['promotions', 'coupons'], instalacion: ['Promotion', 'Coupon'] },
    { clave: 'cliente', etiqueta: 'Clientes', web: ['customers'], instalacion: ['Customer'] },
    { clave: 'compra', etiqueta: 'Compras', web: ['purchases', 'suppliers', 'supplier-notes'], instalacion: ['Purchase', 'Supplier'] },
    { clave: 'operador', etiqueta: 'Operadores', web: ['operators'], instalacion: ['Operator'] },
    { clave: 'usuario', etiqueta: 'Usuarios', web: ['users', 'invitations'], instalacion: [] },
    { clave: 'rol', etiqueta: 'Roles y permisos', web: ['roles', 'role-permissions'], instalacion: ['Role'] },
    { clave: 'impuesto', etiqueta: 'Impuestos', web: ['taxes'], instalacion: ['Tax'] },
    { clave: 'empresa', etiqueta: 'Empresas y sucursales', web: ['companies', 'locations', 'departments', 'business-lines', 'devices'], instalacion: [] },
    { clave: 'configuracion', etiqueta: 'Configuración', web: ['tenant-settings', 'document-series', 'payment-methods', 'cfdi'], instalacion: [] },
];

const porCrudo = new Map<string, TipoDeBitacora>();
for (const t of TIPOS_DE_BITACORA) for (const n of [...t.web, ...t.instalacion]) porCrudo.set(n, t);

/** La clave y la etiqueta de un tipo crudo; lo desconocido se enseña como vino. */
export function tipoDeBitacora(entityType: string): { clave: string; etiqueta: string } {
    const t = porCrudo.get(entityType);
    return t ? { clave: t.clave, etiqueta: t.etiqueta } : { clave: entityType, etiqueta: entityType };
}

/** Los nombres crudos de una clave, para filtrar en las dos tablas. Una clave desconocida filtra por sí misma. */
export function nombresCrudosDeTipo(clave: string): string[] {
    const t = TIPOS_DE_BITACORA.find((x) => x.clave === clave);
    return t ? [...t.web, ...t.instalacion] : [clave];
}

/** La acción cruda de la web (`CREATE`, `SET_DEFAULT`) o de la caja (`create`) en una de las tres, u `otra`. */
export function operacionDeBitacora(accion: string): OperacionDeBitacora {
    const a = accion.toLowerCase();
    return a === 'create' || a === 'update' || a === 'delete' ? a : 'otra';
}

const ACCIONES: Readonly<Record<string, string>> = {
    create: 'Alta',
    update: 'Cambio',
    delete: 'Borrado',
    activate: 'Activó',
    deactivate: 'Desactivó',
    block: 'Bloqueó',
    set_default: 'Predeterminó',
    default: 'Predeterminó',
    cancel: 'Canceló',
    roles: 'Roles',
    alcance: 'Alcance',
    permissions: 'Permisos',
};

/** Cómo se lee la acción: `Alta`, `Cambio`, `Borrado` o la acción de la web en palabras. */
export function etiquetaDeAccion(accion: string): string {
    const a = accion.toLowerCase();
    if (ACCIONES[a]) return ACCIONES[a];
    const t = a.replace(/_/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Resume el diff de una caja en una línea: `price: 10 → 25 · name`.
 *
 * En una edición cada campo es `{old, new}`; en un alta o una baja es el valor directo. Por eso se
 * enseñan los **nombres** y, cuando hay old/new, el cambio. Un diff ilegible se devuelve tal cual:
 * es un dato real y esconderlo sería peor. El escritorio lleva el espejo en
 * `IBitacoraDeInstalaciones.Resumir`, con los mismos casos en sus pruebas.
 */
export function resumirCambios(json: string | null | undefined): string {
    if (!json || json.trim() === '') return '—';
    try {
        const diff = JSON.parse(json) as unknown;
        if (!diff || typeof diff !== 'object' || Array.isArray(diff)) return json;
        const partes = Object.entries(diff as Record<string, unknown>).map(([campo, valor]) => {
            if (valor && typeof valor === 'object' && 'old' in valor && 'new' in valor) {
                const v = valor as { old: unknown; new: unknown };
                return `${campo}: ${texto(v.old)} → ${texto(v.new)}`;
            }
            return campo;
        });
        return partes.length > 0 ? partes.join(' · ') : '—';
    } catch {
        return json;
    }
}

function texto(v: unknown): string {
    if (v === null) return 'null';
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

/**
 * Encabezado con el que una caja se identifica cuando llama a la API **en línea**, fuera del sync
 * (dar de alta una cuenta, guardar un alcance). La bitácora lo usa para no confundir esas acciones
 * con las de la web. Solo sirve para etiquetar el origen: quién lo hizo sigue saliendo del token.
 * No es `X-Device-ID`, porque ese cambia el origen de los cambios del sync.
 */
export const ENCABEZADO_DE_INSTALACION = 'X-Pittaj-Instalacion';
