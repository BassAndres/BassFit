/**
 * Procedural muscular anatomy model (rigged + posed).
 *
 * A humanoid built from smooth volumes (capsules for limbs/torso, spheres for
 * muscle bellies and joints) organized as a joint hierarchy, so it can be
 * placed into the exercise pose. The worked muscle(s) glow and pulse.
 *
 * This is a stylized-but-muscular figure generated entirely in code (no
 * external assets). For a photoreal anatomical model you'd load a rigged .glb
 * (Z-Anatomy / MakeHuman / Mixamo) — the loader (MuscleModelGLB) already
 * supports that path. Rendered with expo-gl / React Three Fiber.
 */
import React, { useRef, type MutableRefObject } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { usePalette } from '@/theme';
import { useModelRotation } from '@/hooks/useModelRotation';
import { poseForExercise, type PoseKey } from '@/data/exercisePoses';
import type { MuscleGroup } from '@/types/models';

const SKIN = '#9a9398';
type V3 = [number, number, number];

interface Pose {
  root?: V3;
  rootRot?: V3;
  waist?: V3;
  shoulderL?: V3;
  shoulderR?: V3;
  elbowL?: number;
  elbowR?: number;
  hipL?: V3;
  hipR?: V3;
  kneeL?: number;
  kneeR?: number;
}

const POSES: Record<PoseKey, Pose> = {
  standing: {},
  squat: {
    root: [0, -0.12, 0],
    waist: [0.28, 0, 0],
    hipL: [-1.0, 0, 0],
    hipR: [-1.0, 0, 0],
    kneeL: 1.7,
    kneeR: 1.7,
    shoulderL: [-1.4, 0, 0],
    shoulderR: [-1.4, 0, 0],
    elbowL: 0.3,
    elbowR: 0.3,
  },
  hinge: {
    waist: [0.9, 0, 0],
    hipL: [-0.2, 0, 0],
    hipR: [-0.2, 0, 0],
    kneeL: 0.3,
    kneeR: 0.3,
    shoulderL: [0.4, 0, 0],
    shoulderR: [0.4, 0, 0],
  },
  benchPress: {
    shoulderL: [-1.5, 0, 0.25],
    shoulderR: [-1.5, 0, -0.25],
    elbowL: 0.5,
    elbowR: 0.5,
  },
  overheadPress: {
    shoulderL: [-2.7, 0, 0.2],
    shoulderR: [-2.7, 0, -0.2],
    elbowL: 0.4,
    elbowR: 0.4,
  },
  row: {
    waist: [0.6, 0, 0],
    hipL: [-0.15, 0, 0],
    hipR: [-0.15, 0, 0],
    kneeL: 0.25,
    kneeR: 0.25,
    shoulderL: [0.4, 0, 0],
    shoulderR: [0.4, 0, 0],
    elbowL: 1.4,
    elbowR: 1.4,
  },
  curl: { shoulderL: [0.2, 0, 0], shoulderR: [0.2, 0, 0], elbowL: 1.7, elbowR: 1.7 },
  pushdown: { shoulderL: [0.1, 0, 0], shoulderR: [0.1, 0, 0], elbowL: 1.0, elbowR: 1.0 },
  lateralRaise: { shoulderL: [0, 0, 1.4], shoulderR: [0, 0, -1.4] },
  lunge: {
    root: [0, -0.1, 0],
    hipL: [-0.9, 0, 0],
    kneeL: 1.4,
    hipR: [0.45, 0, 0],
    kneeR: 1.2,
    shoulderL: [0.15, 0, 0],
    shoulderR: [0.15, 0, 0],
  },
  calfRaise: { root: [0, 0.06, 0] },
  abs: { waist: [0.5, 0, 0], shoulderL: [-0.8, 0, 0], shoulderR: [-0.8, 0, 0], elbowL: 0.6, elbowR: 0.6 },
};

/** A muscle volume that glows + pulses when it's the worked muscle. */
function Muscle({
  active,
  accent,
  position,
  rotation,
  scale,
  kind,
  args,
}: {
  active: boolean;
  accent: string;
  position?: V3;
  rotation?: V3;
  scale?: V3;
  kind: 'capsule' | 'sphere';
  args: [number, number?, number?, number?];
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (active && mat.current) {
      mat.current.emissiveIntensity = 0.4 + 0.4 * Math.abs(Math.sin(clock.elapsedTime * 2.2));
    }
  });
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      {kind === 'capsule' ? (
        <capsuleGeometry args={[args[0], args[1] ?? 0.2, args[2] ?? 6, args[3] ?? 14]} />
      ) : (
        <sphereGeometry args={[args[0], args[2] ?? 16, args[3] ?? 16]} />
      )}
      <meshStandardMaterial
        ref={mat}
        color={active ? accent : SKIN}
        emissive={active ? accent : '#000000'}
        emissiveIntensity={active ? 0.6 : 0}
        roughness={0.55}
        metalness={0.05}
      />
    </mesh>
  );
}

function Figure({
  pose,
  accent,
  isActive,
  rotation,
  dragging,
}: {
  pose: Pose;
  accent: string;
  isActive: (m: MuscleGroup) => boolean;
  rotation: MutableRefObject<number>;
  dragging: MutableRefObject<boolean>;
}) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!dragging.current) rotation.current += delta * 0.5;
    if (spin.current) spin.current.rotation.y = rotation.current;
  });

  const z: V3 = [0, 0, 0];
  return (
    <group ref={spin}>
      <group position={pose.root ?? z} rotation={pose.rootRot ?? z}>
        {/* pelvis */}
        <Muscle active={false} accent={accent} kind="sphere" args={[0.16, 18, 14]} position={[0, 0, 0]} scale={[1.2, 0.7, 0.8]} />
        <Muscle active={isActive('glutes')} accent={accent} kind="sphere" args={[0.1]} position={[-0.08, -0.04, -0.12]} />
        <Muscle active={isActive('glutes')} accent={accent} kind="sphere" args={[0.1]} position={[0.08, -0.04, -0.12]} />

        {/* spine / torso (rotates at the waist) */}
        <group position={[0, 0.06, 0]} rotation={pose.waist ?? z}>
          {/* ribcage / lats base */}
          <Muscle active={isActive('back')} accent={accent} kind="capsule" args={[0.17, 0.26]} position={[0, 0.32, 0]} scale={[1.25, 1, 0.85]} />
          {/* pecs */}
          <Muscle active={isActive('chest')} accent={accent} kind="sphere" args={[0.11]} position={[-0.1, 0.46, 0.13]} scale={[1.1, 0.8, 0.7]} />
          <Muscle active={isActive('chest')} accent={accent} kind="sphere" args={[0.11]} position={[0.1, 0.46, 0.13]} scale={[1.1, 0.8, 0.7]} />
          {/* abs (six-pack) */}
          {[0.26, 0.16, 0.06].map((y, r) => (
            <React.Fragment key={r}>
              <Muscle active={isActive('abs')} accent={accent} kind="sphere" args={[0.05]} position={[-0.055, y, 0.14]} />
              <Muscle active={isActive('abs')} accent={accent} kind="sphere" args={[0.05]} position={[0.055, y, 0.14]} />
            </React.Fragment>
          ))}

          {/* neck + head */}
          <group position={[0, 0.5, 0]}>
            <Muscle active={false} accent={accent} kind="capsule" args={[0.05, 0.08]} position={[0, 0.05, 0]} />
            <Muscle active={false} accent={accent} kind="sphere" args={[0.13, 20, 20]} position={[0, 0.22, 0]} />
          </group>

          {/* LEFT arm */}
          <group position={[-0.24, 0.46, 0]} rotation={pose.shoulderL ?? z}>
            <Muscle active={isActive('shoulders')} accent={accent} kind="sphere" args={[0.09]} position={[0, 0, 0]} />
            <Muscle active={isActive('biceps')} accent={accent} kind="capsule" args={[0.06, 0.26]} position={[0, -0.18, 0.02]} />
            <Muscle active={isActive('triceps')} accent={accent} kind="capsule" args={[0.055, 0.24]} position={[0, -0.18, -0.03]} scale={[1, 1, 0.8]} />
            <group position={[0, -0.36, 0]} rotation={[pose.elbowL ?? 0, 0, 0]}>
              <Muscle active={isActive('forearms')} accent={accent} kind="capsule" args={[0.05, 0.26]} position={[0, -0.16, 0]} />
              <Muscle active={false} accent={accent} kind="sphere" args={[0.055]} position={[0, -0.34, 0]} />
            </group>
          </group>

          {/* RIGHT arm */}
          <group position={[0.24, 0.46, 0]} rotation={pose.shoulderR ?? z}>
            <Muscle active={isActive('shoulders')} accent={accent} kind="sphere" args={[0.09]} position={[0, 0, 0]} />
            <Muscle active={isActive('biceps')} accent={accent} kind="capsule" args={[0.06, 0.26]} position={[0, -0.18, 0.02]} />
            <Muscle active={isActive('triceps')} accent={accent} kind="capsule" args={[0.055, 0.24]} position={[0, -0.18, -0.03]} scale={[1, 1, 0.8]} />
            <group position={[0, -0.36, 0]} rotation={[pose.elbowR ?? 0, 0, 0]}>
              <Muscle active={isActive('forearms')} accent={accent} kind="capsule" args={[0.05, 0.26]} position={[0, -0.16, 0]} />
              <Muscle active={false} accent={accent} kind="sphere" args={[0.055]} position={[0, -0.34, 0]} />
            </group>
          </group>
        </group>

        {/* LEFT leg */}
        <group position={[-0.1, -0.05, 0]} rotation={pose.hipL ?? z}>
          <Muscle active={isActive('quads')} accent={accent} kind="capsule" args={[0.1, 0.3]} position={[0, -0.25, 0.02]} />
          <Muscle active={isActive('hamstrings')} accent={accent} kind="capsule" args={[0.085, 0.28]} position={[0, -0.25, -0.05]} scale={[1, 1, 0.8]} />
          <group position={[0, -0.5, 0]} rotation={[pose.kneeL ?? 0, 0, 0]}>
            <Muscle active={isActive('calves')} accent={accent} kind="capsule" args={[0.075, 0.28]} position={[0, -0.22, -0.01]} />
            <Muscle active={false} accent={accent} kind="sphere" args={[0.07]} position={[0, -0.42, 0.05]} scale={[1, 0.6, 1.4]} />
          </group>
        </group>

        {/* RIGHT leg */}
        <group position={[0.1, -0.05, 0]} rotation={pose.hipR ?? z}>
          <Muscle active={isActive('quads')} accent={accent} kind="capsule" args={[0.1, 0.3]} position={[0, -0.25, 0.02]} />
          <Muscle active={isActive('hamstrings')} accent={accent} kind="capsule" args={[0.085, 0.28]} position={[0, -0.25, -0.05]} scale={[1, 1, 0.8]} />
          <group position={[0, -0.5, 0]} rotation={[pose.kneeR ?? 0, 0, 0]}>
            <Muscle active={isActive('calves')} accent={accent} kind="capsule" args={[0.075, 0.28]} position={[0, -0.22, -0.01]} />
            <Muscle active={false} accent={accent} kind="sphere" args={[0.07]} position={[0, -0.42, 0.05]} scale={[1, 0.6, 1.4]} />
          </group>
        </group>
      </group>
    </group>
  );
}

interface AnatomyModelProps {
  exerciseId: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  height?: number;
}

export function AnatomyModel({ exerciseId, primary, secondary = [], height = 280 }: AnatomyModelProps) {
  const { colors } = usePalette();
  const control = useModelRotation();

  const poseKey = poseForExercise(exerciseId, primary);
  const pose = POSES[poseKey];
  const isFull = primary === 'fullBody';
  const isActive = (m: MuscleGroup) => isFull || m === primary || secondary.includes(m);

  return (
    <View style={{ height }} {...control.panHandlers}>
      <Canvas camera={{ position: [0, 0, 2.7], fov: 45 }} gl={{ alpha: true }} style={{ backgroundColor: 'transparent' }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[2, 4, 5]} intensity={1.15} />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} />
        <Figure pose={pose} accent={colors.tint} isActive={isActive} rotation={control.rotation} dragging={control.dragging} />
      </Canvas>
    </View>
  );
}
