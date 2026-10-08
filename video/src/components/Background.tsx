import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

// Fundo claro da landing (indigo-50 → purple-50 → branco) com bolhas que flutuam.
export const LightBg: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.indigo50} 0%, ${C.purple50} 45%, ${C.white} 100%)`,
        overflow: "hidden",
      }}
    >
      <Blob x={780 + Math.sin(f / 40) * 40} y={-120 + Math.cos(f / 50) * 30} r={620} color="rgba(199,210,254,0.75)" />
      <Blob x={-260 + Math.cos(f / 45) * 30} y={1300 + Math.sin(f / 38) * 40} r={560} color="rgba(233,213,255,0.7)" />
      {children}
    </AbsoluteFill>
  );
};

// Fundo escuro (gradiente indigo → roxo) usado em ganchos e chamadas.
export const DarkBg: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 30% 20%, #3B2FB8 0%, #1E1B4B 55%, #0B0A23 100%)`,
        overflow: "hidden",
      }}
    >
      <Blob x={700 + Math.sin(f / 30) * 60} y={1350 + Math.cos(f / 40) * 50} r={700} color="rgba(147,51,234,0.35)" />
      <Blob x={-200 + Math.cos(f / 35) * 50} y={-100 + Math.sin(f / 45) * 40} r={600} color="rgba(79,70,229,0.35)" />
      {children}
    </AbsoluteFill>
  );
};

const Blob: React.FC<{ x: number; y: number; r: number; color: string }> = ({ x, y, r, color }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: r,
      height: r,
      borderRadius: "50%",
      background: color,
      filter: "blur(90px)",
    }}
  />
);
