import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

# Servidor e porta do Gmail para envio via SSL
_SMTP_SERVER = "smtp.gmail.com"
_SMTP_PORT = 465


def enviar_email(destinatario: str, assunto: str, corpo_html: str) -> None:
    """
    Envia um e-mail HTML via Gmail SMTP com SSL nativo.

    Utiliza as credenciais configuradas em GMAIL_USER e GMAIL_APP_PASSWORD.
    Lança RuntimeError em português se o envio falhar por qualquer motivo.
    """
    # Monta a mensagem com suporte a corpo HTML
    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = assunto
    mensagem["From"] = settings.GMAIL_USER
    mensagem["To"] = destinatario

    # Anexa o corpo em HTML — clientes sem suporte a HTML exibirão texto simples
    mensagem.attach(MIMEText(corpo_html, "html", "utf-8"))

    # Cria contexto SSL seguro para a conexão com o servidor
    contexto_ssl = ssl.create_default_context()

    try:
        with smtplib.SMTP_SSL(_SMTP_SERVER, _SMTP_PORT, context=contexto_ssl) as servidor:
            servidor.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            servidor.sendmail(settings.GMAIL_USER, destinatario, mensagem.as_string())
    except Exception as erro:
        raise RuntimeError(f"Falha ao enviar e-mail para {destinatario}: {erro}") from erro
