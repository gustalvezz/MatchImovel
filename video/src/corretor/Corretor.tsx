import React from "react";
import { Audio, staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { MUSICA, VOLUME_MUSICA } from "../config";
import { useFonts } from "../fonts";
import { P, T } from "../components/transitions";
import { CTA, Comissao, Curadoria, Descrever, Ficha, Gancho, Marca, Resultados, Virada, WhatsCorretor } from "./Cenas";

// Ordem, duração (frames a 30fps) e transição de entrada de cada cena.
const CENAS = [
  { C: Gancho, d: 120, t: null },
  { C: Virada, d: 100, t: P.zoom },
  { C: Marca, d: 85, t: P.fade },
  { C: Descrever, d: 165, t: P.slideUp },
  { C: Ficha, d: 165, t: P.slideLeft },
  { C: Resultados, d: 170, t: P.slideLeft },
  { C: Curadoria, d: 150, t: P.wipe },
  { C: WhatsCorretor, d: 180, t: P.clock },
  { C: Comissao, d: 150, t: P.zoom },
  { C: CTA, d: 130, t: P.iris },
] as const;

export const DURACAO_CORRETOR = CENAS.reduce((s, c) => s + c.d, 0) - (CENAS.length - 1) * T.D;

export const Corretor: React.FC = () => {
  useFonts();
  return (
    <>
      <TransitionSeries>
        {CENAS.map(({ C, d, t }, i) => (
          <React.Fragment key={i}>
            {t ? <TransitionSeries.Transition presentation={t} timing={T.smooth} /> : null}
            <TransitionSeries.Sequence durationInFrames={d}>
              <C />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      {MUSICA ? <Audio src={staticFile(MUSICA)} volume={VOLUME_MUSICA} /> : null}
    </>
  );
};
