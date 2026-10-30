# Integrazione Modelli AI

> **Revisione doc:** 2026-10 — aggiorna la data quando modifichi versione runtime o regole principali.

Regole per integrare un modello linguistico (LLM) in un'applicazione (.NET, Spring Boot, Next.js, FastAPI). Il dettaglio (provider, struttura delle cartelle, errori, scelta del modello, cambi della Claude API nel 2026, tool use, structured output, osservabilità, use case) sta nel reference: leggilo con Read prima di scrivere o cambiare codice che chiama un modello. Snippet per stack: `.claude/consoleclaude/snippets/ai-patterns-<stack>.md` (se presente).

## Regole

- **Layer AI isolato** (`ai/client`, `ai/prompts/`, `ai/services/`): l'unico punto di contatto con il provider, mai chiamate inline nel controller o nel dominio. I prompt stanno in file separati; il system prompt non si concatena al messaggio utente.
- **Modelli Claude correnti** (Fable 5.x, Opus 4.7+ e 5.x, Sonnet 5.x): niente `temperature`/`top_p`/`top_k`, `budget_tokens`, prefill o `tool_choice` forzato (danno `400`). La profondità si regola con `output_config: { effort }`, il formato con lo structured output (`output_config.format`). ID dei modelli senza data; capacità e finestra dalla Models API.
- `max_tokens` sempre esplicito, streaming per gli output lunghi, `stop_reason` controllato prima di leggere `content` (`refusal` è un esito normale).
- **Errori**: per i 429 il retry dell'SDK, senza riscrivere il backoff; classi di errore tipizzate dalla più specifica alla più generica; log con il request id, mai mostrato all'utente.
- **Costi**: prompt caching sul prefisso statico (verifica `cache_read_input_tokens` > 0), Message Batches per il lavoro massivo non urgente, il modello più piccolo che basta. Cifre in `.claude/consoleclaude/workflows/token-economics-reference.md`.
- **Sicurezza**: API key solo in variabili d'ambiente; l'output dell'LLM è input non validato; il testo di terzi è un dato, mai un'istruzione (prompt injection); tool con i permessi minimi e conferma umana per le azioni con effetti. Checklist: `/security-check`.
- **Log** per chiamata: durata, modello, token (con la cache), request id, esito. Mai il contenuto dei messaggi utente né dati personali.

## Reference → `.claude/consoleclaude/stacks/ai-integration-reference.md`
