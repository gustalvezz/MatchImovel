import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../theme";

// Entrada com mola: 0 → 1 a partir de `delay` (em frames).
export const pop = (frame: number, delay = 0, damping = 14, stiffness = 140) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness, mass: 0.8 } });

// Interpolação linear com clamp e easing suave.
export const ease = (
  frame: number,
  from: number,
  to: number,
  out: [number, number] = [0, 1],
  easing: (t: number) => number = Easing.bezier(0.22, 1, 0.36, 1),
) =>
  interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Texto digitado: devolve o trecho visível de `text` entre `start` e `start + dur`.
export const typed = (frame: number, text: string, start: number, dur: number) => {
  const n = Math.round(ease(frame, start, start + dur, [0, text.length], (t) => t));
  return text.slice(0, n);
};

// Contador numérico animado.
export const countUp = (frame: number, to: number, start: number, dur: number, from = 0) =>
  Math.round(ease(frame, start, start + dur, [from, to], Easing.out(Easing.cubic)));

export const brl = (n: number) => n.toLocaleString("pt-BR");
