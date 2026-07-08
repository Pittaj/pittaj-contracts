/**
 * @fileoverview Response DTO para AssignCustomerToTicket command
 * @module commands/assign-customer
 * @version 1.0.0
 */

import type { PosTicketResponse } from './PosTicketResponse';

/**
 * Response DTO para ticket con cliente asignado (o limpiado a mostrador).
 * @since 1.0.0
 */
export type AssignCustomerToTicketResponse = PosTicketResponse;
