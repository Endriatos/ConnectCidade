import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

_SMTP_SERVER = "smtp.gmail.com"
_SMTP_PORT = 465


def _logo_base64() -> str:
    import base64
    from pathlib import Path
    caminho = Path(__file__).parent.parent.parent / "assets" / "logoInverted.png"
    try:
        return "data:image/png;base64," + base64.b64encode(caminho.read_bytes()).decode()
    except FileNotFoundError:
        return ""


_RODAPE_PADRAO = "Você recebeu este e-mail pois recebemos uma solicitação de redefinição de senha para sua conta.<br>Se não foi você, ignore esta mensagem — nenhuma alteração será feita."
_RODAPE_STATUS = "Este e-mail foi enviado automaticamente. Por favor, não responda."


def montar_template_email(titulo: str, saudacao: str, linhas: list[str], rotulo_botao: str, url_botao: str, rodape_extra: str = "", rodape: str = "") -> str:
    logo_src = _logo_base64()
    linhas_html = "".join(f'<p style="margin:0 0 14px 0;color:#444444;font-size:15px;line-height:1.6;">{l}</p>' for l in linhas)
    rodape_extra_html = f'<p style="margin:16px 0 0 0;color:#999999;font-size:12px;line-height:1.5;">{rodape_extra}</p>' if rodape_extra else ""
    texto_rodape = rodape if rodape else _RODAPE_PADRAO
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>{titulo}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Cabeçalho -->
        <tr><td style="background-color:#3cb478;border-radius:12px 12px 0 0;padding:16px 40px;text-align:center;">
          <img src="{logo_src}" alt="Connect Cidade" style="height:32px;display:inline-block;" />
        </td></tr>

        <!-- Corpo -->
        <tr><td style="background-color:#ffffff;padding:40px 40px 32px 40px;">
          <p style="margin:0 0 20px 0;font-size:17px;font-weight:600;color:#1a1a1a;">{saudacao}</p>
          {linhas_html}

          <!-- Botão -->
          <table cellpadding="0" cellspacing="0" style="margin:28px 0 8px 0;">
            <tr><td style="background-color:#3cb478;border-radius:8px;">
              <a href="{url_botao}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">{rotulo_botao}</a>
            </td></tr>
          </table>

          {rodape_extra_html}
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="background-color:#f7f7f7;border-radius:0 0 12px 12px;padding:20px 40px;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;text-align:center;">
            {texto_rodape}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


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
