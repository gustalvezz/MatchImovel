# MatchImovel

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</p>

## Sobre o Projeto

**MatchImovel** é uma plataforma imobiliária inovadora que inverte o modelo tradicional do mercado. Em vez de listar imóveis à venda, a plataforma exibe **compradores interessados** para que corretores possam encontrar o "match" perfeito para seus imóveis.

### Conceito Principal

1. **Compradores** registram seus interesses de compra com características detalhadas
2. **Corretores** buscam compradores compatíveis com imóveis que estão vendendo
3. **Curadores** (equipe da plataforma) aprovam os matches e intermediam toda a comunicação
4. **Admin** gerencia usuários, curadores e monitora a plataforma

---

## Arquitetura

```
/app
├── backend/                    # API FastAPI
│   ├── .env                    # Variáveis de ambiente
│   ├── .env.example            # Template de configuração
│   ├── requirements.txt        # Dependências Python
│   └── server.py               # Servidor principal
│
├── frontend/                   # Aplicação React
│   ├── .env                    # Variáveis de ambiente
│   ├── .env.example            # Template de configuração
│   ├── package.json            # Dependências Node.js
│   ├── public/                 # Assets estáticos
│   └── src/
│       ├── components/         # Componentes reutilizáveis
│       │   ├── ui/             # Componentes Shadcn UI
│       │   ├── AnalyticsDashboard.js
│       │   ├── CreateCuratorModal.js
│       │   ├── CreateInterestModal.js
│       │   ├── DeleteConfirmModal.js
│       │   ├── EditInterestModal.js
│       │   └── MatchFollowUp.js
│       ├── context/
│       │   └── AuthContext.js  # Contexto de autenticação
│       └── pages/
│           ├── AdminDashboard.js
│           ├── AdminLogin.js
│           ├── AgentDashboard.js
│           ├── BuyerDashboard.js
│           ├── CompleteRegistration.js
│           ├── LandingPage.js
│           ├── LoginPage.js
│           └── RegisterPage.js
│
└── memory/
    └── PRD.md                  # Documentação do produto
```

---

## Funcionalidades

### Para Compradores
- ✅ Registro e login seguro
- ✅ Cadastro de interesses de compra com detalhes completos
- ✅ Edição e exclusão de interesses (com motivo obrigatório)
- ✅ Visualização de matches aprovados
- ✅ Auto-refresh do dashboard

### Para Corretores
- ✅ Busca de compradores por interesse
- ✅ Criação de matches com compradores
- ✅ Visualização do status dos matches
- ✅ Exclusão de matches (com motivo obrigatório)

### Para Curadores
- ✅ Aprovação/rejeição de matches pendentes
- ✅ Sistema CRM com follow-ups
- ✅ Visualização de matches que curou
- ✅ Registro de contatos com corretores e compradores

### Para Administradores
- ✅ Dashboard completo de Analytics
- ✅ Gerenciamento de usuários (compradores, corretores, curadores)
- ✅ Criação de novos curadores via email
- ✅ Visualização de todos os matches e interesses
- ✅ Métricas de performance por curador e corretor
- ✅ Distribuição por tipo de imóvel e localização

---

## Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web Python de alta performance
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver async para MongoDB
- **PyJWT** - Autenticação JWT
- **bcrypt** - Hash de senhas
- **aiosmtplib** - Envio de emails assíncrono

### Frontend
- **React 18** - Biblioteca UI
- **React Router** - Roteamento SPA
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilização utility-first
- **Shadcn/UI** - Componentes de interface
- **Framer Motion** - Animações
- **Lucide React** - Ícones

---

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- MongoDB 6+

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar servidor
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend

# Instalar dependências
yarn install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com a URL do backend

# Iniciar aplicação
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
| `FRONTEND_URL` | URL do frontend | ✅ |
| `CORS_ORIGINS` | Origens CORS permitidas | ✅ |
| `SMTP_HOST` | Servidor SMTP | ❌ |
| `SMTP_PORT` | Porta SMTP | ❌ |
| `SMTP_USER` | Usuário SMTP | ❌ |
| `SMTP_PASSWORD` | Senha SMTP | ❌ |
| `SMTP_FROM_EMAIL` | Email remetente | ❌ |
| `SMTP_FROM_NAME` | Nome remetente | ❌ |
| `EMERGENT_LLM_KEY` | Chave para IA (opcional) | ❌ |

### Frontend (.env)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `REACT_APP_BACKEND_URL` | URL da API backend | ✅ |

---

## API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registro de usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/complete-curator-registration` | Finalizar registro de curador |

### Compradores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/buyers/interests` | Criar interesse |
| GET | `/api/buyers/my-interests` | Listar meus interesses |
| PUT | `/api/buyers/interests/{id}` | Editar interesse |
| DELETE | `/api/buyers/interests/{id}` | Excluir interesse |
| GET | `/api/buyers/my-matches` | Listar meus matches |

### Corretores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/agents/buyers` | Buscar compradores |
| POST | `/api/agents/match` | Criar match |
| GET | `/api/agents/my-matches` | Listar meus matches |
| DELETE | `/api/agents/match/{id}` | Excluir match |

### Curadoria
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/curator/pending-matches` | Matches pendentes |
| POST | `/api/curator/curate/{id}` | Aprovar/rejeitar match |

### Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/stats` | Estatísticas gerais |
| GET | `/api/admin/analytics` | Dashboard completo |
| GET | `/api/admin/buyers` | Listar compradores |
| GET | `/api/admin/agents` | Listar corretores |
| GET | `/api/admin/interests` | Listar interesses |
| GET | `/api/admin/matches` | Listar matches |
| GET | `/api/admin/curators` | Listar curadores |
| POST | `/api/admin/create-curator` | Criar curador |

### Follow-ups (CRM)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/matches/{id}/followup` | Criar follow-up |
| GET | `/api/matches/{id}/followups` | Listar follow-ups |

---

## Modelos de Dados

### User
```json
{
  "id": "uuid",
  "email": "string",
  "password": "hashed",
  "role": "buyer | agent | curator | admin",
  "name": "string",
  "phone": "string",
  "created_at": "datetime"
}
```

### BuyerInterest
```json
{
  "id": "uuid",
  "buyer_id": "uuid",
  "property_type": "string",
  "location": "string",
  "neighborhoods": ["array"],
  "min_price": "number",
  "max_price": "number",
  "bedrooms": "number",
  "bathrooms": "number",
  "parking_spaces": "number",
  "features": ["array"],
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
  "status": "pending_approval | approved | rejected",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### FollowUp
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "curator_id": "uuid",
  "content": "string",
  "contact_type": "corretor | comprador",
  "created_at": "datetime"
}
```

---

## Fluxo de Uso

```
Comprador registra interesse
         ↓
Corretor busca compradores
         ↓
Corretor cria match
         ↓
    Curador analisa
      ↓       ↓
  Aprova   Rejeita
     ↓
Match visível para curador
         ↓
Curador contata corretor
         ↓
Curador avalia imóvel
         ↓
Curador contata comprador
         ↓
Agendamento de visita
```

---

## Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ Autenticação via JWT com expiração de 7 dias
- ✅ CORS configurável por ambiente
- ✅ Variáveis sensíveis em arquivos .env
- ✅ Validação de inputs com Pydantic
- ✅ Proteção de rotas por role

---

## Deploy em Produção

### Checklist

1. **Backend**
   - [ ] Alterar `JWT_SECRET` para uma chave segura
   - [ ] Configurar `MONGO_URL` com autenticação
   - [ ] Configurar `CORS_ORIGINS` com domínios específicos
   - [ ] Configurar `FRONTEND_URL` com URL de produção
   - [ ] Configurar SMTP para envio de emails

2. **Frontend**
   - [ ] Configurar `REACT_APP_BACKEND_URL` com URL da API

3. **Infraestrutura**
   - [ ] Configurar HTTPS/SSL
   - [ ] Configurar DNS
   - [ ] Configurar backups do MongoDB

---

## Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## Licença

Este projeto está sob licença privada. Todos os direitos reservados.

---

## Contato

**MatchImovel** - [matchimovel@matchimovel.com.br](mailto:matchimovel@matchimovel.com.br)

---

<p align="center">
  Desenvolvido com ❤️ pela equipe MatchImovel
</p>
