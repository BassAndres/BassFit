/**
 * Real-time 3D muscle model. A low-poly humanoid (built entirely from code —
 * no external 3D assets) that slowly rotates so front and back are both seen,
 * with the worked muscle(s) rendered as glowing, pulsing patches on the body.
 *
 * Rendered with WebGL via expo-gl + three.js through React Three Fiber. If a
 * device can't provide a GL context, the caller's ErrorBoundary falls back to
 * the 2D MuscleMap.
 */
import React, { useRef, type MutableRefObject } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { usePalette } from '@/theme';
import { useModelRotation } from '@/hooks/useModelRotation';
import type { MuscleGroup } from '@/types/models';

type Vec3 = [number, number, number];
interface Patch {
  pos: Vec3;
  size: Vec3;
}

const BASE_COLOR = '#8E8E93';

// Muscle → highlight patches placed on the humanoid's surface.
const PATCHES: Record<MuscleGroup, Patch[]> = {
  chest: [
    { pos: [-0.12, 0.66, 0.13], size: [0.18, 0.2, 0.06] },
    { pos: [0.12, 0.66, 0.13], size: [0.18, 0.2, 0.06] },
  ],
  abs: [{ pos: [0, 0.4, 0.13], size: [0.22, 0.28, 0.06] }],
  shoulders: [
    { pos: [-0.3, 0.74, 0], size: [0.16, 0.16, 0.24] },
    { pos: [0.3, 0.74, 0], size: [0.16, 0.16, 0.24] },
  ],
  biceps: [
    { pos: [-0.33, 0.58, 0.07], size: [0.12, 0.26, 0.08] },
    { pos: [0.33, 0.58, 0.07], size: [0.12, 0.26, 0.08] },
  ],
  triceps: [
    { pos: [-0.33, 0.58, -0.07], size: [0.12, 0.26, 0.08] },
    { pos: [0.33, 0.58, -0.07], size: [0.12, 0.26, 0.08] },
  ],
  forearms: [
    { pos: [-0.39, 0.15, 0.06], size: [0.1, 0.3, 0.08] },
    { pos: [0.39, 0.15, 0.06], size: [0.1, 0.3, 0.08] },
  ],
  back: [{ pos: [0, 0.58, -0.14], size: [0.42, 0.42, 0.06] }],
  quads: [
    { pos: [-0.14, -0.14, 0.1], size: [0.16, 0.42, 0.08] },
    { pos: [0.14, -0.14, 0.1], size: [0.16, 0.42, 0.08] },
  ],
  hamstrings: [
    { pos: [-0.14, -0.14, -0.1], size: [0.16, 0.42, 0.08] },
    { pos: [0.14, -0.14, -0.1], size: [0.16, 0.42, 0.08] },
  ],
  glutes: [
    { pos: [-0.12, 0.03, -0.13], size: [0.18, 0.2, 0.06] },
    { pos: [0.12, 0.03, -0.13], size: [0.18, 0.2, 0.06] },
  ],
  calves: [
    { pos: [-0.14, -0.7, -0.08], size: [0.12, 0.34, 0.08] },
    { pos: [0.14, -0.7, -0.08], size: [0.12, 0.34, 0.08] },
  ],
  fullBody: [
    { pos: [0, 0.66, 0.13], size: [0.42, 0.2, 0.06] },
    { pos: [0, 0.58, -0.14], size: [0.42, 0.42, 0.06] },
    { pos: [-0.14, -0.14, 0.1], size: [0.16, 0.42, 0.08] },
    { pos: [0.14, -0.14, 0.1], size: [0.16, 0.42, 0.08] },
  ],
};

function BaseBody({ color }: { color: string }) {
  const mat = (
    <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
  );
  return (
    <group>
      {/* head */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        {mat}
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        {mat}
      </mesh>
      {/* torso */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.62, 0.26]} />
        {mat}
      </mesh>
      {/* pelvis */}
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.46, 0.2, 0.24]} />
        {mat}
      </mesh>
      {/* arms */}
      <mesh position={[-0.33, 0.56, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.44, 16]} />
        {mat}
      </mesh>
      <mesh position={[0.33, 0.56, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.44, 16]} />
        {mat}
      </mesh>
      <mesh position={[-0.39, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.42, 16]} />
        {mat}
      </mesh>
      <mesh position={[0.39, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.42, 16]} />
        {mat}
      </mesh>
      {/* legs */}
      <mesh position={[-0.14, -0.16, 0]}>
        <cylinderGeometry args={[0.1, 0.09, 0.52, 16]} />
        {mat}
      </mesh>
      <mesh position={[0.14, -0.16, 0]}>
        <cylinderGeometry args={[0.1, 0.09, 0.52, 16]} />
        {mat}
      </mesh>
      <mesh position={[-0.14, -0.7, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.46, 16]} />
        {mat}
      </mesh>
      <mesh position={[0.14, -0.7, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.46, 16]} />
        {mat}
      </mesh>
    </group>
  );
}

function GlowPatch({ patch, color, strong }: { patch: Patch; color: string; strong: boolean }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const pulse = 0.45 + 0.4 * Math.abs(Math.sin(clock.elapsedTime * 2.2));
    mat.current.emissiveIntensity = strong ? pulse : pulse * 0.4;
  });
  return (
    <mesh position={patch.pos}>
      <boxGeometry args={patch.size} />
      <meshStandardMaterial
        ref={mat}
        color={color}
        emissive={color}
        emissiveIntensity={strong ? 0.7 : 0.3}
        transparent
        opacity={strong ? 1 : 0.7}
        roughness={0.4}
      />
    </mesh>
  );
}

function Mannequin({
  primary,
  secondary,
  accent,
  rotationRef,
  draggingRef,
}: {
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  accent: string;
  rotationRef: MutableRefObject<number>;
  draggingRef: MutableRefObject<boolean>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!draggingRef.current) rotationRef.current += delta * 0.55;
    if (group.current) group.current.rotation.y = rotationRef.current;
  });

  const isFull = primary === 'fullBody';
  const primaryPatches = PATCHES[primary] ?? [];
  const secondaryPatches = secondary.flatMap((m) => (m === primary ? [] : PATCHES[m] ?? []));

  return (
    <group ref={group}>
      <BaseBody color={BASE_COLOR} />
      {primaryPatches.map((p, i) => (
        <GlowPatch key={`p-${i}`} patch={p} color={accent} strong />
      ))}
      {!isFull &&
        secondaryPatches.map((p, i) => <GlowPatch key={`s-${i}`} patch={p} color={accent} strong={false} />)}
    </group>
  );
}

interface MuscleModel3DProps {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  height?: number;
}

export function MuscleModel3D({ primary, secondary = [], height = 240 }: MuscleModel3DProps) {
  const { colors } = usePalette();
  const { panHandlers, rotation, dragging } = useModelRotation();
  return (
    <View style={{ height }} {...panHandlers}>
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        gl={{ alpha: true }}
        style={{ backgroundColor: 'transparent' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 5]} intensity={1.1} />
        <directionalLight position={[-3, 2, -3]} intensity={0.45} />
        <Mannequin
          primary={primary}
          secondary={secondary}
          accent={colors.tint}
          rotationRef={rotation}
          draggingRef={dragging}
        />
      </Canvas>
    </View>
  );
}
