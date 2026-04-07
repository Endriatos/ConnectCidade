from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    ADMIN_CPF: str
    ADMIN_NOME: str
    ADMIN_EMAIL: str
    ADMIN_SENHA: str

    # Credenciais do Gmail para envio de e-mails transacionais via SMTP
    GMAIL_USER: str = ""
    # Senha de app gerada no Google (não a senha da conta) — necessária com 2FA ativo
    GMAIL_APP_PASSWORD: str = ""
    # URL base do frontend — usada para montar links nos e-mails enviados
    FRONTEND_URL: str = "http://localhost:5173"

    MINIO_ENDPOINT: str = "http://minio:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "connect-cidade-fotos"
    MINIO_PUBLIC_URL: str = ""


settings = Settings()
