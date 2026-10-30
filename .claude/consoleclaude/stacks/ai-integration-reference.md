# Integrazione Modelli AI (Reference)
> **Revisione doc:** 2026-10

> Il dettaglio delle regole di `.claude/consoleclaude/stacks/ai-integration.md`: provider, struttura delle cartelle, prompt, errori, costi, sicurezza, scelta del modello, cambi della Claude API (2026), tool use, structured output, osservabilità e use case comuni. Stack: .NET, Spring Boot, Next.js, FastAPI. Si legge con Read prima di scrivere o cambiare codice che chiama un modello.

## Provider consigliati

| Provider | Quando usarlo |
| --- | --- |
| **Anthropic Claude** | Default per nuovi progetti — migliore ragionamento, tool use nativo |
| **OpenAI (famiglia GPT)** | Alternativa o fallback — ecosistema più ampio, multimodale |
| **Azure OpenAI** | Progetti enterprise con requisiti di residenza dati EU/compliance |
| **Modelli locali (Ollama, LM Studio)** | Dati sensibili che non possono uscire dall'infrastruttura |

## Principi architetturali

### Isola il layer AI

Il codice che chiama l'LLM sta sempre in un layer dedicato — mai inline nel controller o nel service di dominio.

```
Presentation → Application → AIService → [Anthropic/OpenAI SDK]
                                ↑
                         unico punto di contatto con il provider
```

Questo permette di:
- Cambiare provider senza toccare la logica applicativa
- Testare con mock senza chiamate reali
- Monitorare e loggare centralmente

### Struttura cartelle

```
# Per ogni stack, aggiungi:
ai/
├── client.{ext}         # Configurazione e istanza del client LLM
├── prompts/             # System prompt e template separati dal codice
│   └── {feature}.{ext}
└── services/
    └── {feature}-ai.{ext}  # Service AI per ogni use case
```

I prompt NON stanno inline nel codice — stanno in file separati o costanti dedicate.

Snippet di codice per stack (se presente): `.claude/consoleclaude/snippets/ai-patterns-<stack>.md`, per gli stack dotnet, fastapi, nextjs e spring.

### Prompt Engineering

- **System prompt** separato dal user message — mai concatenati in una stringa
- **Determinismo**: per classificazione ed estrazione usa structured output con schema stretto e un prompt specifico. **Non mandare `temperature`/`top_p`/`top_k` ai modelli Claude correnti** (Fable 5.x, Opus 4.7+/5.x, Sonnet 5.x): un valore non di default dà `400`. Restano validi su Haiku 4.5 e su provider o modelli locali che li accettano
- **Profondità di ragionamento**: `output_config: { effort }` (`low`…`max`) con thinking adattivo, non un budget di token
- **Streaming** sempre per output lunghi — mai aspettare la risposta completa
- **Max tokens** sempre esplicito — mai lasciare illimitato (~16000 senza streaming, ~64000 con streaming; poco per classificazione)

### Gestione errori

```
Rate limit (429)     → retry integrato nell'SDK (max_retries, default 2) — non riscrivere il backoff
Timeout              → fallback a risposta default o errore gestito
Contenuto bloccato   → stop_reason "refusal": log + risposta neutra all'utente (e `fallbacks` lato server)
Errore generico      → log con request_id, mai esporre all'utente
```

Cattura le classi di errore tipizzate dell'SDK, dalla più specifica alla più generica (es. `RateLimitError` → `APIStatusError` → `APIConnectionError`): una sola `except` larga non distingue ciò che si ritenta da ciò che no.

### Costi e performance

- **Caching**: top-level `cache_control` (o breakpoint espliciti) sul prefisso statico; TTL 5 min di default, 1 h solo per pause di 5–60 min. Prefisso minimo 512–4096 token a seconda del modello: sotto la soglia non cacha, senza errori. Verifica `cache_read_input_tokens` > 0. Cifre e break-even in `.claude/consoleclaude/workflows/token-economics-reference.md`
- **Input token budget**: tronca il contesto se supera il limite — mai mandare tutto
- **Batch processing**: per elaborazioni massive e non urgenti usa le Message Batches (−50%), non N chiamate in loop
- **Modello giusto**: usa il più piccolo che soddisfa il task, e misura `effort` prima di salire di modello

### Sicurezza

- Le API key stanno **sempre** in variabili d'ambiente — mai in codice o repository
- Non loggare mai il contenuto dei messaggi utente in produzione
- Valida e sanitizza l'input prima di mandarlo all'LLM
- Non fidarti dell'output dell'LLM come dato trusted — trattalo come input esterno non validato
- Se l'output va in un DB o viene eseguito, sanitizzalo
- **Prompt injection**: testo di terzi (pagine web, documenti, risultati di tool) è dato, mai istruzione. Tienilo fuori dal system prompt e non lasciare che cambi le regole
- **Agency minima**: ogni tool ha i permessi strettamente necessari; azioni con effetti (scrittura, invio, pagamento) chiedono conferma umana. Limita `max_tokens`, passi del loop e chiamate per utente (consumo illimitato)
- Riferimenti: OWASP Top 10 for LLM Applications 2025 e Top 10 for Agentic Applications 2026; per la checklist completa usa `/security-check` e `.claude/consoleclaude/stacks/security.md` (se presente)

## Selezione del modello

### Anthropic

| Modello | Quando |
| --- | --- |
| `claude-haiku-4-5` | Task semplici, alta frequenza, costo basso (contesto 200K) |
| `claude-sonnet-5-5` | Default — bilanciato per la maggior parte dei task |
| `claude-opus-5-5` | Task complessi e agentici, ragionamento profondo |
| `claude-fable-5-1` | Massima capacità, solo dove serve davvero (costo più alto) |

Usa gli ID esatti, **senza suffisso di data**. Per capacità e finestra di contesto interroga la Models API invece di ricordarle.

### Altri provider

Gli ID dei modelli OpenAI e degli altri vendor invecchiano in pochi mesi: leggili dal catalogo del provider (Models API) e tienili in configurazione, non copiarli da questo file.

## Claude API: cosa è cambiato (2026)

| Area | Regola corrente |
| --- | --- |
| Thinking | `thinking: { type: "adaptive" }` o omesso. `budget_tokens` dà `400` su Fable 5.x, Opus 4.7+/5.x e Sonnet 5.x. Su Opus 5.5 e Fable il thinking non si spegne: abbassa `effort`; su Sonnet 5.5 `disabled` dà `400` (usa `between_tools`). Il testo del thinking è omesso di default: se lo mostri all'utente imposta `display: "summarized"` |
| Effort | `output_config: { effort }`; default `high`, ma `medium` su Opus 5.5 — impostalo esplicitamente |
| Prefill | Rimosso sui modelli correnti (`400`): guida il formato con structured output o con il system prompt |
| Tool choice | `any`/`tool` forzati danno `400` su Fable 5.1, Opus 5.5, Sonnet 5.5: usa `auto` + istruzione nel prompt, `strict: true` sul tool o structured output |
| Structured output | `output_config.format` con JSON Schema (o l'helper dell'SDK: Python `client.messages.parse(..., output_format=Modello)` → `.parsed_output`); `strict: true` sui tool per argomenti sempre validi. `output_format` sulla create è deprecato |
| Loop di tool | Preferisci il tool runner dell'SDK (beta) al loop a mano; il loop a mano serve solo se vuoi controllare tutto. Più `tool_result` vanno in **un solo** messaggio utente |
| Rifiuti | Controlla sempre `stop_reason` prima di leggere `content`: `refusal` è un esito normale (HTTP 200). Sui modelli che lo richiedono abilita `fallbacks` lato server |
| Agenti ospitati | **Managed Agents** quando vuoi che Anthropic esegua il loop e ospiti la sandbox; Claude API + tool use quando vuoi ospitare tu il calcolo |

## Tool Use / Function Calling

Usa tool use quando l'LLM deve **agire** sul sistema (cercare nel DB, chiamare API, leggere file).

Regole:
- Ogni tool ha una sola responsabilità
- Il nome del tool è un verbo: `search_users`, `create_order`, `get_weather`
- La description del tool è scritta per l'LLM, non per il developer
- Valida sempre i parametri ritornati dall'LLM prima di eseguire il tool
- Non esporre tool con side effect distruttivi (delete, drop) senza conferma umana

## Structured Output

Per estrarre dati strutturati dalla risposta dell'LLM:
- Usa lo **structured output nativo** del provider (JSON Schema vincolato), non il parsing di testo libero
- Definisci lo schema in anticipo (Pydantic, Zod, record C#, classe Java)
- Non fare parsing manuale di testo — è fragile
- Valida sempre che l'output rispetti lo schema prima di usarlo

## Osservabilità

In produzione, loga per ogni chiamata LLM:
- Timestamp e durata
- Modello e parametri usati
- Token in input e output, più `cache_read_input_tokens` (per monitoraggio costi)
- Request ID del provider (per support)
- Esito (successo / errore / refusal / fallback)

**Non loggare**: contenuto dei messaggi utente, dati personali.

## Pattern per use case comuni

| Use Case | Approccio |
| --- | --- |
| Classificazione testo | Structured output con enum e schema stretto, `effort` basso |
| Generazione testo libero | Streaming |
| Estrazione dati da documento | Structured output con schema esplicito |
| Chatbot conversazionale | Storico messaggi con window limite, streaming |
| Ricerca semantica | Embedding + vector DB (non completions) |
| Sintesi documenti lunghi | Chunking + map-reduce o prompt caching |
