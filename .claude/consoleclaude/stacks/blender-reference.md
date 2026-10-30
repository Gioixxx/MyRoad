# Blender — Reference

> **Revisione doc:** 2026-10

## Requisiti
- Blender 4.2 o successivo (provato con 5.2.2 LTS), motore EEVEE. Si installa da blender.org: su Windows finisce in Program Files, nella cartella «Blender Foundation», ed è lì che gli strumenti lo cercano (poi Steam, poi il PATH). La variabile `BLENDER_BIN` indica un eseguibile diverso.
- Nessun componente aggiuntivo di Blender, nessuna finestra aperta.
- Python: il lanciatore usa quello che Blender si porta dietro. Con un Python 3.8+ di sistema si può anche lanciare direttamente `.claude/consoleclaude/tools/blender/blender_kit.py`.
- GPU facoltativa: EEVEE va anche senza, più lento. `check` dice quale GPU trova.

## Gli strumenti
In `.claude/consoleclaude/tools/blender/`:
- `.claude/consoleclaude/tools/blender/blender-kit.ps1`: il lanciatore (PowerShell 5.1);
- `.claude/consoleclaude/tools/blender/blender_kit.py`: i comandi;
- `.claude/consoleclaude/tools/blender/scene_kit.py`: le funzioni per costruire le scene, da usare dentro Blender.

```
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/consoleclaude/tools/blender/blender-kit.ps1 check
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/consoleclaude/tools/blender/blender-kit.ps1 new anim/intro.py
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/consoleclaude/tools/blender/blender-kit.ps1 stills anim/intro.py 1,30,60
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/consoleclaude/tools/blender/blender-kit.ps1 render anim/intro.py --out assets --width 960
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/consoleclaude/tools/blender/blender-kit.ps1 preview assets
```

- `find`: percorso e versione di Blender. Esce con 2 se manca.
- `check`: versione, EEVEE, video WebM con alfa, GPU. Esce con 1 se manca EEVEE o il video con alfa.
- `new <scena.py>`: scrive una scena di partenza (una palla che rimbalza in loop, con l'ombra finta) che importa `scene_kit` con un percorso relativo. Non sovrascrive un file che c'è già.
- `stills <scena.py> <frame,...>`: PNG `<scena>_<frame>.png`; di default 640 px, 16 campioni, in una cartella temporanea (`--out` per sceglierla). Si guardano con Read.
- `render <scena.py>`: il video `<scena>.webm`; di default 640 px e 64 campioni (`--width`, `--samples`, `--out`; `--mode png` per tutti i frame).
- `preview [cartella]`: server locale su 127.0.0.1, porta 5190 (`--port`), con una pagina che mostra tutti i video e le immagini della cartella e un pulsante chiaro/scuro per controllare la trasparenza. Il pannello browser dell'app desktop non riproduce i video da `file://`: serve questo.
- `stills` e `render` passano alla scena anche gli argomenti dopo le opzioni. Il registro completo di Blender sta in `blender-kit.log`, nella cartella di uscita.

## Il contratto di una scena
Blender riceve dopo `--`: cartella di uscita, larghezza, modalità (`webm`, `png`, `still:1,30`), campioni EEVEE, poi gli argomenti propri della scena. `scene_kit.args()` li legge; la scena finisce con `scene_kit.render(...)`.

```python
import os, sys
sys.dont_write_bytecode = True   # niente __pycache__ accanto a scene_kit, nella copia della libreria
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.claude/consoleclaude/tools/blender/")))
import scene_kit as sk

a = sk.args()
sk.reset_scene(a.width, a.samples)            # EEVEE, sfondo trasparente, 16:9, colori Standard
ball = sk.link(sk.ellipsoid("Palla", 1, 1, 1))
ball.data.materials.append(sk.material("palla", sk.lin("06b6d4"), rough=0.35))
sk.light("Key", (-4, -6, 6.5), 900, 5, (0, 0, 1))
sk.camera((0, -13, 3.6), (0, 0, 1.2))
for f in range(48):                            # una chiave per frame, calcolata in Python
    ball.location = (0, 0, 1 + sk.hop((f % 24) / 24, 1.2))
    ball.keyframe_insert("location", frame=f + 1)
sk.render(a.out, a.mode, "palla", 48)
```

Il percorso di `sys.path` è relativo alla scena: `new` lo calcola da sé. `sys.dont_write_bytecode` serve perché il Python di
Blender scriverebbe la cache compilata (`__pycache__`) accanto a `scene_kit`, dentro la copia della libreria.

## `scene_kit` in breve
| Funzione | A cosa serve |
|---|---|
| `args()` | Gli argomenti dopo `--` |
| `reset_scene(width, samples, fps, height)` | Scena vuota: EEVEE, sfondo trasparente, colori Standard, luce tenue dal mondo |
| `light(name, loc, power, size, target)`, `camera(loc, target, lens)` | Luci ad area rotonde (riflessi tondi) e camera puntate su un punto |
| `link`, `empty` | Mettere un oggetto nella scena, con un genitore |
| `ellipsoid`, `dome`, `torus`, `disc`, `lathe`, `rod`, `slab`, `text3d` | Forme: ellissoide, mezza sfera, toro, disco, solido di rotazione, cilindro tra due punti, lastra arrotondata, testo |
| `material(key, color, rough, coat, emit, sss, alpha)`, `lin("rrggbb")` | Materiale condiviso per chiave; colore sRGB convertito in lineare |
| `shadow_plane(name, size)` | Ombra finta sotto un oggetto, con l'intensità da chiavare |
| `keys(f, [(frame, valore), ...])`, `ramp`, `smooth`, `hop`, `facing` | Movimento: interpolazione dolce, arco di un salto, angolo per guardare nella direzione del moto |
| `render(out, mode, name, frame_end)` | Uscita: WebM con alfa, PNG di tutti i frame o di quelli scelti |

## Blender 5.x: cose da sapere
- Dalla 4.5 il video si chiede con `image_settings.media_type = "VIDEO"` prima di `file_format = "FFMPEG"`. `render()` lo fa.
- Il motore si chiama `BLENDER_EEVEE`; nella 4.2-4.4 era `BLENDER_EEVEE_NEXT`. `reset_scene()` sceglie quello che c'è.
- Blender aggiunge l'intervallo dei frame al nome di un video (`nome-0001-0048.webm`): `render()` lo rinomina in `nome.webm`.
- I colori dei materiali sono lineari: `lin()` converte da quelli esadecimali di un'interfaccia.
- Con la trasformazione AgX di default i colori di un marchio si sbiadiscono: `reset_scene()` usa «Standard».
- EEVEE non ha lo shadow catcher, e su sfondo trasparente un pavimento vero non si vedrebbe: `shadow_plane()`.
- `read_factory_settings(use_empty=True)` svuota tutto, materiali e caratteri compresi: `reset_scene()` li ricrea.
- Prima di leggere `matrix_world` di un oggetto appena messo in posa: `bpy.context.view_layer.update()`.
- Per sapere dove cade un punto della scena nell'immagine, per esempio per il `transform-origin` del CSS: `bpy_extras.object_utils.world_to_camera_view`.

## Ricette
- **Loop senza scatti.** Ogni movimento ha un periodo che divide la durata; un anello di oggetti di colori diversi fa un giro intero, non una frazione.
- **Un oggetto che passa di mano.** Prima si mette in posa il personaggio su tutti i frame e si annota dove sta la mano (`matrix_world` dopo `view_layer.update()`); poi si aggancia l'oggetto alla mano fino al lancio, o dalla presa in poi.
- **Avatar animati dal CSS.** Invece di un video per stato: livelli trasparenti con la stessa camera (corpo, una copia a occhi chiusi, effetti a parte) e i punti di rotazione proiettati con `world_to_camera_view`. Le animazioni restano CSS, leggere, e rispettano il moto ridotto.
- **Contorni per il tema chiaro.** Una sagoma appena più grande dietro l'oggetto, di un colore scuro, fa da contorno senza effetti di post-produzione.
- **Peso.** Circa 110-160 KB al secondo a 960x540 in WebM. Un'immagine WebP 256x256 con alfa pesa circa 8 KB.
