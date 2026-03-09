# MatchImovel - PRD (Product Requirements Document)

## Problema Original
Construir uma plataforma imobiliária chamada "MatchImovel" que inverte o modelo tradicional: em vez de listar imóveis à venda, exibe compradores interessados. Corretores encontram "matches" com compradores, e curadores da plataforma intermediam toda a comunicação.

## Personas
1. **Compradores**: Registram interesse em imóveis com características específicas
2. **Corretores/Agentes**: Buscam compradores compatíveis com imóveis que estão vendendo
3. **Curadores**: Profissionais da plataforma que aprovam matches e intermediam comunicação
4. **Admin**: Gerencia usuários, curadores e tem visão completa da plataforma

## Stack Técnico
- **Backend**: FastAPI (Python)
- **Frontend**: React.js + Tailwind CSS + Shadcn UI
- **Database**: MongoDB
- **Autenticação**: JWT

## Funcionalidades Implementadas

### ✅ Autenticação
- Login/Registro para compradores, corretores, curadores e admin
- JWT com expiração de 7 dias
- Login separado para admin/curador (`/admin/login`)

### ✅ Dashboard do Comprador
- Criar, editar e excluir interesses
- Visualizar matches aprovados
- Motivo obrigatório ao excluir interesse

### ✅ Dashboard do Corretor
- Buscar compradores por interesse
- Criar matches (iniciam como `pending_approval`)
- Excluir matches com motivo obrigatório

### ✅ Dashboard Admin/Curador
- Aprovar/rejeitar matches pendentes
- Sistema CRM de follow-ups
- Criar novos curadores (gera link de registro)
- Visualização de estatísticas

### ✅ Fluxo de Curadoria
- Matches começam com status `pending_approval`
- Curador aprova → match fica visível apenas para ele e admin
- Sistema de follow-ups para registrar contatos

### ✅ Landing Page
- Design responsivo
- Múltiplas seções informativas
- Branding MatchImovel

## Variáveis de Ambiente

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=matchimob_production
CORS_ORIGINS=https://seudominio.com.br
JWT_SECRET=CHAVE_SEGURA
FRONTEND_URL=https://seudominio.com.br  # OBRIGATÓRIO
EMERGENT_LLM_KEY=  # Opcional
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://api.seudominio.com.br
```

## Credenciais de Teste
- **Admin**: admin@matchimob.com / admin123
- **Curador teste**: curador.teste@test.com / curador123

---

## Backlog

### P0 - Próximas Tarefas
- [ ] Integrar serviço de email SMTP (Hostgator) para registro de curadores
- [ ] Dashboard de Analytics para admin

### P1 - Pendente
- [ ] Criar README.md completo
- [ ] Verificar lógica de visibilidade de matches para curadores
- [ ] Verificar funcionalidade de auto-refresh

### P2 - Futuro
- [ ] Notificações push
- [ ] Seção FAQ na landing page
- [ ] Melhorias de SEO

---

## Última Atualização
**Data**: 07/12/2024

**Sessão anterior**:
- Corrigido link de registro de curador (usava localhost hardcoded)
- Adicionada variável `FRONTEND_URL` ao backend
- Sistema agora falha explicitamente se variáveis obrigatórias não estiverem configuradas
- Criados arquivos `.env.example` para backend e frontend
