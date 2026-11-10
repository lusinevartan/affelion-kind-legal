import type { SilhouetteMask } from '../../render/fluid/FluidSim';

/**
 * In-memory handoff from the scan screen to the portrait/report screens. Masks are large
 * and transient, so they are not persisted; a saved scan without a cached mask falls back
 * to a soft oval field in the renderer.
 */
const masks = new Map<string, SilhouetteMask>();

export function cacheMask(scanId: string, mask: SilhouetteMask | null) {
  if (mask) masks.set(scanId, mask);
}

export function getCachedMask(scanId: string): SilhouetteMask | null {
  return masks.get(scanId) ?? null;
}
