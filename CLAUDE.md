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

**Backend** (`backend/.env`):
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
| `INTERNAL_API_KEY` | Protege o endpoint `/api/internal/process-saved-searches` — **obrigatório**; sem ele o endpoint rejeita todas as requisições |

**Frontend** (`frontend/.env`):
| Var | Uso |
|-----|-----|
| `REACT_APP_BACKEND_URL` | URL do backend (ex: `http://localhost:8001`) |

## Architecture

### Stack
- **Backend**: FastAPI + Motor (MongoDB async) + AsyncOpenAI (GPT-4o) + aiosmtplib
- **Frontend**: React 19 + React Router v7 + Tailwind + shadcn/ui + Framer Motion
- **Build**: craco (webpack com alias `@/` → `src/`)

### Backend — 5 routers em `/api`
- `auth_routes.py` — registro, login, reset de senha, validação CRECI (BuscaCRECI API)
- `agent_routes.py` — fluxo de descoberta 3 etapas, saved searches, criar match
- `buyer_routes.py` — CRUD de interesses, visualização de matches
- `curator_routes.py` — aprovação de matches, agendamento de visitas, follow-ups
- `admin_routes.py` — gestão de usuários, analytics, aprovação de CRECI

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

### Cron semanal
GitHub Actions (`.github/workflows/process-searches.yml`) toda segunda às 06h UTC chama `POST /api/internal/process-saved-searches` com header `X-Internal-Key`. Requer secrets `BACKEND_URL` e `INTERNAL_API_KEY` configurados no repositório GitHub.

### PWA
`frontend/public/`: `manifest.json` + `sw.js` (cache-first para assets, network-first para navegação, ignora `/api/`). Registro em `src/serviceWorkerRegistration.js` (produção apenas). Ícones necessários: `favicon.png` (64×64), `apple-touch-icon.png` (180×180), `logo192.png`, `logo512.png`.
