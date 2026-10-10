import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT_BODY } from "../theme";

// Proporção da tela do modelo 3D (≈ 19,5:9). As telas são desenhadas em 390 px de largura lógica,
// como no celular 2D, e gravadas em 780 x 1522 para virar textura do celular 3D.
export const TELA_LOGICA_W = 390;
export const TELA_LOGICA_H = 761;
export const TELA_VIDEO_W = 780;
export const TELA_VIDEO_H = 1522;

const BarraStatus: React.FC<{ clara: boolean; fundo: string }> = ({ clara, fundo }) => {
  const cor = clara ? C.white : C.slate900;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px 0 34px",
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: 14,
        color: cor,
        background: fundo,
        zIndex: 100,
      }}
    >
      <span>9:41</span>
      <div style={{ position: "absolute", left: "50%", top: 10, width: 112, height: 32, marginLeft: -56, borderRadius: 16, background: "#000" }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
        {[4, 6, 8, 10].map((h) => (
          <div key={h} style={{ width: 3, height: h, borderRadius: 1, background: cor }} />
        ))}
        <div style={{ marginLeft: 6, width: 22, height: 11, borderRadius: 3, border: `1.5px solid ${cor}`, padding: 1.5 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 1.5, background: cor }} />
        </div>
      </div>
    </div>
  );
};

// Moldura de tela para os vídeos de textura: conteúdo em `base` px de largura lógica,
// barra de status com ilha dinâmica e indicador inferior.
export const TelaFrame: React.FC<{
  children: React.ReactNode;
  bg?: string;
  base?: number;
  statusClara?: boolean;
  statusFundo?: string; // fundo da barra de status (o conteúdo rola por baixo dela)
}> = ({ children, bg = "#F7F7FB", base = TELA_LOGICA_W, statusClara = false, statusFundo }) => {
  const escala = TELA_VIDEO_W / base;
  const alturaLogica = TELA_VIDEO_H / escala;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          width: base,
          height: alturaLogica,
          transform: `scale(${escala})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          fontFamily: FONT_BODY,
        }}
      >
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${TELA_VIDEO_W / TELA_LOGICA_W})`, transformOrigin: "top left", width: TELA_LOGICA_W, height: TELA_LOGICA_H }}>
        <BarraStatus clara={statusClara} fundo={statusFundo ?? (statusClara ? "transparent" : "rgba(247,247,251,0.97)")} />
        <div style={{ position: "absolute", bottom: 8, left: "50%", width: 134, height: 5, marginLeft: -67, borderRadius: 3, background: statusClara ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.85)" }} />
      </div>
    </AbsoluteFill>
  );
};
