"""blender_kit.py - strumenti rapidi per usare Blender da riga di comando, senza interfaccia: trova Blender, controlla GPU
e video trasparente, crea una scena di partenza, rende pochi fotogrammi o il video intero (un render alla volta) e apre
un'anteprima locale dove i video trasparenti si guardano su sfondo chiaro e scuro.

Si lancia con blender-kit.ps1 (usa il Python di Blender: non serve un Python di sistema) oppure con un Python 3.8+:

    python blender_kit.py find                          dov'e' Blender e che versione
    python blender_kit.py check                         motore EEVEE, GPU, video WebM con alfa
    python blender_kit.py new anim/palla.py             scena di partenza: una palla che rimbalza in loop
    python blender_kit.py stills anim/palla.py 1,12,24  pochi fotogrammi in PNG, per controllare pose e inquadratura
    python blender_kit.py render anim/palla.py --out assets   il video intero, WebM VP9 con alfa
    python blender_kit.py preview assets                anteprima su http://127.0.0.1:5190/

Blender si cerca in BLENDER_BIN, poi nelle cartelle d'installazione standard (Blender Foundation, Steam), poi nel PATH.
Una scena e' uno script Python che riceve, dopo `--`: cartella di uscita, larghezza, modalita (webm, png, still:<frame>),
campioni EEVEE e i propri argomenti (vedi scene_kit.py). Uno script di Blender esegue codice: si lanciano solo scene del
repository o scritte nella sessione.
"""
import argparse
import contextlib
import html
import http.server
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse

KIT_DIR = os.path.dirname(os.path.abspath(__file__))
LOCK_NAME = "blender_kit.lock"
LOG_NAME = "blender-kit.log"
SHOWN = re.compile(r"Error|error:|Traceback|Exception|^\s+File \"|DONE|Saved:")


# --- Trovare Blender ---------------------------------------------------------------------------------------------------------
def _version_key(path):
    m = re.search(r"(\d+(?:\.\d+)+)", os.path.basename(os.path.dirname(path)))
    return tuple(int(x) for x in m.group(1).split(".")) if m else (0,)


def find_blender():
    """Percorso di blender(.exe), o None. BLENDER_BIN vince; tra piu' installazioni si sceglie la versione piu' alta."""
    env = os.environ.get("BLENDER_BIN")
    if env:
        return env if os.path.isfile(env) else None
    found = []
    roots = {os.environ.get(k) for k in ("ProgramFiles", "ProgramW6432", "ProgramFiles(x86)")} - {None, ""}
    for root in roots:
        base = os.path.join(root, "Blender Foundation")
        if os.path.isdir(base):
            for d in os.listdir(base):
                exe = os.path.join(base, d, "blender.exe")
                if os.path.isfile(exe):
                    found.append(exe)
        steam = os.path.join(root, "Steam", "steamapps", "common", "Blender", "blender.exe")
        if os.path.isfile(steam):
            found.append(steam)
    mac = "/Applications/Blender.app/Contents/MacOS/Blender"
    if os.path.isfile(mac):
        found.append(mac)
    if found:
        return max(found, key=_version_key)
    return shutil.which("blender")


def need_blender():
    exe = find_blender()
    if not exe:
        raise SystemExit("Blender non trovato: installalo da blender.org oppure imposta BLENDER_BIN col percorso dell'eseguibile.")
    return exe


# --- Lanciare Blender ----------------------------------------------------------------------------------------------------------
@contextlib.contextmanager
def render_lock():
    """Un render alla volta: due render di Blender sulla stessa GPU fanno fallire il piu' lungo (il video resta vuoto).
    Il blocco e' del sistema operativo: si libera da solo se il processo muore."""
    path = os.path.join(tempfile.gettempdir(), LOCK_NAME)
    fh = open(path, "a+")
    try:
        fh.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            raise SystemExit("C'e' gia' un render di Blender in corso: aspetta che finisca (due render insieme sulla stessa GPU fanno fallire il piu' lungo).")
        yield
    finally:
        try:
            if os.name == "nt":
                import msvcrt
                fh.seek(0)
                msvcrt.locking(fh.fileno(), msvcrt.LK_UNLCK, 1)
        except OSError:
            pass
        fh.close()


def run_blender(argv, log_dir):
    """Lancia Blender senza interfaccia. Tutto l'output va in <log_dir>/blender-kit.log; a schermo solo errori, file salvati
    e la riga finale, per non riempire il contesto. Restituisce il codice d'uscita."""
    exe = need_blender()
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, LOG_NAME)
    cmd = [exe, "-b", "--factory-startup", "--python-exit-code", "1"] + argv
    start = time.time()
    with open(log_path, "w", encoding="utf-8", errors="replace") as log:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
        for line in proc.stdout:
            log.write(line)
            if SHOWN.search(line):
                print(line.rstrip())
        code = proc.wait()
    print(f"Blender: uscita {code} in {time.time() - start:.0f} s; registro completo in {log_path}")
    return code


def scene_name(scene):
    return os.path.splitext(os.path.basename(scene))[0]


def default_out(scene):
    return os.path.join(tempfile.gettempdir(), "blender_kit", scene_name(scene))


def need_scene(scene):
    if not os.path.isfile(scene):
        raise SystemExit("scena non trovata: " + scene)
    return os.path.abspath(scene)


# --- Comandi -----------------------------------------------------------------------------------------------------------------
PROBE = r'''
import bpy
r = bpy.context.scene.render
print("KIT version=" + bpy.app.version_string)
eng = [e.identifier for e in r.bl_rna.properties["engine"].enum_items]
print("KIT eevee=" + ("si" if ("BLENDER_EEVEE" in eng or "BLENDER_EEVEE_NEXT" in eng) else "no"))
im = r.image_settings
ok = False
try:
    if "media_type" in im.bl_rna.properties:
        im.media_type = "VIDEO"
    im.file_format = "FFMPEG"
    r.ffmpeg.format = "WEBM"
    r.ffmpeg.codec = "WEBM"
    im.color_mode = "RGBA"
    ok = im.color_mode == "RGBA"
except Exception as e:
    print("KIT webm_error=" + str(e))
print("KIT webm_alpha=" + ("si" if ok else "no"))
gpus = []
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for t in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
        try:
            prefs.compute_device_type = t
            prefs.get_devices()
            gpus += [d.name + " (" + t + ")" for d in prefs.devices if d.type == t]
        except Exception:
            pass
except Exception:
    pass
print("KIT gpu=" + "; ".join(gpus))
'''


def cmd_find(_a):
    exe = find_blender()
    if not exe:
        print("Blender non trovato: installalo da blender.org oppure imposta BLENDER_BIN.")
        return 2
    out = subprocess.run([exe, "--version"], capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    print(exe)
    print((out.strip().splitlines() or ["versione sconosciuta"])[0])
    return 0


def cmd_check(_a):
    exe = need_blender()
    out = subprocess.run([exe, "-b", "--factory-startup", "--python-expr", PROBE], capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stdout
    info = dict(line[4:].split("=", 1) for line in out.splitlines() if line.startswith("KIT ") and "=" in line)
    print("Blender:", exe)
    print("versione:", info.get("version", "?"))
    print("EEVEE:", info.get("eevee", "?"))
    print("video WebM con alfa:", info.get("webm_alpha", "?"), "(" + info["webm_error"] + ")" if "webm_error" in info else "")
    print("GPU:", info.get("gpu") or "nessuna trovata: EEVEE va comunque, piu' lento")
    return 0 if info.get("eevee") == "si" and info.get("webm_alpha") == "si" else 1


TEMPLATE = '''"""Scena di partenza (blender_kit.py new): una palla che rimbalza in loop con lo schiacciamento all'appoggio e l'ombra
finta, su sfondo trasparente. Cambiala a piacere; le regole sono nel modulo Blender della libreria.

Argomenti dopo `--`: cartella di uscita, larghezza, modalita (webm, png, still:<frame>), campioni (vedi scene_kit.args).
"""
import math
import os
import sys

sys.dont_write_bytecode = True               # niente __pycache__ accanto a scene_kit, nella copia della libreria
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), {kit_rel!r})))
import scene_kit as sk  # noqa: E402

a = sk.args()
sk.reset_scene(a.width, a.samples)

N, BOUNCE, HEIGHT = 48, 24, 1.2            # loop di 1,6 s a 30 fps, due rimbalzi
rig = sk.empty("Rig")                      # a terra: lo schiacciamento parte dal pavimento
ball = sk.link(sk.ellipsoid("Palla", 1.0, 1.0, 1.0), rig)
ball.location = (0, 0, 1)
ball.data.materials.append(sk.material("palla", sk.lin("06b6d4"), rough=0.35, coat=0.5))
shadow, strength = sk.shadow_plane("Ombra", size=1.4)

sk.light("Key", (-4.0, -6.0, 6.5), 900, 5.0, (0, 0, 1.2))
sk.light("Rim", (4.5, 5.0, 4.0), 600, 3.0, (0, 0, 1.2), (0.9, 0.97, 1.0))
sk.camera((0.0, -13.0, 3.6), (0.0, 0.0, 1.4))

for f in range(N):                          # una chiave per frame, calcolata qui: il loop si richiude da solo
    k = f % BOUNCE
    if k < 3:
        h, sz = 0.0, (0.88, 0.78, 0.88)[k]  # appoggio: si schiaccia
    else:
        u = (k - 2) / (BOUNCE - 2)
        h, sz = sk.hop(u, HEIGHT), 1 + 0.1 * abs(1 - 2 * u) ** 3
    sxy = 1 / math.sqrt(sz)                 # volume costante
    rig.location = (0, 0, h)
    rig.scale = (sxy, sxy, sz)
    rig.keyframe_insert("location", frame=f + 1)
    rig.keyframe_insert("scale", frame=f + 1)
    lift = h / HEIGHT
    shadow.scale = ((1 - 0.38 * lift) * sxy,) * 2 + (1,)
    shadow.keyframe_insert("scale", frame=f + 1)
    strength.outputs[0].default_value = 0.42 * (1 - 0.6 * lift)
    strength.outputs[0].keyframe_insert("default_value", frame=f + 1)

sk.render(a.out, a.mode, {name!r}, N)
print("DONE", a.out)
'''


def cmd_new(a):
    target = os.path.abspath(a.scene)
    if os.path.exists(target):
        raise SystemExit("esiste gia': " + target + " (scegli un altro nome)")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    kit_rel = os.path.relpath(KIT_DIR, os.path.dirname(target)).replace(os.sep, "/")
    with open(target, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(TEMPLATE.format(kit_rel=kit_rel, name=scene_name(target)))
    print("scena creata:", target)
    print("prova:", "stills", a.scene, "1,6,12  poi  render", a.scene)
    return 0


def cmd_stills(a):
    scene = need_scene(a.scene)
    if not re.fullmatch(r"\d+(,\d+)*", a.frames):
        raise SystemExit("fotogrammi: un elenco di numeri separati da virgole, per esempio 1,30,60")
    out = os.path.abspath(a.out or default_out(scene))
    with render_lock():
        code = run_blender(["-P", scene, "--", out, str(a.width), "still:" + a.frames, str(a.samples)] + a.extra, out)
    print("fotogrammi in", out)
    return code


def cmd_render(a):
    scene = need_scene(a.scene)
    out = os.path.abspath(a.out or default_out(scene))
    with render_lock():
        code = run_blender(["-P", scene, "--", out, str(a.width), a.mode, str(a.samples)] + a.extra, out)
    print("uscita in", out)
    return code


PAGE = """<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Anteprima Blender</title><style>
body{{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg)}}
:root{{--bg:#17191d;--fg:#eceef1;--card:#212429}} :root.light{{--bg:#eceef1;--fg:#1f2328;--card:#fff}}
header{{position:sticky;top:0;padding:10px 16px;background:var(--card);display:flex;gap:10px;align-items:center}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:16px}}
figure{{margin:0;background:var(--card);border-radius:12px;padding:8px}} video,img{{width:100%;display:block}}
figcaption{{font-size:12px;opacity:.7;padding-top:6px}} button{{font:inherit}}
</style></head><body><header><b>Anteprima Blender</b><button onclick="document.documentElement.classList.toggle('light')">Chiaro / scuro</button>
<button onclick="document.querySelectorAll('video').forEach(v=>{{v.currentTime=0;v.play()}})">Rivedi</button></header><main>{items}</main></body></html>"""


def parse_range(header, size):
    """(start, end) estremi compresi per `bytes=a-b` o `bytes=a-`; None se va mandato tutto il file (intestazione non valida,
    inizio oltre la fine del file, fine prima dell'inizio)."""
    m = re.fullmatch(r"bytes=(\d+)-(\d*)", (header or "").strip())
    if not m or size <= 0:
        return None
    start = int(m.group(1))
    if start >= size:
        return None
    if not m.group(2):
        return start, size - 1
    if int(m.group(2)) < start:
        return None
    return start, min(int(m.group(2)), size - 1)


class PreviewHandler(http.server.SimpleHTTPRequestHandler):
    """File statici della cartella, con le richieste a intervalli (Range) che i video chiedono; «/» elenca video e immagini."""

    def do_GET(self):
        path = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if path in ("/", "/index.html") and not os.path.isfile(os.path.join(self.directory, "index.html")):
            return self.index()
        local = self.translate_path(self.path)
        rng = self.headers.get("Range")
        if not rng or not os.path.isfile(local):
            return super().do_GET()
        size = os.path.getsize(local)
        span = parse_range(rng, size)
        if span is None:
            return super().do_GET()
        start, end = span
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(local))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        with open(local, "rb") as fh:
            fh.seek(start)
            self.wfile.write(fh.read(end - start + 1))
        return None

    def index(self):
        items = []
        for root, _dirs, names in os.walk(self.directory):
            for n in sorted(names):
                rel = os.path.relpath(os.path.join(root, n), self.directory).replace(os.sep, "/")
                url, label = urllib.parse.quote(rel), html.escape(rel)
                if n.endswith(".webm"):
                    items.append(f'<figure><video src="{url}" muted autoplay loop playsinline></video><figcaption>{label}</figcaption></figure>')
                elif n.endswith((".png", ".webp")) and "/frames/" not in "/" + rel:
                    items.append(f'<figure><img src="{url}" alt=""><figcaption>{label}</figcaption></figure>')
        body = PAGE.format(items="".join(items) or "<p>Nessun video o immagine in questa cartella.</p>").encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *_):
        pass


def cmd_preview(a):
    folder = os.path.abspath(a.folder)
    if not os.path.isdir(folder):
        raise SystemExit("cartella non trovata: " + folder)

    def handler(*args, **kwargs):
        return PreviewHandler(*args, directory=folder, **kwargs)

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", a.port), handler)
    print(f"anteprima di {folder} su http://127.0.0.1:{a.port}/ (Ctrl+C per fermare)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(prog="blender_kit", description="Strumenti rapidi per Blender da riga di comando.")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("find", help="dov'e' Blender e che versione").set_defaults(fn=cmd_find)
    sub.add_parser("check", help="EEVEE, GPU, video WebM con alfa").set_defaults(fn=cmd_check)
    n = sub.add_parser("new", help="crea una scena di partenza")
    n.add_argument("scene")
    n.set_defaults(fn=cmd_new)
    s = sub.add_parser("stills", help="pochi fotogrammi in PNG")
    s.add_argument("scene")
    s.add_argument("frames", help="per esempio 1,30,60")
    s.add_argument("--out")
    s.add_argument("--width", type=int, default=640)
    s.add_argument("--samples", type=int, default=16)
    s.add_argument("extra", nargs="*", help="argomenti propri della scena")
    s.set_defaults(fn=cmd_stills)
    r = sub.add_parser("render", help="il video intero (o tutti i frame in PNG)")
    r.add_argument("scene")
    r.add_argument("--out")
    r.add_argument("--width", type=int, default=640)
    r.add_argument("--samples", type=int, default=64)
    r.add_argument("--mode", default="webm", choices=("webm", "png"))
    r.add_argument("extra", nargs="*", help="argomenti propri della scena")
    r.set_defaults(fn=cmd_render)
    v = sub.add_parser("preview", help="anteprima locale dei video e delle immagini di una cartella")
    v.add_argument("folder", nargs="?", default=".")
    v.add_argument("--port", type=int, default=5190)
    v.set_defaults(fn=cmd_preview)
    a = p.parse_args(argv)
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())
