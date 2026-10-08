import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT_BODY } from "../theme";
import { pop } from "./anim";

export const SCREEN_W = 390; // largura lógica das telas (igual aos prints, em px de celular)

// Moldura de celular. O conteúdo é desenhado em 390px de largura e ampliado,
// então o texto continua nítido em 1080p.
export const Phone: React.FC<{
  width?: number;
  height: number;
  enter?: number;
  bg?: string;
  children: React.ReactNode;
}> = ({ width = 860, height, enter = 0, bg = "#F7F7FB", children }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, enter, 16, 110);
  const bezel = 20;
  const scale = (width - bezel * 2) / SCREEN_W;
  const innerH = (height - bezel * 2) / scale;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 96,
        background: "#0F1022",
        padding: bezel,
        boxShadow: "0 60px 120px rgba(49,46,129,0.35), 0 0 0 3px #2A2B45 inset",
        transform: `translateY(${(1 - p) * 500}px) rotate(${(1 - p) * 6}deg)`,
        opacity: Math.min(1, p * 2),
        position: "relative",
      }}
    >
      <div
        style={{
          width: width - bezel * 2,
          height: height - bezel * 2,
          borderRadius: 78,
          overflow: "hidden",
          background: bg,
          position: "relative",
        }}
      >
        <div
          style={{
            width: SCREEN_W,
            height: innerH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            fontFamily: FONT_BODY,
          }}
        >
          {children}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: bezel + 18,
          left: "50%",
          width: 150,
          height: 40,
          marginLeft: -75,
          borderRadius: 20,
          background: "#0F1022",
        }}
      />
    </div>
  );
};

// Toque animado (círculo que pulsa) para simular cliques na tela.
export const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -8 || t > 22) return null;
  const appear = Math.min(1, (t + 8) / 8);
  const ring = Math.max(0, t) / 22;
  return (
    <div style={{ position: "absolute", left: x - 22, top: y - 22, pointerEvents: "none", zIndex: 50 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: "rgba(79,70,229,0.35)",
          border: `2px solid ${C.white}`,
          opacity: t > 6 ? 1 - (t - 6) / 16 : appear,
          transform: `scale(${t < 0 ? 1.4 - appear * 0.4 : 1 - Math.min(t, 4) * 0.05})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          border: `3px solid ${C.indigo}`,
          opacity: t >= 0 ? 1 - ring : 0,
          transform: `scale(${1 + ring * 1.6})`,
        }}
      />
    </div>
  );
};
