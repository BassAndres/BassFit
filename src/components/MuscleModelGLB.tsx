/**
 * Loads and displays a bundled .glb muscle model (the BassFit model pack) with
 * expo-asset + three's GLTFLoader, rendered through expo-gl / React Three Fiber
 * and slowly auto-rotated.
 *
 * Graceful degradation: if the asset can't be read or parsed on a given device,
 * it falls back to the procedural 3D model (MuscleModel3D). The caller also
 * wraps this in an ErrorBoundary that drops to the 2D MuscleMap as a last resort.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

import { MuscleModel3D } from './MuscleModel3D';
import { MUSCLE_MODELS } from '@/data/muscleModels';
import type { MuscleGroup } from '@/types/models';

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let len = b64.length * 0.75;
  if (b64[b64.length - 1] === '=') len--;
  if (b64[b64.length - 2] === '=') len--;
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const e1 = lookup[b64.charCodeAt(i)] ?? 0;
    const e2 = lookup[b64.charCodeAt(i + 1)] ?? 0;
    const e3 = lookup[b64.charCodeAt(i + 2)] ?? 0;
    const e4 = lookup[b64.charCodeAt(i + 3)] ?? 0;
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (b64[i + 2] !== '=') bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (b64[i + 3] !== '=') bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes.buffer;
}

function RotatingModel({ object }: { object: THREE.Object3D }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.55;
  });
  return (
    <group ref={ref}>
      <primitive object={object} />
    </group>
  );
}

interface Props {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  height?: number;
}

export function MuscleModelGLB({ primary, secondary = [], height = 240 }: Props) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setObject(null);
    setFailed(false);
    (async () => {
      try {
        const mod = MUSCLE_MODELS[primary] ?? MUSCLE_MODELS.fullBody;
        const asset = Asset.fromModule(mod);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const buffer = base64ToArrayBuffer(b64);
        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          (gltf) => {
            if (alive) setObject(gltf.scene);
          },
          () => {
            if (alive) setFailed(true);
          }
        );
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [primary]);

  // Could not load the .glb on this device — use the procedural model.
  if (failed) return <MuscleModel3D primary={primary} secondary={secondary} height={height} />;

  return (
    <View style={{ height }}>
      <Canvas camera={{ position: [0, 0, 3.6], fov: 45 }} gl={{ alpha: true }} style={{ backgroundColor: 'transparent' }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 5]} intensity={1.1} />
        <directionalLight position={[-3, 2, -3]} intensity={0.45} />
        {object && <RotatingModel object={object} />}
      </Canvas>
    </View>
  );
}
