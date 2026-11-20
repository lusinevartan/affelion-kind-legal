import * as React from 'react';
import { AppState } from 'react-native';

/**
 * The current time as state, so screens stay pure. Refreshes every minute and whenever the app
 * comes back to the front, which is when a new week's free scan usually becomes due.
 */
export function useNow(refreshMs = 60_000): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, refreshMs);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [refreshMs]);
  return now;
}
