# Melon Focus - Detalhamento do Projeto

> Documento principal de referencia do projeto. Ultima atualizacao: Abril 2026.

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Arquitetura](#2-arquitetura)
3. [Modelo de Dados](#3-modelo-de-dados)
4. [Modulos Funcionais](#4-modulos-funcionais)
5. [Estrategia de Testes & Qualidade](#5-estrategia-de-testes--qualidade)
6. [Requisitos Nao-Funcionais](#6-requisitos-nao-funcionais)
7. [Fases de Desenvolvimento](#7-fases-de-desenvolvimento)
8. [Arquitetura Escalavel pra App Mobile](#8-arquitetura-escalavel-pra-app-mobile)
9. [Integracao com Design](#9-integracao-com-design)
10. [Decisoes Tecnicas Pendentes](#10-decisoes-tecnicas-pendentes)
11. [Estimativa de Escopo por Modulo](#11-estimativa-de-escopo-por-modulo)

---

## 1. Visao Geral

**Melon Focus** e um app web de produtividade que permite ao usuario criar sessoes de foco personalizadas, vincula-las a objetivos concretos e acompanhar o progresso por meio de metricas e insights.

### Problema que resolve

Ferramentas de foco existentes sao genericas demais. O usuario quer autonomia total sobre a configuracao de seus timers (Pomodoro, Deep Work, Flowtime, Custom), visibilidade real de progresso vinculado a objetivos, e dados de produtividade que ajudem a entender habitos.

### Publico-alvo

Profissionais, estudantes e criadores que buscam disciplina de foco com metricas de acompanhamento. Perfil: pessoas que ja usam tecnicas como Pomodoro mas querem mais controle e visibilidade.

### Diferenciais

- 4 metodologias de foco (Pomodoro, Deep Work, Flowtime, Custom) totalmente configuraveis
- Objetivos com metas em horas e sessoes, vinculados a sessoes de foco
- Metricas detalhadas: streaks, insights de horario produtivo, dia mais focado, taxa de conclusao
- Arquitetura preparada para app mobile futuro (React Native/Expo)
- Design autoral feito no Figma pelo proprio desenvolvedor

---

## 2. Arquitetura

### Stack Tecnologica

| Camada | Tecnologia | Versao |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| Linguagem | TypeScript | 5.x |
| UI | Tailwind CSS + Shadcn/UI + Base UI | 4.x / 4.2.0 / 1.4.0 |
| ORM | Prisma (com `@prisma/adapter-pg`) | 7.7.0 |
| Banco | PostgreSQL | - |
| Auth | NextAuth v5 (beta) + JWT strategy | 5.0.0-beta.31 |
| State | Zustand | 5.0.12 |
| Validacao | Zod **v3** | 3.25.76 |
| Charts | Recharts | 3.8.1 |
| Icons | Lucide React | 1.8.0 |
| Utilitarios | date-fns, clsx, tailwind-merge, class-variance-authority | - |
| Hashing | bcryptjs | 3.0.3 |
| Testes Unit/Integration | Vitest + Testing Library + jsdom | 4.1.4 |
| Testes E2E | Playwright + Chromium | 1.59.1 |
| Acessibilidade | axe-playwright | 2.2.2 |
| Runtime | React | 19.2.4 |
| Deploy | Vercel | - |

> **Nota importante:** Zod e v3 (nao v4). A v4 e incompativel com `eslint-config-next`. Import: `from "zod"`.

### Estrutura de Pastas (real do repositorio)

```
melon-focus/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Pipeline CI (quality + e2e)
├── prisma/
│   ├── schema.prisma                 # 10 models + enums + indices
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
│   │   │   │   ├── overview/route.ts         # GET - visao geral
│   │   │   │   ├── daily/route.ts            # GET - metricas diarias
│   │   │   │   ├── by-objective/route.ts     # GET - metricas por objetivo
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
│   │   ├── utils.ts                          # cn() e utilitarios
│   │   └── validators/
│   │       ├── auth.ts                       # registerSchema, loginSchema
│   │       ├── objective.ts                  # createObjectiveSchema, updateObjectiveSchema
│   │       ├── focus-config.ts               # createFocusConfigSchema, updateFocusConfigSchema
│   │       └── focus-session.ts              # startSessionSchema, finishSessionSchema
│   ├── middleware.ts                         # NextAuth middleware (Edge)
│   ├── services/
│   │   ├── objective.service.ts              # CRUD + progress
│   │   ├── focus-session.service.ts          # start, finish, cancel, list, addInterval
│   │   ├── focus-config.service.ts           # CRUD + validacao de uso
│   │   ├── metrics.service.ts                # overview, daily, byObjective, insights, streak
│   │   └── user.service.ts                   # profile, password, preferences, delete, export
│   ├── stores/
│   │   ├── focus-store.ts                    # Zustand - engine + sessao ativa
│   │   └── user-store.ts                     # Zustand - preferencias do usuario
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

### Separacao Auth (Edge vs Node)

O NextAuth v5 exige que o middleware rode em Edge Runtime, mas Prisma nao suporta Edge. Por isso a configuracao e dividida:

| Arquivo | Runtime | Conteudo |
|---|---|---|
| `src/lib/auth.config.ts` | Edge | Providers (Google, Credentials stub), callbacks (jwt, session, authorized), paginas |
| `src/lib/auth.ts` | Node | PrismaAdapter, Credentials com `authorize()` real (bcrypt + DB lookup) |
| `src/middleware.ts` | Edge | Importa apenas `auth.config.ts`, protege rotas privadas |

---

## 3. Modelo de Dados

### Diagrama de Entidades

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

### Models Detalhados

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

Relacoes: Account[], Session[], Objective[], FocusConfig[], FocusSession[], Tag[], UserPreferences?

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

Indices: `@@unique([provider, providerAccountId])`, `@@index([userId])`

#### Session (NextAuth)
| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| sessionToken | String | Unique |
| userId | String | FK -> User (onDelete: Cascade) |
| expires | DateTime | - |

Indice: `@@index([userId])`

#### VerificationToken
| Campo | Tipo | Detalhes |
|---|---|---|
| identifier | String | - |
| token | String | - |
| expires | DateTime | - |

Indice: `@@unique([identifier, token])`

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
| title | String | Obrigatorio |
| description | String? | - |
| targetHours | Float? | Meta em horas |
| targetSessions | Int? | Meta em sessoes |
| deadline | DateTime? | - |
| status | ObjectiveStatus | Default: ACTIVE |
| color | String | Default: "#6366f1" |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |
| deletedAt | DateTime? | **Soft delete** |

Enum ObjectiveStatus: `ACTIVE | PAUSED | COMPLETED | ARCHIVED`

Indices: `@@index([userId, status])`, `@@index([userId, deletedAt])`

#### FocusConfig (templates reutilizaveis)
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

Indice: `@@index([userId])`

#### FocusSession (sessao executada)
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

Indices: `@@index([userId, status])`, `@@index([userId, startedAt])`, `@@index([userId, objectiveId])`, `@@index([objectiveId])`

#### FocusInterval (blocos dentro da sessao)
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

Indice: `@@index([sessionId])`

#### Tag
| Campo | Tipo | Detalhes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK -> User (Cascade) |
| name | String | - |
| color | String | Default: "#8b5cf6" |

Indices: `@@unique([userId, name])`, `@@index([userId])`

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

### Regras de Integridade

- **Cascade em User**: deletar usuario remove tudo (Account, Session, Objective, FocusConfig, FocusSession, Tag, UserPreferences)
- **SetNull em Objective -> FocusSession**: deletar objetivo nao perde sessoes, apenas desvincula
- **Cascade em FocusSession -> FocusInterval**: deletar sessao remove intervalos
- **Cascade nas join tables**: deletar tag/objetivo/sessao limpa relacoes
- **Soft delete em Objective**: campo `deletedAt`, todas queries filtram `deletedAt: null`
- **passwordHash nunca retornado**: todas queries de User usam `select` explicito excluindo `passwordHash`

---

## 4. Modulos Funcionais

### 4.1 Auth (Autenticacao)

#### Providers
- **Google OAuth** (via NextAuth)
- **Credentials** (email + senha com bcrypt, salt rounds = 12)

#### Regras de Senha
- Minimo 8 caracteres
- Ao menos 1 letra maiuscula
- Ao menos 1 numero

#### Telas
| Tela | Rota | Descricao |
|---|---|---|
| Login | `/login` | Email/senha + botao Google |
| Registro | `/register` | Nome, email, senha |
| Erro Auth | `/login` (com query) | Mensagens de erro |

#### Endpoints
| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/api/auth/register` | Registra usuario (credentials), cria preferences default + FocusConfig Pomodoro default |
| GET/POST | `/api/auth/[...nextauth]` | Handlers NextAuth (signin, signout, session, callback) |

#### Middleware
- `src/middleware.ts` protege todas rotas exceto: `/`, `/login`, `/register`, `/api/auth/*`
- Roda em Edge Runtime (usa apenas `auth.config.ts`)
- Matcher: `/((?!_next/static|_next/image|favicon.ico|public/)*)`

### 4.2 Gestao de Conta

#### Funcionalidades
- Ver perfil (nome, email, avatar, providers vinculados, data de criacao)
- Editar nome e avatar
- Alterar senha (apenas contas credentials)
- Atualizar preferencias (tema, idioma, som, notificacoes)
- Exportar dados pessoais (LGPD compliance)
- Deletar conta (cascade completo)

#### Telas
| Tela | Rota | Descricao |
|---|---|---|
| Perfil / Configuracoes | `/settings` | Dados da conta, preferencias |
| Alterar Senha | `/settings/password` | Form de mudanca de senha |
| Exportar Dados | `/settings/export` | Botao de download JSON |
| Deletar Conta | `/settings/delete` | Confirmacao + acao irreversivel |

#### Endpoints
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/user/profile` | Retorna perfil (sem passwordHash) + preferences + providers |
| PATCH | `/api/user/profile` | Atualiza nome/avatar/senha/preferences |
| GET | `/api/user/export` | Exporta todos dados do usuario (JSON) |

#### Service: `userService`
- `getProfile(userId)` - select explicito, sem passwordHash
- `updateProfile(userId, data)` - nome/avatar
- `changePassword(userId, current, new)` - compara hash antes de atualizar
- `updatePreferences(userId, data)` - upsert (cria se nao existir)
- `deleteAccount(userId)` - cascade via Prisma
- `exportData(userId)` - agrega user + objectives + sessions + configs + tags

### 4.3 Objetivos

#### Funcionalidades
- CRUD de objetivos com soft delete
- Metas: targetHours e/ou targetSessions
- Status: ACTIVE, PAUSED, COMPLETED, ARCHIVED
- Tags vinculadas (many-to-many)
- Progresso calculado: % horas, % sessoes
- Deadline opcional
- Cor personalizavel

#### Telas
| Tela | Rota | Descricao |
|---|---|---|
| Lista de Objetivos | `/objectives` | Cards com progresso, filtro por status |
| Detalhes do Objetivo | `/objectives/[id]` | Progresso, sessoes vinculadas, editar |
| Criar Objetivo | `/objectives/new` | Form completo |
| Editar Objetivo | `/objectives/[id]/edit` | Form pre-preenchido |

#### Endpoints
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/objectives` | Lista objetivos (filtra deletedAt: null) |
| POST | `/api/objectives` | Cria objetivo (com tags opcionais) |
| GET | `/api/objectives/[id]` | Detalhe do objetivo |
| PATCH | `/api/objectives/[id]` | Atualiza objetivo (titulo, status, tags, etc.) |
| DELETE | `/api/objectives/[id]` | Soft delete (define deletedAt) |
| GET | `/api/objectives/[id]/progress` | Retorna progresso: totalHours, totalSessions, percentHours, percentSessions |

#### Service: `objectiveService`
- `list(userId, status?)` - inclui tags e contagem de sessoes
- `getById(userId, id)` - com tags
- `create(userId, data)` - cria com tags opcionais (CreateObjectiveInput)
- `update(userId, id, data)` - re-cria tags se tagIds fornecido
- `delete(userId, id)` - soft delete via `deletedAt = new Date()`
- `getProgress(userId, id)` - calcula a partir das sessoes COMPLETED vinculadas

#### Validacao (Zod v3)
```
createObjectiveSchema: title (1-200), description? (max 2000), targetHours? (positive),
  targetSessions? (int positive), deadline? (datetime string), color? (#hex6), tagIds? (string[])

updateObjectiveSchema: partial de create + status? (enum)
```

### 4.4 Timer / Foco

#### Metodologias Suportadas

| Metodologia | focusDuration | shortBreak | longBreak | sessionsBeforeLong |
|---|---|---|---|---|
| POMODORO | 25min | 5min | 15min | 4 |
| DEEP_WORK | 90min | 15min | - | - |
| FLOWTIME | ilimitado (0) | 10min | - | - |
| CUSTOM | configuravel | configuravel | opcional | opcional |

#### Funcionalidades
- Configuracoes de foco reutilizaveis (FocusConfig)
- Apenas 1 config pode ser `isDefault` por usuario
- Sessao de foco com intervalos (focus, short_break, long_break)
- Pause/resume com contagem de pausas e tempo total pausado
- Skip para pular intervalo atual
- Finish para encerrar sessao
- Notas e rating (1-5) ao finalizar
- Cancel para cancelar sessao em progresso
- Auto-cancel de sessoes IN_PROGRESS anteriores ao iniciar nova
- FocusEngine: classe pura sem dependencias DOM/React, funciona no main thread ou Web Worker

#### Telas
| Tela | Rota | Descricao |
|---|---|---|
| Timer Principal | `/focus` | Timer ativo, controles, info do intervalo atual |
| Iniciar Sessao | `/focus/start` | Selecionar config + objetivo (opcional) |
| Configs de Foco | `/focus/configs` | Lista de templates |
| Criar/Editar Config | `/focus/configs/new` ou `/focus/configs/[id]` | Form completo |
| Historico de Sessoes | `/focus/history` | Lista paginada com filtros |
| Detalhe da Sessao | `/focus/sessions/[id]` | Intervalos, duracao, notas, rating |

#### Endpoints
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/focus/configs` | Lista configs do usuario |
| POST | `/api/focus/configs` | Cria config (garante unico isDefault) |
| GET | `/api/focus/configs/[id]` | Detalhe da config |
| PATCH | `/api/focus/configs/[id]` | Atualiza config |
| DELETE | `/api/focus/configs/[id]` | Deleta config (erro se em uso por sessoes) |
| GET | `/api/focus/sessions` | Lista sessoes (paginado, filtro por objective/status) |
| POST | `/api/focus/sessions` | Inicia sessao (cancela IN_PROGRESS anteriores) |
| GET | `/api/focus/sessions/[id]` | Detalhe da sessao com intervalos |
| PATCH | `/api/focus/sessions/[id]` | Finaliza sessao (notes, rating) |
| DELETE | `/api/focus/sessions/[id]` | Cancela sessao |

#### Services
- `focusConfigService`: list, getById, create, update, delete (valida se config esta em uso)
- `focusSessionService`: start, finish, cancel, getById, list (paginado), addInterval

#### Focus Engine (`src/lib/focus-engine.ts`)
Classe pura `FocusEngine`:
- **State**: phase (idle/focus/short_break/long_break/finished), elapsed, remaining, totalFocusTime, totalBreakTime, completedFocusIntervals, intervals[], pauseCount, totalPauseTime, isPaused
- **Metodos publicos**: start(), pause(), resume(), skipInterval(), finish(), getState(), onEvent(callback), destroy()
- **Eventos**: tick, interval_complete, session_complete, phase_change
- **Tick**: setInterval de 1 segundo, atualiza elapsed/remaining, detecta fim de intervalo, auto-avanca conforme config
- **Helper**: formatTime(seconds), getDefaultConfig(methodology)

#### Zustand Store: `useFocusStore`
- Gerencia instancia do FocusEngine no client
- Vincula sessionId do servidor com engine local
- Actions: startFocus, pause, resume, skipInterval, finish, reset

#### Validacao (Zod v3)
```
createFocusConfigSchema: name (1-100), methodology (enum), focusDuration (1-240),
  shortBreakDuration (1-60), longBreakDuration? (1-60), sessionsBeforeLongBreak? (1-20),
  autoStartBreak?, autoStartFocus?, soundEnabled?, soundType?, isDefault?

startSessionSchema: focusConfigId (string), objectiveId? (string)
finishSessionSchema: notes? (max 5000), rating? (1-5 int)
```

### 4.5 Metricas e Insights

#### Funcionalidades
- Overview: total horas, total sessoes, duracao media, rating medio, streak atual/recorde
- Metricas diarias: horas e sessoes por dia (range de datas)
- Metricas por objetivo: horas e sessoes por objetivo, com metas
- Insights inteligentes (baseados nas ultimas 100 sessoes):
  - Horario mais produtivo
  - Dia da semana mais focado
  - Taxa de conclusao
  - Streak ativo

#### Telas
| Tela | Rota | Descricao |
|---|---|---|
| Dashboard | `/dashboard` | Overview + graficos diarios + insights |
| Metricas por Objetivo | `/dashboard/objectives` | Comparativo entre objetivos |
| Detalhes de Progresso | `/dashboard/details` | Analise detalhada com filtros de data |

#### Endpoints
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/metrics/overview` | Horas totais, sessoes, media, streak |
| GET | `/api/metrics/daily?from=&to=` | Metricas diarias no range |
| GET | `/api/metrics/by-objective` | Metricas agrupadas por objetivo |
| GET | `/api/metrics/insights` | Insights inteligentes (min 5 sessoes) |

#### Service: `metricsService`
- `getOverview(userId)` - agrega todas sessoes COMPLETED
- `getDaily(userId, from, to)` - agrupa por dia
- `getByObjective(userId)` - inclui metas pra comparacao
- `getInsights(userId)` - analise das ultimas 100 sessoes (hora, dia, taxa, streak)
- `calculateStreak(dates)` - calcula streak atual e recorde (funcao pura, testada unitariamente)

---

## 5. Estrategia de Testes & Qualidade

### 5.1 Testes Unitarios e de Integracao (Vitest)

**Config:** `vitest.config.ts` com `jsdom`, alias `@/` para `src/`.

| Suite | Arquivo | O que testa |
|---|---|---|
| Focus Engine | `tests/unit/focus-engine.test.ts` | Pomodoro completo, deep work, flowtime (unlimited), pause/resume, skip, finish, contagem de pausas |
| Validators | `tests/unit/validators.test.ts` | Schemas Zod: auth (register, login), objective (create, update), focus-config, focus-session |
| Metrics | `tests/unit/metrics.test.ts` | calculateStreak: streak ativo, streak quebrado, dias unicos, sem dados |

**Status atual:** 36 testes passando.

**Cobertura planejada:**
- Services (mock Prisma) - CRUD operations, edge cases
- API Routes - validacao de input, auth check, error handling
- Stores Zustand - state transitions
- Focus Engine - todas metodologias, edge cases (duracoes extremas, ticks rapidos)

### 5.2 Testes E2E (Playwright)

**Config:** `playwright.config.ts`, browser: Chromium

**Fluxos planejados:**
- Registro completo (credentials) -> login -> dashboard
- Login Google (mock) -> criar objetivo -> iniciar sessao -> finalizar -> ver metricas
- CRUD objetivos (criar, editar, soft delete, filtrar por status)
- Timer: iniciar, pausar, resumir, pular intervalo, finalizar com notas/rating
- Configuracoes: criar config, definir como default, tentar deletar config em uso
- Perfil: alterar nome, mudar senha, exportar dados
- Responsividade: mobile, tablet, desktop

### 5.3 Seguranca

#### OWASP / Ataques Comuns
| Teste | Descricao | Ferramenta |
|---|---|---|
| SQL Injection | Prisma parametriza queries automaticamente; testar input malicioso nos validators | Vitest + manual |
| XSS | Inputs sanitizados, React escapa por default; testar em campos de texto livre (notes, description) | Playwright |
| CSRF | NextAuth inclui tokens CSRF automaticamente | Verificacao manual |
| IDOR | Testar acesso a recursos de outro usuario (objective, session, config) | Vitest + Playwright |
| Brute Force | Rate limiting no registro e login | k6 + middleware |
| Headers | Verificar headers de seguranca (X-Frame-Options, CSP, etc.) | OWASP ZAP / curl |

#### IDOR (Insecure Direct Object Reference) - Prioridade
Cada endpoint de API filtra por `userId` obrigatoriamente. Testes devem validar:
- Usuario A nao consegue GET/PATCH/DELETE recurso do usuario B
- `objectiveService.getById(userA, idDoUserB)` retorna null
- `focusSessionService.finish(userA, sessionIdDoUserB)` retorna null

#### Seguranca do Banco
| Regra | Implementacao |
|---|---|
| Isolamento de dados por usuario | Todas queries incluem `WHERE userId = ?` |
| passwordHash nunca retornado | `select` explicito em toda query de User |
| Cascade controlado | User delete cascatea tudo; Objective delete usa SetNull em sessoes |
| Soft delete | Objectives usam `deletedAt` — dados nunca sao perdidos acidentalmente |
| Hashing seguro | bcryptjs com salt rounds = 12 |
| Tokens sensíveis em Text | `access_token`, `refresh_token`, `id_token` armazenados como `@db.Text` |

### 5.4 Performance

| Tipo | Ferramenta | Metricas Alvo |
|---|---|---|
| Frontend | Lighthouse CI | Performance >= 90, Accessibility >= 90, Best Practices >= 90 |
| Web Vitals | Vercel Analytics / web-vitals lib | LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| Carga | k6 | API endpoints suportam 100 req/s sem degradacao |
| Database | Prisma Studio + EXPLAIN | Queries com indices atendem < 50ms |

**Indices otimizados no schema:**
- `FocusSession(userId, status)` - filtro mais comum
- `FocusSession(userId, startedAt)` - queries de metricas por data
- `FocusSession(userId, objectiveId)` - metricas por objetivo
- `Objective(userId, status)` - listagem
- `Objective(userId, deletedAt)` - filtro soft delete
- `Account(userId)`, `Session(userId)`, `FocusConfig(userId)`, `Tag(userId)` - isolamento

### 5.5 Acessibilidade

| Requisito | Ferramenta | Nivel |
|---|---|---|
| Testes automatizados | axe-playwright (integrado no E2E) | WCAG 2.1 AA |
| Audit manual | axe-core DevTools | WCAG 2.1 AA |
| Navegacao teclado | Playwright keyboard events | Todos fluxos criticos |
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

## 6. Requisitos Nao-Funcionais

### Desempenho
- **Tempo de resposta API:** < 200ms para endpoints criticos (start session, list objectives)
- **Time to Interactive:** < 3 segundos em conexao 3G
- **LCP:** < 2.5 segundos
- **CLS:** < 0.1
- **Bundle size:** monitorar com `@next/bundle-analyzer`, alertar se pagina > 200KB gzipped

### Seguranca
- Autenticacao JWT com rotacao de token (NextAuth gerencia)
- Todas rotas privadas protegidas por middleware Edge
- HTTPS obrigatorio em producao (Vercel)
- Dados sensíveis (tokens OAuth) armazenados como `@db.Text` no PostgreSQL
- passwordHash isolado: nunca trafega na API
- Rate limiting em endpoints de auth (a implementar)

### Disponibilidade
- Deploy Vercel com replicacao automatica
- Banco PostgreSQL gerenciado (Neon / Supabase / Railway)
- Sem estado no servidor (stateless via JWT)

### Escalabilidade
- Arquitetura stateless: horizontal scaling via Vercel
- Prisma connection pooling via `@prisma/adapter-pg`
- Indices no banco para queries frequentes
- Paginacao em listagens (focus sessions: limit/offset)

### Usabilidade
- Interface responsiva (mobile-first)
- Tema: system/light/dark (preferencia persistida)
- Idioma: pt-BR (default), preparado para i18n
- Sons de notificacao configuraveis
- Acessibilidade WCAG 2.1 AA

### Observabilidade
- Vercel Analytics (Web Vitals, erros)
- Structured logging em API routes (a implementar)
- Error boundaries no React

### Compliance
- LGPD: export de dados pessoais via `/api/user/export`
- LGPD: exclusao de conta com cascade completo via `/api/user/profile` (DELETE)
- Dados armazenados no provedor de banco escolhido (preferencia: regiao BR)

---

## 7. Fases de Desenvolvimento

### Fase 1 - MVP Core (semanas 1-4)

> Objetivo: Fluxo completo funcional (auth -> timer -> metricas basicas). Testes desde o dia 1.

- [x] Setup projeto (Next.js 16, Prisma 7, Tailwind 4, Shadcn/UI, ESLint)
- [x] Schema Prisma (10 models, indices, enums)
- [x] Auth (NextAuth v5 + Google + Credentials, JWT, middleware Edge/Node split)
- [x] Services desacoplados (5 services)
- [x] API Routes (13 endpoints)
- [x] Focus Engine (classe pura, 4 metodologias)
- [x] Stores Zustand (focus-store, user-store)
- [x] Validators Zod v3 (auth, objective, focus-config, focus-session)
- [x] Testes unitarios (36 testes: engine, validators, metrics)
- [x] CI pipeline (GitHub Actions: lint, typecheck, test, build, e2e)
- [ ] Design no Figma (telas de auth, timer, dashboard)
- [ ] UI - Telas de Auth (login, registro)
- [ ] UI - Timer principal (iniciar sessao, controles, finalizar)
- [ ] UI - Lista de objetivos (CRUD basico)
- [ ] UI - Dashboard basico (overview, streak)
- [ ] Testes E2E dos fluxos criticos (auth, timer, objectives)
- [ ] Testes de IDOR em todos endpoints
- [ ] Deploy staging (Vercel + banco PostgreSQL)

### Fase 2 - Expansao (semanas 5-8)

> Objetivo: Experiencia completa com metricas detalhadas, configuracoes avancadas, polish.

- [ ] Design Figma (telas de metricas, configs, settings)
- [ ] UI - Metricas detalhadas (graficos diarios com Recharts, metricas por objetivo)
- [ ] UI - Insights inteligentes (horario produtivo, dia focado, taxa conclusao)
- [ ] UI - CRUD completo configs de foco
- [ ] UI - Gestao de tags (criar, editar, vincular)
- [ ] UI - Gestao de conta completa (perfil, senha, preferencias, export, delete)
- [ ] Tema dark/light/system
- [ ] Sons e notificacoes (Web Audio API / Notification API)
- [ ] Testes E2E completos (todos fluxos)
- [ ] Testes de acessibilidade (axe-playwright em todas paginas)
- [ ] Performance audit (Lighthouse CI >= 90)
- [ ] Rate limiting em auth endpoints
- [ ] Headers de seguranca (CSP, X-Frame-Options)

### Fase 3 - Inteligencia e Polish (semanas 9-12)

> Objetivo: Insights avancados, otimizacoes, testes de carga, producao.

- [ ] Insights avancados (tendencias, comparativo semanal, sugestoes de melhoria)
- [ ] Gamificacao basica (badges por streaks, marcos de horas)
- [ ] Onboarding flow (primeira vez do usuario)
- [ ] PWA (manifest, service worker, offline basico)
- [ ] i18n preparacao (extrair strings, estrutura de traducao)
- [ ] Testes de carga (k6: 100 req/s nos endpoints criticos)
- [ ] Security audit (OWASP ZAP scan completo)
- [ ] Monitoramento (structured logging, error tracking)
- [ ] Otimizacao de queries (EXPLAIN, cache onde necessario)
- [ ] Deploy producao

### Fase 4 - App Mobile (semanas 13+)

> Objetivo: App nativo usando arquitetura existente.

- [ ] Setup React Native / Expo
- [ ] Consumir mesma API (services ja desacoplados)
- [ ] Focus Engine roda identico no mobile (classe pura, sem deps DOM)
- [ ] Offline sync (queue de sessoes, sync ao reconectar)
- [ ] Push notifications (abstraction layer + Firebase/APNs)
- [ ] Shared types (extrair para pacote compartilhado)
- [ ] Feature flags (habilitar features por plataforma)
- [ ] App Store / Play Store

---

## 8. Arquitetura Escalavel pra App Mobile

### 8.1 Services Layer Desacoplado

Os 5 services em `src/services/` nao dependem de Next.js:
- Recebem `userId` como parametro (nao extraem de request/session)
- Dependem apenas de `db` (Prisma) e tipos proprios
- Podem ser consumidos por qualquer runtime (Next.js API route, Express, tRPC, mobile BFF)

```
API Route (Next.js) ──→ requireAuth() ──→ service.method(userId, data)
                                              │
                                              ▼
Mobile BFF (Express) ──→ verifyJWT() ──→ service.method(userId, data)
```

### 8.2 JWT-Ready

A stack ja usa JWT strategy (nao session-based):
- Token contem `user.id`
- Stateless: nao depende de lookup no banco por request
- Mobile pode receber o mesmo JWT e enviar no Authorization header
- Rotacao de token e refresh ficam com NextAuth no web; no mobile, implementar com token store seguro (expo-secure-store)

### 8.3 Offline Sync

Estrategia planejada para o mobile:

1. **Focus Engine roda 100% offline** (classe pura, sem HTTP durante sessao)
2. **Queue local**: sessoes finalizadas sao salvas localmente (AsyncStorage / SQLite)
3. **Sync on connect**: ao detectar conexao, envia queue para API
4. **Conflict resolution**: server timestamp wins (startedAt/endedAt definidos no client, validados no server)
5. **Optimistic UI**: lista de sessoes e metricas atualizadas instantaneamente, reconciliadas pos-sync

### 8.4 Shared Types

Tipos que servem web e mobile:

```
src/types/           (ou pacote separado @melon-focus/types)
├── focus.ts         # FocusMethodology, IntervalType, SessionPhase, configs
├── objective.ts     # ObjectiveStatus, CreateObjectiveInput, etc.
├── metrics.ts       # MetricsOverview, DailyMetric, Insight
└── user.ts          # UserProfile, UserPreferences
```

O `FocusEngine` e os validators Zod v3 tambem sao portaveis (sem deps de DOM ou server).

### 8.5 Notification Interface Abstraction

```typescript
// Interface abstrata (compartilhada)
interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleLocal(title: string, body: string, triggerAt: Date): Promise<string>;
  cancelScheduled(id: string): Promise<void>;
  onReceived(callback: (notification: AppNotification) => void): () => void;
}

// Implementacoes concretas
class WebNotificationService implements NotificationService { ... }   // Notification API
class MobileNotificationService implements NotificationService { ... } // expo-notifications
```

### 8.6 Feature Flags

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

Implementacao simples via config. Pode evoluir para servico remoto (LaunchDarkly, Statsig) se necessario.

---

## 9. Integracao com Design

### Workflow Figma -> Codigo

```
1. Design no Figma
   └── Usuario cria telas, componentes, tokens de design

2. Extrair contexto
   └── Figma MCP: get_design_context(fileKey, nodeId)
   └── Retorna: screenshot + codigo de referencia + tokens

3. Adaptar ao projeto
   └── Mapear tokens do Figma → Tailwind CSS variables
   └── Usar componentes Shadcn/UI existentes
   └── Respeitar padroes do projeto (cn(), CVA, Lucide icons)

4. Implementar
   └── Criar componente React em src/components/
   └── Conectar ao service/store correspondente
   └── Aplicar validators Zod nos forms

5. Validar
   └── Comparar screenshot do Figma com resultado
   └── Testar acessibilidade (axe-core)
   └── Testar responsividade
```

### Mapeamento Design System

| Figma | Codigo |
|---|---|
| Cores primarias | CSS variables no `globals.css` (Shadcn theme) |
| Tipografia | Tailwind `font-*` classes |
| Espacamento | Tailwind `p-*`, `m-*`, `gap-*` |
| Componentes base | Shadcn/UI (`button.tsx`, etc.) |
| Iconografia | Lucide React |
| Graficos | Recharts |

### Convencoes de Componentes

- Componentes UI reutilizaveis: `src/components/ui/` (Shadcn)
- Componentes de feature: `src/components/[feature]/` (ex: `src/components/focus/Timer.tsx`)
- Paginas: `src/app/[route]/page.tsx`
- Layouts: `src/app/[route]/layout.tsx`
- Estilo: Tailwind utility classes, `cn()` para merge condicional, CVA para variants

---

## 10. Decisoes Tecnicas Pendentes

| # | Decisao | Opcoes | Contexto |
|---|---|---|---|
| 1 | Provedor PostgreSQL | Neon / Supabase / Railway / Vercel Postgres | Avaliar custo, latencia (regiao BR), connection pooling |
| 2 | Rate limiting | next-rate-limit / upstash/ratelimit / custom middleware | Necessario para endpoints de auth; upstash e serverless-friendly |
| 3 | Error tracking | Sentry / Vercel Error Tracking / LogRocket | Monitoramento de erros em producao |
| 4 | Estrategia de cache | React cache() / unstable_cache / SWR no client / Redis | Metricas overview pode ter cache curto; daily data mais longo |
| 5 | Web Worker pro timer | Sim / Nao | FocusEngine ja e pura; Worker evitaria tab throttling |
| 6 | PWA scope | Full PWA / apenas manifest+icons / nenhum | PWA melhora experiencia mobile web ate ter app nativo |
| 7 | Estrategia i18n | next-intl / react-i18next / custom | pt-BR primeiro; preparar estrutura sem implementar traducoes agora |
| 8 | Storage de imagem | Vercel Blob / Cloudinary / S3 | Avatar upload do usuario |
| 9 | Email transacional | Resend / SendGrid / AWS SES | Verificacao de email, reset de senha (futuro) |
| 10 | Pacote de tipos compartilhados | Monorepo (turborepo) / pacote npm privado / copy manual | Necessario antes de iniciar app mobile |

---

## 11. Estimativa de Escopo por Modulo

> Estimativas em story points relativos (1 SP ~ 1 dia de trabalho focado).

### Fase 1 - MVP Core

| Modulo | Backend | Frontend | Testes | Total SP |
|---|---|---|---|---|
| Auth (UI + fluxos) | Pronto | 5 SP | 3 SP | 8 SP |
| Timer (UI + engine) | Pronto | 8 SP | 4 SP | 12 SP |
| Objetivos (UI CRUD) | Pronto | 5 SP | 3 SP | 8 SP |
| Dashboard basico | Pronto | 4 SP | 2 SP | 6 SP |
| Infra (deploy staging) | 2 SP | - | 1 SP | 3 SP |
| **Subtotal Fase 1** | **2 SP** | **22 SP** | **13 SP** | **37 SP** |

### Fase 2 - Expansao

| Modulo | Backend | Frontend | Testes | Total SP |
|---|---|---|---|---|
| Metricas avancadas (graficos) | Pronto | 6 SP | 3 SP | 9 SP |
| Insights inteligentes | Pronto | 3 SP | 2 SP | 5 SP |
| Configs de foco (CRUD UI) | Pronto | 4 SP | 2 SP | 6 SP |
| Tags (CRUD + vincular) | 2 SP | 3 SP | 2 SP | 7 SP |
| Gestao de conta completa | Pronto | 5 SP | 3 SP | 8 SP |
| Tema dark/light | - | 3 SP | 1 SP | 4 SP |
| Sons e notificacoes | 1 SP | 3 SP | 1 SP | 5 SP |
| Security hardening | 3 SP | - | 3 SP | 6 SP |
| **Subtotal Fase 2** | **6 SP** | **27 SP** | **17 SP** | **50 SP** |

### Fase 3 - Inteligencia e Polish

| Modulo | Backend | Frontend | Testes | Total SP |
|---|---|---|---|---|
| Insights avancados | 4 SP | 4 SP | 2 SP | 10 SP |
| Gamificacao basica | 3 SP | 3 SP | 2 SP | 8 SP |
| Onboarding | - | 4 SP | 1 SP | 5 SP |
| PWA | - | 3 SP | 1 SP | 4 SP |
| i18n preparacao | 1 SP | 3 SP | 1 SP | 5 SP |
| Performance + carga | 2 SP | 2 SP | 3 SP | 7 SP |
| Security audit | - | - | 4 SP | 4 SP |
| Deploy producao | 3 SP | - | 1 SP | 4 SP |
| **Subtotal Fase 3** | **13 SP** | **19 SP** | **15 SP** | **47 SP** |

### Fase 4 - App Mobile

| Modulo | Backend | Mobile | Testes | Total SP |
|---|---|---|---|---|
| Setup React Native / Expo | - | 5 SP | 1 SP | 6 SP |
| Telas core (auth, timer, objectives) | - | 12 SP | 5 SP | 17 SP |
| Offline sync | 4 SP | 6 SP | 4 SP | 14 SP |
| Push notifications | 3 SP | 4 SP | 2 SP | 9 SP |
| Shared types package | 3 SP | 2 SP | 1 SP | 6 SP |
| Feature flags | 2 SP | 1 SP | 1 SP | 4 SP |
| App Store / Play Store | - | 3 SP | - | 3 SP |
| **Subtotal Fase 4** | **12 SP** | **33 SP** | **14 SP** | **59 SP** |

### Resumo Total

| Fase | Story Points | Semanas estimadas |
|---|---|---|
| Fase 1 - MVP Core | 37 SP | 4 semanas |
| Fase 2 - Expansao | 50 SP | 4 semanas |
| Fase 3 - Inteligencia | 47 SP | 4 semanas |
| Fase 4 - Mobile | 59 SP | 5-6 semanas |
| **Total** | **193 SP** | **17-18 semanas** |

> **Nota:** Backend dos modulos core (auth, objectives, focus, metrics, user) ja esta pronto (services + API + validators + engine + stores). O escopo restante e majoritariamente frontend (UI) + testes + polish. A Fase 1 esta com 10 de 18 items concluidos.
