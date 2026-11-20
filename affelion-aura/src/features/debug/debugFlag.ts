/**
 * The debug screen exists only in TestFlight test builds (the `testflight` EAS profile sets
 * EXPO_PUBLIC_DEBUG_PANEL=1) and in development. The App Store build uses the `production`
 * profile, which never sets it, so the screen and its links cannot appear there.
 */
export function debugPanelEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  return process.env.EXPO_PUBLIC_DEBUG_PANEL === '1';
}
