from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    ADMIN_CPF: str
    ADMIN_NOME: str
    ADMIN_EMAIL: str
    ADMIN_SENHA: str

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = ""

    MINIO_ENDPOINT: str = "http://minio:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "connect-cidade-fotos"
    MINIO_PUBLIC_URL: str = ""


settings = Settings()
