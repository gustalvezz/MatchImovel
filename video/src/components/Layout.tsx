import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT_BODY } from "../theme";
import { LightBg } from "./Background";
import { Headline, Kicker } from "./Headline";
import { Phone } from "./Phone";
import { ease } from "./anim";

// Cena padrão: etiqueta + título no topo e um celular entrando por baixo.
export const PhoneScene: React.FC<{
  kicker?: string;
  title: string;
  subtitle?: string;
  phoneEnter?: number;
  phoneBg?: string;
  children: React.ReactNode;
}> = ({ kicker, title, subtitle, phoneEnter = 10, phoneBg, children }) => {
  const frame = useCurrentFrame();
  const titleLines = title.split("\n").length;
  const top = kicker ? 150 : 180;
  return (
    <LightBg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
        {kicker ? (
          <div style={{ marginBottom: 26 }}>
            <Kicker text={kicker} />
          </div>
        ) : null}
        <Headline text={title} start={kicker ? 4 : 0} size={titleLines > 2 ? 76 : 88} />
        {subtitle ? (
          <div
            style={{
              marginTop: 22,
              fontFamily: FONT_BODY,
              fontSize: 36,
              color: C.slate600,
              textAlign: "center",
              maxWidth: 880,
              lineHeight: 1.35,
              opacity: ease(frame, 18, 34),
              transform: `translateY(${ease(frame, 18, 34, [20, 0])}px)`,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", top: subtitle ? 690 : 600 }}>
        <Phone height={1460} enter={phoneEnter} bg={phoneBg}>
          {children}
        </Phone>
      </AbsoluteFill>
    </LightBg>
  );
};
