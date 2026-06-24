/**
 * Touch-drag rotation control for the 3D muscle model. Returns pan handlers to
 * spread on the wrapping View and refs the R3F render loop reads each frame:
 * while dragging, the user controls Y rotation; otherwise it auto-rotates.
 */
import { useRef, type MutableRefObject } from 'react';
import { PanResponder, type GestureResponderHandlers } from 'react-native';

export interface ModelRotation {
  panHandlers: GestureResponderHandlers;
  rotation: MutableRefObject<number>;
  dragging: MutableRefObject<boolean>;
}

export function useModelRotation(): ModelRotation {
  const rotation = useRef(0);
  const dragging = useRef(false);
  const lastDx = useRef(0);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2,
      onPanResponderGrant: () => {
        dragging.current = true;
        lastDx.current = 0;
      },
      onPanResponderMove: (_e, g) => {
        rotation.current += (g.dx - lastDx.current) * 0.01;
        lastDx.current = g.dx;
      },
      onPanResponderRelease: () => {
        dragging.current = false;
        lastDx.current = 0;
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        lastDx.current = 0;
      },
    })
  ).current;

  return { panHandlers: responder.panHandlers, rotation, dragging };
}
