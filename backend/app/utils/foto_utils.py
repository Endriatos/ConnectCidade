import io
import json
import uuid

import boto3
from botocore.config import Config
from PIL import Image

from app.config import settings


def get_cliente_minio():
    """
    Cria e retorna um cliente boto3 configurado para se comunicar com o MinIO.

    O MinIO é compatível com a API S3 da AWS, portanto usamos boto3 com
    endpoint_url apontando para o servidor MinIO e signature_version='s3v4',
    que é o padrão exigido pelo MinIO para autenticação.
    """
    return boto3.client(
        "s3",
        endpoint_url=settings.MINIO_ENDPOINT,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


def garantir_bucket_publico():
    """
    Verifica se o bucket configurado em settings.MINIO_BUCKET_NAME existe.
    Se não existir, cria o bucket. Em seguida, aplica uma policy de leitura
    pública (GetObject) para todos os objetos, permitindo que as fotos sejam
    acessadas via URL sem autenticação.
    """
    cliente = get_cliente_minio()
    bucket = settings.MINIO_BUCKET_NAME

    # Verifica se o bucket já existe; cria caso não exista
    buckets_existentes = [b["Name"] for b in cliente.list_buckets().get("Buckets", [])]
    if bucket not in buckets_existentes:
        cliente.create_bucket(Bucket=bucket)

    # Policy que permite leitura pública (s3:GetObject) de qualquer objeto no bucket
    policy_publica = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket}/*",
            }
        ],
    }
    cliente.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy_publica))


def processar_imagem(arquivo_bytes: bytes) -> bytes:
    """
    Recebe os bytes brutos de uma imagem e retorna bytes de uma imagem JPEG
    processada, com as seguintes transformações:

    - Conversão para RGB (remove canal alpha de PNGs, por exemplo)
    - Redimensionamento proporcional para caber em 1920x1080 (sem distorção)
    - Compressão JPEG com qualidade 85 (bom equilíbrio entre tamanho e qualidade)
    - Remoção de metadados EXIF (privacidade: elimina GPS, câmera, autor, etc.)
    """
    imagem = Image.open(io.BytesIO(arquivo_bytes))

    # Converte para RGB para garantir compatibilidade com JPEG (ex.: RGBA, P, L)
    if imagem.mode != "RGB":
        imagem = imagem.convert("RGB")

    # Redimensiona mantendo a proporção original, limitando a 1920x1080
    imagem.thumbnail((1920, 1080), Image.LANCZOS)

    # Salva como JPEG em memória sem metadados EXIF
    # Não passamos o parâmetro exif, o que efetivamente remove os metadados
    saida = io.BytesIO()
    imagem.save(saida, format="JPEG", quality=85, optimize=True)
    return saida.getvalue()


def fazer_upload_foto(arquivo_bytes: bytes, nome_original: str) -> str:
    """
    Pipeline completo de upload de uma foto para o MinIO:

    1. Processa a imagem (redimensiona, comprime, remove EXIF)
    2. Gera um nome de arquivo único usando UUID4 para evitar colisões
    3. Faz o upload para o bucket configurado com Content-Type correto
    4. Retorna a URL pública completa para acesso direto ao arquivo

    Parâmetros:
        arquivo_bytes: bytes brutos do arquivo enviado pelo usuário
        nome_original: nome original do arquivo (usado apenas para extensão, ignorado no armazenamento)

    Retorna:
        URL pública no formato: {MINIO_PUBLIC_URL}/{bucket}/{chave}
    """
    # Processa e comprime a imagem antes de armazenar
    imagem_processada = processar_imagem(arquivo_bytes)

    # Gera nome único para o arquivo no bucket (evita sobrescrita e colisões)
    chave = f"{uuid.uuid4()}.jpg"

    cliente = get_cliente_minio()
    bucket = settings.MINIO_BUCKET_NAME

    # Faz o upload dos bytes processados com Content-Type explícito
    cliente.put_object(
        Bucket=bucket,
        Key=chave,
        Body=imagem_processada,
        ContentLength=len(imagem_processada),
        ContentType="image/jpeg",
    )

    # Monta e retorna a URL pública para acesso direto à imagem
    url_publica = f"{settings.MINIO_PUBLIC_URL.rstrip('/')}/{chave}"
    return url_publica

