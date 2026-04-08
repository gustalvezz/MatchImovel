# Setup de Cron Externo para Lembretes de Visita

## Visão Geral

O sistema MatchImóvel possui um endpoint interno para enviar lembretes automáticos de visita 2 horas antes do horário agendado. Este endpoint deve ser chamado periodicamente por um serviço de cron externo.

## Endpoint

```
POST /api/internal/send-visit-reminders
```

### Headers Obrigatórios

| Header | Valor |
|--------|-------|
| `X-Internal-Key` | Sua chave de API interna (ver variável `INTERNAL_API_KEY` no `.env`) |

### Response

```json
{
  "status": "success",
  "checked_at": "2026-04-08T10:00:00.000Z",
  "visits_checked": 5,
  "reminders_sent": 2,
  "errors": 0
}
```

## Configuração do Cron

O endpoint deve ser chamado a cada **15 minutos** para garantir que os lembretes sejam enviados no momento correto (entre 2h e 2h15m antes da visita).

### Opção 1: cron-job.org (Gratuito)

1. Acesse [cron-job.org](https://cron-job.org)
2. Crie uma conta gratuita
3. Adicione um novo cronjob:
   - **URL**: `https://seu-dominio.com/api/internal/send-visit-reminders`
   - **Método**: POST
   - **Headers**: 
     - `X-Internal-Key`: sua_chave_aqui
   - **Schedule**: Every 15 minutes (`*/15 * * * *`)

### Opção 2: EasyCron

1. Acesse [easycron.com](https://www.easycron.com)
2. Configure um cronjob com as mesmas especificações

### Opção 3: AWS EventBridge + Lambda

```python
# lambda_function.py
import urllib.request
import json
import os

def lambda_handler(event, context):
    url = os.environ['MATCHIMOB_API_URL'] + '/api/internal/send-visit-reminders'
    api_key = os.environ['INTERNAL_API_KEY']
    
    req = urllib.request.Request(
        url,
        method='POST',
        headers={'X-Internal-Key': api_key}
    )
    
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        print(f"Reminders sent: {result['reminders_sent']}")
        return result
```

Configure o EventBridge para disparar a cada 15 minutos.

### Opção 4: Google Cloud Scheduler

```bash
gcloud scheduler jobs create http matchimob-visit-reminders \
  --schedule="*/15 * * * *" \
  --uri="https://seu-dominio.com/api/internal/send-visit-reminders" \
  --http-method=POST \
  --headers="X-Internal-Key=sua_chave_aqui" \
  --time-zone="America/Sao_Paulo"
```

### Opção 5: Servidor Linux com Crontab

```bash
# Edite o crontab
crontab -e

# Adicione a linha:
*/15 * * * * curl -X POST https://seu-dominio.com/api/internal/send-visit-reminders -H "X-Internal-Key: sua_chave_aqui" >> /var/log/matchimob-reminders.log 2>&1
```

## Variáveis de Ambiente

No arquivo `/app/backend/.env`:

```env
INTERNAL_API_KEY=sua_chave_secreta_aqui
```

Para gerar uma nova chave segura:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Monitoramento

### Logs do Backend

Os logs de execução podem ser verificados em:

```bash
tail -f /var/log/supervisor/backend.err.log | grep -i "visit reminder"
```

### Teste Manual

```bash
curl -X POST https://seu-dominio.com/api/internal/send-visit-reminders \
  -H "X-Internal-Key: sua_chave" \
  -H "Content-Type: application/json"
```

## Fluxo de Funcionamento

1. O cron chama o endpoint a cada 15 minutos
2. O sistema busca visitas agendadas que:
   - Status = "scheduled"
   - `reminder_2h_sent` = false ou não existe
3. Para cada visita, verifica se está entre 0 e 2h15m do horário atual
4. Se estiver no período, envia email para comprador e corretor
5. Marca a visita como `reminder_2h_sent: true`

## Segurança

- O endpoint requer a header `X-Internal-Key` para autenticação
- Sem a chave correta, retorna HTTP 401 Unauthorized
- A chave nunca deve ser exposta em código frontend ou repositórios públicos

## Troubleshooting

### Lembretes não estão sendo enviados

1. Verifique se o cron está configurado e rodando
2. Confirme que a `INTERNAL_API_KEY` está correta
3. Verifique se existem visitas agendadas com status "scheduled"
4. Confira os logs do backend para erros de SMTP

### Erro 401 Unauthorized

- A chave `X-Internal-Key` não está correta ou não foi enviada
- Verifique se a variável `INTERNAL_API_KEY` está definida no `.env`
