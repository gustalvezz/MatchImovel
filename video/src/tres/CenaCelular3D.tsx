import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Headline, Kicker } from "../components/Headline";
import { useFonts } from "../fonts";
import { Celular3D, Pose } from "./Celular3D";

export type Entrada = "direita" | "esquerda" | "baixo" | "frente";

const ease = Easing.bezier(0.22, 1, 0.36, 1);

// Pose inicial de cada tipo de entrada; todas terminam de frente, levemente inclinadas.
const INICIO: Record<Entrada, Required<Pose>> = {
  direita: { x: 1.8, y: 0, z: -0.4, rotX: -0.1, rotY: -1.0, rotZ: 0.12 },
  esquerda: { x: -1.8, y: 0, z: -0.4, rotX: -0.1, rotY: 1.0, rotZ: -0.12 },
  baixo: { x: 0, y: -2.4, z: -0.3, rotX: -1.0, rotY: 0.2, rotZ: 0 },
  frente: { x: 0, y: -0.4, z: -1.4, rotX: -1.15, rotY: 0, rotZ: 0.05 },
};
const FIM: Record<Entrada, Required<Pose>> = {
  direita: { x: 0, y: 0, z: 0, rotX: -0.12, rotY: -0.16, rotZ: 0.02 },
  esquerda: { x: 0, y: 0, z: 0, rotX: -0.12, rotY: 0.16, rotZ: -0.02 },
  baixo: { x: 0, y: 0, z: 0, rotX: -0.16, rotY: 0.06, rotZ: 0 },
  frente: { x: 0, y: 0, z: 0, rotX: -0.08, rotY: -0.1, rotZ: 0 },
};

// Cena com o celular 3D exibindo o vídeo de uma tela (public/telas/*.mp4),
// com etiqueta e título opcionais no topo.
export const CenaCelular3D: React.FC<{
  video: string;
  entrada: Entrada;
  kicker?: string;
  titulo?: string;
  duracaoEntrada?: number;
  acenderEm?: number; // frame em que a tela acende (0 = já acesa)
}> = ({ video, entrada, kicker, titulo, duracaoEntrada = 40, acenderEm = 0 }) => {
  useFonts();
  const f = useCurrentFrame();
  const t = interpolate(f, [0, duracaoEntrada], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const a = INICIO[entrada];
  const b = FIM[entrada];
  const mix = (k: keyof Pose) => (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t;
  const comTitulo = Boolean(titulo);
  const pose: Pose = {
    x: mix("x"),
    y: mix("y") + (comTitulo ? -0.34 : 0),
    // aproximação lenta da câmera depois que o celular assenta
    z: mix("z") + interpolate(f, [duracaoEntrada, duracaoEntrada + 200], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    // balanço suave para a cena nunca ficar congelada
    rotX: mix("rotX") + Math.sin(f / 55) * 0.025 * t,
    rotY: mix("rotY") + Math.sin(f / 42) * 0.07 * t,
    rotZ: mix("rotZ"),
  };
  const brilho = acenderEm > 0 ? interpolate(f, [acenderEm, acenderEm + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ background: "#ECEAF6" }}>
      <Celular3D pose={pose} video={staticFile(video)} brilho={brilho} cameraZ={comTitulo ? 6.1 : 5.2} />
      {comTitulo ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: kicker ? 130 : 170 }}>
          {kicker ? (
            <div style={{ marginBottom: 22 }}>
              <Kicker text={kicker} />
            </div>
          ) : null}
          <Headline text={titulo!} start={kicker ? 4 : 0} size={titulo!.split("\n").length > 2 ? 76 : 86} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
