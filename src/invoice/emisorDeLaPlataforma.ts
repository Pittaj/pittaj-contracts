/**
 * @fileoverview F9.1 · El emisor con que timbra la plataforma, con fecha de vigencia.
 * @module Contracts/Invoice
 *
 * Billing timbra las facturas de suscripción y los paquetes de timbres. Su emisor (RFC, razón social,
 * régimen, CP de expedición) era configuración del servidor (`EMISOR_*`): cambiarlo era un
 * despliegue y no dejaba historia. Pittaj arranca con el RFC del dueño y eventualmente pasará a uno
 * propio (plan de empresas, F9): ese día es un **corte**, no una mudanza. Aquí se da de alta el
 * emisor nuevo con su fecha, y desde ese día billing timbra con él. Lo anterior se queda con el
 * emisor que lo timbró.
 *
 * - Un emisor por fecha de inicio; el vigente en un día es el de la fecha de inicio más reciente
 *   que no la rebase (en la zona de Pittaj).
 * - **No se reescribe el pasado:** la fecha de inicio no puede ser anterior a hoy. Lo ya timbrado
 *   tiene el RFC en su XML y no cambia.
 * - Sin ninguno capturado, rige el del servidor (`EMISOR_*`), como antes.
 * - El certificado (CSD) del RFC nuevo se sube aparte, a la bóveda del PAC (Certificados).
 */
import { z } from 'zod';
import { fechaCivilSchema } from '../shared/fechas.js';

/** RFC de persona moral (12) o física (13), en mayúsculas. */
const rfcSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, 'El RFC no tiene la forma del SAT (12 o 13 caracteres)');

export const createEmisorDeLaPlataformaSchema = z.object({
    rfc: rfcSchema,
    /** Razón social tal como está en la constancia de situación fiscal (sin régimen societario). */
    nombre: z.string().trim().min(1).max(300),
    /** `c_RegimenFiscal`: 612 actividad empresarial, 626 RESICO, 601 general de personas morales… */
    regimenFiscal: z.string().trim().regex(/^\d{3}$/, 'El régimen fiscal es la clave de tres dígitos del SAT'),
    /** Código postal del lugar de expedición. */
    cp: z.string().trim().regex(/^\d{5}$/, 'El código postal son cinco dígitos'),
    /** Desde qué día (civil) timbra con este emisor. No antes de hoy. */
    vigenteDesde: fechaCivilSchema,
});

export type CreateEmisorDeLaPlataformaBody = z.infer<typeof createEmisorDeLaPlataformaSchema>;

export interface EmisorDeLaPlataformaResponse {
    readonly id: string;
    readonly rfc: string;
    readonly nombre: string;
    readonly regimenFiscal: string;
    readonly cp: string;
    readonly vigenteDesde: string;
    /** Es el que timbra hoy. */
    readonly vigente: boolean;
    /** Todavía no empieza: se puede quitar. */
    readonly programado: boolean;
    readonly createdAt: string;
    readonly createdBy: string | null;
}

/** GET /api/admin/cfdi/emisores */
export interface EmisoresDeLaPlataformaResponse {
    readonly items: readonly EmisorDeLaPlataformaResponse[];
    /** Con qué timbra hoy y de dónde sale: capturado aquí, o el del servidor si no hay ninguno. */
    readonly hoy: {
        readonly rfc: string;
        readonly nombre: string;
        readonly regimenFiscal: string;
        readonly cp: string;
        readonly origen: 'CAPTURADO' | 'SERVIDOR';
    } | null;
}
