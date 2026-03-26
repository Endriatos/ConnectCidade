# Connect Cidade 🏙️

> Plataforma web responsiva para reporte e acompanhamento de problemas urbanos.
> Trabalho de Conclusão de Curso — Análise e Desenvolvimento de Sistemas · Uniftec · 2026

**Acesse:** https://connectcidade.duckdns.org/

---

## Sobre o projeto

O **Connect Cidade** conecta cidadãos à gestão municipal, permitindo o registro, acompanhamento e apoio a solicitações de resolução de problemas urbanos nas categorias **Coleta de Resíduos**, **Iluminação Pública**, **Acessibilidade** e **Manutenção de Vias**.

O cidadão registra o problema com foto, localização GPS e descrição. A administração recebe, encaminha e atualiza o status. O cidadão acompanha tudo por uma timeline transparente e recebe notificações a cada atualização.

---

## Tech Stack

| Camada             | Tecnologias                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| **Backend**        | Python · FastAPI · PostgreSQL · SQLAlchemy · Alembic · Pydantic        |
| **Frontend**       | React · Vite · Tailwind CSS · Leaflet.js · Recharts · Zustand · Lottie |
| **Infraestrutura** | Docker · Oracle Cloud (Ubuntu 24.04 aarch64) · MinIO · Resend          |

---

## Pré-requisitos

```bash
python --version   # 3.12+
node --version     # 22+
psql --version     # 16+
git --version
```

---

## Instalação e execução local

### Execução com Docker (recomendado)

1. Preencha os arquivos `.env`. As envs local estão disponíveis em https://drive.google.com/drive/folders/13nKMX3N8IUn5QwFhNWWzmiTNGjmJ9qSS?usp=drive_link

- `./.env`
- `./backend/.env`

2. Suba a stack local com build das imagens do backend e frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

3. Execute o seed inicial (categorias e administrador):

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml exec backend python seed.py
```

4. Acesse:

- App: `http://localhost`
- MinIO Console: `http://localhost:9001`
- MinIO API: `http://localhost:9000`

Comandos úteis:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

Credenciais padrão de administrador (após seed):

- CPF: `00000000000`
- Senha: `troque_esta_senha`

### Execução sem Docker (manual)

#### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

API disponível em `http://localhost:8000` · Documentação em `http://localhost:8000/docs`

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponível em `http://localhost:5173`

---

## Estrutura do projeto

```
ConnectCidade/
├── backend/
│   ├── app/
│   │   ├── models/       # Mapeamento das tabelas (SQLAlchemy)
│   │   ├── schemas/      # Validação de dados (Pydantic)
│   │   ├── routers/      # Endpoints da API (FastAPI)
│   │   ├── crud/         # Operações de banco de dados
│   │   └── utils/        # Autenticação, email, foto, geolocalização
│   ├── migrations/       # Histórico de versões do banco (Alembic)
│   ├── seed.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/   # Componentes reutilizáveis
        ├── pages/        # Telas da aplicação
        ├── services/     # Integração com a API
        └── store/        # Estado global (Zustand)
```

---

## Funcionalidades

**Cidadão**

- Cadastro e autenticação via CPF
- Registro de solicitações com foto, GPS e descrição
- Mapa interativo com todas as solicitações abertas
- Apoio a solicitações de outros cidadãos
- Acompanhamento por timeline e notificações
- Avaliação do atendimento após resolução

**Administrador**

- Painel com listagem e filtros de solicitações
- Atualização de status com comentário obrigatório
- Dashboard com indicadores de desempenho
- Gestão de administradores

---

## Arquitetura de deploy

A aplicação roda em uma VM Oracle Cloud (Ubuntu 24.04 · ARM aarch64) com três containers Docker gerenciados pelo Compose:

| Container  | Imagem base                                       | Função                                  |
| ---------- | ------------------------------------------------- | --------------------------------------- |
| `frontend` | `nginx:alpine` (multi-stage com `node:22-alpine`) | Build do React + reverse proxy          |
| `backend`  | `python:3.12-slim`                                | API FastAPI via Uvicorn                 |
| `db`       | `postgres:16-alpine`                              | Banco de dados (volume persistente)     |
| `minio`    | `minio/minio:latest`                              | Armazenamento de fotos das solicitações |

O Nginx recebe todas as requisições na porta 80. Chamadas para `/api/*` são repassadas ao backend; todo o resto serve os arquivos estáticos do React com fallback para `index.html`.

---

## Convenções de código

| Onde                           | Estilo       |
| ------------------------------ | ------------ |
| Backend — variáveis e funções  | `snake_case` |
| Backend — classes              | `PascalCase` |
| Frontend — variáveis e funções | `camelCase`  |
| Frontend — componentes         | `PascalCase` |
| Banco de dados                 | `snake_case` |
| URLs da API                    | `kebab-case` |

---
