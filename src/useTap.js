import { useRef } from 'react';

// Pointer-based tap detector. Returns handlers to spread on a list row.
//
// Why this exists: during iOS momentum scrolling, the first synthetic click
// on a row is consumed by Safari to halt the scroll, so an onClick handler
// silently misses taps that land on a still-decelerating list. Pointer
// events fire reliably, and we treat a press+release as a tap only when
// the pointer didn't move (so a flick/drag is still a scroll, not a tap).
export function useTap(onTap, { moveThreshold = 8, timeThreshold = 600 } = {}) {
  const state = useRef({ x: 0, y: 0, t: 0, active: false, moved: false });

  return {
    onPointerDown: (e) => {
      state.current = {
        x: e.clientX,
        y: e.clientY,
        t: Date.now(),
        active: true,
        moved: false,
      };
    },
    onPointerMove: (e) => {
      const s = state.current;
      if (!s.active || s.moved) return;
      if (
        Math.abs(e.clientX - s.x) > moveThreshold ||
        Math.abs(e.clientY - s.y) > moveThreshold
      ) {
        s.moved = true;
      }
    },
    onPointerUp: (e) => {
      const s = state.current;
      if (!s.active) return;
      const dt = Date.now() - s.t;
      const moved = s.moved;
      s.active = false;
      if (moved || dt >= timeThreshold) return;
      // Don't intercept taps that began on a nested interactive control —
      // the control's own click handler should run instead.
      if (
        e.target &&
        typeof e.target.closest === 'function' &&
        e.target.closest('button, a, input, textarea, select, label')
      ) {
        return;
      }
      onTap(e);
    },
    onPointerCancel: () => {
      state.current.active = false;
    },
  };
}
