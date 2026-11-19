import * as React from 'react';
import { Image, View } from 'react-native';
import type { AffelionSilhouetteViewProps, AffelionSilhouetteViewRef } from './AffelionSilhouette.types';

export const supportsARKitFaceTracking = false;

/**
 * Browsers have no person segmentation here, so the outline is device-only. The review build
 * (localStorage `aura.demo` = `1`, with `aura.demoStill` and `aura.demoMask`) shows a sample
 * photo as the camera and reports its outline, so the scan runs end to end.
 */
function review(): { still: string; mask: { w: number; h: number; b64: string } } | null {
  try {
    const ls = globalThis.localStorage;
    if (ls?.getItem('aura.demo') !== '1') return null;
    const still = ls.getItem('aura.demoStill');
    const raw = ls.getItem('aura.demoMask');
    if (!still || !raw) return null;
    return { still, mask: JSON.parse(raw) as { w: number; h: number; b64: string } };
  } catch {
    return null;
  }
}

export const AffelionSilhouetteView = React.forwardRef<AffelionSilhouetteViewRef, AffelionSilhouetteViewProps>(
  function AffelionSilhouetteView(props, ref) {
    const demo = React.useMemo(review, []);
    const { active, onMask, onFace, onStatus } = props;
    React.useImperativeHandle(ref, () => ({
      async captureStill() {
        if (!demo) throw new Error('Still capture is only available on iOS and Android devices.');
        return { uri: demo.still, width: 0, height: 0 };
      },
    }), [demo]);
    React.useEffect(() => {
      if (!demo) {
        onStatus?.({ nativeEvent: { state: 'error', message: 'Silhouette tracking is device-only.' } });
        return;
      }
      if (!active) return;
      onStatus?.({ nativeEvent: { state: 'running' } });
      const { w, h, b64 } = demo.mask;
      const id = setInterval(() => {
        onFace?.({ nativeEvent: { detected: true, cx: 0.5, cy: 0.38, width: 0.34, height: 0.3, yaw: 0, pitch: 0, roll: 0 } });
        onMask?.({ nativeEvent: { width: w, height: h, imageAspect: w / h, data: b64 } });
      }, 70);
      return () => {
        clearInterval(id);
        onStatus?.({ nativeEvent: { state: 'stopped' } });
      };
    }, [demo, active, onMask, onFace, onStatus]);
    return (
      <View style={[{ backgroundColor: '#000', overflow: 'hidden' }, props.style]}>
        {demo ? <Image source={{ uri: demo.still }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} resizeMode="cover" /> : null}
      </View>
    );
  },
);
