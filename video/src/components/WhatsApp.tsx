import React from "react";
import { CheckCheck, ChevronLeft, Phone as PhoneIcon, Video } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { C, FONT_BODY } from "../theme";
import { pop } from "./anim";
import { LogoMark } from "./Logo";

export type Msg = {
  from: "me" | "them";
  at: number; // frame em que a mensagem aparece
  text: React.ReactNode;
  buttons?: string[];
  time?: string;
  typing?: number; // frames de "digitando..." antes da mensagem (só para "them")
};

// Conversa de WhatsApp recriada (cabeçalho, balões, botões de resposta rápida).
export const WhatsAppChat: React.FC<{ title: string; subtitle?: string; msgs: Msg[]; scrollAt?: [number, number, number] }> = ({
  title,
  subtitle = "online",
  msgs,
  scrollAt,
}) => {
  const frame = useCurrentFrame();
  const scroll = scrollAt ? Math.max(0, Math.min(1, (frame - scrollAt[0]) / (scrollAt[1] - scrollAt[0]))) * scrollAt[2] : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.waBg, fontFamily: FONT_BODY, display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.waDark, color: C.white, padding: "46px 12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <ChevronLeft size={22} />
        <div style={{ width: 34, height: 34, borderRadius: 17, background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LogoMark size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{subtitle}</div>
        </div>
        <Video size={19} />
        <PhoneIcon size={17} style={{ marginLeft: 14 }} />
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ padding: "14px 10px", display: "flex", flexDirection: "column", gap: 8, transform: `translateY(${-scroll}px)` }}>
          {msgs.map((m, i) => {
            const typingStart = m.at - (m.typing ?? 0);
            if (frame < typingStart) return null;
            if (frame < m.at) return <Typing key={i} />;
            const p = pop(frame, m.at, 15, 170);
            const me = m.from === "me";
            return (
              <div
                key={i}
                style={{
                  alignSelf: me ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 20}px)`,
                  transformOrigin: me ? "bottom right" : "bottom left",
                  opacity: p,
                }}
              >
                <div
                  style={{
                    background: me ? C.waBubble : C.white,
                    borderRadius: 10,
                    borderTopRightRadius: me ? 2 : 10,
                    borderTopLeftRadius: me ? 10 : 2,
                    padding: "7px 9px 5px",
                    fontSize: 13,
                    lineHeight: 1.38,
                    color: "#111B21",
                    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                  }}
                >
                  {m.text}
                  <div style={{ fontSize: 9.5, color: "#667781", textAlign: "right", marginTop: 2, display: "flex", justifyContent: "flex-end", gap: 3 }}>
                    {m.time ?? "10:42"}
                    {me ? <CheckCheck size={12} color="#53BDEB" /> : null}
                  </div>
                </div>
                {m.buttons?.map((b, bi) => (
                  <div
                    key={b}
                    style={{
                      marginTop: 3,
                      background: C.white,
                      borderRadius: 8,
                      padding: "7px 0",
                      textAlign: "center",
                      color: "#027EB5",
                      fontSize: 13,
                      fontWeight: 500,
                      opacity: pop(frame, m.at + 6 + bi * 3),
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "8px 10px 22px", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, background: C.white, borderRadius: 22, padding: "10px 14px", fontSize: 13, color: "#8696A0" }}>Mensagem</div>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: "#00A884" }} />
      </div>
    </div>
  );
};

const Typing: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ alignSelf: "flex-start", background: C.white, borderRadius: 10, padding: "10px 12px", display: "flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            background: "#8696A0",
            opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + i * 5) / 6)),
          }}
        />
      ))}
    </div>
  );
};
