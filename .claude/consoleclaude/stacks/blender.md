# Blender — Animazioni 3D

> **Revisione doc:** 2026-10

## Principio
Blender da riga di comando, senza interfaccia: ogni animazione è uno script Python del repository che costruisce la scena da zero e la rende. Il video si rifà identico, e una modifica è un diff.

## Regole
- **Azioni.** Se hai `mcp__actions__list` e `mcp__actions__run`, lancia le azioni `blender-*` (tabella sotto) invece di `blender-kit.ps1` con `Bash`: parametri controllati, un render alla volta, Stop, e torna solo la coda dell'output con i file nuovi. Se le azioni non ci sono, usa `blender-kit.ps1` come descritto qui.
- Si passa dagli strumenti in `.claude/consoleclaude/tools/blender/`: `blender-kit.ps1` trova Blender e usa il Python di Blender, non serve un Python di sistema. Senza Blender lo si dice all'utente e ci si ferma: niente installazioni da soli.
- Prima pochi fotogrammi (`stills`), guardati con Read; poi il render intero (`render`). Mai un render lungo alla cieca.
- Un render alla volta: due render sulla stessa GPU fanno fallire il più lungo, e il video resta vuoto. `blender_kit.py` ha un blocco; con Blender lanciato a mano si aspetta la fine dell'altro.
- Per le interfacce: sfondo trasparente e WebM VP9 con alfa, così lo stesso video sta sul tema chiaro e su quello scuro; colori con la trasformazione «Standard».
- Contrasto su entrambi i temi: un oggetto chiaro sparisce sul tema chiaro, uno scuro su quello scuro. Serve un contorno o un colore deciso.
- Chiavi su ogni frame, calcolate in Python: il risultato è deterministico. Un loop si richiude se ogni movimento ha un periodo che divide la durata.
- Uno script di Blender esegue codice: si lanciano solo scene del repository o scritte nella sessione, mai scaricate.
- Nelle interfacce un'animazione si salta (clic o Esc) e non parte con il moto ridotto.
- L'output di Blender va nel registro (`blender-kit.log` nella cartella di uscita), non nel contesto: a schermo solo errori e file salvati.

## Pattern
| Bisogno | Comando di `blender-kit.ps1` | Azione |
|---|---|---|
| Blender c'è? Che versione? | `find` | `blender-find` |
| GPU, EEVEE, video con alfa | `check` | `blender-check` |
| Una scena da cui partire | `new <scena.py>` | (la scrivi tu con Write) |
| Controllare pose e inquadratura | `stills <scena.py> 1,30,60` | `blender-stills` |
| Il video finale | `render <scena.py> --out <cartella>` | `blender-render` |
| Guardarlo su chiaro e scuro | `preview <cartella>` | (la lancia l'utente) |

## Reference → `.claude/consoleclaude/stacks/blender-reference.md`
