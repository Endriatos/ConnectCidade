# Connect Cidade 🏙️

> Plataforma web responsiva para reporte e acompanhamento de problemas urbanos.  
> Trabalho de Conclusão de Curso — Análise e Desenvolvimento de Sistemas · Uniftec · 2026

---

## Sobre o projeto

O **Connect Cidade** conecta cidadãos à gestão municipal, permitindo o registro, acompanhamento e apoio a solicitações de resolução de problemas urbanos nas categorias **Coleta de Resíduos**, **Iluminação Pública**, **Acessibilidade** e **Manutenção de Vias**.

O cidadão registra o problema com foto, localização GPS e descrição. A administração recebe, encaminha e atualiza o status. O cidadão acompanha tudo por uma timeline transparente e recebe notificações a cada atualização.

---

## Tech Stack

| Camada | Tecnologias |
|---|---|
| **Backend** | Python · FastAPI · PostgreSQL · SQLAlchemy · Alembic · Pydantic |
| **Frontend** | React · Vite · Tailwind CSS · Leaflet.js · Recharts · Zustand |
| **Infraestrutura** | Vercel · Railway · Cloudflare R2 · Resend |

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

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # preencha as variáveis
alembic upgrade head         # cria as tabelas
python seed.py               # popula dados iniciais
uvicorn app.main:app --reload
```

API disponível em `http://localhost:8000` · Documentação em `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env         # preencha a URL da API
npm run dev
```

App disponível em `http://localhost:5173`

---

## Variáveis de ambiente

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:senha@localhost:5432/connectcidade
SECRET_KEY=chave-secreta-longa
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
ADMIN_CPF=00000000000
ADMIN_NOME=Administrador
ADMIN_EMAIL=admin@connectcidade.com
ADMIN_SENHA=senha-admin
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@connectcidade.com
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=connect-cidade-fotos
R2_PUBLIC_URL=
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
VITE_DEFAULT_LAT=-29.1678
VITE_DEFAULT_LNG=-51.1794
VITE_DEFAULT_ZOOM=14
```

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
        ├── store/        # Estado global (Zustand)
        └── hooks/        # Hooks customizados
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

## Convenções de código

| Onde | Estilo |
|---|---|
| Backend — variáveis e funções | `snake_case` |
| Backend — classes | `PascalCase` |
| Frontend — variáveis e funções | `camelCase` |
| Frontend — componentes | `PascalCase` |
| Banco de dados | `snake_case` |
| URLs da API | `kebab-case` |

---
