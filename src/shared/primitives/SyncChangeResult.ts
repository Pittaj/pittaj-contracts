/**
 * El veredicto de la nube sobre UN cambio que subió una caja.
 *
 * ── Por qué es un estado y no un booleano ──
 *
 * Los tres desenlaces se tratan distinto en el cliente y no son dos:
 *
 * | Estado | Qué significa | Qué hace la caja |
 * |---|---|---|
 * | `applied` | quedó guardado | lo saca de su cola |
 * | `conflict` | otro lo cambió antes | lo marca para resolver — **reintentar no lo arregla** |
 * | `error` | no se pudo aplicar | reintenta, y tras N intentos lo deja en error |
 *
 * Cuando esto era `success: boolean`, el conflicto tenía que deducirse **buscando la palabra
 * «version» dentro del texto del mensaje**. Funcionaba de milagro: el mensaje decía
 * «(version esperada: 3)» sin acento. Escrito «versión», la comparación falla y **todos los
 * conflictos pasan a tratarse como errores**, se reintentan y acaban descartados sin que nadie lo
 * vea. Ese mensaje estaba copiado en quince sitios.
 *
 * Quien sabe si algo fue conflicto es el repositorio que lo intentó. Aquí solo se transporta.
 */
export type SyncChangeStatus = 'applied' | 'conflict' | 'error';

export interface SyncChangeResult {
  readonly id: string;
  readonly status: SyncChangeStatus;
  /** Para diagnóstico. **No se parsea**: quien decide es `status`. */
  readonly message?: string;
}
