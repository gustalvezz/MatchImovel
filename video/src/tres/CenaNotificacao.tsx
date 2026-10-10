import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { useFonts } from "../fonts";
import { Celular3D } from "./Celular3D";
import { pop } from "../components/anim";

// Cena 3D: o celular sobre a mesa recebe a notificação de match.
// `deslocY` desce o celular (abre espaço para um título) e `cameraZ` afasta a câmera.
export const CenaNotificacao: React.FC<{ titulo: string; linhas: string[]; deslocY?: number; cameraZ?: number }> = ({
  titulo,
  linhas,
  deslocY = 0,
  cameraZ,
}) => {
  useFonts();
  const f = useCurrentFrame();
  const e = Easing.bezier(0.22, 1, 0.36, 1);
  // 1) começa de costas (câmeras à vista), gira mostrando a lateral e para de frente, virado à esquerda;
  // 2) enquanto aguarda a notificação, faz um tilt suave de volta para a direita.
  const NOTIF = 116;
  const t = interpolate(f, [0, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
  const tilt = interpolate(f, [80, 124], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const pose = {
    rotX: interpolate(t, [0, 1], [-0.1, -0.3]) + Math.sin(f / 45) * 0.015,
    rotY: interpolate(t, [0, 1], [Math.PI * 0.92, -0.32]) + tilt * 0.46 + Math.sin(f / 60) * 0.03,
    rotZ: interpolate(t, [0, 1], [-0.12, 0.06]) - tilt * 0.09,
    y: interpolate(t, [0, 1], [-0.35, 0.05]) + deslocY,
    z: interpolate(t, [0, 1], [-0.3, 0]) + interpolate(f, [80, 220], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
  const acesa = interpolate(f, [62, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const notif = pop(f, NOTIF, 13, 150);
  return (
    <AbsoluteFill style={{ background: "#ECEAF6" }}>
      <Celular3D
        cameraZ={cameraZ}
        pose={pose}
        tela={{ acesa, notif, hora: "9:41", data: "sábado, 11 de outubro", notificacao: { titulo, linhas } }}
      />
      {/* som da notificação, no instante em que ela aparece */}
      <Sequence from={NOTIF} durationInFrames={40} layout="none">
        <Audio src={staticFile("sons/notificacao.mp3")} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
