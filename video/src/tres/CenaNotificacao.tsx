import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { useFonts } from "../fonts";
import { Celular3D } from "./Celular3D";
import { pop } from "../components/anim";

// Cena 3D: o celular sobre a mesa recebe a notificação de match.
export const CenaNotificacao: React.FC<{ titulo: string; linhas: string[] }> = ({ titulo, linhas }) => {
  useFonts();
  const f = useCurrentFrame();
  const e = Easing.bezier(0.22, 1, 0.36, 1);
  const t = interpolate(f, [0, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
  const pose = {
    rotX: interpolate(t, [0, 1], [-0.95, -0.42]) + Math.sin(f / 45) * 0.015,
    rotY: interpolate(t, [0, 1], [0.9, -0.12]) + Math.sin(f / 60) * 0.03,
    rotZ: interpolate(t, [0, 1], [0.35, 0.08]),
    y: interpolate(t, [0, 1], [-0.6, 0.05]),
    z: interpolate(t, [0, 1], [-1.2, 0]) + interpolate(f, [70, 220], [0, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
  const acesa = interpolate(f, [48, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const notif = pop(f, 84, 13, 150);
  return (
    <AbsoluteFill style={{ background: "#0d0c12" }}>
      <Celular3D
        pose={pose}
        tela={{ acesa, notif, hora: "9:41", data: "sábado, 11 de outubro", notificacao: { titulo, linhas } }}
      />
    </AbsoluteFill>
  );
};
