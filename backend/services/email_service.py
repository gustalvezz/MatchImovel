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


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via SMTP"""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        logger.warning("SMTP not configured, skipping email send")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        html_part = MIMEText(html_content, "html")
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


async def send_interest_registered_email(buyer_email: str, buyer_name: str, interest_data: dict) -> bool:
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
        'acima_1500k': 'Acima de R$ 1,5 milhão'
    }
    
    property_type = interest_data.get('property_type', 'Imóvel')
    if property_type in property_type_labels:
        property_type = property_type_labels[property_type]
    
    budget = budget_labels.get(interest_data.get('budget_range', ''), 'A definir')
    location = interest_data.get('location', 'A definir')
    
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


async def send_match_approved_buyer_email(buyer_email: str, buyer_name: str) -> bool:
    """Send email to buyer when a match is approved"""
    
    subject = "Wohoo! Um novo match foi encontrado! - MatchImovel"
    
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
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; text-align: center; }}
            .greeting {{ font-size: 22px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .message-box {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 30px; border-radius: 16px; margin: 24px 0; }}
            .message-box p {{ margin: 0; font-size: 18px; color: #065f46; }}
            .whatsapp-info {{ background: #dcfce7; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #22c55e; }}
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
                
                <div class="whatsapp-info">
                    <p>📱 <strong>Seu curador irá enviar mais detalhes do imóvel via WhatsApp em breve!</strong></p>
                </div>
                
                <p>Fique de olho no seu celular e prepare-se para conhecer essa oportunidade!</p>
                
                <p style="margin-top: 30px;">Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(buyer_email, subject, html_content)


async def send_match_approved_agent_email(agent_email: str, agent_name: str, buyer_name: str) -> bool:
    """Send email to agent when their match is approved"""
    
    subject = "Seu match foi aprovado! - MatchImovel"
    
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
