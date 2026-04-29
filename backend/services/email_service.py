"""
Email notification service
Handles all SMTP email sending functionality
"""
import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
    """Send email via SMTP with HTML and optional plain text fallback"""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        logger.warning("SMTP not configured, skipping email send")
        return False

    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Plain text must be attached first — email clients prefer the last part
        if text_content:
            text_part = MIMEText(text_content, "plain", "utf-8")
            message.attach(text_part)

        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)

        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


async def send_interest_registered_email(buyer_email: str, buyer_name: str, interest_data: dict, ai_interpretation: dict = None) -> bool:
    """Send email to buyer when interest is registered"""
    
    property_type_labels = {
        'apartamento': 'Apartamento',
        'casa': 'Casa',
        'casa_condominio': 'Casa de condomínio',
        'terreno': 'Terreno',
        'terreno_condominio': 'Terreno de condomínio',
        'sala_comercial': 'Sala comercial',
        'predio_comercial': 'Prédio comercial',
        'studio_loft': 'Studio/Loft'
    }
    
    budget_labels = {
        'ate_400k': 'Até R$ 400 mil',
        '400k_550k': 'R$ 400 a 550 mil',
        '550k_700k': 'R$ 550 a 700 mil',
        '700k_800k': 'R$ 700 a 800 mil',
        '800k_1500k': 'R$ 800 mil a 1,5 milhão',
        'acima_1500k': 'Acima de R$ 1,5 milhão',
        'ate_550k': 'Até R$ 550 mil',
        'ate_700k': 'Até R$ 700 mil',
        'ate_800k': 'Até R$ 800 mil',
        'ate_1500k': 'Até R$ 1,5 milhão',
        'ate_2500k': 'Até R$ 2,5 milhões',
        'ate_5000k': 'Até R$ 5 milhões',
        'acima_5000k': 'Acima de R$ 5 milhões'
    }
    
    property_type = interest_data.get('property_type', 'Imóvel')
    if property_type in property_type_labels:
        property_type = property_type_labels[property_type]
    
    budget = budget_labels.get(interest_data.get('budget_range', ''), 'A definir')
    location = interest_data.get('location', 'A definir')
    
    # Build AI interpretation section if available
    ai_section = ""
    if ai_interpretation:
        perfil_narrativo = ai_interpretation.get('perfil_narrativo', '')
        criterios = ai_interpretation.get('criterios_inegociaveis', [])
        imovel_ideal = ai_interpretation.get('perfil_do_imovel_ideal', '')
        alertas = ai_interpretation.get('alertas', [])
        
        criterios_html = ""
        if criterios:
            criterios_items = "".join([f'<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 20px; font-size: 12px; margin: 2px;">{c}</span>' for c in criterios])
            criterios_html = f'''
                <div style="margin-top: 16px;">
                    <p style="font-weight: 600; color: #64748b; margin-bottom: 8px; font-size: 14px;">O que você não abre mão:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">{criterios_items}</div>
                </div>
            '''
        
        imovel_html = ""
        if imovel_ideal:
            imovel_html = f'''
                <div style="background: #dcfce7; padding: 16px; border-radius: 12px; margin-top: 16px;">
                    <p style="font-weight: 600; color: #166534; margin-bottom: 8px; font-size: 14px;">Imóvel ideal para você:</p>
                    <p style="color: #15803d; font-size: 14px; margin: 0;">{imovel_ideal}</p>
                </div>
            '''
        
        alertas_html = ""
        if alertas:
            alertas_items = "".join([f'<li style="margin: 4px 0;">{a}</li>' for a in alertas])
            alertas_html = f'''
                <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin-top: 16px;">
                    <p style="font-weight: 600; color: #92400e; margin-bottom: 8px; font-size: 14px;">Pontos de atenção:</p>
                    <ul style="color: #78350f; font-size: 14px; margin: 0; padding-left: 20px;">{alertas_items}</ul>
                </div>
            '''
        
        ai_section = f'''
                <div style="background: linear-gradient(135deg, #f3e8ff, #e0e7ff); padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #7c3aed; font-size: 18px;">✨ Análise do seu perfil por IA</h3>
                    <p style="color: #4c1d95; font-size: 14px; line-height: 1.6; margin: 0;">{perfil_narrativo}</p>
                    {criterios_html}
                    {imovel_html}
                    {alertas_html}
                </div>
        '''
    
    subject = "Seu interesse foi cadastrado com sucesso! - MatchImovel"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .header p {{ color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .info-card {{ background: #f0f4ff; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #6366f1; }}
            .info-card h3 {{ margin: 0 0 16px 0; color: #4f46e5; font-size: 18px; }}
            .info-row {{ display: flex; margin: 8px 0; }}
            .info-label {{ font-weight: 600; color: #64748b; min-width: 120px; }}
            .info-value {{ color: #1e293b; }}
            .next-steps {{ background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; }}
            .next-steps h3 {{ margin: 0 0 16px 0; color: #92400e; font-size: 18px; }}
            .next-steps ul {{ margin: 0; padding-left: 20px; color: #78350f; }}
            .next-steps li {{ margin: 8px 0; }}
            .highlight {{ background: #e0e7ff; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center; }}
            .highlight p {{ margin: 0; color: #4338ca; font-weight: 500; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
            .emoji {{ font-size: 24px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MatchImovel</h1>
                <p>Seu interesse foi cadastrado com sucesso!</p>
            </div>
            <div class="content">
                <p class="greeting">Olá, {buyer_name}! <span class="emoji">👋</span></p>
                
                <p>Parabéns! Seu interesse de compra foi registrado em nossa plataforma. Agora nossa equipe de especialistas vai trabalhar para encontrar o imóvel ideal para você.</p>
                
                <div class="info-card">
                    <h3>📋 Resumo do seu interesse</h3>
                    <div class="info-row">
                        <span class="info-label">Tipo de imóvel:</span>
                        <span class="info-value">{property_type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Localização:</span>
                        <span class="info-value">{location}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Investimento:</span>
                        <span class="info-value">{budget}</span>
                    </div>
                </div>
                
                {ai_section}
                
                <div class="next-steps">
                    <h3>📞 Próximos passos</h3>
                    <ul>
                        <li><strong>Um curador especialista da equipe MatchImovel entrará em contato pelo telefone cadastrado</strong> para confirmar e detalhar ainda mais seu perfil.</li>
                        <li>Esse contato é muito importante para que possamos <strong>filtrar as ofertas</strong> e enviar apenas opções que realmente façam sentido para você.</li>
                        <li>O curador é um <strong>corretor habilitado</strong> que irá acompanhá-lo em todo o processo de compra, desde a busca até a assinatura do contrato.</li>
                    </ul>
                </div>
                
                <div class="highlight">
                    <p><span class="emoji">🎯</span> Nosso objetivo é conectar você ao imóvel perfeito, sem perda de tempo com opções que não fazem sentido!</p>
                </div>
                
                <p>Enquanto isso, fique tranquilo! Corretores parceiros já podem visualizar seu perfil e enviar ofertas compatíveis com o que você busca.</p>
                
                <p>Qualquer dúvida, estamos à disposição!</p>
                
                <p>Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
                <p>Este é um email automático, por favor não responda.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(buyer_email, subject, html_content)


async def send_match_approved_buyer_email(
    buyer_email: str, 
    buyer_name: str,
    ai_compatibility: dict = None,
    property_info: dict = None
) -> bool:
    """Send email to buyer when a match is approved"""
    
    subject = "Wohoo! Um novo match foi encontrado! - MatchImovel"
    
    # Build AI compatibility section
    ai_section = ""
    if ai_compatibility:
        score = ai_compatibility.get('score', 0)
        justificativa = ai_compatibility.get('justificativa', '')
        score_color = '#22c55e' if score >= 80 else '#eab308' if score >= 60 else '#f97316'
        
        ai_section = f"""
        <div style="background: linear-gradient(135deg, #eef2ff, #e0e7ff); padding: 24px; border-radius: 16px; margin: 24px 0; border: 2px solid #818cf8;">
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background: {score_color}; color: white; font-size: 28px; font-weight: bold; line-height: 80px;">
                    {score}%
                </div>
            </div>
            <h3 style="margin: 0 0 12px 0; color: #4f46e5; font-size: 18px; text-align: center;">✨ Compatibilidade com seu perfil</h3>
            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; text-align: center;">{justificativa}</p>
        </div>
        """
    
    # Build property info section
    property_section = ""
    if property_info:
        details = []
        if property_info.get('bedrooms'):
            details.append(f"🛏️ {property_info['bedrooms']} quartos")
        if property_info.get('bathrooms'):
            details.append(f"🚿 {property_info['bathrooms']} banheiros")
        if property_info.get('area_m2'):
            details.append(f"📐 {property_info['area_m2']} m²")
        if property_info.get('price'):
            details.append(f"💰 R$ {property_info['price']:,.0f}".replace(',', '.'))
        
        details_html = " • ".join(details) if details else ""
        address_html = f"<p style='margin: 12px 0 0 0; color: #6b7280; font-size: 14px;'>📍 {property_info.get('address', '')}</p>" if property_info.get('address') else ""
        
        property_section = f"""
        <div style="background: #f0fdf4; padding: 24px; border-radius: 16px; margin: 24px 0; border: 2px solid #86efac;">
            <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 18px;">🏠 Sobre o imóvel</h3>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;">{property_info.get('description', '')}</p>
            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">{details_html}</p>
            {address_html}
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 32px; }}
            .celebration {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 22px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center; }}
            .message-box {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 30px; border-radius: 16px; margin: 24px 0; text-align: center; }}
            .message-box p {{ margin: 0; font-size: 18px; color: #065f46; }}
            .whatsapp-info {{ background: #dcfce7; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #22c55e; text-align: center; }}
            .whatsapp-info p {{ margin: 0; color: #166534; font-weight: 500; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="celebration">🎉</div>
                <h1>Wohoo!</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {buyer_name}!</p>
                
                <div class="message-box">
                    <p><strong>Um novo match foi encontrado para você!</strong></p>
                    <p style="margin-top: 16px;">Um corretor parceiro encontrou um imóvel que pode ser perfeito para o que você procura! 🏠</p>
                </div>
                
                {ai_section}
                
                {property_section}
                
                <div class="whatsapp-info">
                    <p>📱 <strong>Seu curador irá enviar mais detalhes do imóvel via WhatsApp em breve!</strong></p>
                </div>
                
                <p style="text-align: center;">Fique de olho no seu celular e prepare-se para conhecer essa oportunidade!</p>
                
                <p style="margin-top: 30px; text-align: center;">Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(buyer_email, subject, html_content)


async def send_match_approved_agent_email(
    agent_email: str, 
    agent_name: str, 
    buyer_name: str,
    buyer_info: dict = None,
    ai_compatibility: dict = None
) -> bool:
    """Send email to agent when their match is approved"""
    
    subject = "Seu match foi aprovado! - MatchImovel"
    
    # Build buyer profile section
    buyer_section = ""
    if buyer_info:
        interpretacao = buyer_info.get('interpretacaoIA') or {}
        
        # Build profile details
        details_parts = []
        if buyer_info.get('property_type'):
            details_parts.append(f"Tipo: {buyer_info['property_type']}")
        if buyer_info.get('location'):
            details_parts.append(f"Local: {buyer_info['location']}")
        if buyer_info.get('budget_range'):
            budget_labels = {
                'ate_400k': 'Até R$ 400 mil',
                'ate_550k': 'Até R$ 550 mil',
                'ate_700k': 'Até R$ 700 mil',
                'ate_800k': 'Até R$ 800 mil',
                'ate_1500k': 'Até R$ 1,5 milhão',
                'ate_2500k': 'Até R$ 2,5 milhões',
                'ate_5000k': 'Até R$ 5 milhões',
                'acima_5000k': 'Acima de R$ 5 milhões'
            }
            details_parts.append(f"Orçamento: {budget_labels.get(buyer_info['budget_range'], buyer_info['budget_range'])}")
        
        details_html = " • ".join(details_parts) if details_parts else ""
        
        # AI interpretation section
        ai_interpretation_html = ""
        if interpretacao.get('perfil_narrativo'):
            ai_interpretation_html = f"""
            <div style="background: linear-gradient(135deg, #f3e8ff, #e0e7ff); padding: 20px; border-radius: 12px; margin: 16px 0;">
                <h4 style="margin: 0 0 12px 0; color: #7c3aed; font-size: 14px;">✨ Análise de Perfil por IA</h4>
                <p style="margin: 0; color: #4c1d95; font-size: 14px; line-height: 1.5;">{interpretacao['perfil_narrativo']}</p>
            </div>
            """
        
        # Ideal property section
        ideal_property_html = ""
        if interpretacao.get('perfil_do_imovel_ideal'):
            ideal_property_html = f"""
            <div style="background: #dcfce7; padding: 16px; border-radius: 10px; margin: 12px 0;">
                <p style="font-weight: 600; color: #166534; margin: 0 0 8px 0; font-size: 13px;">Imóvel ideal para este comprador:</p>
                <p style="color: #15803d; font-size: 13px; margin: 0; line-height: 1.5;">{interpretacao['perfil_do_imovel_ideal']}</p>
            </div>
            """
        
        # Criteria section
        criterios_html = ""
        criterios = interpretacao.get('criterios_inegociaveis', [])
        if criterios:
            criterios_badges = "".join([f'<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 20px; font-size: 11px; margin: 2px; display: inline-block;">{c}</span>' for c in criterios[:6]])
            criterios_html = f"""
            <div style="margin: 12px 0;">
                <p style="font-weight: 600; color: #64748b; margin: 0 0 8px 0; font-size: 12px;">Critérios inegociáveis:</p>
                <div>{criterios_badges}</div>
            </div>
            """
        
        buyer_section = f"""
        <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 2px solid #e2e8f0;">
            <h3 style="margin: 0 0 16px 0; color: #334155; font-size: 18px;">👤 Perfil do Comprador</h3>
            <p style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 600;">{buyer_name}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">{details_html}</p>
            {ai_interpretation_html}
            {ideal_property_html}
            {criterios_html}
        </div>
        """
    
    # AI compatibility section
    ai_section = ""
    if ai_compatibility:
        score = ai_compatibility.get('score', 0)
        justificativa = ai_compatibility.get('justificativa', '')
        score_color = '#22c55e' if score >= 80 else '#eab308' if score >= 60 else '#f97316'
        
        ai_section = f"""
        <div style="background: linear-gradient(135deg, #eef2ff, #e0e7ff); padding: 20px; border-radius: 12px; margin: 16px 0; text-align: center;">
            <div style="display: inline-block; width: 60px; height: 60px; border-radius: 50%; background: {score_color}; color: white; font-size: 22px; font-weight: bold; line-height: 60px; margin-bottom: 12px;">
                {score}%
            </div>
            <p style="margin: 0; color: #4f46e5; font-size: 14px;">{justificativa}</p>
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .checkmark {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .success-box {{ background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #22c55e; }}
            .success-box p {{ margin: 0; color: #166534; }}
            .info-box {{ background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0; }}
            .info-box p {{ margin: 0; color: #1e40af; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="checkmark">✅</div>
                <h1>Match Aprovado!</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {agent_name}!</p>
                
                <div class="success-box">
                    <p><strong>Ótima notícia!</strong> Seu match com <strong>{buyer_name}</strong> foi aprovado pela nossa equipe de curadoria!</p>
                </div>
                
                {buyer_section}
                
                {ai_section}
                
                <div class="info-box">
                    <p>📋 <strong>Próximos passos:</strong></p>
                    <p style="margin-top: 12px;">Aguarde o contato da equipe MatchImovel. Nosso curador irá intermediar a comunicação entre você e o comprador para agendar uma visita ao imóvel.</p>
                </div>
                
                <p>Obrigado por fazer parte da nossa rede de corretores parceiros!</p>
                
                <p style="margin-top: 30px;">Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(agent_email, subject, html_content)


async def send_deletion_notification_curator(
    curator_email: str, 
    curator_name: str, 
    deletion_type: str,
    deleted_by_name: str,
    deleted_by_email: str,
    deleted_by_phone: str,
    reason: str,
    description: str
) -> bool:
    """Send email to curator when an interest or match is deleted"""
    
    reason_labels = {
        'ja_comprei': 'Já comprei um imóvel',
        'mudei_planos': 'Mudei de planos',
        'nao_interessado': 'Não tenho mais interesse',
        'imovel_vendido': 'Imóvel já vendeu',
        'proprietario_desistiu': 'Proprietário desistiu da venda',
        'outro': 'Outro motivo'
    }
    
    reason_text = reason_labels.get(reason, reason)
    
    if deletion_type == 'interest':
        subject = "⚠️ Interesse excluído por comprador - MatchImovel"
        title = "Um comprador excluiu seu interesse"
        person_type = "Comprador"
    else:
        subject = "⚠️ Match excluído por corretor - MatchImovel"
        title = "Um corretor excluiu um match"
        person_type = "Corretor"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 24px; }}
            .warning {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .info-card {{ background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b; }}
            .info-card h3 {{ margin: 0 0 16px 0; color: #92400e; font-size: 16px; }}
            .info-row {{ margin: 8px 0; }}
            .info-label {{ font-weight: 600; color: #78350f; }}
            .info-value {{ color: #451a03; }}
            .reason-box {{ background: #fee2e2; padding: 20px; border-radius: 12px; margin: 24px 0; }}
            .reason-box h4 {{ margin: 0 0 12px 0; color: #991b1b; }}
            .reason-box p {{ margin: 0; color: #7f1d1d; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="warning">⚠️</div>
                <h1>{title}</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {curator_name}!</p>
                
                <p>Informamos que um {deletion_type} vinculado a você foi excluído. Veja os detalhes abaixo:</p>
                
                <div class="info-card">
                    <h3>👤 Dados do {person_type}</h3>
                    <div class="info-row">
                        <span class="info-label">Nome:</span>
                        <span class="info-value">{deleted_by_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{deleted_by_email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Telefone:</span>
                        <span class="info-value">{deleted_by_phone or 'Não informado'}</span>
                    </div>
                </div>
                
                <div class="reason-box">
                    <h4>📝 Motivo da exclusão</h4>
                    <p><strong>{reason_text}</strong></p>
                    {f'<p style="margin-top: 12px;">{description}</p>' if description else ''}
                </div>
                
                <p>Se necessário, entre em contato com a pessoa para entender melhor a situação.</p>
                
                <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(curator_email, subject, html_content)


async def send_creci_verified_email(agent_email: str, agent_name: str, creci: str) -> bool:
    """Send email to agent when CRECI is verified and approved"""
    
    subject = "✅ Seu CRECI foi verificado! - MatchImovel"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .checkmark {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; text-align: center; }}
            .greeting {{ font-size: 22px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .message-box {{ background: #ecfdf5; padding: 30px; border-radius: 16px; margin: 24px 0; border: 2px solid #10b981; }}
            .message-box p {{ margin: 0; font-size: 16px; color: #065f46; }}
            .creci-badge {{ background: #d1fae5; padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 20px 0; }}
            .creci-badge span {{ font-size: 20px; font-weight: 700; color: #047857; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="checkmark">✅</div>
                <h1>CRECI Verificado!</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {agent_name}!</p>
                
                <div class="message-box">
                    <p><strong>Ótima notícia!</strong> Seu CRECI foi verificado pela nossa equipe e está tudo em ordem com seu cadastro!</p>
                </div>
                
                <div class="creci-badge">
                    <span>CRECI: {creci}</span>
                </div>
                
                <p>Agora você pode utilizar todas as funcionalidades da plataforma MatchImovel normalmente.</p>
                
                <p>Bons negócios!</p>
                
                <p style="margin-top: 30px;">Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(agent_email, subject, html_content)


async def send_creci_blocked_email(agent_email: str, agent_name: str, creci: str) -> bool:
    """Send email to agent when CRECI is marked as invalid/blocked"""
    
    subject = "⚠️ Pendência no seu CRECI - MatchImovel"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .warning {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .alert-box {{ background: #fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444; }}
            .alert-box p {{ margin: 0; color: #991b1b; }}
            .creci-badge {{ background: #fee2e2; padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 20px 0; }}
            .creci-badge span {{ font-size: 18px; font-weight: 700; color: #b91c1c; }}
            .action-box {{ background: #fef3c7; padding: 20px; border-radius: 12px; margin: 24px 0; }}
            .action-box h4 {{ margin: 0 0 12px 0; color: #92400e; }}
            .action-box ul {{ margin: 0; padding-left: 20px; color: #78350f; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="warning">⚠️</div>
                <h1>Atenção: Pendência no CRECI</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {agent_name}!</p>
                
                <div class="alert-box">
                    <p><strong>Identificamos uma pendência com seu CRECI.</strong> Seu acesso à plataforma está temporariamente bloqueado até a regularização.</p>
                </div>
                
                <div class="creci-badge">
                    <span>CRECI: {creci}</span>
                </div>
                
                <div class="action-box">
                    <h4>📋 O que fazer agora?</h4>
                    <ul>
                        <li>Verifique se seu CRECI está ativo junto ao CRECI do seu estado</li>
                        <li>Caso tenha alguma pendência, regularize-a</li>
                        <li>Entre em contato conosco pelo email suporte@matchimovel.com.br informando seu CRECI atualizado</li>
                    </ul>
                </div>
                
                <p>Assim que a situação for regularizada, liberaremos seu acesso imediatamente.</p>
                
                <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(agent_email, subject, html_content)


async def send_visit_notification(
    to_email: str,
    to_name: str,
    visit_date: str,
    visit_time: str,
    property_address: str,
    is_reminder: bool = False,
    is_2h_reminder: bool = False
) -> bool:
    """Send visit notification email"""
    
    if is_2h_reminder:
        subject = "⏰ Lembrete: Visita em 2 horas - MatchImovel"
        title = "Sua visita é em 2 horas!"
        message = f"Lembrando que você tem uma visita agendada para <strong>hoje às {visit_time}</strong>."
    elif is_reminder:
        subject = "📅 Lembrete: Visita agendada - MatchImovel"
        title = "Lembrete de visita agendada"
        message = f"Você tem uma visita agendada para <strong>{visit_date} às {visit_time}</strong>."
    else:
        subject = "🏠 Visita agendada - MatchImovel"
        title = "Nova visita agendada!"
        message = f"Uma visita foi agendada para <strong>{visit_date} às {visit_time}</strong>."
    
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .info-box {{ background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 15px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .highlight {{ color: #6366f1; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MatchImovel</h1>
            </div>
            <div class="content">
                <h2>{title}</h2>
                <p>Olá, <strong>{to_name}</strong>!</p>
                <p>{message}</p>
                
                <div class="info-box">
                    <p><strong>📍 Endereço:</strong> {property_address}</p>
                    <p><strong>📅 Data:</strong> {visit_date}</p>
                    <p><strong>🕐 Horário:</strong> {visit_time}</p>
                </div>
                
                <p>Em caso de dúvidas ou necessidade de reagendamento, entre em contato com nossa equipe de curadoria.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, email_html)



async def send_saved_search_results_email(
    to_email: str,
    agent_name: str,
    property_description: str,
    matches_found: int,
    days_remaining: int
) -> bool:
    """Send email notification about saved search results"""
    
    if matches_found > 0:
        subject = f"MatchImovel: Encontramos {matches_found} novos compradores para seu imóvel!"
        result_message = f"""
            <p style="font-size: 18px; color: #059669; font-weight: bold;">
                Boas notícias! Encontramos {matches_found} novo(s) comprador(es) compatível(is) com seu imóvel.
            </p>
            <p>
                Acesse sua conta no MatchImovel para verificar os detalhes e dar match com os compradores interessados.
            </p>
        """
        cta_text = "Ver Compradores Compatíveis"
        cta_color = "#059669"
    else:
        subject = "MatchImovel: Atualização da sua busca automática"
        result_message = f"""
            <p>
                Rodamos sua busca automática em todos os novos compradores cadastrados e, 
                infelizmente, não encontramos matches compatíveis desta vez.
            </p>
            <p style="color: #d97706; font-weight: 500;">
                Sua busca será executada automaticamente novamente em 7 dias. 
                Restam <strong>{days_remaining} dias</strong> antes da desativação automática por inatividade.
            </p>
        """
        cta_text = "Acessar Meu Painel"
        cta_color = "#6366f1"
    
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
            .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }}
            .property-box {{ background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }}
            .cta {{ display: inline-block; background: {cta_color}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">MatchImovel</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Busca Automática de Compradores</p>
            </div>
            <div class="content">
                <p>Olá, <strong>{agent_name}</strong>!</p>
                
                {result_message}
                
                <div class="property-box">
                    <strong>Imóvel buscado:</strong>
                    <p style="margin: 10px 0 0 0; color: #4b5563;">{property_description}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://matchimovel.com.br/dashboard/agent" class="cta">{cta_text}</a>
                </div>
                
                <p style="font-size: 13px; color: #6b7280; margin-top: 30px;">
                    Esta é uma notificação automática do sistema de buscas salvas. 
                    Para desativar esta busca, acesse seu painel e clique em "Desativar" na seção "Minhas Buscas Ativas".
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, email_html)
