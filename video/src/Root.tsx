import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Corretor, DURACAO_CORRETOR } from "./corretor/Corretor";
import { Comprador, DURACAO_COMPRADOR } from "./comprador/Comprador";
import { CenaNotificacao } from "./tres/CenaNotificacao";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Corretor" component={Corretor} durationInFrames={DURACAO_CORRETOR} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Comprador" component={Comprador} durationInFrames={DURACAO_COMPRADOR} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition
      id="Teste3D"
      component={CenaNotificacao}
      durationInFrames={210}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ titulo: "Seu match foi aprovado!", linhas: ["Casa em Jundiaí, 94% compatível.", "Visita agendada: sábado, 10h."] }}
    />
  </>
);
