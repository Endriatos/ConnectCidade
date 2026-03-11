# Connect Cidade 🏙️

> Plataforma web responsiva para reporte e acompanhamento de problemas urbanos — TCC Análise e Desenvolvimento de Sistemas · Uniftec Caxias do Sul · 2026

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Tech Stack](#tech-stack)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Rodando o projeto localmente](#rodando-o-projeto-localmente)
- [Banco de dados](#banco-de-dados)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Hospedagem](#hospedagem)
- [Convenções de nomenclatura](#convenções-de-nomenclatura)
- [Cronograma de entregas](#cronograma-de-entregas)
- [Regras de negócio](#regras-de-negócio)
- [Próximos passos](#próximos-passos)

---

## Sobre o projeto

O **Connect Cidade** é uma plataforma que permite ao cidadão registrar, acompanhar e apoiar solicitações de resolução de problemas urbanos nas categorias:

- 🗑️ Coleta de Resíduos
- 💡 Iluminação Pública
- ♿ Acessibilidade
- 🛣️ Manutenção de Vias

O cidadão registra o problema com foto, localização GPS e descrição. A prefeitura (usuário admin) recebe, encaminha e atualiza o status. O cidadão acompanha tudo por uma timeline transparente.

---

## Tech Stack

### Backend
| Tecnologia | Versão recomendada | Finalidade |
|---|---|---|
| Python | 3.12+ | Linguagem base |
| FastAPI | 0.111+ | Framework web e API |
| PostgreSQL | 16+ | Banco de dados relacional |
| SQLAlchemy | 2.0+ | ORM (mapeamento objeto-relacional) |
| Alembic | 1.13+ | Controle de versão do banco (migrations) |
| Pydantic | 2.0+ | Validação de dados (incluso no FastAPI) |
| python-jose | 3.3+ | Geração e validação de tokens JWT |
| passlib[bcrypt] | 1.7+ | Hash seguro de senhas |
| Pillow | 10+ | Compressão de imagens e remoção de EXIF |
| boto3 | 1.34+ | Upload de arquivos para Cloudflare R2 |
| resend | 2.0+ | Envio de emails transacionais |
| python-multipart | 0.0.9+ | Upload de arquivos via formulário |
| uvicorn | 0.29+ | Servidor ASGI para desenvolvimento |

### Frontend
| Tecnologia | Versão recomendada | Finalidade |
|---|---|---|
| Node.js | 22+ | Ambiente de execução |
| Vite | 5+ | Build tool e servidor de desenvolvimento |
| React | 18+ | Biblioteca de interface |
| React Router | 6+ | Navegação entre páginas |
| Axios | 1.7+ | Requisições HTTP para a API |
| Tailwind CSS | 3+ | Estilização utilitária e responsividade |
| Leaflet.js | 1.9+ | Mapa interativo |
| React-Leaflet | 4+ | Wrapper React para o Leaflet |
| Recharts | 2+ | Gráficos para o dashboard admin |
| Zustand | 4+ | Gerenciamento de estado global |

---

## Pré-requisitos

Antes de começar, verifique se você tem instalado:

```bash
# Verificar versões
python --version      # deve ser 3.12+
node --version        # deve ser 22+
npm --version         # deve ser 10+
psql --version        # deve ser 16+
git --version         # qualquer versão recente
```

---

## Estrutura de pastas

```
connect-cidade/
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # Ponto de entrada do FastAPI — registra todos os routers
│   │   ├── config.py                # Lê e valida variáveis de ambiente (.env)
│   │   ├── database.py              # Cria a conexão com o PostgreSQL via SQLAlchemy
│   │   │
│   │   ├── models/                  # Estrutura das tabelas no banco (SQLAlchemy ORM)
│   │   │   ├── __init__.py          # Importa todos os models (necessário para o Alembic)
│   │   │   ├── usuario.py           # Tabela usuarios: cidadãos e admins
│   │   │   ├── solicitacao.py       # Tabela solicitacoes: o core do sistema
│   │   │   ├── categoria.py         # Tabela categorias: 4 categorias fixas (seed)
│   │   │   ├── foto.py              # Tabela fotos: até 5 fotos por solicitação
│   │   │   ├── atualizacao.py       # Tabela atualizacoes: histórico / timeline
│   │   │   ├── apoio.py             # Tabela apoios: 1 por usuário por solicitação
│   │   │   ├── avaliacao.py         # Tabela avaliacoes: nota + checkbox + comentário
│   │   │   └── notificacao.py       # Tabela notificacoes: sininho do app
│   │   │
│   │   ├── schemas/                 # Validação e formato dos dados (Pydantic)
│   │   │   ├── auth.py              # Login, token JWT, recuperar/redefinir senha
│   │   │   ├── usuario.py           # Criar conta, perfil, resposta admin
│   │   │   ├── solicitacao.py       # Criar, listar (resumo), detalhe, atualizar status
│   │   │   ├── categoria.py         # Dados da categoria para combo e mapa
│   │   │   ├── atualizacao.py       # Entradas da timeline
│   │   │   ├── apoio.py             # Registrar apoio, contagem
│   │   │   ├── avaliacao.py         # Registrar nota e comentário
│   │   │   ├── notificacao.py       # Listar notificações, marcar como lida
│   │   │   └── dashboard.py         # Estatísticas e KPIs do painel admin
│   │   │
│   │   ├── routers/                 # Endpoints da API (FastAPI APIRouter)
│   │   │   ├── auth.py              # POST /auth/login, /auth/cadastro, /auth/recuperar-senha
│   │   │   ├── solicitacoes.py      # CRUD de solicitações do cidadão
│   │   │   ├── mapa.py              # GET /mapa — listagem por viewport geográfico
│   │   │   ├── apoios.py            # POST /apoios — registrar apoio
│   │   │   ├── notificacoes.py      # GET/PATCH /notificacoes — listar e marcar lidas
│   │   │   ├── avaliacoes.py        # POST /avaliacoes — registrar avaliação
│   │   │   └── admin/               # Rotas protegidas — apenas admins
│   │   │       ├── solicitacoes.py  # Listar, filtrar, atualizar status
│   │   │       ├── dashboard.py     # KPIs e estatísticas
│   │   │       └── administradores.py  # Criar e gerenciar admins
│   │   │
│   │   ├── crud/                    # Operações de banco de dados (apenas SQL, sem lógica extra)
│   │   │   ├── usuario.py           # get_by_cpf, get_by_email, criar, desativar, anonimizar
│   │   │   ├── solicitacao.py       # criar, listar_por_viewport, get_by_id, atualizar_status
│   │   │   ├── categoria.py         # listar_todas, get_by_id
│   │   │   ├── apoio.py             # criar, contar_por_solicitacao, verificar_existente
│   │   │   ├── atualizacao.py       # criar, listar_por_solicitacao
│   │   │   ├── avaliacao.py         # criar, get_by_solicitacao
│   │   │   └── notificacao.py       # criar, listar_por_usuario, marcar_lida, limpar_antigas
│   │   │
│   │   └── utils/                   # Funções auxiliares (não são banco, não são rotas)
│   │       ├── auth_utils.py        # Hash de senha, verificação, criação de token JWT
│   │       ├── cpf_utils.py         # Validação do algoritmo do CPF brasileiro
│   │       ├── email_utils.py       # Envio de emails via Resend (recuperação de senha + notificações)
│   │       ├── foto_utils.py        # Compressão com Pillow, remoção de EXIF, upload para R2
│   │       ├── protocolo_utils.py   # Geração do protocolo ANO-SEQUENCIAL (ex: 2025-00123)
│   │       ├── geo_utils.py         # Fórmula Haversine para cálculo de distância entre coordenadas
│   │       └── deps.py              # Dependências do FastAPI: get_db, get_current_user, require_admin
│   │
│   ├── migrations/                  # Alembic: histórico de versões do banco
│   │   ├── env.py                   # Configuração do Alembic (gerado automaticamente)
│   │   └── versions/                # Arquivos de migration gerados pelo Alembic
│   │
│   ├── seed.py                      # Popula o banco: admin padrão + 4 categorias fixas
│   ├── requirements.txt             # Todas as dependências Python com versões fixadas
│   ├── .env                         # Variáveis de ambiente REAIS — NUNCA commitar no Git
│   └── .env.example                 # Modelo do .env com chaves mas sem valores — commitar
│
├── frontend/
│   ├── src/
│   │   ├── assets/                  # Imagens, ícones, logo do projeto
│   │   │
│   │   ├── components/              # Peças reutilizáveis da interface
│   │   │   ├── ui/                  # Componentes genéricos: Button, Input, Modal, Badge, Spinner
│   │   │   ├── mapa/                # MapaView, Marcador, BottomSheet, ClusterIcon
│   │   │   └── layout/              # Header, NotificationBell, PrivateRoute
│   │   │
│   │   ├── pages/                   # Telas completas da aplicação
│   │   │   ├── Login.jsx
│   │   │   ├── Cadastro.jsx
│   │   │   ├── RecuperarSenha.jsx
│   │   │   ├── Mapa.jsx             # Tela principal — mapa interativo
│   │   │   ├── NovaSolicitacao.jsx  # Formulário de criação de solicitação
│   │   │   ├── MinhasSolicitacoes.jsx
│   │   │   ├── DetalhesSolicitacao.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── GestaoSolicitacoes.jsx
│   │   │       ├── DetalhesSolicitacaoAdmin.jsx
│   │   │       └── Administradores.jsx
│   │   │
│   │   ├── services/                # Funções que chamam os endpoints da API
│   │   │   ├── api.js               # Configuração base do Axios (URL, interceptors JWT)
│   │   │   ├── authService.js       # login(), cadastro(), recuperarSenha()
│   │   │   ├── solicitacaoService.js# criar(), listarMinhas(), buscarDetalhes()
│   │   │   ├── mapaService.js       # buscarPorViewport()
│   │   │   ├── apoioService.js      # apoiar()
│   │   │   └── notificacaoService.js# listar(), marcarLida()
│   │   │
│   │   ├── store/                   # Estado global com Zustand
│   │   │   ├── authStore.js         # Usuário logado, token JWT, logout
│   │   │   └── notificacaoStore.js  # Contagem de não lidas
│   │   │
│   │   ├── hooks/                   # Lógica reutilizável React
│   │   │   ├── useGeolocalizacao.js # Captura GPS do dispositivo com fallback
│   │   │   └── useNotificacoes.js   # Polling de novas notificações
│   │   │
│   │   ├── utils/                   # Funções auxiliares JavaScript
│   │   │   ├── formatarData.js      # Formatar datas no padrão brasileiro
│   │   │   └── validarCPF.js        # Validação do CPF no frontend
│   │   │
│   │   ├── App.jsx                  # Componente raiz — envolve tudo com Router e providers
│   │   ├── main.jsx                 # Ponto de entrada React — renderiza App no DOM
│   │   └── routes.jsx               # Definição de todas as rotas e proteção por perfil
│   │
│   ├── .env                         # Variáveis de ambiente do frontend — NUNCA commitar
│   ├── .env.example                 # Modelo do .env frontend
│   ├── index.html                   # HTML base (Vite injeta o React aqui)
│   ├── package.json                 # Dependências e scripts npm
│   ├── tailwind.config.js           # Configuração do Tailwind CSS
│   └── vite.config.js               # Configuração do Vite (proxy para o backend em dev)
│
├── .gitignore                       # Arquivos ignorados pelo Git
└── README.md                        # Este arquivo
```

---

## Configuração do ambiente

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/connect-cidade.git
cd connect-cidade
```

### 2. Backend — configurar ambiente Python

```bash
cd backend

# Criar ambiente virtual (isola as dependências do projeto)
python -m venv venv

# Ativar o ambiente virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Copiar o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais (veja seção Variáveis de ambiente)
```

### 3. Frontend — configurar ambiente Node

```bash
cd frontend

# Instalar dependências
npm install

# Copiar o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env
```

---

## Banco de dados

### Criar o banco no PostgreSQL

```sql
-- No terminal psql ou pgAdmin:
CREATE DATABASE connect_cidade;
CREATE USER connect_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE connect_cidade TO connect_user;
```

### Rodar as migrations (criar as tabelas)

```bash
# Na pasta backend/, com o ambiente virtual ativado:
alembic upgrade head
```

### Popular o banco com dados iniciais (seed)

```bash
# Na pasta backend/, com o ambiente virtual ativado:
python seed.py
```

O seed cria:
- 1 administrador padrão (CPF e senha definidos no `.env`)
- 4 categorias fixas: Coleta de Resíduos, Iluminação Pública, Acessibilidade, Manutenção de Vias
- _(opcional em dev)_ 10 solicitações de exemplo para popular o mapa

---

## Rodando o projeto localmente

### Backend (FastAPI)

```bash
# Na pasta backend/, com o ambiente virtual ativado:
uvicorn app.main:app --reload --port 8000
```

A API estará disponível em:
- **API:** http://localhost:8000
- **Swagger (documentação interativa):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Frontend (Vite + React)

```bash
# Na pasta frontend/:
npm run dev
```

O app estará disponível em: http://localhost:5173

---

## Variáveis de ambiente

### backend/.env.example

```env
# Banco de dados
DATABASE_URL=postgresql://connect_user:sua_senha@localhost:5432/connect_cidade

# Segurança JWT
SECRET_KEY=gere_uma_chave_secreta_longa_e_aleatoria_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Admin padrão (criado pelo seed)
ADMIN_CPF=00000000000
ADMIN_NOME=Administrador
ADMIN_EMAIL=admin@connectcidade.com
ADMIN_SENHA=troque_esta_senha

# Email — Resend (https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@connectcidade.com

# Armazenamento de fotos — Cloudflare R2
R2_ACCOUNT_ID=seu_account_id
R2_ACCESS_KEY_ID=sua_access_key
R2_SECRET_ACCESS_KEY=sua_secret_key
R2_BUCKET_NAME=connect-cidade-fotos
R2_PUBLIC_URL=https://seu_bucket.r2.dev

# Ambiente
ENV=development
```

### frontend/.env.example

```env
# URL da API backend
VITE_API_URL=http://localhost:8000

# Coordenadas padrão (fallback GPS) — Caxias do Sul
VITE_DEFAULT_LAT=-29.1678
VITE_DEFAULT_LNG=-51.1794
VITE_DEFAULT_ZOOM=14
```

---

## Hospedagem

| Serviço | O que hospeda | Plano |
|---|---|---|
| **Vercel** | Frontend (React) | Gratuito |
| **Railway** | Backend (FastAPI) + PostgreSQL | Free tier / ~US$5/mês |
| **Cloudflare R2** | Fotos das solicitações | Gratuito até 10GB |
| **Resend** | Emails transacionais | Gratuito até 3.000/mês |

---

## Convenções de nomenclatura

> Consulte o arquivo **`convencoes_nomenclatura.pdf`** na raiz do repositório para a explicação completa das escolhas. O resumo abaixo serve como referência rápida no dia a dia.

### Por que padronizar?

Código é lido muito mais vezes do que é escrito. Sem um padrão combinado, cada desenvolvedor escreve de um jeito e o projeto fica inconsistente. As convenções abaixo seguem o padrão oficial de cada linguagem e ferramenta usada no projeto.

### Tabela de referência rápida

| Onde | Estilo | Idioma | Exemplo |
|---|---|---|---|
| Backend — variáveis e funções | `snake_case` | Português p/ domínio, inglês p/ prefixos CRUD | `nome_usuario`, `get_solicitacao()`, `create_usuario()` |
| Backend — classes | `PascalCase` | Português | `Solicitacao`, `Usuario`, `SolicitacaoCreate` |
| Backend — constantes | `MAIÚSCULO_SNAKE` | Inglês (nomes técnicos fixos) | `SECRET_KEY`, `DATABASE_URL` |
| Frontend — variáveis e funções | `camelCase` | Português | `nomeUsuario`, `buscarSolicitacoes()` |
| Frontend — componentes React | `PascalCase` | Português | `NovaSolicitacao`, `PainelAdmin` |
| Frontend — arquivos de componente | `PascalCase.jsx` | Português | `Login.jsx`, `Mapa.jsx` |
| Frontend — arquivos utilitários | `camelCase.js` | Português | `authService.js`, `formatarData.js` |
| Banco — tabelas | `snake_case`, singular | Português | `solicitacao`, `atualizacao_solicitacao` |
| Banco — colunas | `snake_case` | Português | `id_usuario`, `data_registro` |
| URLs da API | `kebab-case` | Português | `/recuperar-senha`, `/admin/solicitacoes` |
| Comentários | — | Português sempre | `# Verifica duplicata no raio` |

### A regra de ouro

**O estilo escolhido importa menos do que a consistência com que ele é aplicado.**

Sempre que tiver dúvida, consulte esta tabela. Se o caso não estiver coberto, siga o padrão mais próximo e registre a decisão para o colega saber.

> ⚠️ Quando o Claude Code gerar um arquivo novo, verifique se os nomes seguem esta tabela antes de continuar. É muito mais fácil corrigir um arquivo do que refatorar o projeto inteiro depois.

---

## Cronograma de entregas

| # | Entrega | Conteúdo principal |
|---|---|---|
| 1 | Setup + Cadastro + Login | Fundação do sistema |
| 2 | Criar Solicitação — Parte 1 | Formulário, GPS, protocolo, duplicata |
| 3 | Criar Solicitação — Parte 2 | Upload de fotos, compressão, EXIF |
| **4** ⭐ | **Mapa interativo** | **Bottom sheet, marcadores, viewport — fecha 1º trimestre** |
| 5 | Interação do cidadão | Popup, Apoiar, timeline, acompanhamento |
| 6 | Painel admin | Listar, filtrar, atualizar status |
| 7 | Comunicação | Notificações, email, avaliação, recuperação de senha |
| **8** ⭐ | **Dashboard + Deploy** | **KPIs, gráficos, gestão de admins, sistema no ar** |

---

## Regras de negócio

> Consulte o arquivo **`regras_negocio.pdf`** na raiz do repositório para a lista completa e detalhada de todas as regras de negócio definidas pelo time.

Resumo das principais:

- **Login:** via CPF + senha (CPF validado pelo algoritmo nacional)
- **Categorias:** 4 fixas, definidas por seed — sem interface de gestão
- **Solicitação:** mínimo 1 foto, máximo 5; campo de endereço obrigatório; GPS + ajuste manual
- **Duplicata:** aviso (não bloqueio) se existir solicitação da mesma categoria em raio de 50m
- **Status:** `PENDENTE → EM_ANALISE → EM_ANDAMENTO → RESOLVIDO | CANCELADO` — admin pode mover em qualquer direção com comentário obrigatório
- **Mapa:** apenas usuários logados; viewport dinâmico; CANCELADO nunca aparece; RESOLVIDO aparece por 48h
- **Apoio:** 1 por usuário por solicitação
- **Notificações:** automáticas a cada mudança de status — sininho + email (Resend)
- **Avaliação:** disponível após RESOLVIDO — checkbox "foi realmente resolvido?" + nota 1-5 + comentário
- **LGPD:** exclusão de conta anonimiza dados pessoais; solicitações permanecem no banco

---

## Próximos passos

### ✅ Para iniciar a Entrega 1, siga esta ordem:

1. Crie o repositório no GitHub e clone localmente
2. Crie a estrutura de pastas completa conforme este README
3. Configure o banco de dados PostgreSQL local
4. Crie o `.env` a partir do `.env.example`
5. Implemente na seguinte ordem:
   - `backend/app/database.py` — conexão com o banco
   - `backend/app/models/usuario.py` — model de usuário
   - `backend/app/models/categoria.py` — model de categoria
   - `alembic init migrations` + primeira migration + `alembic upgrade head`
   - `backend/seed.py` — admin padrão + 4 categorias
   - `backend/app/utils/auth_utils.py` — hash de senha e JWT
   - `backend/app/utils/cpf_utils.py` — validação de CPF
   - `backend/app/schemas/auth.py` + `schemas/usuario.py`
   - `backend/app/crud/usuario.py`
   - `backend/app/routers/auth.py` — endpoints de cadastro e login
   - `backend/app/main.py` — registrar router
   - Testar no Swagger: criar conta → fazer login → receber JWT
   - Frontend: telas de Login e Cadastro conectadas à API

### 🔧 Comandos úteis do dia a dia

```bash
# Criar nova migration após alterar um model
alembic revision --autogenerate -m "descricao_da_mudanca"
alembic upgrade head

# Ver o estado atual das migrations
alembic current

# Reverter última migration
alembic downgrade -1

# Rodar backend em modo desenvolvimento
uvicorn app.main:app --reload

# Rodar frontend em modo desenvolvimento
npm run dev

# Instalar nova dependência Python
pip install nome_do_pacote
pip freeze > requirements.txt  # atualizar o arquivo de dependências

# Instalar nova dependência Node
npm install nome_do_pacote
```

### 🌿 Fluxo Git para o time (dois desenvolvedores)

```bash
# Antes de começar a trabalhar — sempre atualizar primeiro
git pull origin main

# Criar uma branch para a entrega atual (substitua N pelo número)
git checkout -b entrega-N

# Durante o trabalho — commitar com frequência
git add .
git commit -m "feat: descrição do que foi feito"

# Enviar para o GitHub
git push origin entrega-N

# Quando a entrega estiver pronta — abrir Pull Request no GitHub para revisão
# Após revisão, fazer merge na main pelo GitHub
```

---

> **Desenvolvido por:** Daniel Albrecht e Deivid Spada
> **Orientadora:** Prof. Ms. Stéfani Mano Valmini
> **Instituição:** Centro Universitário Uniftec — Caxias do Sul, 2026