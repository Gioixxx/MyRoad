# Enforcement Hooks — Reference
> **Revisione doc:** 2026-10

> Contiene l'architettura del layer di hook, il formato dell'output, `circuit-breaker.json`, il gate dei comandi distruttivi, una tabella di esempi e il troubleshooting. Per le regole essenziali: `.claude/consoleclaude/workflows/enforcement-hooks.md`.

## Architettura

```
App (codice, caricato dalla console per sessione come plugin)
  hooks.PreToolUse   → guard.py         (Read|Bash|PowerShell)
  hooks.SessionStart → session_start.py
  hooks.PreCompact   → save_context.py
  hooks.SessionEnd   → save_context.py
  hooks.InstructionsLoaded → context_audit.py
  guard.py           PreToolUse: circuit-breaker + gate dei comandi distruttivi (+ riscrittura RTK, spenta)
  command_risk.py    classificazione per raggio del danno (logica pura, usata da guard.py)
  session_start.py   SessionStart: mode attivo + ultima sessione + blocco di routing (solo con il sidecar)
  save_context.py    PreCompact/SessionEnd: snapshot del transcript -> session-log.md
  context_audit.py   InstructionsLoaded: registra cosa entra nel preambolo

Repository del progetto (solo dati)
  .claude/consoleclaude/circuit-breaker.json  ← soglie/glob (per progetto)
  .claude/memory/session-log.md               ← snapshot di sessione (rolling, upsert per sessionId)
  .claude/context-audit.jsonl                 ← misura del preambolo (solo se esiste .claude/consoleclaude/; non gitignorato)
```

Loop **load↔save**: `save_context.py` salva prima di compaction/clear, `session_start.py` ricarica l'ultima entry all'avvio.

Gli hook stanno nell'app: aggiornare l'app aggiorna anche gli hook, senza toccare il repository. Il repository non contiene percorsi del programma né `.claude/settings.json` scritti per loro.

## Output degli hook (contratto Claude Code)

PreToolUse — `guard.py` stampa su stdout:

```json
{ "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|defer",
    "permissionDecisionReason": "…",
    "updatedInput": { "command": "rtk git status" }
} }
```

- `allow` + `updatedInput`: comando riscritto a RTK (trasparente; solo se `rtkRewrite` non è vuoto).
- `deny` + reason: file bloccato dal circuit-breaker (il motivo guida Claude verso Grep, o verso Read con offset e limit entro `maxLines`; un `Read` con `limit` entro `maxLines` passa, e immagini e PDF non hanno la soglia in byte), oppure comando
  distruttivo fermato dal gate (il motivo dice cosa colpirebbe e, se è da confermare, come giustificarlo).
- `defer`: flusso nativo (nessun intervento) — è anche il fallback di ogni errore.

SessionStart — `session_start.py` stampa testo grezzo (additionalContext): blocco `## Contesto di sessione (auto-caricato)` con mode attivo + ultima entry di `session-log.md`, più il blocco di routing «chiama prima il sidecar» se la console ha acceso il sidecar. Non ripete `MEMORY.md`: la regione di `CLAUDE.md` lo importa già. Nel contesto del modello l'output è preceduto da `SessionStart:startup hook success: `.

PreCompact / SessionEnd — `save_context.py` è **side-effect only** (non emette `decision`): legge `transcript_path`, estrae snapshot e fa upsert in `session-log.md`. Su qualsiasi errore esce 0 senza scrivere.

### session-log.md

Entry delimitate da `<!-- session:<id> -->`, upsert per `sessionId` (PreCompact + SessionEnd dello stesso giro convergono a una entry), rolling alle ultime ~10, scritte UTF-8 senza BOM. Campi: titolo (da `ai-title`), branch, range date, ultima richiesta (`last-prompt`), file toccati (`tool_use` Edit/Write), verbi comando (Bash), e `Sintesi` del modello locale se `.claude/memory-sync.json` ha `enabled:true`. Il file è locale, non va committato.

## circuit-breaker.json

```json
{
  "maxBytes": 102400,
  "maxLines": 1500,
  "denyGlobs": ["**/*.lock", "**/package-lock.json", "**/pnpm-lock.yaml", "**/yarn.lock", "**/dist/**", "**/build/**", "**/*.min.js", "**/*.map"],
  "rtkRewrite": [],
  "riskGate": true,
  "protectedPaths": []
}
```

- `maxBytes`: gate primario (lo `stat` non costa token). `maxLines`: gate secondario, valutato solo su file di testo entro `maxBytes` (una riga è un a-capo, o l'ultimo pezzo senza a-capo finale). Non si applicano a un `Read` con `limit` entro `maxLines` (già a pezzi); `maxBytes` non si applica a immagini e PDF (`.png .jpg .jpeg .gif .webp .bmp .tif .tiff .pdf`). `denyGlobs` vale sempre.
- `denyGlobs`: match euristico stile `**/…` (basename, path completo, segmenti `**/dir/**`).
- `rtkRewrite`: verbi proxati (per esempio `"git"`, `"npm"`, `"cargo"`); vuoto = nessuna riscrittura (default, perché `rtk init -g` riscrive già). La riscrittura salta i meta `rtk gain|proxy|discover` e i comandi già `rtk …`.
- `riskGate`: `false` spegne il gate dei comandi distruttivi. `protectedPaths`: percorsi in più (assoluti o con `~`) da
  trattare come le credenziali: cancellarli, o cancellare una cartella che li contiene, è sempre negato.
- Il file lo crea l'installazione dal modello e poi non lo aggiorna più. Se manca vale `.vibekit/circuit-breaker.conf` (stesso formato), e senza nessuno dei due i default del codice.

## Gate dei comandi distruttivi

`command_risk.py` guarda **cosa** verrebbe distrutto, non il nome del comando:
`rm`, `rmdir`, `shred`, `truncate`, `dd of=`, `find -delete|-exec rm`, `chmod|chown -R`, `rsync --delete`, `Remove-Item` e alias,
`Clear-Content`, `cmd /c rd|del`, formattazioni, più i comandi git che buttano lavoro. Segue `;`, `&&`, `||`, `|`, `$(…)`,
`bash -c`, `powershell -Command`, `cmd /c`, i `cd` del comando e i prefissi (`sudo`, `env`, `rtk`). Il corpo di heredoc e
here-string è testo, non comandi.

| Livello | Quando | Esito |
|---|---|---|
| catastrofico | radice di un disco, home o una cartella che la contiene, `~/.ssh`, `~/.aws`, le credenziali di Claude Code, cartelle di sistema, `mkfs`, `Format-Volume`, `dd` su un dispositivo | `deny` sempre |
| da confermare | fuori dal progetto, bersaglio non determinabile (`$VAR`, pipeline, `xargs`), la cartella del progetto o `.git`, `git reset --hard`, `clean -f`, `checkout -- .`, `branch -D`, `stash drop`, `push --force` senza lease | `deny` finché la `description` non inizia con `Serve a:` + la richiesta dell'utente |
| basso | dentro il progetto o in una cartella temporanea | nessun intervento |

Nessun secondo modello: il rifiuto costringe il modello che ha generato il comando a rileggere la richiesta, e ripetere
il comando alla cieca non basta. Non è una sandbox: `python -c "shutil.rmtree(…)"` o le redirezioni (`> file`) non sono
valutate.

## Esempi di comportamento

| Tool input | Esito |
|---|---|
| Bash `git status` (rtk presente, `rtkRewrite` con `git`) | `allow` → `rtk git status` |
| Bash `git status` (default, `rtkRewrite` vuoto) | `defer` |
| Bash `git log \| head` | `defer` (composto) |
| Bash `rtk gain` | `defer` (meta) |
| Bash `rm -rf build` | `defer` (dentro il progetto) |
| Bash `rm -rf ~` · PowerShell `Remove-Item -Recurse` sulla cartella home | `deny` (catastrofico) |
| Bash `rm -rf ../altro` | `deny` con richiesta di riflessione |
| lo stesso con `description: "Serve a: l'utente ha chiesto di …"` | `defer` |
| Read `package-lock.json` | `deny` (denyGlobs) |
| Read `dump.sql` da 5 MB | `deny` (maxBytes) |
| Read `src/app.ts` 80 righe | `defer` |

## Troubleshooting

- **Comandi non riscritti**: atteso, `rtkRewrite` è vuoto di default. Per accenderla elenca i verbi in `circuit-breaker.json` e verifica che `rtk` sia sul PATH (`rtk --version`); controlla anche di non avere già l'hook globale di `rtk init -g`.
- **Read sempre bloccato**: soglia troppo bassa in `circuit-breaker.json`, o glob troppo ampio.
- **Comando legittimo negato dal gate**: se è catastrofico lancialo tu con `! <comando>`; se è da confermare basta il
  secondo tentativo con `Serve a:`. Per spegnerlo in un progetto: `"riskGate": false` in `circuit-breaker.json`.
- **Hook non attivi**: servono Python 3.8+, la console (non `claude` da solo) e nessun hook equivalente già in `.claude/settings.json` o `.claude/settings.local.json` del progetto né nel `settings.json` globale dell'utente; `CONSOLECLAUDE_HOOKS` non deve valere `0`. `/lib-doctor` mostra cosa manca.
- **session-log.md non si aggiorna**: serve `.claude/memory/` esistente e un transcript con contenuto saliente.
- **Sintesi assente nelle entry**: normale se il modello locale non gira o `.claude/memory-sync.json` ha `enabled:false` → fallback meccanico.
- **Disattivare temporaneamente**: `CONSOLECLAUDE_HOOKS=0` prima di aprire la console.
