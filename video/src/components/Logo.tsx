import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT_TITLE } from "../theme";
import { ease, pop } from "./anim";

const CASA =
  "M 168 412 H 146 Q 110 412 110 376 V 230 Q 110 206 128 191 L 230 104 Q 256 82 282 104 L 384 191 Q 402 206 402 230 V 376 Q 402 412 366 412 H 344";
const M = "M 192 412 V 262 L 256 322 L 320 262 V 412";
const LEN_CASA = 1250;
const LEN_M = 560;

// Logo MatchImovel (casa + M) desenhado em SVG. `animate` desenha o traço.
export const LogoMark: React.FC<{
  size: number;
  start?: number;
  animate?: boolean;
  light?: boolean;
}> = ({ size, start = 0, animate = false, light = false }) => {
  const frame = useCurrentFrame();
  const casa = animate ? ease(frame, start, start + 26) : 1;
  const m = animate ? ease(frame, start + 14, start + 36) : 1;
  return (
    <svg width={size} height={size} viewBox="60 50 392 400">
      <path
        d={CASA}
        fill="none"
        stroke={light ? C.white : C.navy}
        strokeWidth={38}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={LEN_CASA}
        strokeDashoffset={LEN_CASA * (1 - casa)}
      />
      <path
        d={M}
        fill="none"
        stroke={light ? "#B9A8FF" : C.violet}
        strokeWidth={38}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={LEN_M}
        strokeDashoffset={LEN_M * (1 - m)}
      />
    </svg>
  );
};

export const Wordmark: React.FC<{ size: number; light?: boolean }> = ({ size, light }) => (
  <span style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: size, letterSpacing: -0.5 }}>
    <span style={{ color: light ? C.white : C.slate900 }}>Match</span>
    <span style={{ color: light ? "#A5B4FC" : C.indigo }}>Imovel</span>
  </span>
);

// Logo completo com entrada animada (traço + nome deslizando).
export const LogoReveal: React.FC<{ start?: number; size?: number; light?: boolean }> = ({
  start = 0,
  size = 1,
  light,
}) => {
  const frame = useCurrentFrame();
  const word = pop(frame, start + 22);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 * size }}>
      <div style={{ transform: `scale(${0.6 + 0.4 * pop(frame, start)})` }}>
        <LogoMark size={170 * size} start={start} animate light={light} />
      </div>
      <div
        style={{
          opacity: word,
          transform: `translateX(${(1 - word) * -40}px)`,
          clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
        }}
      >
        <Wordmark size={112 * size} light={light} />
      </div>
    </div>
  );
};
