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

// Trilha de fundo com "ducking": abaixa sob cada fala e sobe nas pausas, com fade no início e no fim.
export const Trilha: React.FC<{
  src: string;
  falas: Fala[];
  inicios: number[];
  total: number;
  pausa: number;
  voz: number;
  atraso?: number;
}> = ({ src, falas, inicios, total, pausa, voz, atraso = 8 }) => {
  const trechos = falas.map((f, i) => {
    const a = inicios[i] + atraso;
    return [a, a + Math.ceil((f.fim - f.inicio) * FPS)] as const;
  });
  const DESCE = 8; // frames para abaixar antes da fala
  const SOBE = 14; // frames para voltar depois da fala
  const volume = (f: number) => {
    let duck = 0;
    for (const [a, b] of trechos) {
      if (f < a - DESCE || f > b + SOBE) continue;
      const v = f < a ? (f - (a - DESCE)) / DESCE : f <= b ? 1 : 1 - (f - b) / SOBE;
      duck = Math.max(duck, v);
    }
    const base = pausa - (pausa - voz) * duck;
    const fadeIn = Math.min(1, f / 15);
    const fadeOut = Math.min(1, Math.max(0, (total - f) / 45));
    return base * fadeIn * fadeOut;
  };
  return <Audio src={src} volume={volume} />;
};
