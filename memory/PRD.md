# MatchImovel - PRD (Product Requirements Document)

## Visão Geral
Plataforma imobiliária que conecta compradores interessados a corretores através de um sistema de curadoria profissional. O diferencial é que os compradores cadastram seu interesse e os corretores os encontram, invertendo o modelo tradicional.

## Usuários e Papéis
1. **Comprador**: Cadastra interesse em comprar imóvel através de formulário detalhado
2. **Corretor/Agent**: Busca compradores compatíveis e dá "match" com informações do imóvel
3. **Curador**: Aprova/rejeita matches e agenda visitas, intermediando a comunicação
4. **Admin**: Gerencia usuários, curadores e visualiza analytics

## Fluxo Principal
1. Comprador se registra → Preenche formulário de interesse (10 telas) → Recebe email de confirmação
2. IA gera perfil do comprador baseado nas respostas
3. Corretor busca compradores → Dá match com informações do imóvel (modal obrigatório)
4. Curador avalia o match → Aprova/Rejeita → Emails enviados ao comprador e corretor
5. Curador agenda visita → Notificações por email enviadas
6. Processo de intermediação até fechamento

---

## Funcionalidades Implementadas

### Autenticação e Usuários
- [x] Registro de compradores com telefone obrigatório (máscara aplicada)
- [x] Login JWT para todos os papéis
- [x] Admin login separado (/admin/login)
- [x] Curador login via área admin
- [x] **Validação de CRECI para corretores** (via API BuscaCRECI)

### Validação de CRECI - Implementado 16/03/2026
- [x] Campo UF (dropdown com todos estados, SP como padrão)
- [x] Campo número CRECI (ex: 123456-F)
- [x] Botão "Validar CRECI" com loading (até 30s)
- [x] Rejeita CRECI com sufixo J (apenas PF aceito)
- [x] Rejeita CRECI com situação diferente de "Ativo"
- [x] Feedback visual (borda verde/vermelha, ícones, mensagens)
- [x] Salva creci_completo retornado pela API no banco

### Formulário de Interesse (v3)
- [x] **Tela 1**: Perfil (5 opções incluindo "Quero sair do aluguel")
- [x] **Tela 2**: Urgência (3, 12 meses ou sem prazo)
- [x] **Tela 3**: Localização (campo livre)
- [x] **Tela 4**: Orçamento (6 faixas até "Acima de 1,5 milhão")
- [x] **Tela 5**: Tipo de imóvel (8 opções: Apartamento, Casa, Terreno, etc.)
- [x] **Tela 6**: Indispensável (múltipla seleção com novas opções)
- [x] **Tela 7**: Ambiente ideal (5 opções atualizadas)
- [x] **Tela 8**: O que incomoda (1-3 seleções)
- [x] **Tela 9**: Proximidade necessária (inclui "Tanto faz")
- [x] **Tela 10**: Informações extras + Termos de Uso + Finalizar

### Dashboard do Corretor
- [x] Listagem de compradores com perfil IA
- [x] **Busca inteligente ignorando acentos** (sao paulo → São Paulo)
- [x] Modal de match com informações do imóvel (descrição obrigatória)
- [x] Aba "Meus Matches" com coração vermelho e borda colorida
- [x] Status do match (Em Análise, Aprovado, Visita Agendada, etc.)
- [x] Modal de exclusão com 3 opções + descrição obrigatória

### Dashboard do Curador
- [x] Aba "Pendentes" para avaliar matches
- [x] Aba "Meus Matches" com matches aprovados
- [x] Exibição de informações do imóvel cadastradas pelo corretor
- [x] Telefone do comprador e corretor com link WhatsApp
- [x] Botão "Agendar Visita" com formulário de data/hora
- [x] Follow-ups (CRM) para acompanhamento

### Dashboard do Admin
- [x] Gestão de usuários
- [x] Criação de curadores com envio de email
- [x] Analytics com métricas da plataforma
- [x] Visualização de todos os matches

### Sistema de Notificações por Email
- [x] Email ao comprador: Interesse cadastrado (com próximos passos)
- [x] Email ao comprador: Match aprovado ("Wohoo!")
- [x] Email ao corretor: Match aprovado
- [x] Email ao curador: Interesse/Match excluído (com motivo)
- [x] Email ao agendar visita (comprador e corretor)
- [x] Endpoint para lembrete 2h antes da visita

### Modais de Exclusão
**Exclusão de Interesse (Comprador):**
- Opções: "Já comprei", "Mudei de planos", "Não tenho mais interesse", "Outro"
- Descrição obrigatória apenas para "Outro"

**Exclusão de Match (Corretor):**
- Opções: "Imóvel vendeu", "Proprietário desistiu", "Outro"
- Descrição SEMPRE obrigatória

### SEO e Landing Page
- [x] Meta tags, Open Graph, Twitter Cards
- [x] JSON-LD structured data
- [x] Menu sticky com anchor links

---

## Stack Técnica
- **Frontend**: React.js, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI (Python) - Modularizado
- **Database**: MongoDB
- **AI**: OpenAI via emergentintegrations (Emergent LLM Key)
- **Email**: SMTP (Hostgator) via aiosmtplib
- **CRECI**: API BuscaCRECI (https://api.buscacreci.com.br)

### Arquitetura Backend (v2.0.0)
```
/app/backend/
├── server.py          # Entry point (50 linhas)
├── config.py          # Configurações env vars
├── database.py        # Conexão MongoDB
├── auth.py            # JWT e passwords
├── models/
│   └── schemas.py     # Pydantic models
├── services/
│   └── email_service.py  # Funções de email
└── routes/
    ├── auth_routes.py    # Login, registro, CRECI
    ├── buyer_routes.py   # Endpoints compradores
    ├── agent_routes.py   # Endpoints corretores
    ├── curator_routes.py # Endpoints curadores
    └── admin_routes.py   # Endpoints admin
```

## Credenciais de Teste
- **Admin**: admin@matchimob.com / admin123
- **URL Admin**: /admin/login

---

## Backlog / Tarefas Futuras

### P1 - Alta Prioridade
- [ ] Configurar cron job para lembretes de visita 2h antes
- [x] ~~Refatorar server.py em módulos (routes, models, services)~~ **CONCLUÍDO 01/04/2026**

### P2 - Média Prioridade
- [ ] Analytics expandido para performance de curadores
- [ ] Histórico de visitas no dashboard do curador

### P3 - Baixa Prioridade
- [ ] Seção FAQ na landing page
- [ ] Notificações push (web push)

---

## Changelog

### 08/04/2026
- **Setup de Cron Externo para Lembretes de Visita**:
  - Endpoint: `POST /api/internal/send-visit-reminders`
  - Segurança: Validação via header `X-Internal-Key` (configurado em `INTERNAL_API_KEY` no `.env`)
  - Funcionalidade: Envia email de lembrete 2h antes da visita para comprador e corretor
  - Logging detalhado: visits_checked, reminders_sent, errors
  - Documentação completa em `/app/docs/CRON_SETUP.md` com exemplos para:
    - cron-job.org (gratuito)
    - EasyCron
    - AWS EventBridge + Lambda
    - Google Cloud Scheduler
    - Servidor Linux com crontab

### 07/04/2026
- **Correção do Bug de Redirecionamento Após Login**:
  - Problema: Usuário era redirecionado para `/` ao invés do dashboard após login
  - Causa: Race condition entre `login()` e `navigate()` - o estado do React não atualizava a tempo
  - Solução: 
    - `AuthContext.js`: `login()` agora retorna uma Promise que resolve após o estado ser atualizado
    - `LoginPage.js`: Usa `await login()` antes de chamar `navigate()`
    - `App.js`: Adicionado `PublicRoute` para redirecionar usuários já logados que tentam acessar login/register
    - `ProtectedRoute` agora redireciona para o dashboard correto baseado no role (em vez de `/`)
  - Helper `getRedirectPath(role)` centraliza a lógica de redirecionamento

- **Tela de Loading Animada**:
  - Criado componente `DashboardLoading.js` com:
    - Logo MatchImovel animado
    - Spinner circular com animação de rotação
    - Mensagem de loading contextual
    - Dots animados pulsando
  - Aplicado em todos os dashboards: Buyer, Agent, Curator, Admin
  - Substitui a tela branca/texto simples "Carregando..."

### 01/04/2026
- **Termos de Uso para Compradores**:
  - Checkbox obrigatório na última tela do formulário de interesse (Step 10)
  - Modal com texto legal completo ao clicar em "li e aceito..."
  - Backend captura e salva: `terms_accepted` (bool), `terms_accepted_at` (timestamp), `terms_accepted_ip` (IP do cliente)
  - Endpoint `/api/interests/create-full` atualizado com `Request` para capturar IP
  - Schema `FullInterestCreate` atualizado com campos de termos
  - **Compliance no Admin Dashboard**: Card de interesse exibe seção verde "Termos de Uso Aceitos" com data/hora e IP registrados

- **Termo de Parceria para Corretores**:
  - Checkbox obrigatório na tela de cadastro de corretor (`RegisterPage.js`)
  - Modal com texto legal completo do Termo de Parceria e Credenciamento
  - CRECI do corretor exibido dinamicamente no texto do termo
  - Backend captura e salva: `terms_accepted`, `terms_accepted_at`, `terms_accepted_ip` no perfil do corretor (collection `agents`)
  - Schema `UserRegister` atualizado com campos de termos
  - Endpoint `/api/auth/register` atualizado com `Request` para capturar IP
  - **Compliance no Admin Dashboard**: Card do corretor exibe seção verde "Termo de Parceria Aceito" com data/hora e IP

- **Fluxo de Redefinição de Senha**:
  - `POST /api/auth/forgot-password` - Solicita reset (envia email com link)
  - `POST /api/auth/reset-password` - Redefine senha com token
  - `GET /api/auth/verify-reset-token/{token}` - Valida token
  - Token válido por 24 horas
  - Email de confirmação quando senha é alterada
  - Páginas: `/forgot-password` e `/reset-password?token=xxx`
  - Link "Esqueceu sua senha?" na página de login

- **Sistema de Descoberta Inteligente por IA (Claude)**:
  - Substituiu busca por palavra-chave por matching inteligente
  - Corretor descreve o imóvel em texto livre
  - IA (Claude Sonnet via Emergent LLM Key) avalia compatibilidade com cada comprador
  - Retorna compradores com score > 50% ordenados por compatibilidade
  - Justificativa em linguagem natural citando elementos específicos
  - Badge visual de score (verde 80+, amarelo 60-79)
  - Modal de "Dar Match" existente mantido intacto
  - Novo endpoint: `POST /api/agents/ai-discovery`
  - **Pré-filtro para economia de tokens**:
    - Filtro por orçamento: elimina compradores com max_price < 75% do valor do imóvel
    - Filtro por tipo: elimina compradores que buscam tipo incompatível (apartamento vs casa vs terreno vs comercial)
    - Campos opcionais no frontend: "Valor do Imóvel" e "Tipo do Imóvel"
    - Logging de métricas: total disponíveis → filtrados por orçamento → filtrados por tipo → enviados para IA
    - Response inclui: `total_before_prefilter`, `filtered_by_budget`, `filtered_by_type`, `sent_to_ai`

- **Refatoração completa do backend (v2.0.0)**:
  - server.py (2531 linhas) dividido em 11 arquivos modulares
  - Separação em: config, database, auth, models, services, routes
  - Cada arquivo com responsabilidade única
  - Facilita manutenção e reduz custo de tokens em updates
  - Todos endpoints funcionando após refatoração

### 16/03/2026 (Tarde)
- Implementada validação de CRECI para corretores:
  - Integração com API BuscaCRECI
  - Campos UF e número CRECI no formulário
  - Rejeita CRECI de PJ (sufixo J) e inativos
  - Loading visual durante validação
  - Salva creci_completo no banco
- Corrigida busca de interesses para ignorar acentos
  - "sao paulo" agora encontra "São Paulo"

### 16/03/2026 (Manhã)
- Modais de exclusão atualizados
- Sistema completo de notificações por email

### 15/03/2026
- Reformulação completa do formulário de interesse (v3)
- Modal de informações do imóvel ao dar match
- Coração vermelho no card de matches
- Agendamento de visitas
- SEO implementado
