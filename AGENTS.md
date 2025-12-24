# AGENTS.md

## Commands
- **Lint**: `bun run lint` (in bot/ or dashboard/)
- **Format**: `bun run format` (in bot/ or dashboard/)
- **Dev**: `task bot` or `task dashboard` (from root)
- **Database**: `task up`, `task down`, `task push`, `task studio`

## Code Style
- **Formatting**: 2 spaces, semicolons, single quotes, trailing commas, 80 char width
- **Type imports**: Use inline style: `import { type Foo } from 'bar'` (enforced by ESLint)
- **Path aliases**: Bot uses `~/` for src/, Dashboard uses `@/` for src/
- **Naming**: camelCase files, PascalCase components/types, camelCase functions

## Patterns
- **Error handling**: Use `Result<T, E>` class with `Result.success(data)`/`Result.failure(error)`, check with `.isSuccess()`/`.isFailure()`, access via `.data`/`.error` or `.unwrap()` methods. Zod `.safeParse()` for validation
- **Bot exports**: `export const command = <Command>{...}`, same for `event`, `component`
- **Dashboard**: Server Actions with `'use server'`, `cn()` for class merging
- **Database**: Drizzle ORM with NanoID keys, schema in `database/src/schema.ts`, Zod validations in `database/src/validations.ts`
- **Utils**: Shared utilities, import via `import { fn } from 'utils/module'`

## Tech Stack
Bun runtime, TypeScript strict mode, discord.js (bot), Next.js 16 + React 19 (dashboard), Drizzle ORM + PostgreSQL, shared utils package
