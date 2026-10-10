import React from "react";
import { staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { MUSICA, MUSICA_VOLUME_PAUSA, MUSICA_VOLUME_VOZ } from "../config";
import { useFonts } from "../fonts";
import { P, T } from "../components/transitions";
import { Fala, Narracao, Trilha, iniciosDasCenas } from "../components/Narracao";
import { CTA, Cadastro3D, Curadoria, Gancho, Marca3D, Match3D, Perfil3D, Virada, Whats3D } from "./Cenas";
import { DUR } from "./duracoes";
import voz from "./audios/comprador_voz.mp3";

// Ordem, duração (frames a 30fps) e transição de entrada de cada cena.
// As durações já incluem o tempo da fala e uma pausa para leitura no fim de cada tela.
// As cenas com celular usam o celular 3D; as versões 2D (Marca, Cadastro, ...) continuam em Cenas.tsx.
const CENAS = [
  { C: Gancho, d: 166, t: null },
  { C: Virada, d: 126, t: P.zoom },
  { C: Marca3D, d: DUR.marca, t: P.iris },
  { C: Cadastro3D, d: DUR.cadastro, t: P.slideUp },
  { C: Whats3D, d: DUR.whats, t: P.clock },
  { C: Perfil3D, d: DUR.perfil, t: P.slideLeft },
  { C: Curadoria, d: 176, t: P.wipe },
  { C: Match3D, d: DUR.match, t: P.slideLeft },
  { C: CTA, d: 176, t: P.zoom },
] as const;

// Onde cada frase está no MP3 da voz (segundos), na mesma ordem das cenas.
// Se gerar a voz de novo, atualize estes tempos.
const FALAS: Fala[] = [
  { inicio: 0.0, fim: 3.4 }, // Você já mandou mensagem para vinte e três corretores?
  { inicio: 3.83, fim: 5.91 }, // E se o imóvel ideal te encontrasse?
  { inicio: 6.22, fim: 9.2 }, // MatchImovel. O imóvel ideal te encontra.
  { inicio: 9.56, fim: 12.07 }, // Conte quem você é, não só o que procura.
  { inicio: 12.36, fim: 15.59 }, // Prefere o WhatsApp? Cadastre seu interesse por mensagem.
  { inicio: 15.86, fim: 18.53 }, // A inteligência artificial entende o seu perfil.
  { inicio: 18.77, fim: 20.74 }, // Só chega até você o que combina.
  { inicio: 21.01, fim: 22.27 }, // E o match acontece.
  { inicio: 22.54, fim: 25.6 }, // Cadastre o que procura. Nós buscamos por você.
];

const DURACOES = CENAS.map((c) => c.d);
const INICIOS = iniciosDasCenas(DURACOES, T.D);
export const DURACAO_COMPRADOR = DURACOES.reduce((s, d) => s + d, 0) - (CENAS.length - 1) * T.D;

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
      <Narracao src={voz} falas={FALAS} inicios={INICIOS} />
      {MUSICA ? (
        <Trilha
          src={staticFile(MUSICA)}
          falas={FALAS}
          inicios={INICIOS}
          total={DURACAO_COMPRADOR}
          pausa={MUSICA_VOLUME_PAUSA}
          voz={MUSICA_VOLUME_VOZ}
        />
      ) : null}
    </>
  );
};
