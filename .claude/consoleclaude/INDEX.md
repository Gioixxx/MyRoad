# Libreria di ConsoleClaude

Comandi, skill, regole di stack e memoria di questo progetto, installati da ConsoleClaude. Non modificare a mano `.claude/consoleclaude/`: l'app la aggiorna, e un file che hai cambiato lo segnala senza sovrascriverlo.

## Cosa è installato
Gli stack (uno o più: `stack` è il principale, `stacks` li elenca tutti) e i moduli aggiuntivi scelti stanno in `.claude/consoleclaude/manifest.json`.

## Due livelli
- **Livello 1**: importato da `CLAUDE.md`, sempre nel contesto. Questo indice, le regole degli stack, `.claude/consoleclaude/workflows/iterative-dev.md` e `.claude/consoleclaude/workflows/token-economics.md`.
- **Livello 2**: installato ma non importato. I `-reference`, gli snippet e i moduli delle aggiunte che non servono sempre (`.claude/consoleclaude/stacks/ai-integration.md`, `.claude/consoleclaude/stacks/style-system.md` se scelti; Next.js e React Native li tengono nel livello 1 dello stack) si leggono con Read solo quando servono, con il percorso intero, per esempio `.claude/consoleclaude/stacks/<stack>-reference.md` (se presente).

## Comandi
/ai-integrate /analyze /changelog /commit /context /context-prune /debug /doc /doc-update /explain /handoff /lib-doctor /onboard /remember /retrospective /review /rtk-check /scope /security-check /session-end /session-start /sprint /standup /style-check /test /threat-model /token-cost

Più un `/<stack>-check` per ogni stack del progetto.

## Skill
`precise-code` (sempre) e una `write-<stack>` per ogni stack del progetto: si caricano prima di scrivere codice (la `write-<stack>` dello stack del codice che tocchi).

## Memoria
`.claude/memory/MEMORY.md` è l'indice; gli altri file di memoria si leggono quando servono, mai con un `@`.

## Strumenti locali
Se in sessione ci sono `mcp__ollama-sidecar__*` e `mcp__library-router__*`, vedi `.claude/consoleclaude/workflows/token-economics.md`; se non ci sono, nulla cambia. Se in sessione ci sono `mcp__figcraft__*`, la guida è `.claude/consoleclaude/workflows/figcraft.md`; se non ci sono, nulla cambia. Gli script dei comandi stanno in `.claude/consoleclaude/tools/`.
