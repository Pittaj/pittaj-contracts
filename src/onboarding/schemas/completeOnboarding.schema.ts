/**
 * @fileoverview Schema Zod para completar onboarding
 * @module Onboarding/Contracts/Schemas
 */

import { z } from 'zod';

export const INDUSTRY_VALUES = [
    'retail',
    'restaurant',
    'services',
    'manufacturing',
    'technology',
    'healthcare',
    'education',
    'real_estate',
    'transportation',
    'other',
] as const;
export type IndustryValue = (typeof INDUSTRY_VALUES)[number];

export const EMPLOYEE_COUNT_VALUES = ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'] as const;
export type EmployeeCountValue = (typeof EMPLOYEE_COUNT_VALUES)[number];

export const PLAN_VALUES = ['starter', 'growth', 'enterprise'] as const;
export type PlanValue = (typeof PLAN_VALUES)[number];

export const MODULE_VALUES = ['org', 'tpv', 'inventario', 'compras', 'ventas'] as const;
export type ModuleValue = (typeof MODULE_VALUES)[number];

export const teamMemberSchema = z.object({
    email: z.string().email('Email inválido'),
    role: z.string().min(1, 'Rol es requerido'),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
});

export const completeOnboardingSchema = z.object({
    industry: z.enum(INDUSTRY_VALUES),
    employeeCount: z.enum(EMPLOYEE_COUNT_VALUES),
    companyName: z.string().min(1, 'Nombre de empresa es requerido').max(255),
    taxId: z.string().max(50).optional(),
    country: z.string().length(2).default('MX'),
    currency: z.string().length(3).default('MXN'),
    selectedModules: z.array(z.enum(MODULE_VALUES)).min(1, 'Al menos un módulo es requerido'),
    recommendedPlan: z.enum(PLAN_VALUES).default('starter'),
    locationName: z.string().min(1, 'Nombre de sucursal es requerido').max(255),
    useDemoData: z.boolean().default(false),
    teamMembers: z.array(teamMemberSchema).default([]),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
