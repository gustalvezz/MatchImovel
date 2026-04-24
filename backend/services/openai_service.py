"""
OpenAI Service for AI-powered matching
"""
import os
import json
import logging
from typing import List, Dict, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

async def evaluate_buyers_with_openai(
    property_description: str,
    buyer_profiles: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Evaluate buyer compatibility using OpenAI GPT-4o
    
    Args:
        property_description: Description of the property
        buyer_profiles: List of buyer profile dictionaries (enriched with all form data)
        
    Returns:
        List of evaluation results with scores and justifications
    """
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    
    client = AsyncOpenAI(api_key=api_key)
    
    # Build simplified profiles for the prompt (to reduce tokens)
    simplified_profiles = []
    for p in buyer_profiles:
        # Check if has AI interpretation
        interpretacao = p.get("interpretacao_ia")
        
        simplified = {
            "id": p["id"],
            "nome": p["nome"],
            "tipo_imovel": p["tipo_imovel_desejado"],
            "localizacao": p["localizacao_desejada"],
            "orcamento": p["orcamento"],
            "quartos_min": p.get("quartos_minimos"),
            "faixa_etaria": p.get("faixa_etaria"),
            "motivo_busca": p.get("motivo_busca"),
            "urgencia": p.get("urgencia"),
            "quem_vai_morar": p.get("quem_vai_morar", []),
            "tem_filhos": bool(p.get("filhos_quantidade")),
            "filhos_idades": p.get("filhos_idades", []),
            "pets": p.get("pets"),
            "preferencia_andar": p.get("preferencia_andar"),
            "tamanho_espaco": p.get("tamanho_espaco"),
            "condicao_imovel": p.get("condicao_imovel", []),
            "ambiente_ideal": p.get("ambiente_ideal"),
            "indispensaveis": p.get("caracteristicas_indispensaveis", []),
            "deal_breakers": p.get("o_que_nao_aceita", []),
            "proximidades": p.get("precisa_proximidade_de", []),
            "rotina": p.get("rotina_em_casa", []),
            "locomocao": p.get("locomocao", []),
            "forma_pagamento": p.get("forma_pagamento", []),
            "observacoes": p.get("observacoes", "")
        }
        
        # If has AI interpretation, include the key fields
        if interpretacao:
            simplified["perfil_ideal_ia"] = interpretacao.get("perfil_do_imovel_ideal", "")
            simplified["criterios_inegociaveis_ia"] = interpretacao.get("criterios_inegociaveis", [])
            simplified["alertas_ia"] = interpretacao.get("alertas", [])
        
        simplified_profiles.append(simplified)
    
    profiles_json = json.dumps(simplified_profiles, ensure_ascii=False, indent=2)
    
    prompt = f"""Você é um especialista em mercado imobiliário brasileiro com 20+ anos de experiência em matching entre imóveis e compradores.

## IMÓVEL OFERECIDO PELO CORRETOR:
{property_description}

## PERFIS DOS COMPRADORES CADASTRADOS:
{profiles_json}

## INSTRUÇÕES DE AVALIAÇÃO:

### 1. ANÁLISE DE COMPATIBILIDADE ESTRUTURADA

**ELIMINATÓRIOS (score máximo 30 se não atender):**
- Tipo de imóvel incompatível (ex: quer apartamento, oferece casa)
- Localização claramente incompatível
- Orçamento insuficiente para o padrão do imóvel

**ANÁLISE DE PERFIL FAMILIAR:**
- Se tem filhos pequenos: valorize playground, segurança, proximidade de escola
- Se tem filhos adolescentes: valorize quartos extras, área de lazer
- Se tem pets de grande porte: valorize quintal, área externa, aceita pets
- Se mora sozinho: compacto pode ser ideal
- Se pessoa com mobilidade reduzida: térrea ou elevador é crítico

**ANÁLISE DE ESTILO DE VIDA:**
- Se faz home office: valorize escritório, silêncio, internet
- Se cozinha muito: cozinha ampla é importante
- Se recebe visitas: área social/gourmet importa
- Se tem 2+ carros: vagas são críticas

**ANÁLISE DE LOCOMOÇÃO:**
- Se usa transporte público: proximidade de metrô/ônibus é importante
- Se tem carro: garagem necessária

**CAMPOS DE IA (se disponíveis):**
- `perfil_ideal_ia`: Use como REFERÊNCIA PRINCIPAL do que o comprador realmente precisa
- `criterios_inegociaveis_ia`: Trate como DEAL-BREAKERS automáticos - se o imóvel viola algum, score máximo 40
- `alertas_ia`: Considere possíveis inconsistências

### 2. PONTUAÇÃO (0-100):
- 90-100: Match perfeito, altamente recomendado
- 70-89: Boa compatibilidade, vale apresentar
- 50-69: Compatibilidade moderada, pode interessar
- 30-49: Baixa compatibilidade, provavelmente não
- 0-29: Incompatível

### 3. JUSTIFICATIVA:
Escreva 2-4 frases ESPECÍFICAS citando:
- Elementos do imóvel que combinam com o perfil
- Elementos que podem ser problemáticos
- Se há critérios inegociáveis atendidos ou violados

## FORMATO DE RESPOSTA:
Responda APENAS com um JSON válido, sem markdown, no formato:
[
  {{
    "comprador_id": "COPIE EXATAMENTE o valor do campo 'id' do perfil",
    "score": 0-100,
    "justificativa": "2-4 frases específicas sobre a compatibilidade"
  }}
]

IMPORTANTE: 
- O campo "comprador_id" DEVE ser EXATAMENTE igual ao campo "id" de cada perfil. NÃO invente IDs.
- Inclua TODOS os compradores na resposta, mesmo os com score baixo.
- Seja rigoroso: um score 80+ significa que você recomendaria fortemente este imóvel para este comprador."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Você é um especialista em matching imobiliário com profundo conhecimento do mercado brasileiro. Analise perfis de compradores com atenção aos detalhes de estilo de vida, família e necessidades reais. Sempre responda em JSON válido, sem markdown."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean response - remove markdown if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        results = json.loads(response_text)
        scores = [r.get('score', 0) for r in results]
        logger.info(f"OpenAI evaluation completed: {len(results)} buyers evaluated, scores: {scores}")
        return results
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response: {e}")
        raise ValueError("Erro ao processar resposta da IA")
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise ValueError(f"Erro na API OpenAI: {str(e)}")
