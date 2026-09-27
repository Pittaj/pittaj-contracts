/**
 * @fileoverview DTO de "Mi Suscripción" para el tenant autenticado.
 *
 * Modelo de negocio vigente (docs `producto/modelo-negocio.md`): se cobra por OPERACIONES al mes,
 * con timbres CFDI incluidos por plan, y Mercado Pago cobra el día 3. Los campos de cajas
 * (`includedDevices`, `extraDevices`, `pricePerExtraDevice`) son del modelo por caja que ya no se
 * vende; siguen aquí por los planes viejos.
 *
 * @module Contracts/SubscriptionSummary
 */

/** Estados de la suscripción (espejo del dominio backend). */
export const MY_SUBSCRIPTION_STATUSES = [
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'SUSPENDED',
] as const;
export type MySubscriptionStatus = (typeof MY_SUBSCRIPTION_STATUSES)[number];

/** Conteos de uso del tenant (informativos; sin límites que bloqueen). */
export interface SubscriptionUsage {
    readonly users: number;
    readonly companies: number;
    /** Sucursales activas. Informativo: no cuestan. */
    readonly locations: number;
    /** Cajas activas hoy en toda la cuenta: lo único que se cobra. */
    readonly devices: number;
}

/** Datos de cobro estimado (preliminar hasta integrar pagos). */
export interface SubscriptionBilling {
    /** Sucursales activas. Se conserva por compatibilidad; ya no cobra nada. */
    readonly activeLocations: number;
    /** Mensualidad, IVA incluido (setting billing.base-price). */
    readonly basePrice: number;
    /** Cajas cubiertas por la mensualidad. */
    readonly includedDevices: number;
    /** Cajas activas por encima de las incluidas. */
    readonly extraDevices: number;
    /** Precio de cada caja adicional al mes, IVA incluido. */
    readonly pricePerExtraDevice: number;
    readonly currency: 'MXN';
    /** basePrice + extraDevices × pricePerExtraDevice, menos el cupón vigente. */
    readonly estimatedMonthly: number;
    /** true mientras no exista integración de pagos (precio preliminar). */
    readonly preliminary: boolean;
}

/** Modelos de cobro de una licencia. */
export const BILLING_MODELS = ['PERPETUAL', 'SUBSCRIPTION'] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

/**
 * La licencia contratada: qué se compró, no qué puede hacer el usuario.
 *
 * El código nunca pregunta «¿qué plan tiene?» sino «¿tiene esta capacidad?»; este
 * bloque existe para lo único que sí necesita saber el nombre del plan, que es
 * enseñárselo al dueño y decidir qué tarjeta pintar.
 */
export interface SubscriptionLicense {
    /** Código del plan: 'escritorio' | 'conectado' | 'completo'. */
    readonly planCode: string;
    readonly planName: string;
    /** PERPETUAL se compró una vez; SUBSCRIPTION se renta. */
    readonly billingModel: BillingModel;
    /** Cajas que cubre el nivel: 1 en la perpetua, 3 en las de renta. */
    readonly includedDevices: number;
    /**
     * Hasta cuándo recibe funciones nuevas la licencia perpetua (ISO 8601).
     * null en las de renta: ahí el mantenimiento va dentro de la mensualidad.
     */
    readonly maintenanceUntil: string | null;
    /**
     * false solo cuando una perpetua tiene el mantenimiento caducado.
     *
     * **No corta nada.** Deja de recibir funciones nuevas y lo obligatorio por ley
     * entra siempre: un punto de venta que no puede timbrar está muerto.
     */
    readonly maintenanceActive: boolean;
    /** Qué apps abre el nivel: 'sync' | 'web' | 'bancos' | 'contabilidad' | 'fiscal'. */
    readonly capabilities: readonly string[];
}

/**
 * Un nivel del catálogo, como se pinta en la pantalla de suscripción.
 *
 * Sale de la tabla `plans`, no de una lista en el cliente: añadir un nivel tiene
 * que seguir siendo meter una fila.
 */
export interface AvailablePlan {
    readonly code: string;
    readonly name: string;
    readonly description: string | null;
    /** MXN, IVA incluido. Mensual salvo que `billingModel` sea PERPETUAL. */
    readonly price: number;
    readonly billingModel: BillingModel;
    readonly includedDevices: number;
    /** Timbres que se reponen cada mes. 0 en la perpetua. */
    readonly monthlyStamps: number;
    /** Timbres de bienvenida, una sola vez en la vida de la licencia. */
    readonly oneTimeStamps: number;
    readonly capabilities: readonly string[];
    /**
     * Operaciones incluidas al mes (modelo por operaciones, docs `producto/modelo-negocio.md`).
     * null = el plan no mide operaciones (los tres niveles viejos).
     */
    readonly includedOperations: number | null;
    /** $ por cada 1,000 operaciones extra. 0 si el plan no cobra excedente. */
    readonly overagePricePerThousand: number;
    /** Lo más que se cobra en un mes con plan + excedente; null = sin tope. */
    readonly overageCap: number | null;
    /** $ por timbre extra. */
    readonly extraStampPrice: number;
    /**
     * false = existe pero **todavía no se vende**.
     *
     * Se devuelve igual, en vez de esconderlo: el dueño tiene que poder ver a qué
     * puede subir, y que un nivel esté a medias es información, no un secreto.
     */
    readonly available: boolean;
    /**
     * true = está disponible **solo** porque a esta cuenta se le abrió el acceso
     * anticipado; para el resto sigue sin venderse.
     *
     * Tiene que llegar hasta lo que el cliente ve. Si un nivel a medias le aparece
     * como uno normal, cuando choque con lo que falta no va a pensar «estoy
     * probando algo temprano», va a pensar «me vendieron algo roto» — y serán las
     * devoluciones de la gente que menos conviene perder.
     */
    readonly beta: boolean;
}

/** Respuesta de GET /api/subscriptions/me. */
export interface MySubscriptionResponse {
    readonly status: MySubscriptionStatus;
    /** Fin de la prueba (ISO 8601); null si no aplica. */
    readonly trialEndsAt: string | null;
    /** Días restantes de prueba (0 si venció hoy); null si no está en TRIAL. */
    readonly trialDaysLeft: number | null;
    readonly currentPeriodStart: string | null;
    readonly currentPeriodEnd: string | null;
    readonly usage: SubscriptionUsage;
    readonly billing: SubscriptionBilling;
    /** null en cuentas viejas sin fila de suscripción. */
    readonly license: SubscriptionLicense | null;
    /**
     * Bajada de nivel ya pedida que todavía NO ha entrado. `null` si no hay ninguna.
     *
     * Tiene que viajar aunque la interfaz pudiera vivir sin ello: quien pide una bajada y no
     * ve rastro de ella vuelve a pedirla, o escribe a soporte creyendo que falló. Y como el
     * cambio no toca `license` hasta el día 1, sin este campo la pantalla enseñaría el nivel
     * viejo sin ninguna pista de lo que va a pasar.
     */
    readonly pendingPlanChange: PendingPlanChange | null;
    /**
     * Desde cuándo la cuenta está en el programa beta (ISO), o `null` si no lo está.
     *
     * Cambia lo que la pantalla DEBE decir: a un invitado no se le habla de prueba vencida ni de
     * cobros, porque no va a pagar mientras dure. Sin este dato, el aviso de vencimiento le llega
     * igual y es la primera fricción que se encuentra — falsa, además.
     *
     * NO tiene nada que ver con el canal de actualizaciones: un tester corre el mismo `stable`
     * que cualquiera.
     */
    readonly betaSince: string | null;
    /**
     * Lo que el próximo cobro lleva **además** del plan y del excedente de operaciones: los timbres
     * extra y los cargos ya anotados (la diferencia de una subida a mitad de mes).
     *
     * Sin esto, la pantalla sumaba plan + operaciones y el cargo real traía algo más: el primer
     * cobro después de la prueba incluye todos los timbres extra aceptados, y el de después de una
     * subida incluye el prorrateo. Un total que no cuadra con el banco es la forma más rápida de
     * perder la confianza del cliente.
     */
    readonly nextChargeExtras: NextChargeExtras;
}

/** Cargos del próximo cobro que no son el plan ni el excedente de operaciones. */
export interface NextChargeExtras {
    readonly extraStamps: NextChargeExtraStamps;
    /** Cargos anotados que todavía no entran en una factura, en el orden en que se anotaron. */
    readonly pendingCharges: readonly NextChargePendingCharge[];
}

/**
 * Timbres extra ($ c/u del plan) que entran en el próximo cobro.
 *
 * En el primer cobro son **todos** los de la prueba o la beta; después, los del mes que cierra
 * antes del día 3. `count` 0 = ninguno (el renglón no se pinta).
 */
export interface NextChargeExtraStamps {
    readonly count: number;
    /** MXN por timbre, IVA incluido (`plans.extra_stamp_price`). */
    readonly unitPrice: number;
    /** count × unitPrice, redondeado a centavos: lo mismo que pone la factura. */
    readonly amount: number;
    /** Cuándo aceptó la cuenta que se cobraran (ISO); null si nunca hizo falta aceptar. */
    readonly acceptedAt: string | null;
    /** Quién lo aceptó, «Nombre Apellido»; null si no se sabe. */
    readonly acceptedByName: string | null;
}

export interface NextChargePendingCharge {
    /** El texto que irá en la factura, p. ej. «Diferencia por subir a Crecimiento (8 días)». */
    readonly description: string;
    /** MXN, IVA incluido. */
    readonly amount: number;
}

/** Una bajada de nivel programada para el inicio del siguiente periodo. */
export interface PendingPlanChange {
    readonly planCode: string;
    readonly planName: string;
    /** Cuándo entra (ISO 8601). Es el día 1 del mes siguiente al de la petición. */
    readonly effectiveFrom: string;
}

/** Resultado del alta (o cambio) de la tarjeta del cobro por operaciones. */
export interface CardSubscriptionResponse {
    /** `created` = alta nueva; `card_changed` = ya existía y cambió de tarjeta. */
    readonly outcome: 'created' | 'card_changed';
    /** Estado en Mercado Pago: pending · authorized · paused · cancelled. */
    readonly subscriptionStatus: string;
    /** Mensualidad que cobrará, MXN con IVA. */
    readonly amount: number;
    /** Próximo cobro (ISO); el primero es el próximo día 3. */
    readonly nextChargeAt: string | null;
    readonly card: {
        readonly brand: string;
        readonly last4: string;
        readonly expMonth: number;
        readonly expYear: number;
    };
}

/**
 * Lo que la pantalla necesita para la tarjeta del cobro por operaciones.
 * `GET /api/billing/card-subscription`.
 */
export interface CardSubscriptionInfoResponse {
    /**
     * ¿Se cobra con Mercado Pago? Solo si la pasarela está configurada y el plan cobra por
     * operaciones. Si es false, no hay tarjeta que capturar y la pantalla no la muestra.
     */
    readonly available: boolean;
    /** Llave pública para el SDK de Mercado Pago; null si no está disponible. */
    readonly publicKey: string | null;
    /** Estado de la suscripción en Mercado Pago; null si todavía no hay. */
    readonly subscriptionStatus: string | null;
    readonly card: {
        readonly brand: string;
        readonly last4: string;
        readonly expMonth: number;
        readonly expYear: number;
    } | null;
}
