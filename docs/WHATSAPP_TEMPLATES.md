# WhatsApp Templates — Meta Cloud API

Guia de criação dos 17 templates aprovados pela Meta para o MatchImovel.

**Caminho no Meta for Developers:**  
WhatsApp Manager → Conta → Modelos de mensagem → Criar modelo

**Configurações comuns a todos os templates:**
- Idioma: **Português (BR)** (`pt_BR`)
- Categoria: **UTILITY** (salvo indicação contrária)
- Status necessário: **Aprovado** antes de usar

---

## Índice

| # | Template | Destinatário | Evento |
|---|---|---|---|
| 1 | [`match_aprovado`](#1-match_aprovado) | Comprador | Match aprovado pelo curator |
| 2 | [`match_aprovado_corretor`](#2-match_aprovado_corretor) | Corretor | Match aprovado pelo curator |
| 3 | [`visita_agendada`](#3-visita_agendada) | Comprador + Corretor | Visita agendada ou reagendamento aprovado |
| 4 | [`lembrete_visita`](#4-lembrete_visita) | Comprador + Corretor | Lembrete 2h antes da visita (cron) |
| 5 | [`feedback_visita`](#5-feedback_visita) | Comprador | Visita marcada como concluída |
| 6 | [`match_rejeitado`](#6-match_rejeitado) | Corretor | Comprador rejeita o match após visita |
| 7 | [`interesse_cadastrado`](#7-interesse_cadastrado) | Comprador | Interesse registrado via app ou web |
| 8 | [`creci_verificado`](#8-creci_verificado) | Corretor | Admin verifica CRECI |
| 9 | [`creci_bloqueado`](#9-creci_bloqueado) | Corretor | Admin bloqueia CRECI |
| 10 | [`busca_resultados`](#10-busca_resultados) | Corretor | Cron semanal: resultados de busca salva |
| 11 | [`novos_interesses`](#11-novos_interesses) | Corretor | Cron semanal: novos compradores não cobertos |
| 12 | [`curador_exclusao`](#12-curador_exclusao) | Curator | Interesse ou match excluído |
| 13 | [`curador_visita_confirmada`](#13-curador_visita_confirmada) | Curator | Comprador ou corretor confirma presença |
| 14 | [`curador_reagendamento`](#14-curador_reagendamento) | Curator + outra parte | Reagendamento solicitado |
| 15 | [`reset_senha`](#15-reset_senha) | Qualquer usuário | Reset de senha solicitado |
| 16 | [`novo_corretor`](#16-novo_corretor) | Admin | Novo corretor se cadastra |

---

## 1. `match_aprovado`

**Destinatário:** Comprador  
**Disparado em:** `curator_routes.py → decide_match()` quando curator aprova  
**Função no código:** `notify_buyer_match_approved()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `match_aprovado` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! 🏠 Um corretor encontrou um imóvel em *{{2}}* com *{{3}}%* de compatibilidade com o seu perfil.

Responda a esta mensagem para ver todos os detalhes e nos contar o que você achou.
```

### Rodapé
```
MatchImovel — Plataforma de conexão imobiliária
```

### Botões
Nenhum (usuário responde livremente; sessão `match_feedback` é criada antes do envio)

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Maria Silva` |
| `{{2}}` | `Savassi, Belo Horizonte` |
| `{{3}}` | `87` |

### Observações
- O bot cria uma sessão `B_NOTIFY` antes de enviar este template, portanto a primeira resposta do comprador aciona o Flow B automaticamente.
- `{{2}}` é truncado em 50 caracteres no código.

---

## 2. `match_aprovado_corretor`

**Destinatário:** Corretor  
**Disparado em:** `curator_routes.py → decide_match()` quando curator aprova  
**Função no código:** `notify_agent_match_approved()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `match_aprovado_corretor` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! ✅ Seu match foi aprovado pela curadoria.

👤 Comprador: *{{2}}*
🎯 Compatibilidade: *{{3}}%*
📍 Imóvel: {{4}}

O comprador será notificado e nossa equipe de curadoria cuidará do próximo passo. Acompanhe pelo app.
```

### Rodapé
```
MatchImovel — Plataforma de conexão imobiliária
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Carlos Mendes` |
| `{{2}}` | `João Pereira` |
| `{{3}}` | `92` |
| `{{4}}` | `Rua das Flores, 100 — Lourdes` |

### Observações
- `{{4}}` é o endereço do imóvel (`property_info.address`). Se vazio, o código envia `"a confirmar"`.

---

## 3. `visita_agendada`

**Destinatário:** Comprador e Corretor (template enviado para ambos)  
**Disparado em:**
- `curator_routes.py → schedule_visit()` — agendamento inicial
- `curator_routes.py → approve_reschedule()` — reagendamento aprovado  

**Função no código:** `notify_visit_scheduled()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `visita_agendada` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! 📅 Sua visita foi agendada.

🏠 Imóvel: *{{2}}*
🗓 Data: *{{3}}*
🕐 Horário: *{{4}}*

Responda a esta mensagem para confirmar presença, solicitar reagendamento ou cancelar.
```

### Rodapé
```
MatchImovel — Curadoria imobiliária
```

### Botões
Nenhum (usuário responde; sessão `V_ACTION_MENU` é criada antes do envio)

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Ana Costa` |
| `{{2}}` | `Av. Paulista, 1500 — Bela Vista` |
| `{{3}}` | `28/06/2026` |
| `{{4}}` | `10:00` |

### Observações
- Data é convertida de `YYYY-MM-DD` para `DD/MM/YYYY` no código (`format_visit_date()`).
- Este template é enviado tanto para comprador quanto para corretor. A sessão criada para cada um usa `role: buyer` ou `role: agent`, permitindo que o Flow V trate as respostas diferentemente.
- Em reagendamento aprovado, o mesmo template é enviado novamente com a nova data.

---

## 4. `lembrete_visita`

**Destinatário:** Comprador e Corretor  
**Disparado em:** `curator_routes.py → send_visit_reminders()` — cron 2h antes  
**Função no código:** `notify_visit_reminder()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `lembrete_visita` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
⏰ Lembrete de visita, {{1}}!

🏠 Imóvel: *{{2}}*
🗓 {{3}}

Qualquer imprevisto? Responda esta mensagem para falar com nossa equipe.
```

### Rodapé
```
MatchImovel — Curadoria imobiliária
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Roberto Lima` |
| `{{2}}` | `Rua XV de Novembro, 320 — Centro` |
| `{{3}}` | `28/06/2026 às 14:00` |

### Observações
- `{{3}}` é composto pelo código como `"{date_display} às {visit_time}"`.
- O cron dispara quando `timedelta(hours=0) <= time_diff <= timedelta(hours=2, minutes=15)`.

---

## 5. `feedback_visita`

**Destinatário:** Comprador  
**Disparado em:** `curator_routes.py → record_visit_outcome()` quando visita = `completed`  
**Função no código:** `notify_buyer_feedback_request()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `feedback_visita` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! 🙏 Que bom que você visitou o imóvel em *{{2}}*.

O que você achou? Responda esta mensagem — demora menos de 1 minuto — e nos ajude a encontrar o match perfeito para você.
```

### Rodapé
```
MatchImovel — Sua opinião faz a diferença
```

### Botões
Nenhum (usuário responde; sessão `B_FEEDBACK_ASK` é criada antes do envio, apresentando botões interativos no próximo turno)

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Fernanda Oliveira` |
| `{{2}}` | `Rua Pernambuco, 80 — Funcionários` |

### Observações
- O código cria uma sessão `match_feedback` no estado `B_FEEDBACK_ASK` antes de enviar este template.
- A primeira resposta do comprador (qualquer texto) aciona o Flow B que apresenta os botões de interesse/não interesse.

---

## 6. `match_rejeitado`

**Destinatário:** Corretor  
**Disparado em:** `curator_routes.py → approve_buyer_rejection()`  
**Função no código:** `notify_agent_match_rejected()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `match_rejeitado` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}. Temos uma atualização sobre seu match.

O comprador *{{2}}* não teve interesse no imóvel em *{{3}}* após a visita.

Acesse a plataforma para ver o motivo do feedback e criar novos matches.
```

### Rodapé
```
MatchImovel — Plataforma de conexão imobiliária
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Pedro Souza` |
| `{{2}}` | `Lucas Ferreira` |
| `{{3}}` | `Av. do Contorno, 5000 — Santo Antônio` |

---

## 7. `interesse_cadastrado`

**Destinatário:** Comprador  
**Disparado em:**
- `buyer_routes.py → process_ai_interpretation_background()` (fluxo v2)
- `buyer_routes.py → create_full_interest()` (fluxo v3)

**Função no código:** `notify_buyer_interest_registered()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `interesse_cadastrado` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! ✅ Seu interesse em *{{2}}* em *{{3}}* foi cadastrado com sucesso.

Seu perfil já está visível para corretores qualificados na plataforma. Você será notificado aqui no WhatsApp quando encontrarmos um match compatível!
```

### Rodapé
```
MatchImovel — Encontre o imóvel certo para você
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Juliana Ramos` |
| `{{2}}` | `Apartamento` |
| `{{3}}` | `Funcionários, Belo Horizonte` |

### Observações
- **Não é enviado** se o interesse foi cadastrado via WhatsApp bot (o bot já confirma inline). O código verifica `client_ip != "whatsapp"`.
- `{{2}}` é o tipo de imóvel em português legível (ex: "Apartamento", "Casa de condomínio").

---

## 8. `creci_verificado`

**Destinatário:** Corretor  
**Disparado em:**
- `admin_routes.py → verify_agent_creci()`
- `admin_routes.py → update_creci_status()` quando transição para verificado

**Função no código:** `notify_agent_creci_verified()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `creci_verificado` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! 🎉 Boa notícia!

Seu CRECI *{{2}}* foi verificado com sucesso. Sua conta está ativa na plataforma MatchImovel e você já pode receber matches de compradores qualificados.

Boas vendas!
```

### Rodapé
```
MatchImovel — Plataforma de conexão imobiliária
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Amanda Freitas` |
| `{{2}}` | `MG-123456` |

### Observações
- `{{2}}` é formatado como `"{creci_uf}-{creci}"` no código.

---

## 9. `creci_bloqueado`

**Destinatário:** Corretor  
**Disparado em:**
- `admin_routes.py → block_agent_creci()`
- `admin_routes.py → update_creci_status()` quando transição para bloqueado

**Função no código:** `notify_agent_creci_blocked()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `creci_bloqueado` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}. Identificamos uma pendência com seu CRECI *{{2}}*.

Seu acesso à plataforma foi temporariamente suspenso. Entre em contato com nossa equipe para regularizar sua situação e reativar sua conta.
```

### Rodapé
```
MatchImovel — Suporte: responda esta mensagem
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Marcos Alves` |
| `{{2}}` | `SP-654321` |

---

## 10. `busca_resultados`

**Destinatário:** Corretor  
**Disparado em:** `agent_routes.py → process_saved_searches()` — cron semanal  
**Função no código:** `notify_agent_search_results()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `busca_resultados` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! 🔍 Sua busca ativa encontrou *{{2}} novo(s) comprador(es)* compatível(is).

Busca: _{{3}}_

Acesse a plataforma para ver os perfis e criar matches, ou responda aqui para usar o assistente do WhatsApp.
```

### Rodapé
```
MatchImovel — Plataforma de conexão imobiliária
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Daniela Torres` |
| `{{2}}` | `4` |
| `{{3}}` | `Apartamento 3 quartos, Savassi, até 800k` |

### Observações
- `{{3}}` é os primeiros 60 caracteres do campo `property_description` da busca salva.
- Enviado apenas quando `len(new_matches) > 0`.

---

## 11. `novos_interesses`

**Destinatário:** Corretor  
**Disparado em:** `agent_routes.py → send_uncovered_interests_weekly()` — cron semanal  
**Função no código:** `notify_agent_new_interests()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `novos_interesses` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! 📊 Esta semana chegaram *{{2}} novos compradores* na plataforma.

Tipos não cobertos pelas suas buscas ativas: _{{3}}_

Cadastre seus imóveis pelo app ou responda aqui para usar o assistente do WhatsApp e não perder esses compradores!
```

### Rodapé
```
MatchImovel — Plataforma de conexão imobiliária
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Ricardo Nunes` |
| `{{2}}` | `7` |
| `{{3}}` | `3 apartamento, 2 casa, 2 terreno` |

### Observações
- `{{3}}` é truncado em 60 caracteres no código.
- Enviado apenas para agentes com pelo menos uma busca ativa e que têm tipos de imóvel não cobertos.
- Não enviado se não há novos interesses no período.

---

## 12. `curador_exclusao`

**Destinatário:** Curator  
**Disparado em:**
- `buyer_routes.py → delete_interest()` — comprador exclui interesse
- `agent_routes.py → delete_match()` — corretor exclui match

**Função no código:** `notify_curator_deletion()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `curador_exclusao` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
⚠️ Atenção {{1}}.

*{{2}}* foi excluído(a) da plataforma por *{{3}}*.

Acesse o painel de curadoria para verificar os detalhes e tomar as ações necessárias.
```

### Rodapé
```
MatchImovel — Painel de curadoria
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Beatriz Cardoso` |
| `{{2}}` | `Interesse de Funcionários, BH` |
| `{{3}}` | `Maria Silva` |

### Observações
- `{{2}}` é composto pelo código como `"{tipo} de {endereço/localização}"`.
  - Para interesse: tipo = "Interesse", descrição = `interest.location`
  - Para match: tipo = "Match", descrição = `property_info.address`

---

## 13. `curador_visita_confirmada`

**Destinatário:** Curator  
**Disparado em:** `curator_routes.py → process_visit_token_action()` quando ação = `confirm`  
**Função no código:** `notify_curator_visit_confirmed()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `curador_visita_confirmada` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
✅ Confirmação de presença registrada.

*{{1}}* confirmou presença na visita de *{{2}}* às *{{3}}* no imóvel em *{{4}}*.

Nenhuma ação necessária por enquanto.
```

### Rodapé
```
MatchImovel — Curadoria
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `João Pereira` |
| `{{2}}` | `05/07/2026` |
| `{{3}}` | `11:00` |
| `{{4}}` | `Rua Cláudio Manoel, 50 — Funcionários` |

---

## 14. `curador_reagendamento`

**Destinatário:** Curator e outra parte (comprador ou corretor)  
**Disparado em:**
- `curator_routes.py → process_visit_token_action()` quando ação = `reschedule`
- `buyer_routes.py → buyer_reschedule_request()`
- `routes/whatsapp_routes.py → Flow V` (reagendamento via bot)

**Função no código:** `notify_reschedule_requested()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `curador_reagendamento` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
📅 Solicitação de reagendamento.

*{{1}}* solicitou reagendamento da visita ao imóvel em *{{2}}*.

Motivo: _{{3}}_

Acesse o painel para aprovar ou recusar a nova data proposta.
```

### Rodapé
```
MatchImovel — Curadoria
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Ana Costa` |
| `{{2}}` | `Av. Raja Gabaglia, 1200 — Gutierrez` |
| `{{3}}` | `Conflito de agenda profissional` |

### Observações
- `{{3}}` é truncado em 50 caracteres no código.
- O mesmo template é enviado para o curator e para a outra parte (corretor ou comprador), dependendo de quem solicitou.

---

## 15. `reset_senha`

**Destinatário:** Qualquer usuário (comprador, corretor, curator, admin)  
**Disparado em:** `auth_routes.py → forgot_password()`  
**Função no código:** `notify_password_reset()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `reset_senha` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

> **Atenção:** Este template contém uma URL. A Meta exige que o domínio da URL seja verificado na conta Business Manager antes da aprovação. O domínio deve corresponder ao `FRONTEND_URL` configurado no backend.

### Cabeçalho
Nenhum

### Corpo

```
Olá {{1}}! Recebemos uma solicitação para redefinir sua senha no MatchImovel.

Acesse o link abaixo para criar uma nova senha:
{{2}}

⏰ Este link é válido por *24 horas*. Se você não solicitou a alteração, ignore esta mensagem — sua conta permanece segura.
```

### Rodapé
```
MatchImovel — Segurança da conta
```

### Botões
**Opcional — Call to Action (URL)**

| Campo | Valor |
|---|---|
| Tipo | URL |
| Texto do botão | `Redefinir senha` |
| URL | `{{1}}` (variável de URL — requer plano Meta verificado) |

> Se usar o botão de URL, remova o link `{{2}}` do corpo e use a URL dinâmica no botão. Esta configuração requer conta Business verificada e domínio aprovado.

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Thiago Barbosa` |
| `{{2}}` | `https://app.matchimovel.com.br/reset-password?token=abc123xyz` |

### Observações
- O link expira em 24h (controlado por `auth_routes.py`).
- A Meta pode rejeitar templates com URLs dinâmicas no corpo. Alternativa: usar URL estática no corpo + orientar o usuário a colar o link manualmente, ou usar o botão CTA com URL dinâmica.

---

## 16. `novo_corretor`

**Destinatário:** Admin (opt-in via `WHATSAPP_ADMIN_PHONE`)  
**Disparado em:** `auth_routes.py → register()` quando novo corretor se cadastra  
**Função no código:** `notify_admin_new_agent()`

### Configuração

| Campo | Valor |
|---|---|
| Nome do modelo | `novo_corretor` |
| Categoria | UTILITY |
| Idioma | Português (BR) |

### Cabeçalho
Nenhum

### Corpo

```
🏢 Novo corretor cadastrado na plataforma MatchImovel.

👤 Nome: *{{1}}*
📋 CRECI: *{{2}}*

Acesse o painel administrativo para verificar o CRECI e ativar a conta.
```

### Rodapé
```
MatchImovel — Painel administrativo
```

### Botões
Nenhum

### Exemplos de variáveis

| Variável | Exemplo |
|---|---|
| `{{1}}` | `Sandra Monteiro` |
| `{{2}}` | `RJ-789012` |

### Observações
- Só é enviado se `WHATSAPP_ADMIN_PHONE` estiver configurado no ambiente.
- Um único número é notificado. Para múltiplos admins, configurar via `WHATSAPP_ADMIN_PHONE` com lógica adicional no código.

---

## Variáveis de Ambiente

Após criar e aprovar os templates no Meta, configure as variáveis no `backend/.env`:

```env
# Meta Cloud API
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=seu_verify_token_secreto
WHATSAPP_ADMIN_PHONE=5511999990000

# Template names (devem corresponder exatamente aos nomes aprovados)
WHATSAPP_TPL_MATCH_APROVADO=match_aprovado
WHATSAPP_TPL_MATCH_APROVADO_CORT=match_aprovado_corretor
WHATSAPP_TPL_VISITA_AGENDADA=visita_agendada
WHATSAPP_TPL_LEMBRETE_VISITA=lembrete_visita
WHATSAPP_TPL_FEEDBACK_VISITA=feedback_visita
WHATSAPP_TPL_MATCH_REJEITADO=match_rejeitado
WHATSAPP_TPL_INTERESSE_CAD=interesse_cadastrado
WHATSAPP_TPL_CRECI_VERIFICADO=creci_verificado
WHATSAPP_TPL_CRECI_BLOQUEADO=creci_bloqueado
WHATSAPP_TPL_BUSCA_RESULTADOS=busca_resultados
WHATSAPP_TPL_NOVOS_INTERESSES=novos_interesses
WHATSAPP_TPL_CURADOR_EXCLUSAO=curador_exclusao
WHATSAPP_TPL_CURADOR_CONFIRM=curador_visita_confirmada
WHATSAPP_TPL_REAGENDAMENTO=curador_reagendamento
WHATSAPP_TPL_RESET_SENHA=reset_senha
WHATSAPP_TPL_NOVO_CORRETOR=novo_corretor
```

---

## Processo de Criação no Meta

### Passo a passo

1. Acesse [business.facebook.com](https://business.facebook.com)
2. Vá em **WhatsApp Manager** → selecione a conta → **Modelos de mensagem**
3. Clique em **Criar modelo**
4. Preencha:
   - **Nome do modelo:** exatamente como documentado (letras minúsculas, underscores)
   - **Categoria:** Utilidade
   - **Idioma:** Português (BR)
5. Adicione o **Corpo** copiando o texto acima, substituindo `{{N}}` pelos placeholders
6. Adicione exemplos de variável para cada `{{N}}`
7. Clique em **Enviar para análise**

### Prazo de aprovação

- Templates simples (texto + variáveis): 1–24 horas
- Templates com URL no corpo: pode exigir verificação de domínio (2–7 dias)
- Templates rejeitados: edite e reenvie; a Meta fornece o motivo

### Possíveis causas de rejeição

| Causa | Solução |
|---|---|
| Conteúdo promocional em template UTILITY | Remover linguagem de oferta; focar em notificação transacional |
| URL sem domínio verificado | Verificar domínio no Business Manager antes de submeter |
| Variáveis sem exemplo | Preencher todos os exemplos antes de enviar |
| Nome com caracteres inválidos | Usar apenas letras minúsculas, números e underscores |
| Corpo muito curto | A Meta rejeita templates com menos de ~10 palavras |

---

## Checklist de implantação

- [ ] Conta Meta Business verificada
- [ ] Número WhatsApp Business configurado e aprovado
- [ ] Webhook registrado: `https://SEU_DOMINIO/api/webhooks/whatsapp`
- [ ] Campo verificado: `messages`
- [ ] Domínio do frontend verificado no Business Manager (para `reset_senha`)
- [ ] 16 templates criados e com status **Aprovado**
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] `WHATSAPP_ADMIN_PHONE` configurado (se deseja notificações de admin)
- [ ] Teste de envio realizado para cada template
