# MatchImovel

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</p>

## Sobre o Projeto

**MatchImovel** é uma plataforma imobiliária que inverte o modelo tradicional do mercado. Em vez de listar imóveis à venda, a plataforma exibe **compradores interessados** para que corretores possam encontrar o match perfeito para seus imóveis usando inteligência artificial.

### Conceito Principal

1. **Compradores** registram seus interesses de compra com perfil detalhado (quem são, como vivem, o que buscam)
2. **Corretores** descrevem imóveis e a IA cruza com os perfis de compradores cadastrados
3. **Curadores** (equipe da plataforma) aprovam os matches e intermediam toda a comunicação
4. **Admin** gerencia usuários, curadores e monitora a plataforma

---

## Arquitetura

```
/
├── backend/                        # API FastAPI
│   ├── config.py                   # Configurações e variáveis de ambiente
│   ├── database.py                 # Conexão MongoDB (Motor async)
│   ├── auth.py                     # Lógica JWT
│   ├── server.py                   # Entry point + middleware CORS
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py              # Modelos Pydantic
│   ├── routes/
│   │   ├── auth_routes.py          # Autenticação e recuperação de senha
│   │   ├── buyer_routes.py         # Interesses dos compradores + IA de perfil
│   │   ├── agent_routes.py         # Busca IA, matches, buscas salvas
│   │   ├── curator_routes.py       # Curadoria, follow-ups, visitas
│   │   └── admin_routes.py         # Gestão de usuários e analytics
│   └── services/
│       ├── email_service.py        # Templates e envio de emails (SMTP)
│       └── openai_service.py       # Integração GPT-4o para matching
│
└── frontend/                       # Aplicação React
    ├── public/
    │   └── index.html              # SEO, Open Graph, JSON-LD
    └── src/
        ├── context/
        │   └── AuthContext.js      # Autenticação JWT + axios global
        ├── components/
        │   ├── ui/                 # Componentes Shadcn UI
        │   ├── AnalyticsDashboard.js
        │   ├── CreateCuratorModal.js
        │   ├── DashboardLoading.js
        │   ├── DeleteConfirmModal.js
        │   ├── InterestFormModal.js
        │   ├── MatchFollowUp.js
        │   └── PropertyInfoModal.js
        └── pages/
            ├── AdminDashboard.js
            ├── AdminLogin.js
            ├── AgentDashboard.js
            ├── BuyerDashboard.js
            ├── CompleteRegistration.js
            ├── CuratorDashboard.js
            ├── ForgotPasswordPage.js
            ├── LandingPage.js
            ├── LoginPage.js
            ├── RegisterPage.js
            └── ResetPasswordPage.js
```

---

## Funcionalidades

### Para Compradores
- ✅ Registro e login seguro com validação de CRECI opcional
- ✅ Formulário de interesse em blocos: perfil pessoal, o que busca, como deve ser, como vive, deal breakers e entorno
- ✅ Interpretação automática do perfil por GPT-4o (`perfil_narrativo`, `pontos_decisivos`, `perfil_do_imovel_ideal`)
- ✅ Edição e exclusão de interesses (com motivo obrigatório)
- ✅ Visualização de matches aprovados com detalhes do imóvel

### Para Corretores
- ✅ Busca inteligente de compradores por IA: corretor descreve o imóvel, GPT-4o retorna score de compatibilidade por perfil
- ✅ Pré-filtro automático por tipo de imóvel e faixa de orçamento antes de enviar à IA
- ✅ Buscas salvas com re-execução automática a cada 7 dias via cron
- ✅ Notificação por email quando novos matches são encontrados automaticamente
- ✅ Cadastro de imóvel em 2 etapas: descrição livre → IA extrai campos estruturados por tipo de imóvel
- ✅ Formulário dinâmico por tipo (apartamento, casa, casa de condomínio, terreno, studio/loft, sala comercial)
- ✅ Visualização do status dos matches (em análise, aprovado, visita agendada)

### Para Curadores
- ✅ Fila de matches pendentes com perfil completo do comprador e dados do imóvel
- ✅ Aprovação/rejeição de matches com justificativa
- ✅ Sistema CRM: registro de follow-ups com corretor e comprador
- ✅ Agendamento de visitas com data, hora e endereço
- ✅ Marcação de imóvel como vendido

### Para Administradores
- ✅ Dashboard de analytics: funil de conversão, matches por status, distribuição por tipo e localização
- ✅ Gerenciamento completo de compradores, corretores e curadores
- ✅ Verificação e bloqueio de CRECI de corretores
- ✅ Criação de novos curadores via convite por email
- ✅ Exclusão de interesses com auditoria

---

## Tecnologias Utilizadas

### Backend
- **FastAPI** — Framework web Python de alta performance
- **MongoDB + Motor** — Banco NoSQL com driver async
- **PyJWT + bcrypt** — Autenticação e hash de senhas
- **OpenAI GPT-4o** — Matching de perfis e extração de campos de imóveis
- **aiosmtplib** — Envio de emails assíncrono com templates HTML

### Frontend
- **React 18** — Biblioteca UI
- **React Router** — Roteamento SPA
- **Axios** — Cliente HTTP
- **Tailwind CSS + Shadcn/UI** — Estilização e componentes
- **Framer Motion** — Animações
- **Lucide React** — Ícones

---

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- MongoDB 6+
- Chave de API OpenAI (GPT-4o)

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt

cp .env.example .env
# Editar .env com suas configurações

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend

yarn install

cp .env.example .env
# Editar .env com a URL do backend

yarn start
```

---

## Variáveis de Ambiente

### Backend (.env)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `MONGO_URL` | URL de conexão MongoDB | ✅ |
| `DB_NAME` | Nome do banco de dados | ✅ |
| `JWT_SECRET` | Chave secreta para JWT | ✅ |
| `FRONTEND_URL` | URL do frontend (usada em links de email) | ✅ |
| `CORS_ORIGINS` | Origens CORS permitidas (separadas por vírgula) | ✅ |
| `OPENAI_API_KEY` | Chave da API OpenAI (GPT-4o) | ✅ |
| `SMTP_HOST` | Servidor SMTP | ❌ |
| `SMTP_PORT` | Porta SMTP | ❌ |
| `SMTP_USER` | Usuário SMTP | ❌ |
| `SMTP_PASSWORD` | Senha SMTP | ❌ |
| `SMTP_FROM_EMAIL` | Email remetente | ❌ |
| `SMTP_FROM_NAME` | Nome remetente | ❌ |

### Frontend (.env)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `REACT_APP_BACKEND_URL` | URL base da API backend | ✅ |

---

## API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/validate-creci` | Validar CRECI do corretor |
| POST | `/api/auth/register` | Registro de usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/complete-curator-registration` | Finalizar registro de curador |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha |
| POST | `/api/auth/reset-password` | Redefinir senha |
| GET | `/api/auth/verify-reset-token/{token}` | Verificar token de reset |

### Compradores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/buyers/interests` | Criar interesse (fluxo legado) |
| POST | `/api/interests/create-full` | Criar interesse com perfil completo |
| POST | `/api/interests/create-full-v2` | Criar interesse (v2 com AI assíncrono) |
| GET | `/api/buyers/my-interests` | Listar meus interesses |
| DELETE | `/api/buyers/interests/{id}` | Excluir interesse |
| GET | `/api/buyers/my-matches` | Listar meus matches |

### Corretores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/agents/buyers` | Listar compradores ativos |
| GET | `/api/agents/smart-search` | Busca textual por localização |
| POST | `/api/agents/analyze-property` | Extrair campos do imóvel via IA |
| POST | `/api/agents/ai-discovery` | Buscar compradores compatíveis via GPT-4o |
| GET | `/api/agents/searches` | Listar buscas salvas |
| PATCH | `/api/agents/searches/{id}` | Desativar busca salva |
| PATCH | `/api/agents/searches/{id}/mark-seen` | Marcar resultados como vistos |
| PATCH | `/api/agents/searches/{id}/remove-result/{interest_id}` | Remover resultado de busca |
| POST | `/api/agents/match` | Criar match com dados do imóvel |
| GET | `/api/agents/my-matches` | Listar meus matches |
| DELETE | `/api/agents/match/{id}` | Excluir match |

### Curadoria
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/curator/pending-matches` | Matches pendentes de curadoria |
| POST | `/api/curator/matches/{id}/decision` | Aprovar ou rejeitar match |
| GET | `/api/curator/my-matches` | Matches curados por mim |
| POST | `/api/curator/schedule-visit/{id}` | Agendar visita |
| GET | `/api/curator/visits/{id}` | Listar visitas do match |
| DELETE | `/api/curator/visits/{id}` | Cancelar visita |
| PATCH | `/api/curator/matches/{id}/sold` | Marcar como vendido |
| POST | `/api/matches/{id}/followup` | Registrar follow-up |
| GET | `/api/matches/{id}/followups` | Listar follow-ups |

### Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/stats` | Estatísticas gerais |
| GET | `/api/admin/analytics` | Dashboard completo de analytics |
| GET | `/api/admin/buyers` | Listar compradores |
| GET | `/api/admin/agents` | Listar corretores |
| POST | `/api/admin/agents/{id}/verify-creci` | Verificar CRECI |
| POST | `/api/admin/agents/{id}/block-creci` | Bloquear CRECI |
| PUT | `/api/admin/agents/{id}/creci-status` | Atualizar status CRECI |
| GET | `/api/admin/interests` | Listar interesses |
| DELETE | `/api/admin/interests/{id}` | Excluir interesse |
| GET | `/api/admin/matches` | Listar todos os matches |
| GET | `/api/admin/curators` | Listar curadores |
| POST | `/api/admin/create-curator` | Criar curador via email |

### Interno (cron)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/internal/process-saved-searches` | Re-executar buscas salvas ativas |

---

## Modelos de Dados Principais

### BuyerInterest
```json
{
  "id": "uuid",
  "buyer_id": "uuid",
  "property_type": "apartamento | casa | casa_condominio | terreno | studio_loft | sala_comercial",
  "location": "string",
  "budget_range": "string",
  "min_price": "number",
  "max_price": "number",
  "bedrooms": "number",
  "payment_method": ["À vista", "Financiamento", "FGTS"],
  "indispensable": ["array de critérios inegociáveis"],
  "deal_breakers": ["array de itens rejeitados"],
  "profile_type": "string",
  "has_pets": "boolean",
  "floor_preference": "string",
  "space_size": "string",
  "property_condition": ["array"],
  "daily_routine": ["array"],
  "transportation": ["array"],
  "proximity_needs": ["array"],
  "ai_profile": "string (badge gerado por GPT-4o)",
  "interpretacaoIA": {
    "perfil_narrativo": "string",
    "pontos_decisivos": ["array"],
    "perfil_do_imovel_ideal": "string"
  },
  "status": "active | matched | inactive",
  "created_at": "datetime"
}
```

### Match
```json
{
  "id": "uuid",
  "buyer_id": "uuid",
  "agent_id": "uuid",
  "interest_id": "uuid",
  "curator_id": "uuid",
  "status": "pending_approval | pending_info | approved | rejected | visit_scheduled | completed",
  "property_info": {
    "property_type": "string",
    "original_description": "string",
    "ai_summary": "string",
    "location": "string",
    "address": "string",
    "price": "number",
    "bedrooms": "number",
    "suites": "number",
    "bathrooms": "number",
    "parking_spots": "number",
    "area_m2": "number",
    "condition": "string",
    "furnished": "string",
    "style": "string",
    "accepts_financing": "boolean",
    "accepts_exchange": "boolean | string",
    "condo_fee": "number",
    "iptu": "number",
    "link": "string"
  },
  "ai_compatibility": {
    "score": "number (0-100)",
    "justificativa": "string"
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### AgentSearch (busca salva)
```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "property_type": "string",
  "property_price": "number",
  "property_description": "string",
  "status": "active | inactive",
  "has_new_results": "boolean",
  "pending_results": ["array de BuyerMatch"],
  "last_checked_at": "datetime",
  "last_match_found_at": "datetime",
  "days_until_auto_deactivation": "number"
}
```

---

## Fluxo Principal

```
Comprador registra interesse (formulário em blocos)
              ↓
     GPT-4o gera perfil do comprador
              ↓
Corretor descreve imóvel → IA extrai campos estruturados
              ↓
  Corretor busca compradores compatíveis via IA
  (pré-filtro por tipo/orçamento + score GPT-4o)
              ↓
       Corretor cria match
              ↓
       Curador analisa
         ↓       ↓
     Aprova   Rejeita
         ↓
  Curador contata corretor e comprador
         ↓
  Agendamento de visita
         ↓
    Imóvel vendido
```

---

## Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ Autenticação via JWT com expiração de 7 dias
- ✅ CORS configurável por ambiente
- ✅ Variáveis sensíveis em arquivos .env
- ✅ Validação de inputs com Pydantic
- ✅ Proteção de rotas por role (buyer, agent, curator, admin)

---

## Deploy em Produção

### Checklist

1. **Backend**
   - [ ] Definir `JWT_SECRET` como chave segura aleatória
   - [ ] Configurar `MONGO_URL` com autenticação
   - [ ] Definir `CORS_ORIGINS` com os domínios do frontend
   - [ ] Definir `FRONTEND_URL` com a URL de produção
   - [ ] Configurar `OPENAI_API_KEY`
   - [ ] Configurar SMTP para envio de emails
   - [ ] Configurar cron para `POST /api/internal/process-saved-searches` (recomendado: diário)

2. **Frontend**
   - [ ] Definir `REACT_APP_BACKEND_URL` com a URL da API

3. **Infraestrutura**
   - [ ] HTTPS/SSL configurado
   - [ ] DNS apontando para os serviços
   - [ ] Backups automáticos do MongoDB

---

## Licença

Este projeto está sob licença privada. Todos os direitos reservados.

---

## Contato

**MatchImovel** — [matchimovel@matchimovel.com.br](mailto:matchimovel@matchimovel.com.br) — [matchimovel.com.br](https://matchimovel.com.br)
