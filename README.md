# Melon Focus

## Índice

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Modelo de dados](#3-modelo-de-dados)
4. [Módulos funcionais](#4-módulos-funcionais)
5. [Estratégia de testes & qualidade](#5-estratégia-de-testes--qualidade)
6. [Requisitos não-funcionais](#6-requisitos-não-funcionais)
7. [Fases de desenvolvimento](#7-fases-de-desenvolvimento)
8. [Arquitetura escalável para app mobile](#8-arquitetura-escalável-para-app-mobile)
9. [Integração com design](#9-integração-com-design)
10. [Decisões técnicas pendentes](#10-decisões-técnicas-pendentes)
11. [Estimativa de escopo por módulo](#11-estimativa-de-escopo-por-módulo)
12. [Como rodar o projeto](#12-como-rodar-o-projeto)

---

## 1. Visão Geral

**Melon Focus** é um app web de produtividade que permite ao usuário criar sessões de foco personalizadas, vinculá-las a objetivos concretos e acompanhar o progresso por meio de métricas e insights.

### Problema que resolve

Ferramentas de foco existentes são genéricas demais. O usuário quer autonomia total sobre a configuração de seus timers (Pomodoro, Deep Work, Flowtime, Custom), visibilidade real de progresso vinculado a objetivos, e dados de produtividade que ajudem a entender hábitos.

### Público-alvo

Profissionais, estudantes e criadores que buscam disciplina de foco com métricas de acompanhamento. Perfil: pessoas que já usam técnicas como Pomodoro mas querem mais controle e visibilidade.

### Diferenciais

- 4 metodologias de foco (Pomodoro, Deep Work, Flowtime, Custom) totalmente configuráveis
- Objetivos com metas em horas e sessões, vinculados a sessões de foco
- Métricas detalhadas: streaks, insights de horário produtivo, dia mais focado, taxa de conclusão
- Arquitetura preparada para app mobile futuro (React Native/Expo)
- Design autoral feito no Figma pelo próprio desenvolvedor

---

## 2. Arquitetura

### Stack tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| Linguagem | TypeScript | 5.x |
| UI | Tailwind CSS + Shadcn/UI + Base UI | 4.x / 4.2.0 / 1.4.0 |
| ORM | Prisma (com `@prisma/adapter-pg`) | 7.7.0 |
| Banco | PostgreSQL | - |
| Auth | NextAuth v5 (beta) + JWT strategy | 5.0.0-beta.31 |
| State | Zustand | 5.0.12 |
| Validação | Zod **v3** | 3.25.76 |
| Charts | Recharts | 3.8.1 |
| Icons | Lucide React | 1.8.0 |
| Utilitários | date-fns, clsx, tailwind-merge, class-variance-authority | - |
| Hashing | bcryptjs | 3.0.3 |
| Testes Unit/Integration | Vitest + Testing Library + jsdom | 4.1.4 |
| Testes E2E | Playwright + Chromium | 1.59.1 |
| Acessibilidade | axe-playwright | 2.2.2 |
| Runtime | React | 19.2.4 |
| Deploy | Vercel | - |

> **Nota importante:** Zod é v3 (não v4). A v4 é incompatível com `eslint-config-next`. Import: `from "zod"`.

### Estrutura de pastas (real do repositório)

```
melon-focus/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Pipeline CI (quality + e2e)
├── prisma/
│   ├── schema.prisma                 # 10 models + enums + índices
│   └── seed.ts                       # Seed de desenvolvimento
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts         # POST - registro credentials
│   │   │   │   └── [...nextauth]/route.ts    # NextAuth handlers
│   │   │   ├── focus/
│   │   │   │   ├── configs/
│   │   │   │   │   ├── route.ts              # GET list, POST create
│   │   │   │   │   └── [id]/route.ts         # GET, PATCH, DELETE
│   │   │   │   └── sessions/
│   │   │   │       ├── route.ts              # GET list, POST start
│   │   │   │       └── [id]/route.ts         # GET, PATCH finish, DELETE cancel
│   │   │   ├── metrics/
│   │   │   │   ├── overview/route.ts         # GET - visão geral
│   │   │   │   ├── daily/route.ts            # GET - métricas diárias
│   │   │   │   ├── by-objective/route.ts     # GET - métricas por objetivo
│   │   │   │   └── insights/route.ts         # GET - insights inteligentes
│   │   │   ├── objectives/
│   │   │   │   ├── route.ts                  # GET list, POST create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts              # GET, PATCH, DELETE (soft)
│   │   │   │       └── progress/route.ts     # GET - progresso
│   │   │   └── user/
│   │   │       ├── profile/route.ts          # GET, PATCH profile
│   │   │       └── export/route.ts           # GET - exportar dados (LGPD)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── favicon.ico
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx                    # Shadcn/UI
│   ├── generated/
│   │   └── prisma/                           # Prisma client gerado
│   │       ├── client.ts
│   │       ├── enums.ts
│   │       ├── models/                       # Um arquivo por model
│   │       └── ...
│   ├── lib/
│   │   ├── auth.config.ts                    # Auth config Edge-safe (sem Prisma)
│   │   ├── auth.ts                           # Auth Node completo (com Prisma)
│   │   ├── auth-utils.ts                     # Helper requireAuth()
│   │   ├── db.ts                             # Prisma client singleton
│   │   ├── focus-engine.ts                   # Engine pura de timer (classe)
│   │   ├── utils.ts                          # cn() e utilitários
│   │   └── validators/
│   │       ├── auth.ts                       # registerSchema, loginSchema
│   │       ├── objective.ts                  # createObjectiveSchema, updateObjectiveSchema
│   │       ├── focus-config.ts               # createFocusConfigSchema, updateFocusConfigSchema
│   │       └── focus-session.ts              # startSessionSchema, finishSessionSchema
│   ├── middleware.ts                         # NextAuth middleware (Edge)
│   ├── services/
│   │   ├── objective.service.ts              # CRUD + progress
│   │   ├── focus-session.service.ts          # start, finish, cancel, list, addInterval
│   │   ├── focus-config.service.ts           # CRUD + validação de uso
│   │   ├── metrics.service.ts                # overview, daily, byObjective, insights, streak
│   │   └── user.service.ts                   # profile, password, preferences, delete, export
│   ├── stores/
│   │   ├── focus-store.ts                    # Zustand - engine + sessão ativa
│   │   └── user-store.ts                     # Zustand - preferências do usuário
│   └── types/
│       └── next-auth.d.ts                    # Tipagens NextAuth extendidas
├── tests/
│   ├── setup.ts                              # Setup Vitest
│   └── unit/
│       ├── focus-engine.test.ts              # Timer: pomodoro, deep work, flowtime, pause/resume, skip, finish
│       ├── validators.test.ts                # Schemas Zod: auth, objective, focus-config, focus-session
│       └── metrics.test.ts                   # calculateStreak
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── CLAUDE.md / AGENTS.md
```

### Separação Auth (Edge vs Node)

O NextAuth v5 exige que o middleware rode em Edge Runtime, mas Prisma não suporta Edge. Por isso a configuração é dividida:

| Arquivo | Runtime | Conteúdo |
|---|---|---|
| `src/lib/auth.config.ts` | Edge | Providers (Google, Credentials stub), callbacks (jwt, session, authorized), páginas |
| `src/lib/auth.ts` | Node | PrismaAdapter, Credentials com `authorize()` real (bcrypt + DB lookup) |
| `src/middleware.ts` | Edge | Importa apenas `auth.config.ts`, protege rotas privadas |

---

## 3. Modelo de Dados

### Diagrama de entidades

```
User (1) ──── (*) Account
  │  ──── (*) Session (NextAuth)
  │  ──── (1) UserPreferences
  │  ──── (*) Objective ──── (*) TagOnObjective ──── (*) Tag
  │  ──── (*) FocusConfig
  │  ──── (*) FocusSession ──── (*) FocusInterval
  │                         ──── (*) TagOnSession ──── (*) Tag
  └──── (*) Tag
```

### Models detalhados

#### User

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| name | String? | - |
| email | String | Unique |
| emailVerified | DateTime? | - |
| image | String? | URL avatar |
| passwordHash | String? | **Nunca retornado na API** |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Relações: Account[], Session[], Objective[], FocusConfig[], FocusSession[], Tag[], UserPreferences?

#### Account (NextAuth)

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User (onDelete: Cascade) |
| type | String | oauth/credentials |
| provider | String | google, credentials |
| providerAccountId | String | - |
| refresh_token | String? | @db.Text |
| access_token | String? | @db.Text |
| expires_at | Int? | - |
| token_type | String? | - |
| scope | String? | - |
| id_token | String? | @db.Text |
| session_state | String? | - |

Índices: `@@unique([provider, providerAccountId])`, `@@index([userId])`

#### Session (NextAuth)

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| sessionToken | String | Unique |
| userId | String | FK -> User (onDelete: Cascade) |
| expires | DateTime | - |

Índice: `@@index([userId])`

#### VerificationToken

| Campo | Tipo |
|---|---|
| identifier | String |
| token | String |
| expires | DateTime |

Índice: `@@unique([identifier, token])`

#### UserPreferences

| Campo | Tipo | Default |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | Unique, FK -> User (Cascade) |
| theme | String | "system" |
| language | String | "pt-BR" |
| soundEnabled | Boolean | true |
| notificationsEnabled | Boolean | true |

#### Objective

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User (Cascade) |
| title | String | Obrigatório |
| description | String? | - |
| targetHours | Float? | Meta em horas |
| targetSessions | Int? | Meta em sessões |
| deadline | DateTime? | - |
| status | ObjectiveStatus | Default: ACTIVE |
| color | String | Default: "#6366f1" |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |
| deletedAt | DateTime? | **Soft delete** |

Enum ObjectiveStatus: `ACTIVE | PAUSED | COMPLETED | ARCHIVED`

Índices: `@@index([userId, status])`, `@@index([userId, deletedAt])`

#### FocusConfig (templates reutilizáveis)

| Campo | Tipo | Default |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User (Cascade) |
| name | String | - |
| methodology | FocusMethodology | POMODORO |
| focusDuration | Int | 25 (minutos) |
| shortBreakDuration | Int | 5 (minutos) |
| longBreakDuration | Int? | 15 (minutos) |
| sessionsBeforeLongBreak | Int? | 4 |
| autoStartBreak | Boolean | false |
| autoStartFocus | Boolean | false |
| soundEnabled | Boolean | true |
| soundType | String? | - |
| isDefault | Boolean | false |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Enum FocusMethodology: `POMODORO | DEEP_WORK | FLOWTIME | CUSTOM`

Índice: `@@index([userId])`

#### FocusSession (sessão executada)

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User (Cascade) |
| objectiveId | String? | FK -> Objective (onDelete: SetNull) |
| focusConfigId | String | FK -> FocusConfig |
| startedAt | DateTime | auto |
| endedAt | DateTime? | - |
| plannedDuration | Int | minutos |
| actualDuration | Int? | minutos |
| status | FocusSessionStatus | Default: IN_PROGRESS |
| pauseCount | Int | Default: 0 |
| totalPauseTime | Int | Default: 0 (segundos) |
| notes | String? | - |
| rating | Int? | 1-5 |
| createdAt | DateTime | auto |

Enum FocusSessionStatus: `IN_PROGRESS | COMPLETED | CANCELLED`

Índices: `@@index([userId, status])`, `@@index([userId, startedAt])`, `@@index([userId, objectiveId])`, `@@index([objectiveId])`

#### FocusInterval (blocos dentro da sessão)

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| sessionId | String | FK -> FocusSession (Cascade) |
| type | FocusIntervalType | FOCUS/SHORT_BREAK/LONG_BREAK |
| startedAt | DateTime | auto |
| endedAt | DateTime? | - |
| duration | Int | Default: 0 (segundos) |
| completed | Boolean | Default: false |

Enum FocusIntervalType: `FOCUS | SHORT_BREAK | LONG_BREAK`

Índice: `@@index([sessionId])`

#### Tag

| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User (Cascade) |
| name | String | - |
| color | String | Default: "#8b5cf6" |

Índices: `@@unique([userId, name])`, `@@index([userId])`

#### TagOnObjective (join table)

| Campo | Tipo |
|---|---|
| objectiveId | String (PK composta) |
| tagId | String (PK composta) |

onDelete: Cascade em ambas FKs

#### TagOnSession (join table)

| Campo | Tipo |
|---|---|
| sessionId | String (PK composta) |
| tagId | String (PK composta) |

onDelete: Cascade em ambas FKs

### Regras de integridade

- **Cascade em User**: deletar usuário remove tudo (Account, Session, Objective, FocusConfig, FocusSession, Tag, UserPreferences)
- **SetNull em Objective -> FocusSession**: deletar objetivo não perde sessões, apenas desvincula
- **Cascade em FocusSession -> FocusInterval**: deletar sessão remove intervalos
- **Cascade nas join tables**: deletar tag/objetivo/sessão limpa relações
- **Soft delete em Objective**: campo `deletedAt`, todas queries filtram `deletedAt: null`
- **passwordHash nunca retornado**: todas queries de User usam `select` explícito excluindo `passwordHash`

---

## 4. Módulos Funcionais

### 4.1 Auth (Autenticação)

#### Providers

- **Google OAuth** (via NextAuth)
- **Credentials** (email + senha com bcrypt, salt rounds = 12)

#### Regras de senha

- Mínimo 8 caracteres
- Ao menos 1 letra maiúscula
- Ao menos 1 número

#### Telas

| Tela | Rota | Descrição |
|---|---|---|
| Login | `/login` | Email/senha + botão Google |
| Registro | `/register` | Nome, email, senha |
| Erro Auth | `/login` (com query) | Mensagens de erro |

#### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Registra usuário (credentials), cria preferences default + FocusConfig Pomodoro default |
| GET/POST | `/api/auth/[...nextauth]` | Handlers NextAuth (signin, signout, session, callback) |

#### Middleware

- `src/middleware.ts` protege todas rotas exceto: `/`, `/login`, `/register`, `/api/auth/*`
- Roda em Edge Runtime (usa apenas `auth.config.ts`)
- Matcher: `/((?!_next/static|_next/image|favicon.ico|public/)*)`

### 4.2 Gestão de conta

#### Funcionalidades

- Ver perfil (nome, email, avatar, providers vinculados, data de criação)
- Editar nome e avatar
- Alterar senha (apenas contas credentials)
- Atualizar preferências (tema, idioma, som, notificações)
- Exportar dados pessoais (LGPD compliance)
- Deletar conta (cascade completo)

#### Telas

| Tela | Rota | Descrição |
|---|---|---|
| Perfil / Configurações | `/settings` | Dados da conta, preferências |
| Alterar Senha | `/settings/password` | Form de mudança de senha |
| Exportar Dados | `/settings/export` | Botão de download JSON |
| Deletar Conta | `/settings/delete` | Confirmação + ação irreversível |

#### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/user/profile` | Retorna perfil (sem passwordHash) + preferences + providers |
| PATCH | `/api/user/profile` | Atualiza nome/avatar/senha/preferences |
| GET | `/api/user/export` | Exporta todos dados do usuário (JSON) |

#### Service: `userService`

- `getProfile(userId)` - select explícito, sem passwordHash
- `updateProfile(userId, data)` - nome/avatar
- `changePassword(userId, current, new)` - compara hash antes de atualizar
- `updatePreferences(userId, data)` - upsert (cria se não existir)
- `deleteAccount(userId)` - cascade via Prisma
- `exportData(userId)` - agrega user + objectives + sessions + configs + tags

### 4.3 Objetivos

#### Funcionalidades

- CRUD de objetivos com soft delete
- Metas: targetHours e/ou targetSessions
- Status: ACTIVE, PAUSED, COMPLETED, ARCHIVED
- Tags vinculadas (many-to-many)
- Progresso calculado: % horas, % sessões
- Deadline opcional
- Cor personalizável

#### Telas

| Tela | Rota | Descrição |
|---|---|---|
| Lista de Objetivos | `/objectives` | Cards com progresso, filtro por status |
| Detalhes do Objetivo | `/objectives/[id]` | Progresso, sessões vinculadas, editar |
| Criar Objetivo | `/objectives/new` | Form completo |
| Editar Objetivo | `/objectives/[id]/edit` | Form pré-preenchido |

#### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/objectives` | Lista objetivos (filtra deletedAt: null) |
| POST | `/api/objectives` | Cria objetivo (com tags opcionais) |
| GET | `/api/objectives/[id]` | Detalhe do objetivo |
| PATCH | `/api/objectives/[id]` | Atualiza objetivo (título, status, tags, etc.) |
| DELETE | `/api/objectives/[id]` | Soft delete (define deletedAt) |
| GET | `/api/objectives/[id]/progress` | Retorna progresso: totalHours, totalSessions, percentHours, percentSessions |

#### Service: `objectiveService`

- `list(userId, status?)` - inclui tags e contagem de sessões
- `getById(userId, id)` - com tags
- `create(userId, data)` - cria com tags opcionais (CreateObjectiveInput)
- `update(userId, id, data)` - re-cria tags se tagIds fornecido
- `delete(userId, id)` - soft delete via `deletedAt = new Date()`
- `getProgress(userId, id)` - calcula a partir das sessões COMPLETED vinculadas

#### Validação (Zod v3)

```
createObjectiveSchema: title (1-200), description? (max 2000), targetHours? (positive),
  targetSessions? (int positive), deadline? (datetime string), color? (#hex6), tagIds? (string[])

updateObjectiveSchema: partial de create + status? (enum)
```

### 4.4 Timer / Foco

#### Metodologias suportadas

| Metodologia | focusDuration | shortBreak | longBreak | sessionsBeforeLong |
|---|---|---|---|---|
| POMODORO | 25min | 5min | 15min | 4 |
| DEEP_WORK | 90min | 15min | - | - |
| FLOWTIME | ilimitado (0) | 10min | - | - |
| CUSTOM | configurável | configurável | opcional | opcional |

#### Funcionalidades

- Configurações de foco reutilizáveis (FocusConfig)
- Apenas 1 config pode ser `isDefault` por usuário
- Sessão de foco com intervalos (focus, short_break, long_break)
- Pause/resume com contagem de pausas e tempo total pausado
- Skip para pular intervalo atual
- Finish para encerrar sessão
- Notas e rating (1-5) ao finalizar
- Cancel para cancelar sessão em progresso
- Auto-cancel de sessões IN_PROGRESS anteriores ao iniciar nova
- FocusEngine: classe pura sem dependências DOM/React, funciona no main thread ou Web Worker

#### Telas

| Tela | Rota | Descrição |
|---|---|---|
| Timer Principal | `/focus` | Timer ativo, controles, info do intervalo atual |
| Iniciar Sessão | `/focus/start` | Selecionar config + objetivo (opcional) |
| Configs de Foco | `/focus/configs` | Lista de templates |
| Criar/Editar Config | `/focus/configs/new` ou `/focus/configs/[id]` | Form completo |
| Histórico de Sessões | `/focus/history` | Lista paginada com filtros |
| Detalhe da Sessão | `/focus/sessions/[id]` | Intervalos, duração, notas, rating |

#### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/focus/configs` | Lista configs do usuário |
| POST | `/api/focus/configs` | Cria config (garante único isDefault) |
| GET | `/api/focus/configs/[id]` | Detalhe da config |
| PATCH | `/api/focus/configs/[id]` | Atualiza config |
| DELETE | `/api/focus/configs/[id]` | Deleta config (erro se em uso por sessões) |
| GET | `/api/focus/sessions` | Lista sessões (paginado, filtro por objective/status) |
| POST | `/api/focus/sessions` | Inicia sessão (cancela IN_PROGRESS anteriores) |
| GET | `/api/focus/sessions/[id]` | Detalhe da sessão com intervalos |
| PATCH | `/api/focus/sessions/[id]` | Finaliza sessão (notes, rating) |
| DELETE | `/api/focus/sessions/[id]` | Cancela sessão |

#### Services

- `focusConfigService`: list, getById, create, update, delete (valida se config está em uso)
- `focusSessionService`: start, finish, cancel, getById, list (paginado), addInterval

#### Focus Engine (`src/lib/focus-engine.ts`)

Classe pura `FocusEngine`:

- **State**: phase (idle/focus/short_break/long_break/finished), elapsed, remaining, totalFocusTime, totalBreakTime, completedFocusIntervals, intervals[], pauseCount, totalPauseTime, isPaused
- **Métodos públicos**: start(), pause(), resume(), skipInterval(), finish(), getState(), onEvent(callback), destroy()
- **Eventos**: tick, interval_complete, session_complete, phase_change
- **Tick**: setInterval de 1 segundo, atualiza elapsed/remaining, detecta fim de intervalo, auto-avança conforme config
- **Helper**: formatTime(seconds), getDefaultConfig(methodology)

#### Zustand Store: `useFocusStore`

- Gerencia instância do FocusEngine no client
- Vincula sessionId do servidor com engine local
- Actions: startFocus, pause, resume, skipInterval, finish, reset

#### Validação (Zod v3)

```
createFocusConfigSchema: name (1-100), methodology (enum), focusDuration (1-240),
  shortBreakDuration (1-60), longBreakDuration? (1-60), sessionsBeforeLongBreak? (1-20),
  autoStartBreak?, autoStartFocus?, soundEnabled?, soundType?, isDefault?

startSessionSchema: focusConfigId (string), objectiveId? (string)
finishSessionSchema: notes? (max 5000), rating? (1-5 int)
```

### 4.5 Métricas e Insights

#### Funcionalidades

- Overview: total horas, total sessões, duração média, rating médio, streak atual/recorde
- Métricas diárias: horas e sessões por dia (range de datas)
- Métricas por objetivo: horas e sessões por objetivo, com metas
- Insights inteligentes (baseados nas últimas 100 sessões):
  - Horário mais produtivo
  - Dia da semana mais focado
  - Taxa de conclusão
  - Streak ativo

#### Telas

| Tela | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Overview + gráficos diários + insights |
| Métricas por Objetivo | `/dashboard/objectives` | Comparativo entre objetivos |
| Detalhes de Progresso | `/dashboard/details` | Análise detalhada com filtros de data |

#### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/metrics/overview` | Horas totais, sessões, média, streak |
| GET | `/api/metrics/daily?from=&to=` | Métricas diárias no range |
| GET | `/api/metrics/by-objective` | Métricas agrupadas por objetivo |
| GET | `/api/metrics/insights` | Insights inteligentes (min 5 sessões) |

#### Service: `metricsService`

- `getOverview(userId)` - agrega todas sessões COMPLETED
- `getDaily(userId, from, to)` - agrupa por dia
- `getByObjective(userId)` - inclui metas pra comparação
- `getInsights(userId)` - análise das últimas 100 sessões (hora, dia, taxa, streak)
- `calculateStreak(dates)` - calcula streak atual e recorde (função pura, testada unitariamente)

---

## 5. Estratégia de Testes & Qualidade

### 5.1 Testes unitários e de integração (Vitest)

**Config:** `vitest.config.ts` com `jsdom`, alias `@/` para `src/`.

| Suite | Arquivo | O que testa |
|---|---|---|
| Focus Engine | `tests/unit/focus-engine.test.ts` | Pomodoro completo, deep work, flowtime (unlimited), pause/resume, skip, finish, contagem de pausas |
| Validators | `tests/unit/validators.test.ts` | Schemas Zod: auth (register, login), objective (create, update), focus-config, focus-session |
| Metrics | `tests/unit/metrics.test.ts` | calculateStreak: streak ativo, streak quebrado, dias únicos, sem dados |

**Status atual:** 36 testes passando.

**Cobertura planejada:**

- Services (mock Prisma) - CRUD operations, edge cases
- API Routes - validação de input, auth check, error handling
- Stores Zustand - state transitions
- Focus Engine - todas metodologias, edge cases (durações extremas, ticks rápidos)

### 5.2 Testes E2E (Playwright)

**Config:** `playwright.config.ts`, browser: Chromium

**Fluxos planejados:**

- Registro completo (credentials) -> login -> dashboard
- Login Google (mock) -> criar objetivo -> iniciar sessão -> finalizar -> ver métricas
- CRUD objetivos (criar, editar, soft delete, filtrar por status)
- Timer: iniciar, pausar, resumir, pular intervalo, finalizar com notas/rating
- Configurações: criar config, definir como default, tentar deletar config em uso
- Perfil: alterar nome, mudar senha, exportar dados
- Responsividade: mobile, tablet, desktop

### 5.3 Segurança

#### OWASP / ataques comuns

| Teste | Descrição | Ferramenta |
|---|---|---|
| SQL Injection | Prisma parametriza queries automaticamente; testar input malicioso nos validators | Vitest + manual |
| XSS | Inputs sanitizados, React escapa por default; testar em campos de texto livre (notes, description) | Playwright |
| CSRF | NextAuth inclui tokens CSRF automaticamente | Verificação manual |
| IDOR | Testar acesso a recursos de outro usuário (objective, session, config) | Vitest + Playwright |
| Brute Force | Rate limiting no registro e login | k6 + middleware |
| Headers | Verificar headers de segurança (X-Frame-Options, CSP, etc.) | OWASP ZAP / curl |

#### IDOR (Insecure Direct Object Reference) - prioridade

Cada endpoint de API filtra por `userId` obrigatoriamente. Testes devem validar:

- Usuário A não consegue GET/PATCH/DELETE recurso do usuário B
- `objectiveService.getById(userA, idDoUserB)` retorna null
- `focusSessionService.finish(userA, sessionIdDoUserB)` retorna null

#### Segurança do banco

| Regra | Implementação |
|---|---|
| Isolamento de dados por usuário | Todas queries incluem `WHERE userId = ?` |
| passwordHash nunca retornado | `select` explícito em toda query de User |
| Cascade controlado | User delete cascateia tudo; Objective delete usa SetNull em sessões |
| Soft delete | Objectives usam `deletedAt` — dados nunca são perdidos acidentalmente |
| Hashing seguro | bcryptjs com salt rounds = 12 |
| Tokens sensíveis em Text | `access_token`, `refresh_token`, `id_token` armazenados como `@db.Text` |

### 5.4 Performance

| Tipo | Ferramenta | Métricas alvo |
|---|---|---|
| Frontend | Lighthouse CI | Performance >= 90, Accessibility >= 90, Best Practices >= 90 |
| Web Vitals | Vercel Analytics / web-vitals lib | LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| Carga | k6 | API endpoints suportam 100 req/s sem degradação |
| Database | Prisma Studio + EXPLAIN | Queries com índices atendem < 50ms |

**Índices otimizados no schema:**

- `FocusSession(userId, status)` - filtro mais comum
- `FocusSession(userId, startedAt)` - queries de métricas por data
- `FocusSession(userId, objectiveId)` - métricas por objetivo
- `Objective(userId, status)` - listagem
- `Objective(userId, deletedAt)` - filtro soft delete
- `Account(userId)`, `Session(userId)`, `FocusConfig(userId)`, `Tag(userId)` - isolamento

### 5.5 Acessibilidade

| Requisito | Ferramenta | Nível |
|---|---|---|
| Testes automatizados | axe-playwright (integrado no E2E) | WCAG 2.1 AA |
| Audit manual | axe-core DevTools | WCAG 2.1 AA |
| Navegação teclado | Playwright keyboard events | Todos fluxos críticos |
| Screen reader | Testes manuais com NVDA/VoiceOver | Fluxos principais |
| Contraste | Lighthouse + axe | Ratio >= 4.5:1 (texto normal) |
| Focus visible | CSS `:focus-visible` | Todos elementos interativos |

### 5.6 Pipeline CI

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (ci.yml)                                │
│                                                         │
│  ┌─────────────── Job: quality ──────────────────┐      │
│  │  1. Checkout                                   │      │
│  │  2. Node 20 + npm ci                           │      │
│  │  3. Prisma generate                            │      │
│  │  4. Lint (ESLint)                              │      │
│  │  5. Type check (tsc --noEmit)                  │      │
│  │  6. Unit tests (vitest run)                    │      │
│  │  7. Build (next build)                         │      │
│  └────────────────────┬──────────────────────────┘      │
│                       │ needs: quality                   │
│  ┌────────────────────▼──────────────────────────┐      │
│  │  Job: e2e                                      │      │
│  │  1. Checkout                                   │      │
│  │  2. Node 20 + npm ci                           │      │
│  │  3. Prisma generate                            │      │
│  │  4. Install Playwright (Chromium)              │      │
│  │  5. Run E2E tests                              │      │
│  │  6. Upload report on failure (7 days)          │      │
│  └────────────────────────────────────────────────┘      │
│                                                         │
│  Triggers: push main, PR -> main                        │
└─────────────────────────────────────────────────────────┘
```

**Status atual:** Lint ok, Typecheck ok, 36 testes ok, Build ok.

---

## 6. Requisitos Não-Funcionais

### Desempenho

- **Tempo de resposta API:** < 200ms para endpoints críticos (start session, list objectives)
- **Time to Interactive:** < 3 segundos em conexão 3G
- **LCP:** < 2.5 segundos
- **CLS:** < 0.1
- **Bundle size:** monitorar com `@next/bundle-analyzer`, alertar se página > 200KB gzipped

### Segurança

- Autenticação JWT com rotação de token (NextAuth gerencia)
- Todas rotas privadas protegidas por middleware Edge
- HTTPS obrigatório em produção (Vercel)
- Dados sensíveis (tokens OAuth) armazenados como `@db.Text` no PostgreSQL
- passwordHash isolado: nunca trafega na API
- Rate limiting em endpoints de auth (a implementar)

### Disponibilidade

- Deploy Vercel com replicação automática
- Banco PostgreSQL gerenciado (Neon / Supabase / Railway)
- Sem estado no servidor (stateless via JWT)

### Escalabilidade

- Arquitetura stateless: horizontal scaling via Vercel
- Prisma connection pooling via `@prisma/adapter-pg`
- Índices no banco para queries frequentes
- Paginação em listagens (focus sessions: limit/offset)

### Usabilidade

- Interface responsiva (mobile-first)
- Tema: system/light/dark (preferência persistida)
- Idioma: pt-BR (default), preparado para i18n
- Sons de notificação configuráveis
- Acessibilidade WCAG 2.1 AA

### Observabilidade

- Vercel Analytics (Web Vitals, erros)
- Structured logging em API routes (a implementar)
- Error boundaries no React

### Compliance

- LGPD: export de dados pessoais via `/api/user/export`
- LGPD: exclusão de conta com cascade completo via `/api/user/profile` (DELETE)
- Dados armazenados no provedor de banco escolhido (preferência: região BR)

---

## 7. Fases de Desenvolvimento

### Fase 1 - MVP Core (semanas 1-4)

> Objetivo: Fluxo completo funcional (auth -> timer -> métricas básicas). Testes desde o dia 1.

- [x] Setup projeto (Next.js 16, Prisma 7, Tailwind 4, Shadcn/UI, ESLint)
- [x] Schema Prisma (10 models, índices, enums)
- [x] Auth (NextAuth v5 + Google + Credentials, JWT, middleware Edge/Node split)
- [x] Services desacoplados (5 services)
- [x] API Routes (13 endpoints)
- [x] Focus Engine (classe pura, 4 metodologias)
- [x] Stores Zustand (focus-store, user-store)
- [x] Validators Zod v3 (auth, objective, focus-config, focus-session)
- [x] Testes unitários (36 testes: engine, validators, metrics)
- [x] CI pipeline (GitHub Actions: lint, typecheck, test, build, e2e)
- [ ] Design no Figma (telas de auth, timer, dashboard)
- [ ] UI - Telas de Auth (login, registro)
- [ ] UI - Timer principal (iniciar sessão, controles, finalizar)
- [ ] UI - Lista de objetivos (CRUD básico)
- [ ] UI - Dashboard básico (overview, streak)
- [ ] Testes E2E dos fluxos críticos (auth, timer, objectives)
- [ ] Testes de IDOR em todos endpoints
- [ ] Deploy staging (Vercel + banco PostgreSQL)

### Fase 2 - Expansão (semanas 5-8)

> Objetivo: Experiência completa com métricas detalhadas, configurações avançadas, polish.

- [ ] Design Figma (telas de métricas, configs, settings)
- [ ] UI - Métricas detalhadas (gráficos diários com Recharts, métricas por objetivo)
- [ ] UI - Insights inteligentes (horário produtivo, dia focado, taxa conclusão)
- [ ] UI - CRUD completo configs de foco
- [ ] UI - Gestão de tags (criar, editar, vincular)
- [ ] UI - Gestão de conta completa (perfil, senha, preferências, export, delete)
- [ ] Tema dark/light/system
- [ ] Sons e notificações (Web Audio API / Notification API)
- [ ] Testes E2E completos (todos fluxos)
- [ ] Testes de acessibilidade (axe-playwright em todas páginas)
- [ ] Performance audit (Lighthouse CI >= 90)
- [ ] Rate limiting em auth endpoints
- [ ] Headers de segurança (CSP, X-Frame-Options)

### Fase 3 - Inteligência e Polish (semanas 9-12)

> Objetivo: Insights avançados, otimizações, testes de carga, produção.

- [ ] Insights avançados (tendências, comparativo semanal, sugestões de melhoria)
- [ ] Gamificação básica (badges por streaks, marcos de horas)
- [ ] Onboarding flow (primeira vez do usuário)
- [ ] PWA (manifest, service worker, offline básico)
- [ ] i18n preparação (extrair strings, estrutura de tradução)
- [ ] Testes de carga (k6: 100 req/s nos endpoints críticos)
- [ ] Security audit (OWASP ZAP scan completo)
- [ ] Monitoramento (structured logging, error tracking)
- [ ] Otimização de queries (EXPLAIN, cache onde necessário)
- [ ] Deploy produção

### Fase 4 - App Mobile (semanas 13+)

> Objetivo: App nativo usando arquitetura existente.

- [ ] Setup React Native / Expo
- [ ] Consumir mesma API (services já desacoplados)
- [ ] Focus Engine roda idêntico no mobile (classe pura, sem deps DOM)
- [ ] Offline sync (queue de sessões, sync ao reconectar)
- [ ] Push notifications (abstraction layer + Firebase/APNs)
- [ ] Shared types (extrair para pacote compartilhado)
- [ ] Feature flags (habilitar features por plataforma)
- [ ] App Store / Play Store

---

## 8. Arquitetura Escalável para App Mobile

### 8.1 Services layer desacoplado

Os 5 services em `src/services/` não dependem de Next.js:

- Recebem `userId` como parâmetro (não extraem de request/session)
- Dependem apenas de `db` (Prisma) e tipos próprios
- Podem ser consumidos por qualquer runtime (Next.js API route, Express, tRPC, mobile BFF)

```
API Route (Next.js) ──→ requireAuth() ──→ service.method(userId, data)
                                              │
                                              ▼
Mobile BFF (Express) ──→ verifyJWT() ──→ service.method(userId, data)
```

### 8.2 JWT-Ready

A stack já usa JWT strategy (não session-based):

- Token contém `user.id`
- Stateless: não depende de lookup no banco por request
- Mobile pode receber o mesmo JWT e enviar no Authorization header
- Rotação de token e refresh ficam com NextAuth no web; no mobile, implementar com token store seguro (expo-secure-store)

### 8.3 Offline sync

Estratégia planejada para o mobile:

1. **Focus Engine roda 100% offline** (classe pura, sem HTTP durante sessão)
2. **Queue local**: sessões finalizadas são salvas localmente (AsyncStorage / SQLite)
3. **Sync on connect**: ao detectar conexão, envia queue para API
4. **Conflict resolution**: server timestamp wins (startedAt/endedAt definidos no client, validados no server)
5. **Optimistic UI**: lista de sessões e métricas atualizadas instantaneamente, reconciliadas pós-sync

### 8.4 Shared types

Tipos que servem web e mobile:

```
src/types/           (ou pacote separado @melon-focus/types)
├── focus.ts         # FocusMethodology, IntervalType, SessionPhase, configs
├── objective.ts     # ObjectiveStatus, CreateObjectiveInput, etc.
├── metrics.ts       # MetricsOverview, DailyMetric, Insight
└── user.ts          # UserProfile, UserPreferences
```

O `FocusEngine` e os validators Zod v3 também são portáveis (sem deps de DOM ou server).

### 8.5 Notification interface abstraction

```typescript
// Interface abstrata (compartilhada)
interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleLocal(title: string, body: string, triggerAt: Date): Promise<string>;
  cancelScheduled(id: string): Promise<void>;
  onReceived(callback: (notification: AppNotification) => void): () => void;
}

// Implementações concretas
class WebNotificationService implements NotificationService { ... }   // Notification API
class MobileNotificationService implements NotificationService { ... } // expo-notifications
```

### 8.6 Feature flags

Mecanismo para habilitar/desabilitar features por plataforma ou ambiente:

```typescript
const flags = {
  offlineMode: platform === 'mobile',
  pushNotifications: platform === 'mobile',
  webNotifications: platform === 'web',
  gamification: env === 'production',
  advancedInsights: tier === 'premium', // futuro
};
```

Implementação simples via config. Pode evoluir para serviço remoto (LaunchDarkly, Statsig) se necessário.

---

## 9. Integração com Design

### Workflow Figma → Código

```
1. Design no Figma
   └── Usuário cria telas, componentes, tokens de design

2. Extrair contexto
   └── Figma MCP: get_design_context(fileKey, nodeId)
   └── Retorna: screenshot + código de referência + tokens

3. Adaptar ao projeto
   └── Mapear tokens do Figma → Tailwind CSS variables
   └── Usar componentes Shadcn/UI existentes
   └── Respeitar padrões do projeto (cn(), CVA, Lucide icons)

4. Implementar
   └── Criar componente React em src/components/
   └── Conectar ao service/store correspondente
   └── Aplicar validators Zod nos forms

5. Validar
   └── Comparar screenshot do Figma com resultado
   └── Testar acessibilidade (axe-core)
   └── Testar responsividade
```

### Mapeamento design system

| Figma | Código |
|---|---|
| Cores primárias | CSS variables no `globals.css` (Shadcn theme) |
| Tipografia | Tailwind `font-*` classes |
| Espaçamento | Tailwind `p-*`, `m-*`, `gap-*` |
| Componentes base | Shadcn/UI (`button.tsx`, etc.) |
| Iconografia | Lucide React |
| Gráficos | Recharts |

### Convenções de componentes

- Componentes UI reutilizáveis: `src/components/ui/` (Shadcn)
- Componentes de feature: `src/components/[feature]/` (ex: `src/components/focus/Timer.tsx`)
- Páginas: `src/app/[route]/page.tsx`
- Layouts: `src/app/[route]/layout.tsx`
- Estilo: Tailwind utility classes, `cn()` para merge condicional, CVA para variants

---

## 10. Decisões Técnicas Pendentes

| # | Decisão | Opções | Contexto |
|---|---|---|---|
| 1 | Provedor PostgreSQL | Neon / Supabase / Railway / Vercel Postgres | Avaliar custo, latência (região BR), connection pooling |
| 2 | Rate limiting | next-rate-limit / upstash/ratelimit / custom middleware | Necessário para endpoints de auth; upstash é serverless-friendly |
| 3 | Error tracking | Sentry / Vercel Error Tracking / LogRocket | Monitoramento de erros em produção |
| 4 | Estratégia de cache | React cache() / unstable_cache / SWR no client / Redis | Métricas overview pode ter cache curto; daily data mais longo |
| 5 | Web Worker pro timer | Sim / Não | FocusEngine já é pura; Worker evitaria tab throttling |
| 6 | PWA scope | Full PWA / apenas manifest+icons / nenhum | PWA melhora experiência mobile web até ter app nativo |
| 7 | Estratégia i18n | next-intl / react-i18next / custom | pt-BR primeiro; preparar estrutura sem implementar traduções agora |
| 8 | Storage de imagem | Vercel Blob / Cloudinary / S3 | Avatar upload do usuário |
| 9 | Email transacional | Resend / SendGrid / AWS SES | Verificação de email, reset de senha (futuro) |
| 10 | Pacote de tipos compartilhados | Monorepo (turborepo) / pacote npm privado / copy manual | Necessário antes de iniciar app mobile |

---

## 11. Estimativa de Escopo por Módulo

> Estimativas em story points relativos (1 SP ~ 1 dia de trabalho focado).

### Fase 1 - MVP Core

| Módulo | Backend | Frontend | Testes | Total SP |
|---|---|---|---|---|
| Auth (UI + fluxos) | Pronto | 5 SP | 3 SP | 8 SP |
| Timer (UI + engine) | Pronto | 8 SP | 4 SP | 12 SP |
| Objetivos (UI CRUD) | Pronto | 5 SP | 3 SP | 8 SP |
| Dashboard básico | Pronto | 4 SP | 2 SP | 6 SP |
| Infra (deploy staging) | 2 SP | - | 1 SP | 3 SP |
| **Subtotal Fase 1** | **2 SP** | **22 SP** | **13 SP** | **37 SP** |

### Fase 2 - Expansão

| Módulo | Backend | Frontend | Testes | Total SP |
|---|---|---|---|---|
| Métricas avançadas (gráficos) | Pronto | 6 SP | 3 SP | 9 SP |
| Insights inteligentes | Pronto | 3 SP | 2 SP | 5 SP |
| Configs de foco (CRUD UI) | Pronto | 4 SP | 2 SP | 6 SP |
| Tags (CRUD + vincular) | 2 SP | 3 SP | 2 SP | 7 SP |
| Gestão de conta completa | Pronto | 5 SP | 3 SP | 8 SP |
| Tema dark/light | - | 3 SP | 1 SP | 4 SP |
| Sons e notificações | 1 SP | 3 SP | 1 SP | 5 SP |
| Security hardening | 3 SP | - | 3 SP | 6 SP |
| **Subtotal Fase 2** | **6 SP** | **27 SP** | **17 SP** | **50 SP** |

### Fase 3 - Inteligência e Polish

| Módulo | Backend | Frontend | Testes | Total SP |
|---|---|---|---|---|
| Insights avançados | 4 SP | 4 SP | 2 SP | 10 SP |
| Gamificação básica | 3 SP | 3 SP | 2 SP | 8 SP |
| Onboarding | - | 4 SP | 1 SP | 5 SP |
| PWA | - | 3 SP | 1 SP | 4 SP |
| i18n preparação | 1 SP | 3 SP | 1 SP | 5 SP |
| Performance + carga | 2 SP | 2 SP | 3 SP | 7 SP |
| Security audit | - | - | 4 SP | 4 SP |
| Deploy produção | 3 SP | - | 1 SP | 4 SP |
| **Subtotal Fase 3** | **13 SP** | **19 SP** | **15 SP** | **47 SP** |

### Fase 4 - App Mobile

| Módulo | Backend | Mobile | Testes | Total SP |
|---|---|---|---|---|
| Setup React Native / Expo | - | 5 SP | 1 SP | 6 SP |
| Telas core (auth, timer, objectives) | - | 12 SP | 5 SP | 17 SP |
| Offline sync | 4 SP | 6 SP | 4 SP | 14 SP |
| Push notifications | 3 SP | 4 SP | 2 SP | 9 SP |
| Shared types package | 3 SP | 2 SP | 1 SP | 6 SP |
| Feature flags | 2 SP | 1 SP | 1 SP | 4 SP |
| App Store / Play Store | - | 3 SP | - | 3 SP |
| **Subtotal Fase 4** | **12 SP** | **33 SP** | **14 SP** | **59 SP** |

### Resumo total

| Fase | Story Points | Semanas estimadas |
|---|---|---|
| Fase 1 - MVP Core | 37 SP | 4 semanas |
| Fase 2 - Expansão | 50 SP | 4 semanas |
| Fase 3 - Inteligência | 47 SP | 4 semanas |
| Fase 4 - Mobile | 59 SP | 5-6 semanas |
| **Total** | **193 SP** | **17-18 semanas** |

> **Nota:** Backend dos módulos core (auth, objectives, focus, metrics, user) já está pronto (services + API + validators + engine + stores). O escopo restante é majoritariamente frontend (UI) + testes + polish. A Fase 1 está com 10 de 18 itens concluídos.

---

## 12. Como rodar o projeto

### Desenvolvimento local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e configure no mínimo:

```
DATABASE_URL=postgresql://user:password@localhost:5432/melon_focus?schema=public
AUTH_SECRET=<gere com: npx auth secret>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

### Outros comandos úteis

```bash
npm run build        # build de produção
npm run typecheck    # TypeScript
npm run lint         # ESLint

npm run test         # testes Vitest (unit/integration)
npm run test:watch   # Vitest em modo watch
npm run test:e2e     # Playwright (costuma exigir app rodando)

npm run db:generate  # regenerar Prisma client após mudanças no schema
npm run db:migrate   # aplicar migrações
npm run db:push      # push do schema sem migração (somente desenvolvimento)
npm run db:seed      # popular dados de desenvolvimento
npm run db:studio    # abrir Prisma Studio
```

Stack: [Next.js](https://nextjs.org) (App Router). Deploy na Vercel ou outro host Node: veja [Deploying Next.js](https://nextjs.org/docs/app/building-your-application/deploying).

---

> Documento principal de referência do projeto. Última atualização: Abril 2026.
