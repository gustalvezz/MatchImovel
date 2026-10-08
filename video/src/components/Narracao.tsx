import React from "react";
import { Audio, Sequence } from "remotion";
import { FPS } from "../theme";

// Trecho de uma frase dentro do MP3 da narração (em segundos).
export type Fala = { inicio: number; fim: number };

// Toca cada frase do MP3 no início da cena correspondente.
// `inicios` é o frame em que cada cena começa; `atraso` dá tempo para a cena aparecer antes da voz.
export const Narracao: React.FC<{ src: string; falas: Fala[]; inicios: number[]; atraso?: number; volume?: number }> = ({
  src,
  falas,
  inicios,
  atraso = 8,
  volume = 1,
}) => (
  <>
    {falas.map((f, i) => {
      const dur = Math.ceil((f.fim - f.inicio) * FPS) + 4;
      return (
        <Sequence key={i} from={inicios[i] + atraso} durationInFrames={dur} layout="none" name={`Fala ${i + 1}`}>
          <Audio src={src} trimBefore={Math.max(0, Math.round(f.inicio * FPS) - 2)} durationInFrames={dur} volume={volume} />
        </Sequence>
      );
    })}
  </>
);

// Frame inicial de cada cena numa TransitionSeries (as transições se sobrepõem às cenas).
export const iniciosDasCenas = (duracoes: number[], transicao: number) =>
  duracoes.map((_, i) => duracoes.slice(0, i).reduce((s, d) => s + d, 0) - i * transicao);
