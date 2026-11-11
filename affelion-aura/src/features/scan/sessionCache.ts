import type { SilhouetteMask } from '../../render/fluid/FluidSim';

/**
 * Outlines by scan id, in memory. The scan screen puts a new one here; the store persists it
 * and refills this cache at launch. A scan without one falls back to the neutral silhouette.
 */
const masks = new Map<string, SilhouetteMask>();

export function cacheMask(scanId: string, mask: SilhouetteMask | null) {
  if (mask) masks.set(scanId, mask);
}

export function getCachedMask(scanId: string): SilhouetteMask | null {
  return masks.get(scanId) ?? null;
}
