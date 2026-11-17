import { describe, expect, it } from 'bun:test';
import { abonoEntraAlCajon } from '../../src/layaway/schemas/addLayawayPayment.schema';

describe('abonoEntraAlCajon', () => {
    it('solo el efectivo (o sin tipo) entra al cajón', () => {
        expect(abonoEntraAlCajon(undefined)).toBe(true);
        expect(abonoEntraAlCajon('CASH')).toBe(true);
        expect(abonoEntraAlCajon('cash')).toBe(true);
        expect(abonoEntraAlCajon('CARD')).toBe(false);
        expect(abonoEntraAlCajon('TRANSFER')).toBe(false);
    });
});
