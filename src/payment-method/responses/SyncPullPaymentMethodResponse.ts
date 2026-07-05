/**
 * @fileoverview Response de sincronización Pull de PaymentMethod
 * @module SyncPullPaymentMethodResponse
 * @version 2.0.0
 *
 * Deriva del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de PaymentMethod (shape que ya parsea el desktop).
 */

import type { PaymentMethodResponse } from './PaymentMethodResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullPaymentMethodResponse = SyncPullResponse<PaymentMethodResponse>;
