# MatchImovel - PRD (Product Requirements Document)

## Visão Geral
Plataforma imobiliária que conecta compradores interessados a corretores através de um sistema de curadoria profissional. O diferencial é que os compradores cadastram seu interesse e os corretores os encontram, invertendo o modelo tradicional.

## Usuários e Papéis
1. **Comprador**: Cadastra interesse em comprar imóvel através de formulário detalhado
2. **Corretor/Agent**: Busca compradores compatíveis e dá "match" com informações do imóvel
3. **Curador**: Aprova/rejeita matches e agenda visitas, intermediando a comunicação
4. **Admin**: Gerencia usuários, curadores e visualiza analytics

## Fluxo Principal
1. Comprador se registra → Preenche formulário de interesse (10 telas)
2. IA gera perfil do comprador baseado nas respostas
3. Corretor busca compradores → Dá match com informações do imóvel
4. Curador avalia o match → Aprova/Rejeita
5. Curador agenda visita → Notificações por email enviadas
6. Processo de intermediação até fechamento

---

## Funcionalidades Implementadas

### Autenticação e Usuários
- [x] Registro de compradores com telefone obrigatório (máscara aplicada)
- [x] Login JWT para todos os papéis
- [x] Admin login separado (/admin/login)
- [x] Curador login via área admin

### Formulário de Interesse (v3) - Atualizado 15/03/2026
- [x] **Tela 1**: Perfil (5 opções incluindo "Quero sair do aluguel")
- [x] **Tela 2**: Urgência (3, 12 meses ou sem prazo)
- [x] **Tela 3**: Localização (campo livre)
- [x] **Tela 4**: Orçamento (6 faixas até "Acima de 1,5 milhão")
- [x] **Tela 5**: Tipo de imóvel (8 opções: Apartamento, Casa, Terreno, etc.)
- [x] **Tela 6**: Indispensável (múltipla seleção com novas opções)
- [x] **Tela 7**: Ambiente ideal (5 opções atualizadas)
- [x] **Tela 8**: O que incomoda (1-3 seleções)
- [x] **Tela 9**: Proximidade necessária (inclui "Tanto faz")
- [x] **Tela 10**: Informações extras + Finalizar

### Dashboard do Corretor
- [x] Listagem de compradores com perfil IA
- [x] Busca inteligente com IA
- [x] Modal de match com informações do imóvel (descrição obrigatória)
- [x] Aba "Meus Matches" com coração vermelho e borda colorida
- [x] Status do match (Em Análise, Aprovado, Visita Agendada, etc.)

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

### Notificações por Email
- [x] Email de registro para curadores
- [x] Email ao agendar visita (comprador e corretor)
- [x] Endpoint para lembrete 2h antes da visita

### SEO e Landing Page
- [x] Meta tags, Open Graph, Twitter Cards
- [x] JSON-LD structured data
- [x] Menu sticky com anchor links
- [x] CTAs para compradores e corretores

---

## Stack Técnica
- **Frontend**: React.js, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI via emergentintegrations (Emergent LLM Key)
- **Email**: SMTP (Hostgator) via aiosmtplib

## Credenciais de Teste
- **Admin**: admin@matchimob.com / admin123
- **URL Admin**: /admin/login

## Arquivos Principais
- `/app/backend/server.py` - API completa
- `/app/frontend/src/components/InterestFormModal.js` - Formulário de interesse
- `/app/frontend/src/components/PropertyInfoModal.js` - Modal info imóvel
- `/app/frontend/src/pages/CuratorDashboard.js` - Dashboard curador
- `/app/frontend/src/pages/AgentDashboard.js` - Dashboard corretor

---

## Backlog / Tarefas Futuras

### P1 - Alta Prioridade
- [ ] Configurar cron job para enviar lembretes de visita 2h antes
- [ ] Refatorar server.py em módulos (routes, models, services)

### P2 - Média Prioridade
- [ ] Analytics expandido para performance de curadores
- [ ] Histórico de visitas no dashboard do curador
- [ ] Filtros avançados na busca de compradores

### P3 - Baixa Prioridade
- [ ] Seção FAQ na landing page
- [ ] Notificações push (web push)
- [ ] App mobile (PWA)

### P4 - Melhorias Futuras
- [ ] Integração com portais imobiliários
- [ ] Chat interno entre curador e partes
- [ ] Relatórios de conversão

---

## Changelog

### 15/03/2026
- Reformulação completa do formulário de interesse (v3)
- Adicionada opção "Quero sair do aluguel" na tela 1
- Mudado prazo de 6 para 12 meses na tela 2
- Nova tela 5 "O que está procurando?" com 8 tipos de imóvel
- Atualizadas opções de indispensável (tela 6) e ambiente (tela 7)
- Adicionada opção "Tanto faz" na tela 9
- Removida tela de estilo pessoal
- Modal de informações do imóvel ao dar match
- Coração vermelho no card de matches do corretor
- Exibição de property_info no dashboard do curador
- Agendamento de visitas com notificações por email
- SEO implementado na landing page
- Limpeza completa do banco de dados (apenas admin mantido)

### 10/03/2026
- Implementação inicial do formulário multi-step (v2)
- Integração com IA para geração de perfil
- Dashboards para todos os papéis
- Sistema de matches e curadoria
