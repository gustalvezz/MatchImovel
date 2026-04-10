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
    Evaluate buyer compatibility using OpenAI GPT-4
    
    Args:
        property_description: Description of the property
        buyer_profiles: List of buyer profile dictionaries
        
    Returns:
        List of evaluation results with scores and justifications
    """
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    
    client = AsyncOpenAI(api_key=api_key)
    
    profiles_json = json.dumps(buyer_profiles, ensure_ascii=False, indent=2)
    
    prompt = f"""Você é um especialista em mercado imobiliário. Analise a compatibilidade entre um imóvel e vários perfis de compradores.

## IMÓVEL OFERECIDO PELO CORRETOR:
{property_description}

## PERFIS DOS COMPRADORES CADASTRADOS:
{profiles_json}

## INSTRUÇÕES DE AVALIAÇÃO:

1. **FILTROS ELIMINATÓRIOS** (campos estruturados):
   - Se o tipo de imóvel é incompatível (ex: comprador quer apartamento, imóvel é casa): score máximo 30
   - Se a localização é claramente incompatível: reduza 20-40 pontos
   - Se o orçamento parece muito abaixo do padrão do imóvel descrito: reduza 30 pontos

2. **DIFERENCIADORES POSITIVOS** (campos qualitativos):
   - Ambiente ideal combina com descrição do imóvel: +15 pontos
   - Características desejáveis presentes no imóvel: +5 pontos cada (máx 20)
   - Nenhum deal breaker presente: +10 pontos
   - Proximidades necessárias atendidas: +10 pontos

3. **JUSTIFICATIVA**:
   - Cite elementos ESPECÍFICOS do perfil do comprador
   - Cite elementos ESPECÍFICOS da descrição do imóvel
   - Explique por que combinam ou não em 2-3 frases

## FORMATO DE RESPOSTA:
Responda APENAS com um JSON válido, sem markdown, no formato:
[
  {{
    "comprador_id": "COPIE EXATAMENTE o valor do campo 'id' do perfil do comprador",
    "score": 0-100,
    "justificativa": "2-3 frases explicando a compatibilidade"
  }}
]

IMPORTANTE: O campo "comprador_id" na resposta DEVE ser EXATAMENTE igual ao campo "id" de cada perfil listado acima. NÃO invente IDs.

Inclua TODOS os compradores na resposta, mesmo os com score baixo."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Você é um especialista em matching imobiliário. Sempre responda em JSON válido, sem markdown."
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
