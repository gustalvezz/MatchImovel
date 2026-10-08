import React from "react";
import { Audio, staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { MUSICA, VOLUME_MUSICA } from "../config";
import { useFonts } from "../fonts";
import { P, T } from "../components/transitions";
import { CTA, Cadastro, Curadoria, Gancho, Marca, Match, Perfil, Virada, WhatsComprador } from "./Cenas";

// Ordem, duração (frames a 30fps) e transição de entrada de cada cena.
const CENAS = [
  { C: Gancho, d: 130, t: null },
  { C: Virada, d: 90, t: P.zoom },
  { C: Marca, d: 105, t: P.iris },
  { C: Cadastro, d: 185, t: P.slideUp },
  { C: WhatsComprador, d: 180, t: P.clock },
  { C: Perfil, d: 175, t: P.slideLeft },
  { C: Curadoria, d: 140, t: P.wipe },
  { C: Match, d: 160, t: P.slideLeft },
  { C: CTA, d: 140, t: P.zoom },
] as const;

export const DURACAO_COMPRADOR = CENAS.reduce((s, c) => s + c.d, 0) - (CENAS.length - 1) * T.D;

export const Comprador: React.FC = () => {
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
