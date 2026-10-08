import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { iris } from "@remotion/transitions/iris";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { WIDTH, HEIGHT } from "../theme";

// Transição própria: a cena atual "atravessa" a câmera (zoom + desfoque) e a próxima assenta no lugar.
type ZoomProps = Record<string, never>;
const ZoomThrough: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === "entering";
  // As duas cenas ficam sempre com escala >= 1, então nunca aparecem bordas.
  const scale = entering ? 1.35 - 0.35 * p : 1 + 0.5 * p;
  const blur = entering ? (1 - p) * 28 : p * 28;
  const opacity = entering ? Math.min(1, p * 1.4) : 1 - p;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity }}>{children}</AbsoluteFill>
  );
};
export const zoomThrough = (): TransitionPresentation<ZoomProps> => ({ component: ZoomThrough, props: {} });

const D = 18; // duração padrão das transições (frames)
export const T = {
  D,
  smooth: linearTiming({ durationInFrames: D, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
  springy: springTiming({ durationInFrames: D, config: { damping: 200 } }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPresentation = TransitionPresentation<any>;

export const P: Record<"zoom" | "fade" | "slideUp" | "slideLeft" | "wipe" | "iris" | "clock", AnyPresentation> = {
  zoom: zoomThrough(),
  fade: fade(),
  slideUp: slide({ direction: "from-bottom" }),
  slideLeft: slide({ direction: "from-right" }),
  wipe: wipe({ direction: "from-bottom-left" }),
  iris: iris({ width: WIDTH, height: HEIGHT }),
  clock: clockWipe({ width: WIDTH, height: HEIGHT }),
};
