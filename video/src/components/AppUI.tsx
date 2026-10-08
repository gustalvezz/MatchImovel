import React from "react";
import { LogOut } from "lucide-react";
import { C, FONT_BODY, FONT_TITLE, GRAD } from "../theme";
import { LogoMark } from "./Logo";

// Peças da interface do MatchImovel recriadas a partir dos prints (escala de celular, 390px).

export const AppHeader: React.FC<{ role?: string; hello: string }> = ({ role, hello }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "48px 18px 12px",
      background: "rgba(255,255,255,0.92)",
      borderBottom: `1px solid ${C.slate100}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <LogoMark size={30} />
      <div>
        <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>
          <span style={{ color: C.slate900 }}>Match</span>
          <span style={{ color: C.indigo }}>Imovel</span>
          {role ? <span style={{ color: C.slate900 }}> - {role}</span> : null}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.slate500 }}>{hello}</div>
      </div>
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: `1px solid ${C.slate200}`,
        borderRadius: 999,
        padding: "6px 12px",
        fontFamily: FONT_BODY,
        fontSize: 12,
        fontWeight: 500,
        color: C.slate700,
        background: C.white,
      }}
    >
      <LogOut size={13} /> Sair
    </div>
  </div>
);

export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: C.white,
      borderRadius: 16,
      border: `1px solid ${C.slate100}`,
      boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
      padding: 16,
      fontFamily: FONT_BODY,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ bg: string; color: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  bg,
  color,
  children,
  style,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: bg,
      color,
      borderRadius: 999,
      padding: "3px 10px",
      fontFamily: FONT_BODY,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

export const GradButton: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; dim?: number }> = ({
  children,
  style,
  dim = 0,
}) => (
  <div
    style={{
      background: GRAD,
      color: C.white,
      borderRadius: 12,
      padding: "13px 16px",
      textAlign: "center",
      fontFamily: FONT_BODY,
      fontWeight: 600,
      fontSize: 14,
      opacity: 1 - dim * 0.45,
      boxShadow: dim < 0.5 ? "0 8px 20px rgba(79,70,229,0.3)" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Tabs: React.FC<{ left: string; right: string; active: 0 | 1 }> = ({ left, right, active }) => (
  <div
    style={{
      display: "flex",
      background: C.slate100,
      borderRadius: 10,
      padding: 4,
      fontFamily: FONT_BODY,
      fontSize: 12,
      fontWeight: 500,
    }}
  >
    {[left, right].map((t, i) => (
      <div
        key={t}
        style={{
          flex: 1,
          textAlign: "center",
          padding: "7px 0",
          borderRadius: 8,
          background: active === i ? C.white : "transparent",
          color: active === i ? C.slate900 : C.slate500,
          boxShadow: active === i ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {t}
      </div>
    ))}
  </div>
);

// Campo de formulário com etiqueta e selo "IA" opcional.
export const Field: React.FC<{
  label: string;
  value: string;
  ai?: number; // 0..1, aparecimento do selo IA
  highlight?: number; // 0..1, brilho de "acabou de ser preenchido"
}> = ({ label, value, ai = 0, highlight = 0 }) => (
  <div style={{ fontFamily: FONT_BODY }}>
    <div style={{ display: "flex", alignItems: "center", fontSize: 11.5, fontWeight: 500, color: C.slate700, marginBottom: 4 }}>
      {label}
      <span
        style={{
          marginLeft: 5,
          fontSize: 9,
          padding: "1px 6px",
          background: C.green100,
          color: C.green700,
          borderRadius: 999,
          opacity: ai,
          transform: `scale(${0.5 + ai * 0.5})`,
          display: "inline-block",
        }}
      >
        IA
      </span>
    </div>
    <div
      style={{
        border: `1px solid ${highlight > 0.05 ? C.indigo200 : C.slate200}`,
        borderRadius: 9,
        padding: "8px 10px",
        fontSize: 13,
        color: C.slate900,
        minHeight: 18,
        background: `rgba(238,242,255,${highlight})`,
      }}
    >
      {value}
    </div>
  </div>
);
