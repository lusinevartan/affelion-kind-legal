import * as React from 'react';
import { View } from 'react-native';
import type { AffelionSilhouetteViewProps, AffelionSilhouetteViewRef } from './AffelionSilhouette.types';

export const supportsARKitFaceTracking = false;

/** Web placeholder: no segmentation. The app falls back to a soft oval mask. */
export const AffelionSilhouetteView = React.forwardRef<AffelionSilhouetteViewRef, AffelionSilhouetteViewProps>(
  function AffelionSilhouetteView(props, ref) {
    React.useImperativeHandle(ref, () => ({
      async captureStill() {
        throw new Error('Still capture is only available on iOS and Android devices.');
      },
    }));
    React.useEffect(() => {
      props.onStatus?.({ nativeEvent: { state: 'error', message: 'Silhouette tracking is device-only.' } });
    }, [props.onStatus]);
    return <View style={[{ backgroundColor: '#000' }, props.style]} />;
  },
);
