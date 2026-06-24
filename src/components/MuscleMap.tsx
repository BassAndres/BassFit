/**
 * Anatomical muscle map: a stylized front + back figure where the worked muscle
 * is highlighted and gently pulses, with secondary muscles shown dimmer.
 *
 * This is a vector, animated visualization (SVG + Reanimated) — it conveys
 * "qué músculo trabaja" clearly and performantly. (A literal rotating 3D model
 * per exercise would require per-movement 3D assets; see README/notes.)
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Rect, Ellipse, Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { usePalette, typography } from '@/theme';
import type { MuscleGroup } from '@/types/models';

const AnimatedG = Animated.createAnimatedComponent(G);

type Block =
  | { kind: 'rect'; muscle: MuscleGroup; x: number; y: number; w: number; h: number; r: number }
  | { kind: 'ellipse'; muscle: MuscleGroup; cx: number; cy: number; rx: number; ry: number };

// Front figure (centered ~x=60) and back figure (centered ~x=180).
const FRONT: Block[] = [
  { kind: 'ellipse', muscle: 'shoulders', cx: 36, cy: 48, rx: 11, ry: 8 },
  { kind: 'ellipse', muscle: 'shoulders', cx: 84, cy: 48, rx: 11, ry: 8 },
  { kind: 'rect', muscle: 'chest', x: 40, y: 54, w: 19, h: 20, r: 6 },
  { kind: 'rect', muscle: 'chest', x: 61, y: 54, w: 19, h: 20, r: 6 },
  { kind: 'rect', muscle: 'biceps', x: 28, y: 64, w: 12, h: 26, r: 6 },
  { kind: 'rect', muscle: 'biceps', x: 80, y: 64, w: 12, h: 26, r: 6 },
  { kind: 'rect', muscle: 'abs', x: 47, y: 78, w: 26, h: 38, r: 6 },
  { kind: 'rect', muscle: 'forearms', x: 24, y: 92, w: 11, h: 30, r: 5 },
  { kind: 'rect', muscle: 'forearms', x: 85, y: 92, w: 11, h: 30, r: 5 },
  { kind: 'rect', muscle: 'quads', x: 42, y: 122, w: 15, h: 46, r: 7 },
  { kind: 'rect', muscle: 'quads', x: 63, y: 122, w: 15, h: 46, r: 7 },
  { kind: 'rect', muscle: 'calves', x: 44, y: 176, w: 12, h: 40, r: 6 },
  { kind: 'rect', muscle: 'calves', x: 64, y: 176, w: 12, h: 40, r: 6 },
];

const BACK: Block[] = [
  { kind: 'ellipse', muscle: 'shoulders', cx: 156, cy: 48, rx: 11, ry: 8 },
  { kind: 'ellipse', muscle: 'shoulders', cx: 204, cy: 48, rx: 11, ry: 8 },
  { kind: 'rect', muscle: 'back', x: 159, y: 52, w: 42, h: 52, r: 10 },
  { kind: 'rect', muscle: 'triceps', x: 148, y: 64, w: 12, h: 26, r: 6 },
  { kind: 'rect', muscle: 'triceps', x: 200, y: 64, w: 12, h: 26, r: 6 },
  { kind: 'rect', muscle: 'forearms', x: 144, y: 92, w: 11, h: 30, r: 5 },
  { kind: 'rect', muscle: 'forearms', x: 205, y: 92, w: 11, h: 30, r: 5 },
  { kind: 'rect', muscle: 'glutes', x: 160, y: 108, w: 40, h: 24, r: 10 },
  { kind: 'rect', muscle: 'hamstrings', x: 162, y: 136, w: 15, h: 40, r: 7 },
  { kind: 'rect', muscle: 'hamstrings', x: 183, y: 136, w: 15, h: 40, r: 7 },
  { kind: 'rect', muscle: 'calves', x: 164, y: 180, w: 12, h: 38, r: 6 },
  { kind: 'rect', muscle: 'calves', x: 184, y: 180, w: 12, h: 38, r: 6 },
];

function renderBlock(b: Block, fill: string, key: string, fillOpacity = 1) {
  if (b.kind === 'ellipse') {
    return <Ellipse key={key} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={fill} fillOpacity={fillOpacity} />;
  }
  return (
    <Rect key={key} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={fill} fillOpacity={fillOpacity} />
  );
}

interface MuscleMapProps {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  height?: number;
}

export function MuscleMap({ primary, secondary = [], height = 220 }: MuscleMapProps) {
  const { colors } = usePalette();
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);

  const animatedProps = useAnimatedProps(() => ({ opacity: pulse.value }));

  const isFull = primary === 'fullBody';
  const isPrimary = (m: MuscleGroup) => isFull || m === primary;
  const isSecondary = (m: MuscleGroup) => secondary.includes(m);
  const isActive = (m: MuscleGroup) => isPrimary(m) || isSecondary(m);

  const base = colors.separator;
  const head = colors.secondaryLabel;

  return (
    <View>
      <Svg width="100%" height={height} viewBox="0 0 240 236">
        {/* Heads (not muscles) */}
        <Circle cx={60} cy={24} r={14} fill={head} fillOpacity={0.35} />
        <Circle cx={180} cy={24} r={14} fill={head} fillOpacity={0.35} />

        {/* Base layer — all muscle blocks, muted */}
        <G>
          {FRONT.map((b, i) => renderBlock(b, base, `fb-${i}`, 0.5))}
          {BACK.map((b, i) => renderBlock(b, base, `bb-${i}`, 0.5))}
        </G>

        {/* Active overlay — highlighted, pulsing */}
        <AnimatedG animatedProps={animatedProps}>
          {FRONT.map((b, i) =>
            isActive(b.muscle)
              ? renderBlock(b, colors.tint, `fa-${i}`, isPrimary(b.muscle) ? 1 : 0.4)
              : null
          )}
          {BACK.map((b, i) =>
            isActive(b.muscle)
              ? renderBlock(b, colors.tint, `ba-${i}`, isPrimary(b.muscle) ? 1 : 0.4)
              : null
          )}
        </AnimatedG>

        <SvgText x={60} y={232} fontSize={9} fill={head} textAnchor="middle">
          Frontal
        </SvgText>
        <SvgText x={180} y={232} fontSize={9} fill={head} textAnchor="middle">
          Posterior
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
