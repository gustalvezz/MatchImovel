import React from "react";
import { Audio, staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { MUSICA, VOLUME_MUSICA } from "../config";
import { useFonts } from "../fonts";
import { P, T } from "../components/transitions";
import { Fala, Narracao, iniciosDasCenas } from "../components/Narracao";
import { CTA, Comissao, Curadoria, Descrever, Ficha, Gancho, Marca, Resultados, Virada, WhatsCorretor } from "./Cenas";
import voz from "./audios/corretor_voz.mp3";

// Ordem, duração (frames a 30fps) e transição de entrada de cada cena.
// As durações já incluem o tempo da fala e uma pausa para leitura no fim de cada tela.
const CENAS = [
  { C: Gancho, d: 156, t: null },
  { C: Virada, d: 136, t: P.zoom },
  { C: Marca, d: 200, t: P.fade },
  { C: Descrever, d: 201, t: P.slideUp },
  { C: Ficha, d: 201, t: P.slideLeft },
  { C: Resultados, d: 206, t: P.slideLeft },
  { C: Curadoria, d: 186, t: P.wipe },
  { C: WhatsCorretor, d: 216, t: P.clock },
  { C: Comissao, d: 186, t: P.zoom },
  { C: CTA, d: 166, t: P.iris },
] as const;

// Onde cada frase está no MP3 da voz (segundos), na mesma ordem das cenas.
// Se gerar a voz de novo, atualize estes tempos.
const FALAS: Fala[] = [
  { inicio: 0.0, fim: 3.0 }, // Seu imóvel está encalhado há noventa e quatro dias?
  { inicio: 3.42, fim: 5.33 }, // E se você começasse pelo comprador?
  { inicio: 5.81, fim: 11.13 }, // MatchImovel. Uma vitrine de compradores reais...
  { inicio: 11.46, fim: 13.3 }, // Descreva o imóvel do seu jeito.
  { inicio: 13.67, fim: 16.32 }, // A inteligência artificial monta a ficha sozinha.
  { inicio: 16.63, fim: 18.24 }, // E encontra quem já quer comprar.
  { inicio: 18.68, fim: 20.36 }, // A curadoria cuida do resto.
  { inicio: 20.78, fim: 23.61 }, // E você também pode cadastrar o imóvel pelo WhatsApp.
  { inicio: 24.0, fim: 27.55 }, // E a maior parte da comissão é sua: sessenta por cento.
  { inicio: 28.03, fim: 31.2 }, // Encontre o comprador do seu imóvel. MatchImovel.
];

const DURACOES = CENAS.map((c) => c.d);
export const DURACAO_CORRETOR = DURACOES.reduce((s, d) => s + d, 0) - (CENAS.length - 1) * T.D;

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
      <Narracao src={voz} falas={FALAS} inicios={iniciosDasCenas(DURACOES, T.D)} />
      {MUSICA ? <Audio src={staticFile(MUSICA)} volume={VOLUME_MUSICA} /> : null}
    </>
  );
};
