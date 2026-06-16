# Marketing PRD — Estratégia de Campanhas MatchImovel

## Visão geral

O MatchImovel opera em dois lados de mercado (compradores e corretores). A estratégia de campanhas é dividida em:

1. **Aquisição** — atrair novos usuários para a plataforma
2. **Engajamento** — reativar usuários cadastrados via WhatsApp (disparo direto)

---

## Lado Corretor

### Campanha CAMP80 — Corretor Parceiro Selecionado

**Proposta:** 80% de comissão (vs 60% padrão) para corretores que entram via campanha.

**Canais de aquisição:**
- Meta Ads (Facebook/Instagram) → `/parceiro?promo=CAMP80`
- WhatsApp chatbot: palavras-chave `parceiro`, `camp80`, `80%` → link enviado automaticamente
- Indicação / boca a boca

**Fluxo:**
1. Usuário acessa `/parceiro?promo=CAMP80`
2. Preenche formulário (`CampaignRegisterPage.js`) com `promo_code: "CAMP80"`
3. Backend (`auth_routes.py`) aplica `commission_rate: 80`, `source_campaign: "lancamento_2026"`
4. Corretor aparece na aba "Campanhas → Aquisição" do painel admin com filtro por campanha

**Código promo ativo:**
| Código | Taxa corretor | Campanha |
|--------|--------------|----------|
| `CAMP80` | 80% | `lancamento_2026` |

**Tracking:**
- Meta Pixel: evento `Lead` com `content_name: "cadastro_corretor"`, `content_category: "corretor"`
- GA4: evento `generate_lead` com `event_role: "agent"`
- UTM capturado em `db.users.utm` na criação

---

## Lado Comprador

### Aquisição (planejado)

**Canais:**
- Mídia física (panfletos, QR code)
- Meta Ads → formulário no site → `/register?role=buyer`
- Meta Ads → WhatsApp chatbot → Flow A (captação comprador)
- Google Ads / orgânico (SEO)
- Indicação / referral

**Mecânica:** apenas atração, sem oferta especial (acesso à plataforma é gratuito para compradores).

**Tracking:**
- UTM capturado no cadastro do usuário (`db.users.utm`)
- UTM capturado no interesse cadastrado (`db.interests.utm`) — fix implementado em `buyer_routes.py create-full-v2`
- Analytics consolidado em `GET /admin/analytics/utm`

---

## Engajamento via WhatsApp — Central de Disparos

**Interface:** aba "Campanhas → Disparos" no painel admin (admin only).

### Templates aprovados necessários (UTILITY)

Submeter no **Meta Business Manager → WhatsApp → Modelos de mensagem**:

| Template | Destinatário | Variáveis | Objetivo |
|----------|-------------|-----------|---------|
| `novos_interesses` | Corretor | `{{1}}` nome, `{{2}}` total, `{{3}}` breakdown tipos | Avisar sobre compradores não cobertos *(já existe no sistema)* |
| `lembrete_acesso` | Corretor/Comprador | `{{1}}` nome | Reativar usuário inativo |

> **Atenção:** Templates MARKETING (promoções, ofertas) só devem ser criados após a conta Meta ter histórico positivo de UTILITY (baixo opt-out, boa entrega). Evitar até ter +500 entregas UTILITY sem reclamações.

### Segmentos disponíveis

| Público | Filtro | Caso de uso |
|---------|--------|-------------|
| Corretores — todos | `role: agent` | Avisos gerais |
| Corretores — parceiros 80% | `role: agent, commission_rate_min: 80` | Comunicação exclusiva CAMP80 |
| Corretores — padrão 60% | `role: agent, commission_rate_min: 0` + sem filtro 80 | Oferecer upgrade de comissão |
| Compradores — todos | `role: buyer` | Notificar novos corretores na região |

### Boas práticas

1. **Só enviar via template UTILITY aprovado** — fora da janela 24h é obrigatório, dentro também é recomendado para rastreamento.
2. **Frequência máxima:** 1 disparo por segmento por semana (evitar fadiga / opt-out).
3. **Horário:** preferir entre 9h–20h (horário de Brasília).
4. **Testar com lote pequeno** (5–10 números) antes do disparo em massa.
5. **Monitorar taxa de leitura** no Meta Business Manager após cada disparo.

### Fluxo de disparo

```
Admin → aba "Campanhas" → "Disparos"
  → preencher nome, público, filtro, template
  → "Pré-visualizar" → ver N destinatários + amostra
  → "Enviar para N" → confirmação → disparo
  → resultado salvo em db.whatsapp_campaigns
  → histórico visível na mesma aba
```

---

## KPIs

| Métrica | Onde medir |
|---------|-----------|
| Corretores cadastrados por campanha | Aba Campanhas → Aquisição |
| Taxa de ativação (fez busca) | Aba Campanhas → Aquisição |
| Mensagens enviadas / entregues | Histórico de disparos |
| Leads por canal (UTM) | `GET /admin/analytics/utm` |
| Matches criados por campanha | Aba Campanhas → Aquisição |

---

## Roadmap

| Fase | Status | Descrição |
|------|--------|-----------|
| 0 | ✅ Concluído | UTM capturado em interesses de compradores (`create-full-v2`) |
| 1 | ✅ Concluído | Campanha CAMP80 ativa (landing, promo code, badge, funil no admin) |
| 2 | ✅ Concluído | Central de Disparos WhatsApp no painel admin |
| 3 | 🔲 Pendente | Submeter templates UTILITY `novos_interesses` e `lembrete_acesso` na Meta |
| 4 | 🔲 Pendente | Tracking de entrega por webhook Meta (`delivered`, `read`) |
| 5 | 🔲 Pendente | Opt-out explícito e campo `whatsapp_opt_out` no usuário |
| 6 | 🔲 Pendente | Templates MARKETING (só após histórico positivo UTILITY) |
| 7 | 🔲 Pendente | Campanha de aquisição lado comprador (landing page dedicada) |
