# CORTEX SaaS (Base Inicial)

Monorepo com `apps` e `packages` para o projeto **CORTEX - Sistema de Diagnostico para Conclusao de Projetos**.

## Stack aplicada

- Next 16 (App Router)
- TanStack Query + persistencia offline (localStorage)
- Supabase (Auth + Tables)
- Motion
- Tailwind CSS 4 (CSS-first)
- UI no estilo Shadcn + camada `animated-ui`
- React Hook Form + Zod
- Tema claro/escuro
- Offline-first (cache de query + service worker)
- Monorepo (`apps/*`, `packages/*`)

## Estrutura

- `apps/web`: app principal Next
- `packages/shared`: tipos Supabase + models de dominio
- `packages/ui`: primitives reutilizaveis de UI

## Fluxos prontos

- Login com email/senha
- Cadastro com email/senha
- Login com Google (OAuth callback)
- Dashboard com:
  - saudacao do usuario
  - status de avaliacao/reavaliacoes (45 e 90 dias)
  - progresso do plano estrategico (acoes concluidas)
  - proxima etapa recomendada
  - 4 pilares com glow colorido + gauge
- Header com logo, tema, nome e sair
- Persistencia de progresso para continuar de onde parou (`protocol_progress` + fallback local)

## Setup

1. Copie `apps/web/.env.example` para `apps/web/.env`
2. Preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Instale dependencias:
   - `bun install`
4. Rode:
   - `bun run dev`

## Supabase migrations

O projeto foi configurado com migrations em `supabase/migrations` (schema `cortex`).

Fluxo:

1. Link no projeto Supabase:
   - `supabase link --project-ref whzmrzyffnfufjzctrxe`
2. Aplicar tudo com um comando:
   - `bun run db:push`

Comandos úteis:

- criar migration nova: `bun run db:new <nome_da_migration>`
- sincronizar schema remoto para arquivo local: `bun run db:pull`

## Observacao

No ambiente atual, o acesso ao `registry.npmjs.org` estava indisponivel, entao `bun install` nao concluiu aqui.
