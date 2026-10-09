// Desenha a tela de bloqueio do celular 3D num <canvas> (vira textura da tela do modelo).
// Tudo em coordenadas "retrato": TELA_W x TELA_H.

export const TELA_W = 1000;
export const TELA_H = 1950;

export type Notificacao = {
  titulo: string;
  linhas: string[];
};

export type EstadoTela = {
  acesa: number; // 0..1, brilho da tela (0 = apagada)
  notif: number; // 0..1, entrada da notificação
  hora: string;
  data: string;
  notificacao: Notificacao;
};

const CASA = new Path2D(
  "M 168 412 H 146 Q 110 412 110 376 V 230 Q 110 206 128 191 L 230 104 Q 256 82 282 104 L 384 191 Q 402 206 402 230 V 376 Q 402 412 366 412 H 344",
);
const M = new Path2D("M 192 412 V 262 L 256 322 L 320 262 V 412");

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const papelDeParede = (ctx: CanvasRenderingContext2D) => {
  const g = ctx.createLinearGradient(0, 0, TELA_W * 0.4, TELA_H);
  g.addColorStop(0, "#0B0A23");
  g.addColorStop(0.45, "#1E1B4B");
  g.addColorStop(1, "#090814");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TELA_W, TELA_H);
  const bolha = (x: number, y: number, r: number, cor: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, cor);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, TELA_W, TELA_H);
  };
  bolha(TELA_W * 0.85, TELA_H * 0.78, 900, "rgba(147,51,234,0.55)");
  bolha(TELA_W * 0.1, TELA_H * 0.35, 700, "rgba(79,70,229,0.45)");
};

const barraDeStatus = (ctx: CanvasRenderingContext2D, hora: string) => {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 52px Inter";
  ctx.textBaseline = "middle";
  ctx.fillText(hora, 110, 92);
  // sinal
  for (let i = 0; i < 4; i++) {
    roundRect(ctx, 690 + i * 18, 104 - (i + 1) * 9, 12, (i + 1) * 9, 3);
    ctx.fill();
  }
  // wi-fi
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(790, 110, 12 + i * 12, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
  // bateria
  ctx.lineWidth = 4;
  roundRect(ctx, 830, 76, 68, 34, 10);
  ctx.stroke();
  roundRect(ctx, 836, 82, 52, 22, 6);
  ctx.fill();
  roundRect(ctx, 901, 86, 6, 14, 3);
  ctx.fill();
};

const cadeado = (ctx: CanvasRenderingContext2D, y: number) => {
  ctx.strokeStyle = "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(TELA_W / 2, y, 22, Math.PI, 0);
  ctx.lineTo(TELA_W / 2 + 22, y + 14);
  ctx.moveTo(TELA_W / 2 - 22, y + 14);
  ctx.lineTo(TELA_W / 2 - 22, y);
  ctx.stroke();
  roundRect(ctx, TELA_W / 2 - 34, y + 12, 68, 52, 10);
  ctx.fill();
};

const iconeApp = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  roundRect(ctx, x, y, s, s, s * 0.24);
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, "#4F46E5");
  g.addColorStop(1, "#9333EA");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.translate(x + s * 0.12, y + s * 0.1);
  const k = (s * 0.76) / 392;
  ctx.scale(k, k);
  ctx.translate(-60, -50);
  ctx.lineWidth = 42;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke(CASA);
  ctx.strokeStyle = "#D8CCFF";
  ctx.stroke(M);
  ctx.restore();
};

const cartaoNotificacao = (ctx: CanvasRenderingContext2D, n: Notificacao, p: number) => {
  if (p <= 0) return;
  const x = 60;
  const w = TELA_W - 120;
  const h = 140 + n.linhas.length * 62;
  const yFinal = 980;
  const y = yFinal + (1 - p) * 140;
  ctx.save();
  ctx.globalAlpha = Math.min(1, p * 1.4);
  ctx.translate(TELA_W / 2, y + h / 2);
  const s = 0.86 + 0.14 * p;
  ctx.scale(s, s);
  ctx.translate(-TELA_W / 2, -(y + h / 2));
  roundRect(ctx, x, y, w, h, 56);
  ctx.fillStyle = "rgba(38,36,58,0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  ctx.stroke();
  iconeApp(ctx, x + 40, y + 40, 92);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 44px Inter";
  ctx.fillText("MatchImovel", x + 160, y + 82);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 38px Inter";
  const agora = "agora";
  ctx.fillText(agora, x + w - 40 - ctx.measureText(agora).width, y + 82);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 46px Inter";
  ctx.fillText(n.titulo, x + 160, y + 146);
  ctx.font = "400 42px Inter";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  n.linhas.forEach((l, i) => ctx.fillText(l, x + 160, y + 206 + i * 56));
  ctx.restore();
};

export const desenharTela = (ctx: CanvasRenderingContext2D, e: EstadoTela) => {
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, TELA_W, TELA_H);
  if (e.acesa > 0) {
    ctx.globalAlpha = e.acesa;
    papelDeParede(ctx);
    barraDeStatus(ctx, e.hora);
    cadeado(ctx, 300);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = "300 250px Inter";
    ctx.fillText(e.hora, TELA_W / 2, 640);
    ctx.font = "500 56px Inter";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(e.data, TELA_W / 2, 730);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
    cartaoNotificacao(ctx, e.notificacao, e.notif * e.acesa);
    // ilha dinâmica
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000000";
    roundRect(ctx, TELA_W / 2 - 150, 52, 300, 84, 42);
    ctx.fill();
    // barra inferior (home indicator)
    ctx.globalAlpha = e.acesa;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    roundRect(ctx, TELA_W / 2 - 150, TELA_H - 60, 300, 14, 7);
    ctx.fill();
  }
  ctx.restore();
};
