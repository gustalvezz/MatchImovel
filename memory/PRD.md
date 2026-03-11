# MatchImovel - PRD (Product Requirements Document)

## Problema Original
Construir uma plataforma imobiliária chamada "MatchImovel" que inverte o modelo tradicional: em vez de listar imóveis à venda, exibe compradores interessados. Corretores encontram "matches" com compradores, e curadores da plataforma intermediam toda a comunicação.

## Personas
1. **Compradores**: Registram interesse em imóveis com características específicas
2. **Corretores/Agentes**: Buscam compradores compatíveis com imóveis que estão vendendo
3. **Curadores**: Profissionais da plataforma que aprovam matches e intermediam comunicação
4. **Admin**: Gerencia usuários, curadores e tem visão completa da plataforma

## Stack Técnico
- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React.js + Tailwind CSS + Shadcn UI
- **Email**: SMTP via Titan Email (Hostgator)
- **Autenticação**: JWT

---

## Funcionalidades Implementadas

### ✅ Autenticação (100%)
- Login/Registro para compradores, corretores, curadores e admin
- JWT com expiração de 7 dias
- Login separado para admin/curador (`/admin/login`)
- Registro de curador via convite por email

### ✅ Dashboard do Comprador (100%)
- Criar, editar e excluir interesses
- Visualizar matches aprovados
- Motivo obrigatório ao excluir interesse
- Auto-refresh a cada 30 segundos

### ✅ Dashboard do Corretor (100%)
- Buscar compradores por interesse
- Criar matches (iniciam como `pending_approval`)
- Excluir matches com motivo obrigatório
- Auto-refresh a cada 30 segundos

### ✅ Dashboard Admin/Curador (100%)
- Aprovar/rejeitar matches pendentes
- Sistema CRM de follow-ups
- Criar novos curadores via email
- Visualização de estatísticas
- Auto-refresh a cada 30 segundos

### ✅ Dashboard de Analytics (100%) - NOVO
- Métricas gerais (compradores, corretores, curadores, interesses)
- Estatísticas de matches (total, pendentes, aprovados, rejeitados)
- Taxa de conversão com gráfico de progresso
- Performance dos curadores (matches curados, follow-ups)
- Top 10 corretores por matches
- Distribuição por tipo de imóvel e localização
- Faixa de preço média
- Motivos de exclusão de interesses

### ✅ Integração de Email SMTP (100%) - NOVO
- Configurado com Titan Email (smtp.titan.email:587)
- Email de convite para curadores com template HTML profissional
- Link de registro com token seguro (expira em 7 dias)

### ✅ Fluxo de Curadoria (100%)
- Matches começam com status `pending_approval`
- Curador aprova → match fica visível apenas para ele e admin
- Sistema de follow-ups para registrar contatos

### ✅ Landing Page (100%)
- Design responsivo
- Múltiplas seções informativas
- Branding MatchImovel

---

## Variáveis de Ambiente

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=matchimob_production
CORS_ORIGINS=https://seudominio.com.br
JWT_SECRET=CHAVE_SEGURA_32_BYTES
FRONTEND_URL=https://seudominio.com.br  # OBRIGATÓRIO
SMTP_HOST=smtp.titan.email
SMTP_PORT=587
SMTP_USER=matchimovel@matchimovel.com.br
SMTP_PASSWORD=sua_senha
SMTP_FROM_EMAIL=matchimovel@matchimovel.com.br
SMTP_FROM_NAME=MatchImovel
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://api.seudominio.com.br
```

---

## Credenciais de Teste
- **Admin**: admin@matchimob.com / admin123
- **Curador teste**: curador.teste@test.com / curador123

---

## Testes Realizados
- **Backend**: 14/14 testes passando (100%)
- **Frontend**: Todos os fluxos de UI verificados (100%)
- **Integrações**: Email SMTP funcionando

---

## Backlog

### P2 - Futuro
- [ ] Notificações push
- [ ] Seção FAQ na landing page
- [ ] Melhorias de SEO
- [ ] Dashboard mobile responsivo aprimorado

---

## Última Atualização
**Data**: 11/03/2025

**Sessão atual - Concluído**:
1. ✅ Integração de email SMTP (Titan Email/Hostgator)
2. ✅ Dashboard de Analytics completo para admin
3. ✅ README.md completo em `/app/README.md`
4. ✅ Verificação de visibilidade de matches para curadores
5. ✅ Auto-refresh em todos os dashboards (30s)
6. ✅ Correção de warnings ESLint
7. ✅ Testes completos via testing agent
