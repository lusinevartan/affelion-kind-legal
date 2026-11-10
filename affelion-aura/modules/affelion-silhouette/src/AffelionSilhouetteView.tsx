import { requireNativeModule, requireNativeView } from 'expo';
import * as React from 'react';
import type { AffelionSilhouetteViewProps, AffelionSilhouetteViewRef } from './AffelionSilhouette.types';

const NativeView: React.ComponentType<AffelionSilhouetteViewProps & { ref?: React.Ref<AffelionSilhouetteViewRef> }> =
  requireNativeView('AffelionSilhouette');

const NativeModule = requireNativeModule<{ supportsARKitFaceTracking: boolean }>('AffelionSilhouette');

export const supportsARKitFaceTracking: boolean = NativeModule.supportsARKitFaceTracking;

/** Front-camera preview that emits silhouette masks and face metrics. */
export const AffelionSilhouetteView = React.forwardRef<AffelionSilhouetteViewRef, AffelionSilhouetteViewProps>(
  function AffelionSilhouetteView(props, ref) {
    return <NativeView {...props} ref={ref} />;
  },
);
