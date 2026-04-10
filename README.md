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
python --version   # 3.10 ou superior (recomendado 3.12+)
node --version     # 22+
psql --version     # 16+
git --version
```

---

## Instalação e execução local

Antes de executar o projeto, substitua os valores dos arquivos `.env`. As envs local estão disponíveis em https://drive.google.com/drive/folders/13nKMX3N8IUn5QwFhNWWzmiTNGjmJ9qSS?usp=drive_link

- `./.env`
- `./backend/.env`

### Desenvolvimento local (recomendado): Docker só no PostgreSQL e MinIO

Para trabalhar no **backend** e no **frontend** com alterações rápidas, o fluxo mais prático é subir **apenas** o banco e o MinIO no Docker e rodar a API e o Vite **na máquina**.

**Por quê:** na stack completa em Docker, o frontend é gerado com `npm run build` dentro da imagem e servido pelo Nginx — a cada mudança no React costuma ser necessário **reconstruir a imagem**. O backend no container roda o Uvicorn **sem** `--reload`, então mudanças no Python **não** recarregam sozinhas. Rodando API com `uvicorn --reload` e o app com `npm run dev`, você ganha recarregamento imediato e evita builds repetidos.

1. Na raiz do repositório, `./.env` deve definir `DB_PASSWORD`, `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` (consistentes com o que você usa em `backend/.env`).

2. Suba só o banco e o MinIO:

```bash
docker compose -f docker-compose.yml up -d db minio
```

3. Em `backend/.env`, com a API **fora** do Docker, use `DATABASE_URL` com **localhost** (porta `5432`) e `MINIO_ENDPOINT` com **http://localhost:9000** (não use os hostnames `db` ou `minio`).

4. **Backend** (primeira vez: criar venv, dependências, migrations e seed):

```bash
cd backend
python -m venv venv
```

No Windows (PowerShell), ative o venv e instale:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

No Linux ou macOS:

```bash
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

API: `http://localhost:8000` · documentação: `http://localhost:8000/docs`

5. **Frontend** (outro terminal):

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`. A URL da API vem de `VITE_API_URL` ou, se não estiver definida, de `http://localhost:8000` (ver `frontend/src/services/api.js`).

Para o Google Maps no dev, copie `frontend/.env.example` para `frontend/.env` e defina `VITE_GOOGLE_MAPS_API_KEY`. O `VITE_GOOGLE_MAPS_MAP_ID` pode ficar no `frontend/.env`, nos **repository secrets** do GitHub Actions e nos build args do Docker (`docker-compose.local.yml`) para o pipeline já receber o valor quando o front passar a usar no código; hoje o bundle só depende da API key. No deploy, configure os secrets `VITE_GOOGLE_MAPS_API_KEY` e `VITE_GOOGLE_MAPS_MAP_ID` (este último pode ficar vazio).

MinIO: API `http://localhost:9000` · console `http://localhost:9001`

Comandos úteis:

```bash
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs -f db minio
docker compose -f docker-compose.yml stop db minio
```

**No dia a dia** (venv e `node_modules` já criados): garantir `db` e `minio` no ar, ativar o venv, `uvicorn app.main:app --reload` e, em outro terminal, `npm run dev`. Rode `alembic upgrade head` quando houver migrations novas; `python seed.py` só quando precisar recriar dados iniciais.

### Problemas comuns: Python, venv e pip

| Sintoma | O que fazer |
| --------|-------------|
| `No pyvenv.cfg file` ao usar o Python do `venv` | A pasta `venv` está incompleta ou corrompida. Apague `backend/venv`, recrie com `python -m venv venv` (ou `py -3.11 -m venv venv` no Windows) e instale de novo com `pip install -r requirements.txt`. |
| `No matching distribution found for alembic==...` e o pip lista versões antigas do Alembic | O interpretador do venv é **Python anterior a 3.10**. As dependências atuais exigem **3.10 ou mais**. No Windows, veja versões com `py --list` e crie o venv com uma instalada, por exemplo `py -3.11 -m venv venv`. |
| `No suitable Python runtime found` ao usar `py -3.12` | O Python 3.12 não está instalado. Use uma versão que apareça em `py --list` (por exemplo 3.11) ou instale 3.12 em [python.org](https://www.python.org/downloads/) e marque a opção de adicionar ao PATH. |
| Aviso do pip pedindo upgrade | Opcional, mas recomendado: com o venv ativo, `python -m pip install --upgrade pip`. |

### Stack completa em Docker (build do backend e frontend)

Útil para validar o ambiente parecido com produção ou quando não quiser instalar Node/Python localmente.

1. Suba a stack com build das imagens:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

2. Seed (categorias e administrador):

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml exec backend python seed.py
```

3. Acesse:

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

### Backend e frontend sem Docker (PostgreSQL e MinIO já na máquina)

Configure `DATABASE_URL` e `MINIO_*` em `backend/.env` para os seus hosts e portas e siga os passos de venv, `alembic`, `seed`, `uvicorn` e `npm run dev` da seção de desenvolvimento local.

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
