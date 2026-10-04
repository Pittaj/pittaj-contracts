import { describe, expect, it } from 'vitest';
import { createSupplierSchema, updateSupplierSchema } from '../src/supplier/schemas/supplierSchemas.js';

const ID = '11111111-1111-4111-8111-111111111111';

describe('omisiones de gasto del proveedor (F6.3)', () => {
    it('se aceptan al crear y al editar, y el vacío del formulario es null', () => {
        const c = createSupplierSchema.parse({ id: ID, name: 'CFE', defaultExpenseConceptId: ID, defaultLocationId: '' });
        expect(c.defaultExpenseConceptId).toBe(ID);
        expect(c.defaultLocationId).toBeNull();
        const u = updateSupplierSchema.parse({ version: 2, defaultBusinessLineId: ID });
        expect(u.defaultBusinessLineId).toBe(ID);
    });
    it('ausentes no se tocan (undefined), para no borrar lo que puso otra punta', () => {
        const u = updateSupplierSchema.parse({ version: 2, name: 'CFE' });
        expect('defaultExpenseConceptId' in u && u.defaultExpenseConceptId !== undefined).toBe(false);
    });
});
