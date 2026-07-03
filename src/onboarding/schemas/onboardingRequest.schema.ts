/**
 * @fileoverview Esquema Zod para validación de peticiones de onboarding
 * @module Contracts/Onboarding
 * @version 1.0.0
 *
 * Define validaciones de entrada para el endpoint POST /api/onboarding.
 *
 * **Tenant-First Pattern:**
 * El Tenant y User ya fueron creados durante el OAuth callback o registro.
 * El onboarding solo completa: Company, Location, Role, Subscription.
 */

import { z } from 'zod';

const teamMemberSchema = z.object({
    email: z.string().email('Email inválido'),
    role: z.string().min(1, 'Rol es requerido'),
});

export const onboardingRequestSchema = z.object({
    /** Industria de la empresa (opcional). */
    industry: z.string().optional(),

    /** Número de empleados (opcional). */
    employeeCount: z.string().optional(),

    /** Nombre de la empresa (requerido). */
    companyName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),

    /** RFC / NIF / Tax ID (opcional). */
    taxId: z.string().optional(),

    /** País (requerido, código ISO 3166-1 alpha-2). */
    country: z.string().min(2).max(3),

    /** Moneda (requerido, código ISO 4217). */
    currency: z.string().min(3).max(4),

    /** Módulos seleccionados (opcional). */
    selectedModules: z.array(z.string()).optional(),

    /** Plan recomendado basado en selección (opcional). */
    recommendedPlan: z.string().optional(),

    /** Nombre de la primera location (opcional, default: "Sucursal Principal"). */
    locationName: z.string().optional(),

    /** Si usar datos de demostración (opcional). */
    useDemoData: z.boolean().optional(),

    /** Miembros del equipo a invitar (opcional). */
    teamMembers: z.array(teamMemberSchema).optional(),
});

export type OnboardingRequestInput = z.infer<typeof onboardingRequestSchema>;