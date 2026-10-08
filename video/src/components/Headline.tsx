import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT_TITLE, GRAD } from "../theme";
import { pop } from "./anim";

// Título com revelação palavra a palavra. Trechos entre *asteriscos* recebem destaque
// (podem ter várias palavras: "*do seu jeito*").
// Use "\n" para quebrar linha.
export const Headline: React.FC<{
  text: string;
  start?: number;
  size?: number;
  color?: string;
  highlight?: "gradient" | string;
  stagger?: number;
  align?: "center" | "left";
  italicHighlight?: boolean;
  lineHeight?: number;
}> = ({
  text,
  start = 0,
  size = 96,
  color = C.slate900,
  highlight = "gradient",
  stagger = 3,
  align = "center",
  italicHighlight = false,
  lineHeight = 1.08,
}) => {
  const frame = useCurrentFrame();
  let i = 0;
  let hlOn = false;
  const lines = text.split("\n");
  return (
    <div style={{ textAlign: align, fontFamily: FONT_TITLE, fontWeight: 700, fontSize: size, lineHeight, letterSpacing: -1.5 }}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.split(" ").map((raw, wi) => {
            if (raw.startsWith("*")) hlOn = true;
            const hl = hlOn;
            if (raw.replace(/[.,!?:]+$/, "").endsWith("*") || raw.endsWith("*")) hlOn = false;
            const word = raw.replace(/\*/g, "");
            const p = pop(frame, start + i++ * stagger, 15, 160);
            const hlStyle: React.CSSProperties = hl
              ? highlight === "gradient"
                ? {
                    background: GRAD,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    fontStyle: italicHighlight ? "italic" : undefined,
                    paddingRight: italicHighlight ? 8 : 0,
                  }
                : { color: highlight, fontStyle: italicHighlight ? "italic" : undefined }
              : {};
            return (
              <span
                key={wi}
                style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.06em 0.02em" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 110}%)`,
                    opacity: Math.min(1, p * 1.5),
                    color,
                    ...hlStyle,
                  }}
                >
                  {word}
                </span>
                {" "}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Etiqueta pequena acima do título (ex.: "PASSO 1").
export const Kicker: React.FC<{ text: string; start?: number; dark?: boolean }> = ({ text, start = 0, dark }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, start);
  return (
    <div
      style={{
        display: "inline-block",
        padding: "14px 30px",
        borderRadius: 999,
        background: dark ? "rgba(255,255,255,0.12)" : C.indigo100,
        color: dark ? "#C7D2FE" : C.indigo,
        fontFamily: FONT_TITLE,
        fontWeight: 600,
        fontSize: 34,
        letterSpacing: 3,
        textTransform: "uppercase",
        transform: `scale(${0.7 + 0.3 * p})`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};
