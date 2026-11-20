import { File } from 'expo-file-system';

/**
 * Remove files the app wrote: stills, exported portraits and practice snapshots. Used when the
 * person deletes their data, so nothing of them is left on the device. A file that is already
 * gone, or a URI this platform cannot open, is skipped.
 */
export function deleteFiles(uris: readonly (string | null | undefined)[]): number {
  let removed = 0;
  for (const uri of new Set(uris)) {
    if (!uri || !/^file:|^\//.test(uri)) continue;
    try {
      const f = new File(uri);
      if (f.exists) {
        f.delete();
        removed++;
      }
    } catch {
      // Not ours to remove, or already gone.
    }
  }
  return removed;
}
