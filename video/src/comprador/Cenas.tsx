import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArrowRight, Bell, Building2, CalendarDays, Check, DollarSign, EyeOff, Heart, MapPin, Plus, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { C, FONT_BODY, FONT_TITLE, GRAD, GRAD_DIAG } from "../theme";
import { countUp, ease, pop, typed } from "../components/anim";
import { DarkBg, LightBg } from "../components/Background";
import { Headline, Kicker } from "../components/Headline";
import { LogoReveal } from "../components/Logo";
import { PhoneScene } from "../components/Layout";
import { Tap } from "../components/Phone";
import { AppHeader, Badge, Card, GradButton } from "../components/AppUI";
import { WhatsAppChat } from "../components/WhatsApp";

const COMPRADOR = "Olá, Mariana Costa";

// 1. Gancho: mensagens sem resposta
const RESPOSTAS = [
  { t: "Esse já foi vendido.", at: 26, x: -120, r: -3 },
  { t: "Saiu ontem, mas tenho outros!", at: 40, x: 90, r: 2 },
  { t: "Visualizada às 23:14", at: 54, x: -60, r: -2, ghost: true },
  { t: "Ainda tem interesse?", at: 68, x: 120, r: 3 },
];
export const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const n = countUp(frame, 23, 4, 30, 1);
  return (
    <DarkBg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Headline text={"Você já mandou\nmensagem para"} color={C.white} size={92} />
        <div style={{ fontFamily: FONT_TITLE, fontWeight: 800, fontSize: 130, color: "#C4B5FD", lineHeight: 1.1, opacity: pop(frame, 6) }}>
          {n} corretores
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 860 }}>
        {RESPOSTAS.map((r, i) => {
          const p = pop(frame, r.at, 13, 170);
          return (
            <div
              key={r.t}
              style={{
                position: "absolute",
                left: "50%",
                top: i * 150,
                transform: `translate(calc(-50% + ${r.x}px), ${(1 - p) * 60}px) rotate(${r.r}deg) scale(${0.5 + p * 0.5})`,
                opacity: p,
                whiteSpace: "nowrap",
                background: r.ghost ? "transparent" : C.white,
                border: r.ghost ? "3px dashed rgba(255,255,255,0.4)" : "none",
                color: r.ghost ? "rgba(255,255,255,0.7)" : C.slate900,
                fontFamily: FONT_BODY,
                fontSize: 44,
                fontWeight: 500,
                padding: "26px 40px",
                borderRadius: 36,
                borderTopLeftRadius: 8,
                boxShadow: r.ghost ? "none" : "0 20px 50px rgba(0,0,0,0.35)",
              }}
            >
              {r.t}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 170 }}>
        <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 64, color: C.white, opacity: ease(frame, 92, 106), transform: `translateY(${ease(frame, 92, 106, [30, 0])}px)` }}>
          E o imóvel certo? Nada.
        </div>
      </AbsoluteFill>
    </DarkBg>
  );
};

// 2. Virada
export const Virada: React.FC = () => (
  <LightBg>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Headline text={"E se o imóvel ideal\n*te encontrasse?*"} size={104} stagger={4} />
    </AbsoluteFill>
  </LightBg>
);

// 3. Marca + promessa (hero da landing)
export const Marca: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <LightBg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
        <LogoReveal start={0} size={0.9} />
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 34 }}>
            <Kicker text="Nova forma de comprar imóvel" start={24} />
          </div>
          <Headline text={"O imóvel ideal\n*te encontra.*"} size={124} start={30} italicHighlight />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 40, color: C.slate600, textAlign: "center", lineHeight: 1.4, opacity: ease(frame, 52, 68) }}>
          Você cadastra o que procura.
          <br />
          Plataforma e curadoria trabalham por você.
        </div>
      </AbsoluteFill>
    </LightBg>
  );
};

// 4. Cadastro de interesse (modal em passos)
const PERGUNTAS = [
  { passo: 1, q: "Qual sua faixa etária?", ops: ["Até 30 anos", "30 a 45 anos", "45 a 60 anos", "Acima de 60 anos"], sel: [1], multi: false },
  { passo: 4, q: "Quem vai morar com você?", ops: ["Só eu", "Casal", "Casal com filhos", "Família estendida"], sel: [2], multi: false },
  { passo: 11, q: "Do que você não abre mão?", ops: ["Home office", "Suíte", "Quintal", "Perto de escola"], sel: [0, 1, 3], multi: true },
];
const DUR_Q = 50;
export const Cadastro: React.FC = () => {
  const frame = useCurrentFrame();
  const qi = Math.min(PERGUNTAS.length - 1, Math.max(0, Math.floor((frame - 20) / DUR_Q)));
  const local = frame - 20 - qi * DUR_Q;
  const q = PERGUNTAS[qi];
  const enter = pop(frame, 20 + qi * DUR_Q, 16, 180);
  const progresso = ease(frame, 20 + qi * DUR_Q, 30 + qi * DUR_Q, [qi === 0 ? 0 : PERGUNTAS[qi - 1].passo / 18, q.passo / 18]);
  return (
    <PhoneScene kicker="Cadastro gratuito" title={"Conte quem você é,\n*não só o que procura*"}>
      <AppHeader hello={COMPRADOR} />
      <div style={{ padding: 16, filter: "blur(3px)", opacity: 0.6 }}>
        <div style={{ background: GRAD_DIAG, borderRadius: 20, height: 170 }} />
        <Card style={{ marginTop: 14, height: 80 }}>{null}</Card>
        <Card style={{ marginTop: 14, height: 80 }}>{null}</Card>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.45)" }} />
      <div style={{ position: "absolute", left: 14, right: 14, top: 150, background: C.white, borderRadius: 18, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <div style={{ background: GRAD, padding: "16px 16px 14px", color: C.white }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 17 }}>
            Cadastro de Interesse <X size={18} />
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.3)", borderRadius: 3, marginTop: 12 }}>
            <div style={{ height: 5, width: `${progresso * 100}%`, background: C.white, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.9 }}>Passo {q.passo} de 18</div>
        </div>
        <div style={{ padding: 16, transform: `translateX(${(1 - enter) * 60}px)`, opacity: enter }}>
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 16, color: C.slate900 }}>{q.q}</div>
          <div style={{ fontSize: 11, color: C.slate500, marginBottom: 10 }}>{q.multi ? "Selecione quantas quiser" : "Selecione uma opção"}</div>
          {q.ops.map((o, i) => {
            const k = q.sel.indexOf(i);
            const on = k >= 0 && local >= 14 + k * 7;
            return (
              <div
                key={o}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1.5px solid ${on ? C.indigo : C.slate200}`,
                  background: on ? C.indigo50 : C.white,
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 8,
                  fontSize: 13,
                  color: C.slate900,
                  fontWeight: on ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: on ? C.indigo : C.slate100,
                    color: on ? C.white : C.slate500,
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {on ? <Check size={13} /> : "ABCD"[i]}
                </span>
                {o}
              </div>
            );
          })}
          <GradButton style={{ marginTop: 6, borderRadius: 999 }} dim={local >= 14 ? 0 : 0.7}>
            Continuar <ArrowRight size={15} />
          </GradButton>
        </div>
      </div>
      {PERGUNTAS.map((p, qi2) =>
        p.sel.map((s, k) => <Tap key={`${qi2}-${s}`} at={20 + qi2 * DUR_Q + 14 + k * 7} x={180} y={312 + s * 49} />),
      )}
    </PhoneScene>
  );
};

// 5. WhatsApp: captação por mensagem
export const WhatsComprador: React.FC = () => (
  <PhoneScene kicker="Prefere o WhatsApp?" title={"Cadastre seu interesse\n*por mensagem*"} phoneBg={C.waBg}>
    <WhatsAppChat
      title="MatchImovel"
      scrollAt={[120, 140, 110]}
      msgs={[
        { from: "me", at: 16, text: "Oi" },
        { from: "them", at: 40, typing: 16, text: <>Olá! Sou o assistente do <b>MatchImovel</b>. Vou te ajudar a encontrar o imóvel ideal.</> },
        { from: "them", at: 58, text: "Que tipo de imóvel você procura?", buttons: ["Casa", "Apartamento", "Outro"] },
        { from: "me", at: 90, text: "Casa" },
        { from: "them", at: 118, typing: 16, text: "Qual é seu orçamento máximo?", buttons: ["Até R$ 500 mil", "Até R$ 800 mil", "Acima de R$ 800 mil"] },
        { from: "me", at: 150, text: "Até R$ 800 mil" },
      ]}
    />
  </PhoneScene>
);

// 6. Perfil gerado pela IA
const NARRATIVA =
  "Busca uma casa térrea em Jundiaí para morar com o cônjuge e dois filhos em idade escolar. Trabalha de casa e valoriza silêncio, boa iluminação e espaço para receber a família.";
const CRITERIOS = ["Casa térrea", "3 ou mais quartos", "Home office", "Suíte", "Perto de escola", "Garagem para 2 carros"];
export const Perfil: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = ease(frame, 112, 140, [0, 150]);
  return (
    <PhoneScene kicker="Inteligência artificial" title={"A IA entende\n*o seu perfil*"}>
      <AppHeader hello={COMPRADOR} />
      <div style={{ padding: "14px 16px", transform: `translateY(${-scroll}px)` }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 18 }}>Casa</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge bg={C.indigo} color={C.white}>Ativo</Badge>
              <Trash2 size={14} color="#EF4444" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 12, color: C.slate500, marginTop: 4 }}>
            <MapPin size={12} /> Jundiaí, próximo ao centro
          </div>
          <div style={{ display: "flex", gap: 30, marginTop: 10, fontSize: 11, color: C.slate500 }}>
            <div>
              Orçamento
              <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: C.slate900 }}>
                <DollarSign size={13} /> até R$ 800.000
              </div>
            </div>
            <div>
              Quartos
              <div style={{ fontSize: 13, fontWeight: 600, color: C.slate900 }}>3</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.purple, fontWeight: 600, fontSize: 13, marginTop: 14 }}>
            <Sparkles size={14} /> Análise do seu perfil por IA
          </div>
          <Badge bg={GRAD} color={C.white} style={{ fontSize: 10, marginTop: 6, opacity: pop(frame, 10), transform: `scale(${pop(frame, 10)})` }}>
            FAMÍLIA · Espaço e tranquilidade
          </Badge>
          <div style={{ background: C.purple50, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 12.5, lineHeight: 1.55, color: C.slate700, minHeight: 100 }}>
            {typed(frame, NARRATIVA, 16, 60)}
          </div>
          <div style={{ fontSize: 11, color: C.slate700, marginTop: 12, marginBottom: 6 }}>O que não abrimos mão:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {CRITERIOS.map((c, i) => {
              const p = pop(frame, 70 + i * 5, 12, 200);
              return (
                <span
                  key={c}
                  style={{
                    background: C.red100,
                    border: `1px solid ${C.red200}`,
                    color: C.red700,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    transform: `scale(${p})`,
                    display: "inline-block",
                  }}
                >
                  {c}
                </span>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 12,
              background: C.green50,
              border: `1px solid ${C.green100}`,
              borderRadius: 12,
              padding: 12,
              fontSize: 12.5,
              color: "#166534",
              lineHeight: 1.5,
              opacity: pop(frame, 104),
              transform: `translateY(${(1 - pop(frame, 104)) * 20}px)`,
            }}
          >
            <div style={{ fontSize: 11, marginBottom: 3 }}>Imóvel ideal para você:</div>
            Casa térrea em Jundiaí, perto do centro, até R$ 800 mil. 3+ quartos com suíte, espaço para home office e garagem para 2 carros.
          </div>
        </Card>
      </div>
    </PhoneScene>
  );
};

// 7. Curadoria e privacidade
export const Curadoria: React.FC = () => {
  const frame = useCurrentFrame();
  const itens = [
    { i: <ShieldCheck size={56} />, t: "Curadoria valida cada imóvel", s: "Nada fora do seu perfil chega até você." },
    { i: <EyeOff size={56} />, t: "Seu contato fica protegido", s: "Nenhum corretor acessa os seus dados." },
    { i: <UserRound size={56} />, t: "Um curador exclusivo", s: "Você fala só com a equipe MatchImovel." },
  ];
  return (
    <LightBg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
        <Headline text={"Só chega até você\no que *combina*"} size={96} />
        <div style={{ marginTop: 100, display: "flex", flexDirection: "column", gap: 36, width: 920 }}>
          {itens.map((it, i) => {
            const p = pop(frame, 26 + i * 16);
            return (
              <div
                key={it.t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 36,
                  background: C.white,
                  borderRadius: 40,
                  padding: "40px 44px",
                  boxShadow: "0 18px 50px rgba(79,70,229,0.14)",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 120}px) scale(${0.9 + p * 0.1})`,
                }}
              >
                <div
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 32,
                    background: GRAD_DIAG,
                    color: C.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {it.i}
                </div>
                <div>
                  <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 48, color: C.slate900 }}>{it.t}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 34, color: C.slate500, marginTop: 6 }}>{it.s}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </LightBg>
  );
};

// 8. O match acontece
export const Match: React.FC = () => {
  const frame = useCurrentFrame();
  const NOTIF = 60;
  const notif = pop(frame, NOTIF, 14, 150);
  const stats = [
    { t: "Interesses Ativos", v: 1, icon: <Building2 size={18} color={C.indigo} />, bg: C.indigo100, c: C.indigo },
    { t: "Matches Recebidos", v: countUp(frame, 2, NOTIF + 10, 20), icon: <Heart size={18} color={C.green} />, bg: C.green100, c: C.green },
    { t: "Visitas Agendadas", v: countUp(frame, 1, NOTIF + 40, 14), icon: <CalendarDays size={18} color={C.purple} />, bg: C.purple100, c: C.purple },
  ];
  return (
    <PhoneScene title={"E o match\n*acontece*"} subtitle="Você recebe o imóvel aprovado e a visita já agendada.">
      <AppHeader hello={COMPRADOR} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ background: GRAD_DIAG, borderRadius: 20, padding: 18, color: C.white }}>
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 21, lineHeight: 1.15 }}>Bem-vindo ao seu Dashboard</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Gerencie seus interesses e acompanhe matches.</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.white, color: C.indigo, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600, marginTop: 12 }}>
            <Plus size={14} /> Cadastrar Novo Interesse
          </div>
        </div>
        {stats.map((s) => (
          <Card key={s.t} style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: C.slate500 }}>{s.t}</div>
              <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 28, color: s.c }}>{s.v}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
          </Card>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          top: 50,
          background: "rgba(255,255,255,0.97)",
          borderRadius: 18,
          padding: 12,
          boxShadow: "0 16px 40px rgba(15,23,42,0.25)",
          display: "flex",
          gap: 10,
          transform: `translateY(${(1 - notif) * -160}px)`,
          opacity: notif,
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: GRAD_DIAG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={20} color={C.white} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>Seu match foi aprovado!</div>
          <div style={{ fontSize: 11.5, color: C.slate600, lineHeight: 1.4 }}>Casa em Jundiaí · 94% compatível. Visita agendada para sábado, 10h.</div>
        </div>
      </div>
    </PhoneScene>
  );
};

// 9. Chamada final
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const btn = pop(frame, 40);
  const pulse = 1 + Math.sin(Math.max(0, frame - 60) / 6) * 0.03;
  return (
    <DarkBg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
        <LogoReveal start={0} size={0.85} light />
        <Headline text={"Cadastre o que procura.\n*Nós buscamos por você.*"} color={C.white} size={78} start={14} highlight="#C4B5FD" />
        <div
          style={{
            background: C.white,
            color: C.indigo,
            fontFamily: FONT_TITLE,
            fontWeight: 700,
            fontSize: 50,
            padding: "34px 70px",
            borderRadius: 999,
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            transform: `scale(${btn * pulse})`,
          }}
        >
          Cadastrar meu interesse →
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 38, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 1.5, opacity: ease(frame, 55, 70) }}>
          Gratuito e sem compromisso
          <br />
          matchimovel.com.br
        </div>
      </AbsoluteFill>
    </DarkBg>
  );
};
