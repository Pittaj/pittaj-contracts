/**
 * @fileoverview El catálogo de la suite: qué apps existen y qué módulos tiene cada una.
 * @module Contracts/Suite
 *
 * Es la ÚNICA lista. La web (`APP_DEFINITIONS` y los `*.nav.ts`), el escritorio
 * (`AppCatalog` y `ShellConfigFactory`) y el backoffice (los interruptores de visibilidad) tienen
 * que coincidir con ella; una prueba en cada punta lo vigila. Ya hubo cuatro rondas de «códigos del
 * nav desalineados» entre web y escritorio: por eso el catálogo vive aquí y no en ninguna de las dos.
 *
 * Un módulo se identifica por `<appId>/<ruta>`, donde `ruta` es el segmento de navegación relativo
 * a la app (`compras/ordenes`, `caja/vender`, `org/configuracion/general`). Es lo que ya comparten
 * las dos plataformas: el `to` del sidebar web y el `tag` del sidebar de escritorio. Los módulos que
 * solo existen en una plataforma (e.firma, conexión de la caja) no están aquí y por tanto no se
 * pueden apagar: siempre se ven donde existen.
 *
 * Los ids de app son los de la web. El escritorio llama `pos` a Trastienda (`tpv`) por razones
 * históricas (ADR-014); ese mapeo es suyo.
 */

/** Ids de las apps de la suite, en el orden en que se enseñan. */
export const APP_IDS = ['caja', 'tpv', 'ventas', 'inventario', 'compras', 'produccion', 'bancos', 'contabilidad', 'fiscal', 'org'] as const;

export type AppId = (typeof APP_IDS)[number];

export interface ModuloDeApp {
    /** Segmento de navegación relativo a la app: `ordenes`, `pagos/cxp`. */
    readonly ruta: string;
    readonly nombre: string;
}

export interface AppDeLaSuite {
    readonly id: AppId;
    readonly nombre: string;
    readonly modulos: readonly ModuloDeApp[];
}

/** Clave con la que se enciende o apaga un módulo: `<appId>/<ruta>`. */
export function claveDeModulo(appId: AppId, ruta: string): string {
    return `${appId}/${ruta}`;
}

export const APPS_DE_LA_SUITE: readonly AppDeLaSuite[] = [
    {
        id: 'caja',
        nombre: 'Caja',
        modulos: [
            { ruta: 'vender', nombre: 'Vender' },
            { ruta: 'sesion', nombre: 'Sesión actual' },
            { ruta: 'movimientos', nombre: 'Movimientos' },
            { ruta: 'devoluciones', nombre: 'Devoluciones' },
            { ruta: 'apartados', nombre: 'Apartados' },
            { ruta: 'cierre', nombre: 'Cierre de caja' },
            { ruta: 'sesiones', nombre: 'Sesiones' },
            { ruta: 'tickets', nombre: 'Tickets' },
            { ruta: 'cierres', nombre: 'Cierres' },
        ],
    },
    {
        id: 'tpv',
        nombre: 'Trastienda',
        modulos: [
            { ruta: 'inicio', nombre: 'Inicio' },
            { ruta: 'sesiones', nombre: 'Sesiones' },
            { ruta: 'tickets', nombre: 'Tickets' },
            { ruta: 'cierres', nombre: 'Cierres' },
            { ruta: 'clientes', nombre: 'Clientes' },
            { ruta: 'productos', nombre: 'Productos' },
            { ruta: 'categorias', nombre: 'Categorías' },
            { ruta: 'listas-precios', nombre: 'Listas de Precios' },
            { ruta: 'promociones', nombre: 'Promociones' },
            { ruta: 'reportes', nombre: 'Reportes' },
            { ruta: 'reportes/export-fiscal', nombre: 'Exportar a facturación' },
            { ruta: 'cajas', nombre: 'Cajas Registradoras' },
            { ruta: 'cajeros', nombre: 'Cajeros' },
            { ruta: 'configuracion/perifericos', nombre: 'Periféricos' },
            { ruta: 'configuracion/general', nombre: 'General' },
        ],
    },
    {
        id: 'ventas',
        nombre: 'Ventas',
        modulos: [
            { ruta: 'inicio', nombre: 'Inicio' },
            { ruta: 'cotizaciones', nombre: 'Cotizaciones' },
            { ruta: 'pedidos', nombre: 'Pedidos' },
            { ruta: 'facturas', nombre: 'Facturas' },
            { ruta: 'notas-credito', nombre: 'Notas de Crédito' },
            { ruta: 'remisiones', nombre: 'Remisiones' },
            { ruta: 'devoluciones', nombre: 'Devoluciones' },
            { ruta: 'cobranza/cxc', nombre: 'Cuentas por Cobrar' },
            { ruta: 'cobranza/pagos', nombre: 'Pagos Recibidos' },
            { ruta: 'cobranza/antiguedad', nombre: 'Antigüedad de Saldos' },
            { ruta: 'clientes', nombre: 'Clientes' },
            { ruta: 'clientes/tipos', nombre: 'Tipos de Cliente' },
            { ruta: 'clientes/grupos', nombre: 'Grupos de Cliente' },
            { ruta: 'listas-precios', nombre: 'Listas de Precios' },
            { ruta: 'promociones', nombre: 'Promociones' },
            { ruta: 'reportes/por-periodo', nombre: 'Ventas por Período' },
            { ruta: 'reportes/por-cliente', nombre: 'Por Cliente' },
            { ruta: 'reportes/por-producto', nombre: 'Por Producto' },
            { ruta: 'configuracion/condiciones-pago', nombre: 'Condiciones de Pago' },
            { ruta: 'configuracion/general', nombre: 'General' },
        ],
    },
    {
        id: 'inventario',
        nombre: 'Inventario',
        modulos: [
            { ruta: 'inicio', nombre: 'Inicio' },
            { ruta: 'existencias', nombre: 'Existencias' },
            { ruta: 'movimientos', nombre: 'Movimientos' },
            { ruta: 'traspasos', nombre: 'Traspasos' },
            { ruta: 'ajustes', nombre: 'Ajustes' },
            { ruta: 'conteos', nombre: 'Conteos Físicos' },
            { ruta: 'productos', nombre: 'Productos' },
            { ruta: 'categorias', nombre: 'Categorías' },
            { ruta: 'bodegas', nombre: 'Bodegas' },
            { ruta: 'unidades', nombre: 'Unidades de Medida' },
            { ruta: 'reportes/existencias', nombre: 'Existencias Actual' },
            { ruta: 'reportes/kardex', nombre: 'Kardex' },
            { ruta: 'reportes/valuacion', nombre: 'Valuación' },
            { ruta: 'reportes/sin-movimiento', nombre: 'Sin Movimiento' },
            { ruta: 'reportes/caducidades', nombre: 'Caducidades' },
            { ruta: 'configuracion/costeo', nombre: 'Método de Costeo' },
            { ruta: 'configuracion/niveles-stock', nombre: 'Stock Mín/Máx' },
            { ruta: 'configuracion/alertas', nombre: 'Alertas' },
            { ruta: 'configuracion/general', nombre: 'General' },
        ],
    },
    {
        id: 'compras',
        nombre: 'Compras',
        modulos: [
            { ruta: 'inicio', nombre: 'Inicio' },
            { ruta: 'reabastecimiento', nombre: 'Reabastecimiento' },
            { ruta: 'solicitudes', nombre: 'Solicitudes' },
            { ruta: 'cotizaciones', nombre: 'Cotizaciones' },
            { ruta: 'ordenes', nombre: 'Órdenes de Compra' },
            { ruta: 'recepciones', nombre: 'Recepciones' },
            { ruta: 'devoluciones', nombre: 'Devoluciones a Proveedor' },
            { ruta: 'buzon-cfdi', nombre: 'Buzón de CFDI' },
            { ruta: 'pagos/cxp', nombre: 'Cuentas por Pagar' },
            { ruta: 'pagos/realizados', nombre: 'Pagos Realizados' },
            { ruta: 'pagos/antiguedad', nombre: 'Antigüedad de Saldos' },
            { ruta: 'proveedores', nombre: 'Proveedores' },
            { ruta: 'reportes/por-periodo', nombre: 'Compras por Período' },
            { ruta: 'reportes/por-proveedor', nombre: 'Por Proveedor' },
            { ruta: 'reportes/por-producto', nombre: 'Por Producto' },
            { ruta: 'configuracion/condiciones-pago', nombre: 'Condiciones de Pago' },
            { ruta: 'configuracion/general', nombre: 'General' },
        ],
    },
    {
        id: 'produccion',
        nombre: 'Producción',
        modulos: [
            { ruta: 'inicio', nombre: 'Inicio' },
            { ruta: 'ordenes', nombre: 'Órdenes de Producción' },
            { ruta: 'produccion-dia', nombre: 'Producción del Día' },
            { ruta: 'recetas', nombre: 'Recetas' },
            { ruta: 'productos', nombre: 'Productos' },
            { ruta: 'categorias', nombre: 'Categorías' },
            { ruta: 'reportes/costos', nombre: 'Costos de Producción' },
            { ruta: 'reportes/rendimiento', nombre: 'Rendimiento' },
            { ruta: 'reportes/merma', nombre: 'Merma de Producción' },
            { ruta: 'configuracion/general', nombre: 'General' },
        ],
    },
    {
        id: 'bancos',
        nombre: 'Bancos',
        modulos: [
            { ruta: 'cuentas', nombre: 'Cuentas' },
            { ruta: 'movimientos', nombre: 'Movimientos' },
            { ruta: 'por-pagar', nombre: 'Por pagar' },
            { ruta: 'calendario', nombre: 'Calendario' },
            { ruta: 'conciliacion', nombre: 'Conciliación' },
            { ruta: 'conciliacion/reglas', nombre: 'Reglas automáticas' },
            { ruta: 'flujo', nombre: 'Flujo de efectivo' },
            { ruta: 'reportes/saldos', nombre: 'Saldos' },
            { ruta: 'reportes/categorias', nombre: 'Por categoría' },
            { ruta: 'reportes/comisiones', nombre: 'Comisiones' },
            { ruta: 'categorias', nombre: 'Categorías' },
        ],
    },
    {
        id: 'contabilidad',
        nombre: 'Contabilidad',
        modulos: [
            { ruta: 'polizas', nombre: 'Pólizas' },
            { ruta: 'polizas/nueva', nombre: 'Capturar póliza' },
            { ruta: 'catalogo', nombre: 'Catálogo de cuentas' },
            { ruta: 'activos-fijos', nombre: 'Activos fijos' },
            { ruta: 'periodos', nombre: 'Periodos' },
            { ruta: 'balanza', nombre: 'Balanza de comprobación' },
            { ruta: 'auxiliar', nombre: 'Auxiliar de cuenta' },
            { ruta: 'estado-resultados', nombre: 'Estado de resultados' },
            { ruta: 'balance-general', nombre: 'Balance general' },
            { ruta: 'iva', nombre: 'IVA del mes' },
            { ruta: 'diot', nombre: 'DIOT' },
            { ruta: 'anexo-24', nombre: 'Anexo 24 (SAT)' },
            { ruta: 'cfdi-por-declarar', nombre: 'CFDI por declarar' },
            { ruta: 'cuentas-por-cobrar', nombre: 'Cuentas por cobrar' },
            { ruta: 'cobros', nombre: 'Cobros' },
            { ruta: 'motor', nombre: 'Correr el motor' },
            { ruta: 'excepciones', nombre: 'Sin contabilizar' },
            { ruta: 'cuentas-del-motor', nombre: 'Cuentas del motor' },
        ],
    },
    {
        id: 'fiscal',
        nombre: 'Fiscal',
        modulos: [
            { ruta: 'buzon', nombre: 'Buzón de CFDI' },
            { ruta: 'revision', nombre: 'Revisión fiscal' },
            { ruta: 'emitidos', nombre: 'Comprobantes emitidos' },
            { ruta: 'complementos', nombre: 'Complementos pendientes' },
            { ruta: 'configuracion', nombre: 'Configuración de emisión' },
            { ruta: 'descarga', nombre: 'Descarga del SAT' },
            { ruta: 'descarga/historial', nombre: 'Historial de descargas' },
            { ruta: 'conciliacion', nombre: 'Conciliación' },
        ],
    },
    {
        id: 'org',
        nombre: 'Organización',
        modulos: [
            { ruta: 'inicio', nombre: 'Inicio' },
            { ruta: 'usuarios', nombre: 'Usuarios' },
            { ruta: 'roles', nombre: 'Roles' },
            { ruta: 'permisos', nombre: 'Permisos' },
            { ruta: 'empresas', nombre: 'Empresas' },
            { ruta: 'sucursales', nombre: 'Sucursales' },
            { ruta: 'dispositivos', nombre: 'Dispositivos' },
            { ruta: 'departamentos', nombre: 'Departamentos' },
            { ruta: 'configuracion/impuestos', nombre: 'Impuestos' },
            { ruta: 'configuracion/cfdi', nombre: 'CFDI' },
            { ruta: 'configuracion/monedas', nombre: 'Monedas' },
            { ruta: 'configuracion/series', nombre: 'Series y Folios' },
            { ruta: 'configuracion/metodos-pago', nombre: 'Métodos de Pago' },
            { ruta: 'configuracion/general', nombre: 'General' },
            { ruta: 'auditoria/bitacora', nombre: 'Bitácora de Actividad' },
            { ruta: 'auditoria/accesos', nombre: 'Registro de Accesos' },
            { ruta: 'auditoria/instalaciones', nombre: 'Bitácora de Instalaciones' },
            { ruta: 'mi-suscripcion', nombre: 'Mi Suscripción' },
            { ruta: 'planes', nombre: 'Planes' },
            { ruta: 'historial-facturacion', nombre: 'Historial' },
        ],
    },
];


/**
 * Apps que no se pueden apagar. Organización es donde viven la suscripción, los usuarios y la
 * configuración: sin ella, un negocio con Bancos apagado no tendría ni dónde ver por qué.
 */
export const APPS_SIEMPRE_VISIBLES: readonly AppId[] = ['org'];

/** Búsqueda rápida por id de app. */
export function appDeLaSuite(id: string): AppDeLaSuite | undefined {
    return APPS_DE_LA_SUITE.find((a) => a.id === id);
}

/** Todas las claves de módulo válidas (`<appId>/<ruta>`). */
export const CLAVES_DE_MODULO: readonly string[] = APPS_DE_LA_SUITE.flatMap((a) =>
    a.modulos.map((m) => claveDeModulo(a.id, m.ruta)),
);
