import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BadgeDollarSign,
  BedDouble,
  Building2,
  Check,
  DollarSign,
  Filter,
  Heart,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { C, FONT_BODY, FONT_TITLE, GRAD, GRAD_DIAG } from "../theme";
import { countUp, ease, pop, typed } from "../components/anim";
import { DarkBg, LightBg } from "../components/Background";
import { Headline } from "../components/Headline";
import { LogoReveal } from "../components/Logo";
import { PhoneScene } from "../components/Layout";
import { Tap } from "../components/Phone";
import { AppHeader, Badge, Card, Field, GradButton, Tabs } from "../components/AppUI";
import { WhatsAppChat } from "../components/WhatsApp";

const CORRETOR = "Olá, Carlos Andrade";

// 1. Gancho: o imóvel parado
export const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const dias = countUp(frame, 94, 16, 50);
  const big = pop(frame, 14, 12, 120);
  const shake = frame > 66 && frame < 80 ? Math.sin(frame * 2.2) * 6 : 0;
  return (
    <DarkBg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Headline text={"Seu imóvel está\nencalhado há"} color={C.white} size={92} />
        <div
          style={{
            fontFamily: FONT_TITLE,
            fontWeight: 800,
            fontSize: 330,
            lineHeight: 1,
            letterSpacing: -10,
            background: "linear-gradient(180deg, #FFFFFF 0%, #C4B5FD 100%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            transform: `scale(${0.4 + big * 0.6}) translateX(${shake}px)`,
            opacity: big,
          }}
        >
          {dias}
        </div>
        <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 88, color: "#C4B5FD", marginTop: -30, opacity: big }}>dias</div>
        <div
          style={{
            marginTop: 70,
            fontFamily: FONT_BODY,
            fontSize: 40,
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            opacity: ease(frame, 70, 86),
            transform: `translateY(${ease(frame, 70, 86, [20, 0])}px)`,
          }}
        >
          Anunciado em 5 portais. Nenhuma proposta séria.
        </div>
      </AbsoluteFill>
    </DarkBg>
  );
};

// 2. Virada: começar pelo comprador
const PERFIS = [
  { tag: "FAMÍLIA", txt: "Casa em Jundiaí · até R$ 800 mil", x: -90, y: 0, r: -4 },
  { tag: "INVESTIDOR", txt: "Studio em Campinas · à vista", x: 110, y: 190, r: 3 },
  { tag: "PRIMEIRA COMPRA", txt: "Apto 2 quartos · FGTS", x: -60, y: 380, r: -2 },
];
export const Virada: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <LightBg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 420 }}>
        <Headline text={"E se você começasse\npelo *comprador?*"} size={100} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", top: 900 }}>
        {PERFIS.map((p, i) => {
          const s = pop(frame, 26 + i * 9);
          return (
            <div
              key={p.tag}
              style={{
                position: "absolute",
                left: "50%",
                transform: `translate(calc(-50% + ${p.x}px), ${p.y + (1 - s) * 200 + Math.sin((frame + i * 20) / 18) * 8}px) rotate(${p.r}deg) scale(${s})`,
                background: C.white,
                borderRadius: 32,
                padding: "26px 34px",
                boxShadow: "0 24px 60px rgba(79,70,229,0.18)",
                fontFamily: FONT_BODY,
                display: "flex",
                alignItems: "center",
                gap: 22,
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ width: 72, height: 72, borderRadius: 36, background: GRAD_DIAG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users color={C.white} size={38} />
              </div>
              <div>
                <span style={{ background: GRAD, color: C.white, borderRadius: 999, padding: "5px 16px", fontSize: 22, fontWeight: 700 }}>{p.tag}</span>
                <div style={{ fontSize: 30, color: C.slate700, marginTop: 10, fontWeight: 500 }}>{p.txt}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </LightBg>
  );
};

// 3. Marca
export const Marca: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <LightBg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
        <LogoReveal start={4} size={0.95} />
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 44,
            color: C.slate600,
            textAlign: "center",
            lineHeight: 1.35,
            opacity: ease(frame, 36, 52),
            transform: `translateY(${ease(frame, 36, 52, [24, 0])}px)`,
          }}
        >
          Uma vitrine de <b style={{ color: C.indigo }}>compradores reais</b>,
          <br />
          com intenção real de compra.
        </div>
      </AbsoluteFill>
    </LightBg>
  );
};

// 4. Passo 1: descrever o imóvel
const DESCRICAO =
  "Casa térrea na Vila Arens, Jundiaí. 3 quartos (1 suíte), escritório, quintal com churrasqueira e 2 vagas. Rua tranquila, perto do centro.";
export const Descrever: React.FC = () => {
  const frame = useCurrentFrame();
  const valor = typed(frame, "780.000", 30, 14);
  const tipo = frame > 50 ? "Casa" : "Selecione o tipo";
  const texto = typed(frame, DESCRICAO, 58, 70);
  const pronto = ease(frame, 125, 132);
  const analisando = frame >= 140;
  return (
    <PhoneScene kicker="Passo 1" title={"Descreva o imóvel\n*do seu jeito*"}>
      <AppHeader role="Corretor" hello={CORRETOR} />
      <div style={{ padding: "14px 16px" }}>
        <Tabs left="Descobrir Compradores" right="Meus Matches" active={0} />
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: GRAD_DIAG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles color={C.white} size={20} />
            </div>
            <div>
              <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 17, color: C.slate900 }}>Descoberta Inteligente</div>
              <div style={{ fontSize: 11.5, color: C.slate500, lineHeight: 1.4 }}>
                Preencha os dados básicos e descreva o imóvel: a IA irá completar a ficha e cruzar com os compradores cadastrados.
              </div>
            </div>
          </div>
          <div style={{ background: C.slate50, borderRadius: 12, padding: 12, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.indigo700, marginBottom: 8 }}>
              <Filter size={13} /> Filtros obrigatórios
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Field label="Valor (R$) *" value={valor ? `R$ ${valor}` : "R$ Ex: 500.000"} highlight={valor ? 0.4 : 0} />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Tipo do Imóvel *" value={tipo} highlight={frame > 50 ? 0.4 : 0} />
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              border: `1px solid ${frame > 56 ? C.indigo200 : C.slate200}`,
              borderRadius: 12,
              padding: 12,
              height: 128,
              fontSize: 13.5,
              lineHeight: 1.5,
              color: texto ? C.slate900 : C.slate400,
            }}
          >
            {texto || "Descreva o imóvel que você quer ofertar: localização, características, diferenciais..."}
            {frame > 56 && frame < 130 && Math.floor(frame / 8) % 2 === 0 ? <span style={{ color: C.indigo }}>|</span> : null}
          </div>
          <GradButton style={{ marginTop: 14, transform: `scale(${frame >= 136 && frame < 142 ? 0.96 : 1})` }} dim={1 - pronto}>
            {analisando ? (
              <>
                <Loader2 size={16} style={{ transform: `rotate(${frame * 12}deg)` }} /> Analisando com IA...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Analisar descrição
              </>
            )}
          </GradButton>
        </Card>
      </div>
      <Tap at={136} x={195} y={548} />
    </PhoneScene>
  );
};

// 5. Passo 2: a IA monta a ficha
const CAMPOS: [string, string][] = [
  ["Localização", "Jundiaí, Vila Arens"],
  ["Valor", "R$ 780.000"],
  ["Área útil", "165 m²"],
  ["Área do terreno", "300 m²"],
  ["Quartos", "3"],
  ["Suítes", "1"],
  ["Banheiros", "3"],
  ["Vagas", "2"],
  ["Quintal", "Sim"],
  ["Churrasqueira", "Sim"],
  ["Estado", "Bom estado"],
  ["Aceita financiamento", "Sim"],
];
export const Ficha: React.FC = () => {
  const frame = useCurrentFrame();
  const START = 30;
  const STEP = 7;
  const preenchidos = Math.max(0, Math.min(CAMPOS.length, Math.floor((frame - START) / STEP) + 1));
  return (
    <PhoneScene kicker="Passo 2" title={"A IA monta\n*a ficha* sozinha"}>
      <AppHeader role="Corretor" hello={CORRETOR} />
      <div style={{ padding: "14px 16px" }}>
        <Card>
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 17, color: C.slate900 }}>Ficha do Imóvel</div>
          <div style={{ fontSize: 11.5, color: C.slate500, marginBottom: 10 }}>Confira os campos preenchidos pela IA.</div>
          <div style={{ display: "flex", gap: 10, padding: 10, background: C.indigo50, border: `1px solid ${C.indigo200}`, borderRadius: 12, marginBottom: 12 }}>
            <Sparkles size={15} color={C.indigo} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#3730A3" }}>Ficha preenchida pela IA</div>
              <div style={{ fontSize: 11, color: C.indigo }}>
                {preenchidos}/{CAMPOS.length} campos obrigatórios preenchidos
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CAMPOS.map(([label, value], i) => {
              const at = START + i * STEP;
              const on = frame >= at;
              return (
                <Field
                  key={label}
                  label={label}
                  value={on ? value : ""}
                  ai={pop(frame, at)}
                  highlight={on ? Math.max(0, 1 - (frame - at) / 20) : 0}
                />
              );
            })}
          </div>
        </Card>
      </div>
    </PhoneScene>
  );
};

// 6. Passo 3: compradores compatíveis
const COMPRADORES = [
  { nome: "Mariana Costa", score: 94, perfil: "FAMÍLIA - Espaço e tranquilidade", pag: "Financiamento + FGTS" },
  { nome: "Rafael Mendes", score: 87, perfil: "HOME OFFICE - Conforto e silêncio", pag: "À vista" },
  { nome: "Juliana Prado", score: 72, perfil: "UPGRADE - Mais espaço", pag: "Permuta + Financiamento" },
];
export const Resultados: React.FC = () => {
  const frame = useCurrentFrame();
  const MATCH = 118;
  return (
    <PhoneScene kicker="Passo 3" title={"Encontre quem\n*já quer comprar*"}>
      <AppHeader role="Corretor" hello={CORRETOR} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 17 }}>Compradores compatíveis</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, opacity: ease(frame, 14, 24) }}>
          <Badge bg={C.white} color={C.slate700} style={{ border: `1px solid ${C.slate200}` }}>
            {countUp(frame, 24, 14, 24)} perfis avaliados
          </Badge>
          <Badge bg={C.slate100} color={C.slate600}>9 pré-filtrados</Badge>
        </div>
        {COMPRADORES.map((b, i) => {
          const at = 24 + i * 14;
          const p = pop(frame, at);
          const score = countUp(frame, b.score, at + 4, 26, 0);
          const done = i === 0 && frame >= MATCH + 4;
          return (
            <div key={b.nome} style={{ transform: `translateX(${(1 - p) * 420}px)`, opacity: p, marginBottom: 10 }}>
              <Card style={{ padding: 13, borderLeft: `4px solid ${C.indigo}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge bg={b.score >= 80 ? C.green : C.yellow} color={C.white} style={{ fontSize: 12 }}>
                    {score}% compatível
                  </Badge>
                  <div style={{ fontWeight: 600, fontSize: 15, color: C.slate900 }}>{b.nome}</div>
                </div>
                <Badge bg={GRAD} color={C.white} style={{ marginTop: 7, fontSize: 10 }}>
                  {b.perfil}
                </Badge>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: 11, color: C.slate500, marginTop: 8 }}>
                  <Meta icon={<Building2 size={12} />} t="Casa" />
                  <Meta icon={<MapPin size={12} />} t="Jundiaí" />
                  <Meta icon={<BedDouble size={12} color="#818CF8" />} t="3+ quartos" />
                  <Meta icon={<DollarSign size={12} color="#818CF8" />} t="até R$ 800.000" />
                  <Meta icon={<DollarSign size={12} color={C.green} />} t={b.pag} />
                </div>
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 10,
                    padding: "8px 0",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.white,
                    background: done ? C.green : GRAD,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    transform: `scale(${i === 0 && frame >= MATCH && frame < MATCH + 6 ? 0.95 : 1})`,
                  }}
                >
                  {done ? <Check size={15} /> : <Heart size={14} />}
                  {done ? "Match enviado para curadoria" : "Dar Match"}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
      <Tap at={MATCH} x={195} y={346} />
    </PhoneScene>
  );
};

const Meta: React.FC<{ icon: React.ReactNode; t: string }> = ({ icon, t }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
    {icon}
    {t}
  </span>
);

// 7. Curadoria: status do match evolui
const STATUS = [
  { t: "Em Análise", bg: "#FEF9C3", c: "#A16207" },
  { t: "Aprovado", bg: C.green100, c: C.green700 },
  { t: "Visita Agendada", bg: "#DBEAFE", c: "#1D4ED8" },
];
export const Curadoria: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = frame < 55 ? 0 : frame < 95 ? 1 : 2;
  const flip = pop(frame, idx === 0 ? 0 : idx === 1 ? 55 : 95, 12, 200);
  const s = STATUS[idx];
  return (
    <PhoneScene
      title={"A curadoria\n*cuida do resto*"}
      subtitle="Um curador valida o match, agenda a visita e intermedeia a negociação."
    >
      <AppHeader role="Corretor" hello={CORRETOR} />
      <div style={{ padding: "14px 16px" }}>
        <Tabs left="Descobrir Compradores" right="Meus Matches" active={1} />
        <Card style={{ marginTop: 14, borderLeft: `4px solid #EF4444` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 17 }}>
              <Heart size={18} fill="#EF4444" color="#EF4444" /> Match com Mariana Costa
            </div>
            <Trash2 size={15} color="#EF4444" />
          </div>
          <div style={{ marginTop: 8, transform: `rotateX(${(1 - flip) * 90}deg)` }}>
            <Badge bg={s.bg} color={s.c}>
              {idx === 2 ? "Visita Agendada · Sáb, 10h" : s.t}
            </Badge>
          </div>
          <div style={{ background: C.slate50, borderRadius: 12, padding: 12, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 14 }}>
              <Home size={15} color={C.slate500} /> Casa
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate500, marginTop: 6 }}>
              <MapPin size={13} /> Vila Arens, Jundiaí
            </div>
          </div>
          <div style={{ background: C.indigo50, border: `1px solid ${C.indigo100}`, borderRadius: 12, padding: 12, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.indigo700, fontWeight: 600, fontSize: 13 }}>
                <Sparkles size={14} /> Compatibilidade da IA
              </div>
              <Badge bg={C.green} color={C.white}>94%</Badge>
            </div>
            <div style={{ fontSize: 12, color: C.slate700, lineHeight: 1.5, marginTop: 6 }}>
              Casa térrea dentro do orçamento, com 3 quartos e quintal. A localização perto do centro atende à rotina da família.
            </div>
          </div>
        </Card>
        {[
          { at: 20, t: "Curador analisou o perfil do comprador" },
          { at: 58, t: "Match aprovado pela curadoria" },
          { at: 98, t: "Visita agendada com o comprador" },
        ].map((e) => {
          const p = pop(frame, e.at);
          return (
            <div
              key={e.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 10,
                fontSize: 13,
                color: C.slate700,
                opacity: p,
                transform: `translateY(${(1 - p) * 16}px)`,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 11, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={13} color={C.white} />
              </div>
              {e.t}
            </div>
          );
        })}
      </div>
    </PhoneScene>
  );
};

// 8. WhatsApp: cadastrar imóvel por mensagem
export const WhatsCorretor: React.FC = () => (
  <PhoneScene kicker="Também pelo WhatsApp" title={"Cadastre o imóvel\n*por mensagem*"} phoneBg={C.waBg}>
    <WhatsAppChat
      title="MatchImovel"
      scrollAt={[128, 146, 150]}
      msgs={[
        { from: "me", at: 18, text: "Oi" },
        { from: "them", at: 44, typing: 16, text: <>Olá, <b>Carlos</b>! Me descreva o imóvel que você quer ofertar.</> },
        { from: "me", at: 72, text: "Casa térrea na Vila Arens, Jundiaí. 3 quartos com suíte, quintal, 2 vagas. R$ 780 mil." },
        {
          from: "them",
          at: 108,
          typing: 18,
          text: (
            <>
              <b>Dados extraídos do imóvel:</b>
              <br />
              Tipo: Casa
              <br />
              Local: Vila Arens, Jundiaí
              <br />
              Quartos: 3 (1 suíte)
              <br />
              Valor: R$ 780.000
            </>
          ),
          buttons: ["Buscar compradores"],
        },
        { from: "them", at: 150, typing: 12, text: <>Encontrei <b>3 compradores</b> compatíveis. Quer dar match?</> },
      ]}
    />
  </PhoneScene>
);

// 9. Comissão 60/40
export const Comissao: React.FC = () => {
  const frame = useCurrentFrame();
  const card = pop(frame, 14, 14, 120);
  const pct = countUp(frame, 60, 22, 34);
  const itens = [
    { i: <Users size={44} />, t: "Base de compradores ativos" },
    { i: <BadgeDollarSign size={44} />, t: "Nenhum custo por lead" },
    { i: <RefreshCw size={44} />, t: "Buscas salvas refeitas toda semana" },
  ];
  return (
    <LightBg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 190 }}>
        <Headline text={"E a maior parte\nda comissão *é sua*"} size={92} />
        <div
          style={{
            marginTop: 70,
            width: 900,
            borderRadius: 56,
            padding: "56px 60px",
            background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
            boxShadow: "0 40px 90px rgba(22,163,74,0.35)",
            color: C.white,
            transform: `scale(${0.6 + card * 0.4}) rotate(${(1 - card) * -4}deg)`,
            opacity: card,
          }}
        >
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 60, lineHeight: 1.1 }}>Comissão 60/40 a seu favor</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 10 }}>
            <div style={{ fontFamily: FONT_TITLE, fontWeight: 800, fontSize: 260, lineHeight: 1, letterSpacing: -8 }}>{pct}%</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 38, opacity: 0.9, whiteSpace: "nowrap" }}>para o corretor</div>
          </div>
        </div>
        <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 26, width: 900 }}>
          {itens.map((it, i) => {
            const p = pop(frame, 60 + i * 12);
            return (
              <div
                key={it.t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  background: C.white,
                  borderRadius: 32,
                  padding: "26px 34px",
                  boxShadow: "0 14px 40px rgba(79,70,229,0.12)",
                  fontFamily: FONT_BODY,
                  fontSize: 40,
                  fontWeight: 600,
                  color: C.slate900,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -300}px)`,
                }}
              >
                <div style={{ color: C.indigo }}>{it.i}</div>
                {it.t}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </LightBg>
  );
};

// 10. Chamada final
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const btn = pop(frame, 40);
  const pulse = 1 + Math.sin(Math.max(0, frame - 60) / 6) * 0.03;
  return (
    <DarkBg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 80 }}>
        <LogoReveal start={0} size={0.85} light />
        <Headline text={"Encontre o comprador\ndo seu *imóvel.*"} color={C.white} size={92} start={14} highlight="#C4B5FD" />
        <div
          style={{
            background: C.white,
            color: C.indigo,
            fontFamily: FONT_TITLE,
            fontWeight: 700,
            fontSize: 52,
            padding: "34px 80px",
            borderRadius: 999,
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            transform: `scale(${btn * pulse})`,
          }}
        >
          Sou corretor →
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 40, color: "rgba(255,255,255,0.8)", opacity: ease(frame, 55, 70) }}>
          matchimovel.com.br
        </div>
      </AbsoluteFill>
    </DarkBg>
  );
};

