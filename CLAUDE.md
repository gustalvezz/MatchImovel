# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is MatchImovel

Plataforma imobiliária **invertida**: em vez de listar imóveis, exibe perfis de compradores para que corretores encontrem o match ideal. Quatro papéis: `buyer`, `agent`, `curator`, `admin`.

## Commands

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn start      # dev server (craco)
yarn build      # production build
yarn test       # test runner
```

### Tests
```bash
python backend_test.py   # na raiz do projeto
```

## Environment Variables

**Backend** (`backend/.env` e Vercel):
| Var | Uso |
|-----|-----|
| `MONGO_URL` | Connection string do MongoDB (Motor async) |
| `DB_NAME` | Nome do banco |
| `JWT_SECRET` | Assina tokens JWT (HS256, 7 dias) |
| `OPENAI_API_KEY` | GPT-4o — matching + extração de campos |
| `FRONTEND_URL` | Base URL do frontend (usada em links de email) |
| `CORS_ORIGINS` | Origins permitidas, separadas por vírgula |
| `SMTP_HOST/PORT/USER/PASSWORD` | Envio de email (opcional) |
| `SMTP_FROM_EMAIL/FROM_NAME` | Remetente dos emails |
| `INTERNAL_API_KEY` | Protege endpoints `/api/internal/*` — **obrigatório no Vercel e no GitHub Actions secret** |
| `ENVIRONMENT` | Se `production`, desabilita `/docs` e `/redoc` do FastAPI |
| `WHATSAPP_TOKEN` | Token da Meta Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número WhatsApp Business |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificação do webhook Meta |
| `WHATSAPP_ADMIN_PHONE` | Telefone do admin para alertas (opt-in) |

**Frontend** (`frontend/.env`):
| Var | Uso |
|-----|-----|
| `REACT_APP_BACKEND_URL` | URL do backend — em produção: `https://match-imovel-backend.vercel.app` |

**GitHub Actions secrets** (repositório):
| Secret | Uso |
|--------|-----|
| `REACT_APP_BACKEND_URL` | URL do backend para os crons |
| `INTERNAL_API_KEY` | Chave para autenticar nos endpoints `/api/internal/*` |
| `VERCEL_BYPASS_TOKEN` | Bypass do Vercel Deployment Protection para requisições programáticas |

## Architecture

### Stack
- **Backend**: FastAPI + Motor (MongoDB async) + AsyncOpenAI (GPT-4o) + aiosmtplib
- **Frontend**: React 19 + React Router v7 + Tailwind + shadcn/ui + Framer Motion
- **Build**: craco (webpack com alias `@/` → `src/`)
- **Deploy**: dois projetos Vercel separados — frontend e backend

### Backend — routers em `/api`
- `auth_routes.py` — registro, login, reset de senha, validação CRECI (BuscaCRECI API)
- `agent_routes.py` — fluxo de descoberta 3 etapas, saved searches, criar match
- `buyer_routes.py` — CRUD de interesses, visualização de matches
- `curator_routes.py` — aprovação de matches, agendamento de visitas, follow-ups
- `admin_routes.py` — gestão de usuários, analytics, aprovação de CRECI
- `whatsapp_routes.py` — webhook Meta Cloud API, 4 fluxos conversacionais (buyer, agent, match feedback, visit)

### Fluxo de descoberta (agent_routes.py — arquivo mais crítico, ~54KB)
1. **Analisar** (`POST /agents/analyze-property`): texto livre → GPT-4o extrai campos estruturados
2. **Buscar** (`POST /agents/ai-discovery`): campos estruturados + `property_data` → GPT-4o avalia compradores ativos → retorna scores
3. **Dar match** (`POST /agents/match`): cria `Match` com `property_info` e `ai_compatibility`; aguarda curadoria

O `property_data` (dict com campos do formulário) é salvo no documento `agent_searches` e repassado ao cron semanal para re-execução com mesma qualidade.

### AI (openai_service.py)
- `evaluate_buyers_with_openai(property_description, buyer_profiles, property_data=None)` — matching principal
- `_format_property_data(property_data, property_description)` — converte dict estruturado em texto para o prompt
- `extract_property_fields(description, property_type)` — extração de campos no passo 1
- Parâmetros: GPT-4o, temperature=0.3, max_tokens=4000
- Pré-filtro por tipo de imóvel e orçamento antes de chamar a IA

### Frontend — padrões importantes
- **AuthContext** (`src/context/AuthContext.js`): estado global de auth + configura header `Authorization` do axios globalmente
- **propertyFields.js** (`src/utils/propertyFields.js`): fonte única de verdade para campos de formulário por tipo de imóvel — `FIELDS_BY_TYPE`, `FIELD_META`, `FieldRenderer`, `normalizeExtracted`. Usado tanto no `AgentDashboard` quanto no `PropertyInfoModal`
- **AppLogo** (`src/components/AppLogo.js`): componente único de logo — usa `/favicon.png`. Para fundo escuro usar `className="... brightness-0 invert"`
- Tipos de imóvel suportados: `apartamento`, `casa`, `terreno`, `comercial`, `cobertura`, `kitnet`

### Segurança (backend/server.py)
`SecurityHeadersMiddleware` adicionado — aplica em todas as respostas da API:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Resource-Policy: cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'none'`
- `Strict-Transport-Security` (apenas HTTPS)

Frontend (`frontend/vercel.json`) tem os mesmos headers + CSP em `Content-Security-Policy-Report-Only` (modo observação — mudar key para `Content-Security-Policy` quando quiser ativar modo bloqueante).

### Crons (GitHub Actions)
| Workflow | Horário | Endpoint | O que faz |
|---|---|---|---|
| `process-searches.yml` | Segunda 12h Brasília (15h UTC) | `POST /api/internal/process-saved-searches` | Reprocessa buscas salvas ativas, envia resultados por email |
| `send-visit-reminders.yml` | A cada 30 min | `POST /api/internal/send-visit-reminders` | Envia lembrete 2h antes de visitas (apenas 07h–21h Brasília) |
| `weekly-uncovered-summary.yml` | Sexta 12h Brasília (15h UTC) | `POST /api/internal/uncovered-interests-weekly` | Resume compradores não cobertos por nenhuma busca |
| `daily-summary.yml` | Diário 08h Brasília (11h UTC) | `POST /api/internal/daily-summary` | Email para admins com tudo novo nas últimas 24h (interesses, compradores, buscas); envia mesmo quando não há nada novo |

Todos os workflows usam os secrets `REACT_APP_BACKEND_URL`, `INTERNAL_API_KEY` e `VERCEL_BYPASS_TOKEN`.  

**Notificação imediata de novo interesse:** ao cadastrar um interesse (qualquer origem — formulário web v3/v2, comprador autenticado, ou WhatsApp), `_notify_admins_new_interest` em `buyer_routes.py` envia email na hora para todos os usuários com `role: admin` (função `send_new_interest_admin_notification` em `email_service.py`).
O endpoint `/api/internal/send-visit-reminders` tem janela de silêncio: retorna `{"status": "skipped"}` fora das 07h–21h Brasília.

### WhatsApp (whatsapp_routes.py + whatsapp_service.py)
- Webhook: `GET/POST /api/webhooks/whatsapp`
- 4 fluxos: Flow A (captação comprador), Flow B (feedback pós-match), Flow C (corretor cadastra imóvel), Flow V (gerenciamento de visita)
- Sessões salvas em `db.whatsapp_sessions` com TTL de 24h
- 17 templates Meta aprovados necessários — guia completo em `docs/WHATSAPP_TEMPLATES.md`
- Setup externo pendente: conta Meta Business verificada, número aprovado, webhook registrado na Meta, templates criados

### PWA
`frontend/public/`: `manifest.json` + `sw.js` (cache-first para assets, network-first para navegação, ignora `/api/`). Registro em `src/serviceWorkerRegistration.js` (produção apenas). Ícones: `favicon.png` (64×64), `apple-touch-icon.png` (180×180), `logo192.png`, `logo512.png`.

## Backlog atual
Ver `memory/PRD.md` — seção "Backlog / Tarefas Futuras" para itens pendentes atualizados.

**P2 (próximas prioridades):**
- Exportação CSV de leads para email marketing
- Histórico de visitas no dashboard do curador
- Analytics expandido para performance individual de curadores
