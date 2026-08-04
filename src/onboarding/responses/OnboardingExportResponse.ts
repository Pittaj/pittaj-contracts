/**
 * @fileoverview Respuesta de exportación de datos de onboarding (admin)
 * @module Onboarding/Contracts/Responses
 */

import type { ExportFormatValue } from '../schemas/index.js';

export interface OnboardingExportResponse {
    readonly format: ExportFormatValue;
    readonly filename: string;
    readonly content: string;
    readonly rowCount: number;
}
