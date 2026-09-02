/**
 * @fileoverview Qué requiere atención en Compras, y en qué orden.
 *
 * ── Por qué esto vive en contracts ──
 *
 * Es la primera lista que ve alguien al abrir Compras, y **decide qué se hace primero en el
 * negocio**. Si el escritorio y la web ordenaran por su cuenta, la misma cuenta enseñaría dos
 * urgencias distintas según por dónde entres — y esa divergencia no la ve nadie hasta que alguien
 * paga tarde una factura que en la otra pantalla salía arriba.
 *
 * Mismo patrón que `quoteComparison` y `reposicion`: el cálculo es de las dos plataformas, con
 * espejo literal en C# (`ComprasAtencion.cs`).
 *
 * ── La regla de orden ──
 *
 * **Severidad, luego qué duele más, y el importe solo para desempatar.**
 *
 * El primer intento ordenaba por importe dentro de la misma severidad, y las pruebas enseñaron por
 * qué está mal: dejaba «$12,930 detenidos en borradores» por encima de «$3,847 de IVA que no vas a
 * poder acreditar». **Los importes de dos alertas distintas no son comparables** — uno es lo que
 * gastarías, otro lo que ya comprometiste y otro lo que puedes perder para siempre. Sumarlos en la
 * misma escala hace que la cifra más grande tape a la que de verdad cuesta dinero.
 *
 * Así que el orden lo decide `PESO_POR_TIPO`, que es un juicio explícito de qué duele más, y el
 * importe solo separa dos alertas del mismo tipo. Es menos «automático» y mucho más honesto: la
 * prioridad está escrita en un sitio y se puede discutir.
 *
 * ── Lo que NO se decide aquí ──
 *
 * El texto. Cada plataforma compone la frase con estos datos: la web en JSX y el escritorio en
 * `TextBlock`, y meter cadenas aquí obligaría a mantener el mismo español en dos motores de
 * plantillas. Lo que sí se comparte es **qué se enseña, con qué severidad y en qué orden**.
 */

/** Las cosas que pueden requerir atención. El orden de este array NO es la prioridad. */
export const TIPOS_DE_ALERTA = [
    /** Mercancía recibida cuyo CFDI nunca llegó: IVA que no se puede acreditar. */
    'RECIBIDO_SIN_FACTURA',
    /** Productos bajo su mínimo, con lo que costaría reponerlos. */
    'BAJO_MINIMO',
    /** Compras capturadas que no han entrado al inventario. */
    'BORRADORES_DETENIDOS',
    /** Lo que vence esta semana. Apagada hasta que exista Cuentas por Pagar. */
    'POR_PAGAR_PRONTO',
    /** Lo que ya venció. Apagada hasta que exista Cuentas por Pagar. */
    'VENCIDO',
    /** Entregas que llegaron incompletas y siguen esperando el resto. */
    'ENTREGAS_PARCIALES',
    /** Lo que pidieron las sucursales y nadie ha atendido. */
    'PETICIONES_SIN_ATENDER',
    /** Solicitudes de precio sin contestar, o cuyas respuestas vencieron. */
    'COTIZACIONES_SIN_RESPUESTA',
    /** No hay proveedores dados de alta: no se puede comprar. */
    'SIN_PROVEEDORES',
    /** Ni una compra este mes. Es el vacío de estreno, no una alarma. */
    'SIN_MOVIMIENTO',
] as const;

export type TipoDeAlerta = (typeof TIPOS_DE_ALERTA)[number];

/**
 * Cuánto insistir.
 *
 * `CRITICA` se reserva para lo que **cuesta dinero mientras dure**: IVA que se pierde, mercancía
 * que se acaba antes de que llegue el pedido, una factura vencida. Bajarle el listón a esto es
 * lo que hace que en dos semanas nadie mire la lista.
 */
export type SeveridadDeAlerta = 'CRITICA' | 'ATENCION' | 'INFO';

/** Una cosa que atender, ya con su severidad resuelta. */
export interface AlertaDeCompras {
    readonly tipo: TipoDeAlerta;
    readonly severidad: SeveridadDeAlerta;
    /** Cuántos documentos, productos o renglones. Cero no genera alerta. */
    readonly cantidad: number;
    /** El dinero en juego, si lo hay. Se enseña siempre; ordena solo entre alertas del mismo tipo. */
    readonly importe: number | null;
    /** Antigüedad en días de lo más viejo, cuando aplica. */
    readonly dias: number | null;
    /**
     * Un segundo número que matiza la frase: cuántos son críticos, cuántos se resuelven con
     * traspaso, cuántas respuestas vencieron. Nulo cuando no aplica.
     */
    readonly matiz: number | null;
}

/** Los números en crudo que devuelve el panorama. Todo opcional: lo que no existe, no se enseña. */
export interface DatosDeAtencion {
    readonly recibidoSinFactura?: { readonly compras: number; readonly ivaEnRiesgo: number } | null;
    readonly bajoMinimo?: {
        readonly productos: number;
        /** Los que se acaban antes de que llegue el pedido (días que alcanza < tiempo de entrega). */
        readonly criticos: number;
        readonly importeSugerido: number;
    } | null;
    readonly borradores?: {
        readonly compras: number;
        readonly importe: number;
        readonly diasDelMasViejo: number | null;
    } | null;
    readonly entregasParciales?: { readonly entregas: number; readonly renglones: number } | null;
    readonly peticiones?: {
        readonly pendientes: number;
        readonly diasDeLaMasVieja: number | null;
        /** Cuántas se resuelven moviendo lo que ya hay en otra bodega, sin comprar. */
        readonly conExistenciaEnOtras: number;
    } | null;
    readonly cotizaciones?: {
        readonly sinResponder: number;
        readonly vencidas: number;
        readonly diasDeLaMasVieja: number | null;
    } | null;
    readonly proveedores?: number | null;
    readonly comprasDelMes?: number | null;

    /**
     * ⚠️ Las dos de pago llegan **nulas** hasta que exista Cuentas por Pagar.
     *
     * Están escritas y apagadas a propósito: el saldo de una compra sale de cruzarla con los pagos
     * aplicados, y hoy los pagos solo existen dentro de Bancos —que no está en el escritorio—. El
     * día que el pago a proveedor sea una entidad de Compras, se rellenan estos dos campos y los
     * renglones aparecen solos, sin tocar ninguna pantalla.
     */
    readonly porPagarPronto?: {
        readonly facturas: number;
        readonly importe: number;
        readonly diasAlProximoVencimiento: number | null;
    } | null;
    readonly vencido?: {
        readonly facturas: number;
        readonly importe: number;
        readonly diasDelMasViejo: number | null;
    } | null;
}

/**
 * Qué duele más. **Es lo que ordena la lista** dentro de una misma severidad.
 *
 * Mayor peso = más arriba. El criterio es cuánto de ese dinero se pierde si nadie hace nada:
 * lo vencido y el IVA no acreditado no vuelven; un borrador detenido se resuelve recibiéndolo.
 */
const PESO_POR_TIPO: Readonly<Record<TipoDeAlerta, number>> = {
    VENCIDO: 100,
    RECIBIDO_SIN_FACTURA: 90,
    BAJO_MINIMO: 80,
    POR_PAGAR_PRONTO: 70,
    BORRADORES_DETENIDOS: 60,
    ENTREGAS_PARCIALES: 50,
    PETICIONES_SIN_ATENDER: 40,
    COTIZACIONES_SIN_RESPUESTA: 30,
    SIN_PROVEEDORES: 20,
    SIN_MOVIMIENTO: 10,
};

const ORDEN_DE_SEVERIDAD: Readonly<Record<SeveridadDeAlerta, number>> = {
    CRITICA: 3,
    ATENCION: 2,
    INFO: 1,
};

/** Días a partir de los cuales un borrador detenido deja de ser un descuido y es un problema. */
export const DIAS_PARA_BORRADOR_CRITICO = 7;

/** Días que puede esperar una sucursal antes de que su petición suba de severidad. */
export const DIAS_PARA_PETICION_CRITICA = 5;

/**
 * De los números del panorama a la lista ordenada.
 *
 * Lo que vale cero **no genera renglón**: una lista que dice «0 compras sin factura» gasta la
 * única zona donde el usuario mira cuando algo va mal.
 */
export function evaluarAtencion(datos: DatosDeAtencion): AlertaDeCompras[] {
    const alertas: AlertaDeCompras[] = [];

    const sf = datos.recibidoSinFactura;
    if (sf && sf.compras > 0) {
        alertas.push({
            tipo: 'RECIBIDO_SIN_FACTURA',
            // Siempre crítica: el IVA no acreditado no se recupera solo, y cada mes que pasa lo
            // aleja de la declaración en la que cabía.
            severidad: 'CRITICA',
            cantidad: sf.compras,
            importe: sf.ivaEnRiesgo,
            dias: null,
            matiz: null,
        });
    }

    const bm = datos.bajoMinimo;
    if (bm && bm.productos > 0) {
        alertas.push({
            tipo: 'BAJO_MINIMO',
            // Crítica solo si alguno se acaba antes de que llegue el pedido. Estar bajo mínimo con
            // dos semanas de holgura es una compra que hacer, no una urgencia.
            severidad: bm.criticos > 0 ? 'CRITICA' : 'ATENCION',
            cantidad: bm.productos,
            importe: bm.importeSugerido,
            dias: null,
            matiz: bm.criticos,
        });
    }

    const bo = datos.borradores;
    if (bo && bo.compras > 0) {
        alertas.push({
            tipo: 'BORRADORES_DETENIDOS',
            severidad:
                (bo.diasDelMasViejo ?? 0) >= DIAS_PARA_BORRADOR_CRITICO ? 'CRITICA' : 'ATENCION',
            cantidad: bo.compras,
            importe: bo.importe,
            dias: bo.diasDelMasViejo,
            matiz: null,
        });
    }

    const pp = datos.porPagarPronto;
    if (pp && pp.facturas > 0) {
        alertas.push({
            tipo: 'POR_PAGAR_PRONTO',
            severidad: 'ATENCION',
            cantidad: pp.facturas,
            importe: pp.importe,
            dias: pp.diasAlProximoVencimiento,
            matiz: null,
        });
    }

    const ve = datos.vencido;
    if (ve && ve.facturas > 0) {
        alertas.push({
            tipo: 'VENCIDO',
            severidad: 'CRITICA',
            cantidad: ve.facturas,
            importe: ve.importe,
            dias: ve.diasDelMasViejo,
            matiz: null,
        });
    }

    const ep = datos.entregasParciales;
    if (ep && ep.entregas > 0) {
        alertas.push({
            tipo: 'ENTREGAS_PARCIALES',
            severidad: 'ATENCION',
            cantidad: ep.entregas,
            importe: null,
            dias: null,
            matiz: ep.renglones,
        });
    }

    const pe = datos.peticiones;
    if (pe && pe.pendientes > 0) {
        alertas.push({
            tipo: 'PETICIONES_SIN_ATENDER',
            severidad:
                (pe.diasDeLaMasVieja ?? 0) >= DIAS_PARA_PETICION_CRITICA ? 'ATENCION' : 'INFO',
            cantidad: pe.pendientes,
            importe: null,
            dias: pe.diasDeLaMasVieja,
            matiz: pe.conExistenciaEnOtras,
        });
    }

    const co = datos.cotizaciones;
    if (co && co.sinResponder + co.vencidas > 0) {
        alertas.push({
            tipo: 'COTIZACIONES_SIN_RESPUESTA',
            // Una cotización vencida no es un dato viejo: es volver a pedir precios desde cero.
            severidad: co.vencidas > 0 ? 'ATENCION' : 'INFO',
            cantidad: co.sinResponder + co.vencidas,
            importe: null,
            dias: co.diasDeLaMasVieja,
            matiz: co.vencidas,
        });
    }

    // Los dos vacíos de estreno. Solo cuando NO hay nada más que decir: apilarlos con alertas de
    // verdad haría parecer que el negocio nuevo va mal.
    if (alertas.length === 0) {
        if ((datos.proveedores ?? 0) === 0) {
            alertas.push({
                tipo: 'SIN_PROVEEDORES',
                severidad: 'INFO',
                cantidad: 0,
                importe: null,
                dias: null,
                matiz: null,
            });
        } else if ((datos.comprasDelMes ?? 0) === 0) {
            alertas.push({
                tipo: 'SIN_MOVIMIENTO',
                severidad: 'INFO',
                cantidad: 0,
                importe: null,
                dias: null,
                matiz: null,
            });
        }
    }

    return ordenarAtencion(alertas);
}

/**
 * El orden: severidad, luego el peso del tipo, y el importe solo para desempatar.
 *
 * Se expone aparte de `evaluarAtencion` para poder probarlo con listas armadas a mano.
 */
export function ordenarAtencion(alertas: readonly AlertaDeCompras[]): AlertaDeCompras[] {
    return [...alertas].sort((a, b) => {
        const sev = ORDEN_DE_SEVERIDAD[b.severidad] - ORDEN_DE_SEVERIDAD[a.severidad];
        if (sev !== 0) return sev;

        const peso = PESO_POR_TIPO[b.tipo] - PESO_POR_TIPO[a.tipo];
        if (peso !== 0) return peso;

        // Mismo tipo y misma severidad: aquí los dos importes SÍ miden lo mismo.
        return (b.importe ?? 0) - (a.importe ?? 0);
    });
}

/** Cuántas cosas hay que atender, y si alguna es crítica. Para el encabezado de la sección. */
export function resumirAtencion(alertas: readonly AlertaDeCompras[]): {
    readonly total: number;
    readonly criticas: number;
} {
    return {
        total: alertas.length,
        criticas: alertas.filter((a) => a.severidad === 'CRITICA').length,
    };
}
