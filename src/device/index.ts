/**
 * @fileoverview Contratos del registro de dispositivos (F4 instalación).
 * @module device
 *
 * Cada instalación desktop (deviceId GUID persistido) se registra en la nube
 * anclada a un tenant + sucursal. El registro habilita: inventario de la flota,
 * kill-switch (revocar un equipo robado/dado de baja) y, más adelante, el
 * cobro por caja. El heartbeat viaja implícito en el pull del feed de sync.
 */
import { z } from 'zod';

/** POST /api/devices/register — alta/actualización idempotente del dispositivo. */
export const registerDeviceSchema = z.object({
    deviceId: z.string().min(8).max(64),
    locationId: z.string().uuid(),
    companyId: z.string().uuid().optional(),
    /** Nombre legible (nombre de máquina). */
    name: z.string().max(120).optional(),
    platform: z.string().max(40).optional(),
    appVersion: z.string().max(40).optional(),
});

export type RegisterDeviceRequest = z.infer<typeof registerDeviceSchema>;

export interface DeviceResponse {
    readonly id: string;
    readonly tenantId: string;
    readonly locationId: string;
    readonly companyId: string | null;
    readonly name: string | null;
    readonly platform: string | null;
    readonly appVersion: string | null;
    /** ACTIVE | REVOKED. */
    readonly status: string;
    readonly firstSeenAt: string;
    readonly lastSeenAt: string;
}
