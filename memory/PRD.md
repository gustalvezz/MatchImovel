# MatchImovel - PRD (Product Requirements Document)

## Visão Geral
Plataforma imobiliária que conecta compradores interessados a corretores através de um sistema de curadoria profissional com matching inteligente por IA. O diferencial é que os compradores cadastram seu perfil detalhado e os corretores os encontram, invertendo o modelo tradicional do mercado.

## Usuários e Papéis
1. **Comprador**: Cadastra interesse em comprar imóvel através de formulário detalhado em blocos
2. **Corretor**: Descreve imóveis, a IA cruza com perfis de compradores e retorna matches com score de compatibilidade
3. **Curador**: Aprova/rejeita matches e agenda visitas, intermediando toda a comunicação
4. **Admin**: Gerencia usuários, curadores e visualiza analytics da plataforma

## Fluxo Principal
1. Comprador se registra → Preenche formulário de interesse em blocos → GPT-4o gera perfil do comprador → Email de confirmação
2. Corretor descreve o imóvel → IA extrai campos estruturados por tipo → Corretor confirma a ficha
3. Corretor busca compradores compatíveis via IA (pré-filtro + score GPT-4o) → Dá match
4. Curador avalia o match → Aprova/Rejeita → Emails enviados
5. Curador agenda visita → Intermediação até fechamento

---

## Funcionalidades Implementadas

### Autenticação e Usuários
- [x] Registro de compradores com telefone obrigatório (máscara aplicada)
- [x] Login JWT para todos os papéis (expiração 7 dias)
- [x] Admin login separado (/admin/login)
- [x] Curador login via área admin com convite por email
- [x] Validação de CRECI para corretores via API BuscaCRECI
- [x] Fluxo completo de recuperação de senha (forgot/reset com token 24h)
- [x] Termos de uso para compradores (checkbox + modal + captura de IP e timestamp)
- [x] Termo de parceria para corretores (checkbox + modal com CRECI dinâmico)

### Formulário de Interesse do Comprador (v3 — blocos)
**Bloco 1 — Quem é você:**
- [x] Perfil (5 opções: primeira compra, upgrade, investimento, sair do aluguel, outro)
- [x] Urgência (3, 12 meses, sem prazo)
- [x] Composição familiar (quem vai morar, filhos, idades)
- [x] Faixa etária

**Bloco 2 — O que você busca:**
- [x] Localização (campo livre)
- [x] Orçamento (6 faixas até "Acima de 1,5 milhão") com min/max_price extraídos
- [x] Tipo de imóvel (apartamento, casa, casa de condomínio, terreno, studio/loft, sala comercial)
- [x] Preferência de andar
- [x] Forma de pagamento (múltipla seleção: à vista, financiamento, FGTS, permuta)
- [x] Situação do imóvel atual

**Bloco 3 — Como deve ser:**
- [x] Critérios indispensáveis (múltipla seleção + campo livre)
- [x] Tamanho do espaço
- [x] Estado de conservação desejado
- [x] Ambiance (estilo de vida)

**Bloco 4 — Como você vive:**
- [x] Pets
- [x] Rotina diária
- [x] Meio de transporte

**Bloco 5 — O que você rejeita:**
- [x] Deal breakers (múltipla seleção)

**Bloco 6 — Entorno:**
- [x] Proximidades necessárias (escola, metrô, comércio, hospital, parque, etc.)

**Processamento por IA:**
- [x] GPT-4o gera `perfil_narrativo` (4-6 linhas), `pontos_decisivos` (lista), `perfil_do_imovel_ideal` (string)
- [x] Badge `ai_profile` gerado (ex: "INVESTIDOR - Foco em valorização")
- [x] Processamento assíncrono via BackgroundTasks (evita timeout Vercel)
- [x] Campo `ai_processing_status`: pending → completed / failed

### Dashboard do Corretor
- [x] Listagem de compradores ativos com perfil IA badge
- [x] Busca textual ignorando acentos (sao paulo → São Paulo)
- [x] **Descoberta Inteligente por IA**: corretor descreve imóvel, GPT-4o retorna compradores com score de compatibilidade e justificativa
- [x] **Pré-filtro automático** antes da IA: filtra por orçamento (max_price ≥ 75% do valor) e tipo de imóvel — métricas expostas na resposta
- [x] **Buscas Salvas**: busca é salva automaticamente após execução, re-executada via cron a cada 7 dias
- [x] Notificação por email ao corretor quando cron encontra novos matches
- [x] Cards de resultados exibem: score, nome, tipo, localização, quartos, faixa de preço, forma de pagamento
- [x] Cards de buscas salvas com resultados pendentes: mesmos campos + botão "Ver resumo" expansível com justificativa da IA
- [x] **Cadastro de imóvel em 2 etapas**:
  - Etapa 1: campo de descrição livre + botão "Analisar descrição" com loading
  - Etapa 2: formulário dinâmico por tipo de imóvel, pré-preenchido pela IA com badge "IA" nos campos extraídos
  - Todos os campos obrigatórios exceto link do anúncio
  - `ai_summary` gerado com informações extras da descrição não capturadas nos campos
- [x] Aba "Meus Matches" com status (Em Análise, Aprovado, Visita Agendada, etc.)
- [x] Modal de exclusão de match com motivo obrigatório

### Formulário de Cadastro do Imóvel — Campos por Tipo

**Comuns a todos os tipos:**
localização, endereço, valor, formas de pagamento aceitas, estado de conservação, aceita financiamento, aceita permuta, link do anúncio, ai_summary

**Apartamento:** + andar, área útil, quartos, suítes, banheiros, vagas, varanda, mobília, estilo arquitetônico, condomínio (valor + amenities), IPTU

**Casa (fora de condomínio):** + área útil, área do terreno, quartos, suítes, banheiros, vagas, quintal, piscina própria, churrasqueira, mobília, estilo

**Casa de Condomínio:** + tudo da casa + condomínio (valor + amenities) + pet friendly

**Terreno:** + área total, frente (m), zoneamento, topografia, situação documental

**Studio/Loft:** + andar, área útil, banheiros, vagas, varanda, configuração (conjugado/studio/loft), mobília, estilo, condomínio

**Sala Comercial:** + andar, área útil, vagas, layout (planta livre/dividida), ar condicionado central, gerador, condomínio, aceita PJ

### Dashboard do Curador
- [x] Aba "Pendentes" para avaliar matches com perfil completo do comprador
- [x] Exibição de `interpretacaoIA` do comprador: perfil narrativo, critérios inegociáveis (badges), imóvel ideal
- [x] Exibição de `payment_method` do comprador no resumo de interesse
- [x] Título "O que não abre mão:" acima dos badges de critérios
- [x] Dados completos do imóvel enviado pelo corretor
- [x] Telefone do comprador e corretor com link WhatsApp
- [x] Botão "Agendar Visita" com formulário de data/hora
- [x] Follow-ups (CRM) para acompanhamento
- [x] Marcação de imóvel como vendido

### Dashboard do Admin
- [x] Gestão de compradores, corretores e curadores
- [x] Verificação e bloqueio de CRECI de corretores
- [x] Criação de curadores com envio de email
- [x] Analytics completo: funil de conversão, matches por status, distribuição por tipo/localização
- [x] Exibição de `interpretacaoIA` do comprador no detalhe do interesse
- [x] Exclusão de interesses com auditoria

### Dashboard do Comprador
- [x] Exibição completa do perfil gerado pela IA:
  - Perfil narrativo (texto)
  - Pontos decisivos (lista)
  - Imóvel ideal (card verde)
- [x] Card de status contextual (processando / cadastrado / X matches encontrados)
- [x] Visualização de matches aprovados com dados do imóvel

### Sistema de Notificações por Email
- [x] Email ao comprador: interesse cadastrado (com próximos passos)
- [x] Email ao comprador: match aprovado ("Wohoo!")
- [x] Email ao corretor: match aprovado com dados do comprador
- [x] Email ao corretor: novos resultados de busca salva encontrados pelo cron
- [x] Email ao curador: interesse/match excluído (com motivo)
- [x] Email ao agendar visita (comprador e corretor)
- [x] Endpoint para lembrete 2h antes da visita
- [x] Todos os emails com `multipart/alternative` (plain text + HTML) para deliverability
- [x] Template HTML compatível com iOS Mail (inline-block em vez de flexbox nos badges)

### SEO e Landing Page
- [x] Meta tags, Open Graph, Twitter Cards — domínio `matchimovel.com.br`
- [x] JSON-LD structured data (type: Organization)
- [x] Favicon e apple-touch-icon configurados
- [x] Menu sticky com anchor links
- [x] Canonical URL correta

---

## Stack Técnica
- **Frontend**: React 18, Tailwind CSS, Shadcn UI, Framer Motion, Lucide React
- **Backend**: FastAPI (Python) — arquitetura modular v2.0.0
- **Database**: MongoDB (Motor async)
- **AI**: OpenAI GPT-4o — matching de compradores, extração de campos de imóveis, geração de perfis
- **Email**: SMTP (Hostgator) via aiosmtplib — templates HTML com plain text fallback
- **CRECI**: API BuscaCRECI (https://api.buscacreci.com.br)

### Arquitetura Backend (v2.0.0)
```
backend/
├── server.py             # Entry point + middleware CORS
├── config.py             # Variáveis de ambiente
├── database.py           # Conexão MongoDB
├── auth.py               # JWT e hash de senhas
├── models/
│   └── schemas.py        # Modelos Pydantic
├── services/
│   ├── email_service.py  # Templates e envio de emails
│   └── openai_service.py # Integração GPT-4o
└── routes/
    ├── auth_routes.py    # Login, registro, CRECI, reset de senha
    ├── buyer_routes.py   # Interesses + geração de perfil IA
    ├── agent_routes.py   # Busca IA, analyze-property, buscas salvas, matches
    ├── curator_routes.py # Curadoria, follow-ups, visitas
    └── admin_routes.py   # Gestão de usuários e analytics
```

## Variáveis de Ambiente Obrigatórias

### Backend
| Variável | Descrição |
|----------|-----------|
| `MONGO_URL` | URL de conexão MongoDB |
| `DB_NAME` | Nome do banco de dados |
| `JWT_SECRET` | Chave secreta JWT |
| `FRONTEND_URL` | URL do frontend (links em emails) |
| `CORS_ORIGINS` | Origens CORS permitidas (vírgula) |
| `OPENAI_API_KEY` | Chave OpenAI (GPT-4o) |
| `SMTP_*` | Configurações SMTP para emails |

### Frontend
| Variável | Descrição |
|----------|-----------|
| `REACT_APP_BACKEND_URL` | URL base da API backend |

---

## Backlog / Tarefas Futuras

### P1 - Alta Prioridade
- [ ] Configurar cron job externo para lembretes de visita 2h antes (`POST /api/internal/send-visit-reminders`)
- [ ] Assets visuais: `favicon.png`, `apple-touch-icon.png`, `og-image.png`, `logo.png` (criação por design)

### P2 - Média Prioridade
- [ ] Exportação CSV de leads para email marketing
- [ ] Histórico de visitas no dashboard do curador
- [ ] Analytics expandido para performance individual de curadores

### P3 - Baixa Prioridade
- [ ] Seção FAQ na landing page
- [ ] Notificações push (web push)

---

## Changelog

### 02/05/2026
- **Cadastro de imóvel em 2 etapas com extração de campos por IA**:
  - Novo endpoint `POST /api/agents/analyze-property`: recebe tipo + valor + descrição livre, GPT-4o extrai campos estruturados por tipo de imóvel, retorna JSON pré-preenchido + `ai_summary`
  - `PropertyInfoModal` reescrito: etapa 1 = descrição + botão "Analisar descrição" com loading; etapa 2 = formulário dinâmico pré-preenchido com badge "IA" nos campos extraídos
  - Formulário dinâmico por tipo: 6 tipos de imóvel, cada um com conjunto próprio de campos relevantes (elimina campos inaplicáveis)
  - Estilo arquitetônico adicionado como campo: moderno, clássico, rústico, industrial, retrofit, minimalista, sem estilo definido
  - `normalizeExtracted()` garante tipos corretos nos campos após resposta da IA (previne crash de objeto renderizado como JSX)
  - `ai_summary` armazenado no `property_info` do match para uso no cruzamento com perfis de compradores
  - Todos os campos obrigatórios exceto link do anúncio
  - Backward compatible: registros existentes no banco não são afetados

- **BuyerMatch enriquecido com dados financeiros**:
  - Modelo `BuyerMatch` inclui agora `payment_method`, `bedrooms`, `min_price`, `max_price`
  - Endpoint `/agents/ai-discovery` e cron de buscas salvas passam esses campos nos resultados
  - Cards de resultados (busca manual e buscas salvas) exibem: quartos, faixa de preço e forma de pagamento
  - Cards de buscas salvas: botão "Ver resumo" expansível com justificativa da IA

- **Correção de crash React — objeto renderizado como JSX**:
  - Bug: GPT-4o retornava `perfil_do_imovel_ideal` como objeto `{tipo, localizacao, ...}` em vez de string
  - Corrigido em `BuyerDashboard`, `AdminDashboard` e `CuratorDashboard` com guard `typeof === 'string'`
  - Fallback: se objeto, concatena campos relevantes com vírgula
  - Prompt em `buyer_routes.py` reforçado: "DEVE ser uma string, NUNCA um objeto ou dicionário JSON"

- **CuratorDashboard — melhorias de exibição**:
  - `payment_method` do comprador exibido no resumo de interesse com ícone DollarSign
  - Título "O que não abre mão:" adicionado acima dos badges de critérios indispensáveis

- **SEO Landing Page corrigido**:
  - Domínio corrigido de `matchimob.com.br` para `matchimovel.com.br` em todos os meta tags (og:url, og:image, twitter:url, twitter:image, canonical, JSON-LD)
  - JSON-LD `@type` alterado de `RealEstateAgent` para `Organization`
  - Favicon e apple-touch-icon configurados

- **Email Service — melhorias de deliverability e compatibilidade**:
  - `send_email` agora envia `multipart/alternative` com `text/plain` primeiro (RFC 2046) — melhora deliverability e evita spam
  - Overflow de badges em iOS Mail corrigido: substituído `display:flex` por `display:inline-block` com `margin`
  - Link CTA de `matchimob.com/dashboard/agent` corrigido para `matchimovel.com.br/dashboard/agent`
  - Seção IA reordenada: `perfil_do_imovel_ideal` antes dos badges de critérios
  - Título "Análise do seu perfil por IA" renomeado para "Análise do seu perfil"

- **README.md** completamente reescrito refletindo estado atual da plataforma

### 26/04/2026
- **Dashboard do Comprador — Exibição de Resumo IA e Status**:
  - Exibição completa do `interpretacaoIA` no card de interesse: perfil narrativo, critérios inegociáveis (badges), imóvel ideal (card verde), pontos de atenção (âmbar)
  - Card de status contextual: processando IA / cadastrado sem matches / X matches encontrados
  - Endpoint `/buyers/my-interests` atualizado para retornar `interpretacaoIA`

- **Processamento de IA em Background (Fix Vercel Timeout)**:
  - `POST /api/interests/create-full-v2` usa FastAPI `BackgroundTasks`
  - Interesse salvo imediatamente (resposta < 1s), IA e email em background
  - Campo `ai_processing_status`: pending → completed / failed

### 08/04/2026
- **Cron para Lembretes de Visita**:
  - Endpoint: `POST /api/internal/send-visit-reminders`
  - Segurança via header `X-Internal-Key`
  - Envia lembrete 2h antes da visita para comprador e corretor

### 07/04/2026
- **Correção de bug de redirecionamento após login**:
  - `login()` retorna Promise que resolve após estado atualizado
  - `PublicRoute` redireciona usuários logados que acessam login/register
  - Helper `getRedirectPath(role)` centraliza lógica de redirecionamento

- **Tela de loading animada**:
  - Componente `DashboardLoading.js` com logo animado, spinner e dots pulsando
  - Aplicado em todos os dashboards

### 01/04/2026
- **Termos de Uso e Parceria** com captura de IP e timestamp
- **Fluxo de Redefinição de Senha** (forgot/reset com token 24h)
- **Sistema de Descoberta Inteligente por IA** (substituiu busca por palavra-chave):
  - Pré-filtro por orçamento e tipo antes de enviar à IA
  - Buscas salvas com re-execução automática via cron a cada 7 dias
  - Notificação por email ao corretor quando cron encontra novos matches
- **Refatoração backend para v2.0.0** (server.py 2531 linhas → arquitetura modular)

### 16/03/2026
- Validação de CRECI (API BuscaCRECI, rejeita PJ e inativos)
- Busca ignorando acentos

### 15/03/2026
- Formulário de interesse v3
- Modal de informações do imóvel ao dar match
- Agendamento de visitas
- SEO implementado
