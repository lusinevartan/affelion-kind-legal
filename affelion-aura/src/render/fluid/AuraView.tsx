import * as React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import type { AuraParams } from '../../core/types';
import { FluidSim, QUALITY_PRESETS, type FluidQuality, type SilhouetteMask } from './FluidSim';

export interface AuraViewProps {
  params: AuraParams | null;
  mask: SilhouetteMask | null;
  quality?: keyof typeof QUALITY_PRESETS | FluidQuality;
  /** Stop advancing the simulation (keeps the last frame). */
  paused?: boolean;
  /** Composite as pigment on a light ground. */
  paper?: boolean;
  style?: StyleProp<ViewStyle>;
  onReady?: () => void;
}

export interface AuraViewRef {
  /** PNG with alpha of the current frame, as a file URI. */
  snapshot(): Promise<{ uri: string; width: number; height: number }>;
}

/**
 * Transparent GL surface running the fluid aura. Layer it above the camera preview or a still.
 * Rendering is driven by requestAnimationFrame and paced by the device refresh rate (60 fps target).
 */
export const AuraView = React.forwardRef<AuraViewRef, AuraViewProps>(function AuraView(
  { params, mask, quality = 'medium', paused = false, paper = false, style, onReady },
  ref,
) {
  const glViewRef = React.useRef<GLView>(null);
  const simRef = React.useRef<FluidSim | null>(null);
  const glRef = React.useRef<ExpoWebGLRenderingContext | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastRef = React.useRef<number>(0);
  const pausedRef = React.useRef(paused);
  React.useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  React.useImperativeHandle(ref, () => ({
    async snapshot() {
      const view = glViewRef.current;
      if (!view) throw new Error('Aura view is not mounted');
      const snap = await view.takeSnapshotAsync({ format: 'png', flip: false });
      return { uri: typeof snap.uri === 'string' ? snap.uri : String(snap.uri), width: snap.width, height: snap.height };
    },
  }));

  const loop = React.useCallback((now: number) => {
    const sim = simRef.current;
    const gl = glRef.current;
    if (!sim || !gl) return;
    const last = lastRef.current || now;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    lastRef.current = now;
    if (!pausedRef.current) {
      sim.step(dt);
      gl.endFrameEXP();
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const onContextCreate = React.useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      glRef.current = gl;
      const q = typeof quality === 'string' ? QUALITY_PRESETS[quality] : quality;
      const sim = new FluidSim(gl, q);
      sim.paper = paper;
      simRef.current = sim;
      if (params) sim.setParams(params);
      sim.setMask(mask);
      lastRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
      onReady?.();
    },
    // The sim is created once per GL context; later prop changes flow through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loop],
  );

  React.useEffect(() => {
    if (params) simRef.current?.setParams(params);
  }, [params]);

  React.useEffect(() => {
    simRef.current?.setMask(mask);
  }, [mask]);

  React.useEffect(() => {
    if (simRef.current) simRef.current.paper = paper;
  }, [paper]);

  React.useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      simRef.current?.dispose();
      simRef.current = null;
    },
    [],
  );

  return (
    <View style={[styles.root, style]} pointerEvents="none">
      <GLView ref={glViewRef} style={styles.gl} onContextCreate={onContextCreate} msaaSamples={0} />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: 'transparent' },
  gl: { flex: 1, backgroundColor: 'transparent' },
});
