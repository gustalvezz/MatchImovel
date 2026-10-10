import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Corretor, DURACAO_CORRETOR } from "./corretor/Corretor";
import { Comprador, DURACAO_COMPRADOR } from "./comprador/Comprador";
import { CenaNotificacao } from "./tres/CenaNotificacao";
import { TELA_VIDEO_H, TELA_VIDEO_W, TelaFrame } from "./tres/TelaFrame";
import { Marca, TelaCadastro, TelaPerfil, TelaWhats } from "./comprador/Cenas";
import { DUR } from "./comprador/duracoes";
import { useFonts } from "./fonts";
import { C } from "./theme";

// Conteúdo das telas do celular 3D (gerar com `npm run render:telas`).
const TelaMarca: React.FC = () => {
  useFonts();
  return (
    <TelaFrame base={1080} statusFundo="transparent" bg={`linear-gradient(160deg, ${C.indigo50} 0%, ${C.purple50} 45%, ${C.white} 100%)`}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: TELA_VIDEO_H * (1080 / TELA_VIDEO_W) }}>
        <Marca />
      </div>
    </TelaFrame>
  );
};
const TelaCadastroV: React.FC = () => {
  useFonts();
  return (
    <TelaFrame>
      <TelaCadastro />
    </TelaFrame>
  );
};
const TelaWhatsV: React.FC = () => {
  useFonts();
  return (
    <TelaFrame bg={C.waBg} statusClara>
      <TelaWhats />
    </TelaFrame>
  );
};
const TelaPerfilV: React.FC = () => {
  useFonts();
  return (
    <TelaFrame>
      <TelaPerfil />
    </TelaFrame>
  );
};
const TELAS = [
  { id: "TelaMarca", C: TelaMarca, d: DUR.marca },
  { id: "TelaCadastro", C: TelaCadastroV, d: DUR.cadastro },
  { id: "TelaWhats", C: TelaWhatsV, d: DUR.whats },
  { id: "TelaPerfil", C: TelaPerfilV, d: DUR.perfil },
];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Corretor" component={Corretor} durationInFrames={DURACAO_CORRETOR} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Comprador" component={Comprador} durationInFrames={DURACAO_COMPRADOR} fps={FPS} width={WIDTH} height={HEIGHT} />
    {TELAS.map((t) => (
      <Composition key={t.id} id={t.id} component={t.C} durationInFrames={t.d} fps={FPS} width={TELA_VIDEO_W} height={TELA_VIDEO_H} />
    ))}
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
