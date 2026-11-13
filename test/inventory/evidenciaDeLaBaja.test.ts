/** (2.85.0) El soporte de una baja. Mismos vectores que `EvidenciaDeLaBajaTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import { evidenciaFaltante } from '../../src/inventory/index.js';

const base = { kind: 'ADJUSTMENT' as const, reason: 'THEFT', valorDeLaBaja: 1500, umbral: 1000, evidencias: 0 };

describe('evidenciaFaltante', () => {
    it('un robo arriba del umbral sin soporte se detiene, con la frase para el usuario', () => {
        expect(evidenciaFaltante(base)).toBe(
            'Esta baja vale $1,500.00 y la configuración pide soporte arriba de $1,000.00: agrega el aviso de destrucción, la denuncia o el acta antes de aplicarla.'
        );
    });
    it('con soporte, en el umbral, con umbral 0, una merma o un conteo: pasa', () => {
        expect(evidenciaFaltante({ ...base, evidencias: 1 })).toBeNull();
        expect(evidenciaFaltante({ ...base, valorDeLaBaja: 1000 })).toBeNull();
        expect(evidenciaFaltante({ ...base, umbral: 0 })).toBeNull();
        expect(evidenciaFaltante({ ...base, reason: 'SHRINKAGE' })).toBeNull();
        expect(evidenciaFaltante({ ...base, kind: 'COUNT' })).toBeNull();
    });
    it('caducidad y daño también lo piden', () => {
        expect(evidenciaFaltante({ ...base, reason: 'EXPIRED' })).not.toBeNull();
        expect(evidenciaFaltante({ ...base, reason: 'DAMAGE' })).not.toBeNull();
    });
});
