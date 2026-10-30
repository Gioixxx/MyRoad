---
description: "Verifica convenzioni Next.js App Router"
disable-model-invocation: true
disallowed-tools: Edit Write NotebookEdit
---
# /nextjs-check — Verifica convenzioni Next.js App Router

## Input
File corrente. `.claude/consoleclaude/stacks/nextjs.md`, `.claude/consoleclaude/snippets/nextjs-patterns.md`, `.claude/consoleclaude/snippets/style-patterns-nextjs.md`, `@.claude/memory/conventions.md`. Context7 (se disponibile) per next/npm.

## Regole
- Checklist: Server Component (no "use client", fetch diretto, Suspense), Client Component (props typed, cn()), Server Action ("use server", Zod), Route Handler (Zod, status code), Proxy (`proxy.ts`, solo auth)
- Stile: cn(), Tailwind ordine, no inline style
- ✅/⚠️/❌ per criterio

## Output
Checklist per tipo, punteggio X/Y
