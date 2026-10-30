"""scene_kit.py - funzioni di base per le scene di Blender (4.2 o successivo, provato con 5.2) fatte da script: scena vuota
con lo sfondo trasparente, luci e camera, forme, materiali, ombre finte, chiavi calcolate in Python e uscita in WebM con
alfa o in PNG. Si usa dentro Blender, da uno script di scena lanciato con blender_kit.py (stills, render) o con
`blender -b --factory-startup -P scena.py -- <cartella> <larghezza> <modalita> <campioni> [altri argomenti]`:

    import os, sys
    sys.path.insert(0, CARTELLA_DI_QUESTO_FILE)
    import scene_kit as sk
    a = sk.args()                       # a.out, a.width, a.mode, a.samples, a.extra
    sk.reset_scene(a.width, a.samples)
    ...                                 # oggetti, poi una chiave per frame con keyframe_insert
    sk.render(a.out, a.mode, "nome", ultimo_frame)

Modalita: `webm` (video VP9 con alfa), `png` (tutti i frame), `still:1,30,60` (solo quei frame, in PNG).
"""
import math
import os
import sys
from types import SimpleNamespace

import bmesh
import bpy
from mathutils import Vector


# --- Argomenti -------------------------------------------------------------------------------------------------------------
def args(default_width=640, default_samples=64):
    """Argomenti dopo `--`: cartella di uscita, larghezza, modalita, campioni EEVEE, poi quelli propri della scena."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return SimpleNamespace(
        out=os.path.abspath(argv[0] if argv else "out"),
        width=int(argv[1]) if len(argv) > 1 else default_width,
        mode=argv[2] if len(argv) > 2 else "webm",
        samples=int(argv[3]) if len(argv) > 3 else default_samples,
        extra=argv[4:],
    )


# --- Colori e scena --------------------------------------------------------------------------------------------------------
def lin(h):
    """Colore esadecimale sRGB ("06b6d4") -> RGBA lineare: i colori dei materiali sono lineari."""
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


WHITE = (1.0, 1.0, 1.0, 1.0)
_MATS = {}
_FONT = []


def scene():
    return bpy.context.scene


def reset_scene(width, samples, fps=30, height=None, world=(0.8, 0.86, 0.92), world_strength=0.6):
    """Scena vuota: EEVEE, sfondo trasparente, 16:9 (o `height`), trasformazione dei colori «Standard» (i colori di un
    marchio restano quelli), una luce d'ambiente tenue dal mondo."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = scene()
    w = bpy.data.worlds.new("World")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (*world, 1.0)
    bg.inputs["Strength"].default_value = world_strength
    r = sc.render
    engines = [e.identifier for e in r.bl_rna.properties["engine"].enum_items]
    r.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT"   # 4.2-4.x: EEVEE_NEXT
    r.resolution_x, r.resolution_y, r.resolution_percentage = width, height or width * 9 // 16, 100
    r.fps = fps
    r.film_transparent = True
    sc.eevee.taa_render_samples = samples
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    _MATS.clear()
    _FONT.clear()   # read_factory_settings svuota bpy.data: materiali e carattere vanno ricreati
    return sc


def link(ob, parent=None):
    scene().collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name, parent=None, loc=(0, 0, 0)):
    ob = link(bpy.data.objects.new(name, None), parent)
    ob.location = loc
    return ob


def aim(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


def light(name, loc, power, size, target, color=(1, 1, 1)):
    """Luce ad area rotonda (riflessi tondi, non quadrati) puntata su `target`."""
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "DISK"
    ld.energy, ld.size, ld.color = power, size, color
    ob = link(bpy.data.objects.new(name, ld))
    ob.location = loc
    aim(ob, target)
    return ob


def camera(loc, target, lens=85):
    cd = bpy.data.cameras.new("Cam")
    cd.lens = lens
    cam = link(bpy.data.objects.new("Cam", cd))
    cam.location = loc
    aim(cam, target)
    scene().camera = cam
    return cam


# --- Forme -------------------------------------------------------------------------------------------------------------------
def mesh_object(name, bm, smooth=True):
    me = bpy.data.meshes.new(name)
    for f in bm.faces:
        f.smooth = smooth
    bm.to_mesh(me)
    bm.free()
    return bpy.data.objects.new(name, me)


def ellipsoid(name, rx, ry, rz, segs=64, rings=32):
    """Ellissoide (non ancora nella scena: `link(ellipsoid(...), genitore)`)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    bmesh.ops.scale(bm, vec=(rx, ry, rz), verts=bm.verts)
    return mesh_object(name, bm)


def dome(name, rx, ry, rz, segs=64, rings=32):
    """Mezzo ellissoide (z >= 0), aperto sotto."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context="VERTS")
    bmesh.ops.scale(bm, vec=(rx, ry, rz), verts=bm.verts)
    return mesh_object(name, bm)


def torus(name, major, minor, segs=48, ring=12):
    """Toro nel piano XY, asse Z."""
    bm = bmesh.new()
    grid = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            rr = major + minor * math.cos(b)
            row.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), minor * math.sin(b))))
        grid.append(row)
    for i in range(segs):
        for j in range(ring):
            i2, j2 = (i + 1) % segs, (j + 1) % ring
            bm.faces.new((grid[i][j], grid[i2][j], grid[i2][j2], grid[i][j2]))
    return mesh_object(name, bm)


def disc(name, radius, depth, segs=48):
    """Cilindro basso (asse Z): lenti, dischi, monete."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=radius, radius2=radius, depth=depth)
    return mesh_object(name, bm)


def rod(name, p0, p1, radius, parent, mat, segs=16):
    """Cilindro da p0 a p1 (coordinate del genitore), gia' nella scena."""
    p0, p1 = Vector(p0), Vector(p1)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=radius, radius2=radius, depth=(p1 - p0).length)
    ob = link(mesh_object(name, bm), parent)
    ob.location = (p0 + p1) / 2
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference((p1 - p0).normalized())
    ob.data.materials.append(mat)
    return ob


def slab(name, w, h, t, r, mat, parent=None, loc=(0, 0, 0), segs=5):
    """Lastra larga w (x), alta h (z), spessa t (y), con gli spigoli arrotondati di raggio r; gia' nella scena."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, t, h), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(r, t * 0.49, w * 0.49, h * 0.49), segments=segs, profile=0.5, affect="EDGES")
    ob = link(mesh_object(name, bm), parent)
    ob.location = loc
    ob.data.materials.append(mat)
    return ob


def lathe(name, profile, segs=40, cap_top=False):
    """Solido di rotazione attorno a Z da un profilo [(raggio, z), ...] dal basso; fondo chiuso, sopra aperto o chiuso."""
    bm = bmesh.new()
    rings = [[bm.verts.new((r * math.cos(2 * math.pi * j / segs), r * math.sin(2 * math.pi * j / segs), z)) for j in range(segs)]
             for r, z in profile]
    for a, b in zip(rings, rings[1:]):
        for j in range(segs):
            j2 = (j + 1) % segs
            bm.faces.new((a[j], a[j2], b[j2], b[j]))
    bm.faces.new(list(reversed(rings[0])))
    if cap_top:
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm)


def font():
    """Segoe UI Bold se c'e' (Windows), altrimenti il carattere di Blender."""
    if not _FONT:
        path = os.path.join(os.environ.get("WINDIR", ""), "Fonts", "segoeuib.ttf")
        _FONT.append(bpy.data.fonts.load(path) if os.environ.get("WINDIR") and os.path.isfile(path) else None)
    return _FONT[0]


def text3d(name, body, size, mat, parent=None, loc=(0, 0, 0), extrude=0.03):
    """Testo in piedi rivolto alla camera (-Y), centrato in `loc`."""
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = extrude * 0.35
    cu.align_x, cu.align_y = "CENTER", "CENTER"
    if font():
        cu.font = font()
    ob = link(bpy.data.objects.new(name, cu), parent)
    ob.location = loc
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.data.materials.append(mat)
    return ob


# --- Materiali e ombre ---------------------------------------------------------------------------------------------------------
def material(key, color, rough=0.4, coat=0.0, emit=0.0, sss=0.0, alpha=1.0):
    """Principled condiviso per chiave. `emit` fa brillare il colore (utile per le cose sottili su sfondo scuro),
    `alpha` sotto 1 lo rende trasparente con la fusione vera (vetro, lenti)."""
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.12
    if emit:
        b.inputs["Emission Color"].default_value = color
        b.inputs["Emission Strength"].default_value = emit
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.3, 0.6, 0.6)
        b.inputs["Subsurface Scale"].default_value = 0.08
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    _MATS[key] = m
    return m


def shadow_plane(name, size=1.5):
    """Ombra finta: piano con un gradiente radiale nero e trasparente (EEVEE non ha lo shadow catcher, e un pavimento vero
    non si vedrebbe su sfondo trasparente). Restituisce l'oggetto e il nodo Value dell'intensita' (da chiavare)."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size)
    ob = link(mesh_object(name, bm, smooth=False))
    sm = bpy.data.materials.new(name + "Mat")
    sm.use_nodes = True
    if hasattr(sm, "surface_render_method"):
        sm.surface_render_method = "BLENDED"
    nt = sm.node_tree
    nt.nodes.clear()
    tc = nt.nodes.new("ShaderNodeTexCoord")
    ln = nt.nodes.new("ShaderNodeVectorMath")
    ln.operation = "LENGTH"
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.interpolation_type = "SMOOTHSTEP"
    mr.inputs["From Min"].default_value = 0.2
    mr.inputs["From Max"].default_value = size * 0.93
    mr.inputs["To Min"].default_value = 1.0
    mr.inputs["To Max"].default_value = 0.0
    amt = nt.nodes.new("ShaderNodeValue")
    amt.outputs[0].default_value = 0.4
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tc.outputs["Object"], ln.inputs[0])
    nt.links.new(ln.outputs["Value"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], mul.inputs[0])
    nt.links.new(amt.outputs[0], mul.inputs[1])
    nt.links.new(mul.outputs[0], mix.inputs["Fac"])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    ob.data.materials.append(sm)
    ob.visible_shadow = False
    return ob, amt


# --- Movimento -----------------------------------------------------------------------------------------------------------------
def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ramp(f, a, b, v0, v1, ease=smooth):
    if f <= a:
        return v0
    if f >= b:
        return v1
    return v0 + (v1 - v0) * ease((f - a) / (b - a))


def keys(f, pts):
    """Interpolazione morbida tra chiavi [(frame, valore), ...]: si calcola il valore di ogni frame e lo si chiava."""
    if f <= pts[0][0]:
        return pts[0][1]
    for (a, va), (b, vb) in zip(pts, pts[1:]):
        if f <= b:
            return ramp(f, a, b, va, vb)
    return pts[-1][1]


def facing(dx, dy):
    """Angolo (gradi, attorno a Z) che volta il davanti (-Y locale) verso la direzione (dx, dy)."""
    return math.degrees(math.atan2(dx, -dy))


def hop(u, height):
    """Arco di un salto: u da 0 a 1, altezza massima a meta'."""
    return height * 4 * u * (1 - u)


# --- Uscita --------------------------------------------------------------------------------------------------------------------
def render(out_dir, mode, name, frame_end, frame_start=1):
    """`webm`: <name>.webm (VP9 con alfa); `still:<f1,f2>`: <name>_<frame>.png; `png`: tutti i frame in <out>/frames/."""
    sc = scene()
    r = sc.render
    sc.frame_start, sc.frame_end = frame_start, frame_end
    os.makedirs(out_dir, exist_ok=True)
    im = r.image_settings
    if mode == "webm":
        if "media_type" in im.bl_rna.properties:      # Blender 4.5 e successivi: prima il tipo, poi il formato
            im.media_type = "VIDEO"
        im.file_format = "FFMPEG"
        ff = r.ffmpeg
        ff.format, ff.codec = "WEBM", "WEBM"
        im.color_mode = "RGBA"
        ff.constant_rate_factor = "HIGH"
        ff.ffmpeg_preset = "BEST"
        ff.gopsize = 30
        ff.audio_codec = "NONE"
        r.filepath = os.path.join(out_dir, name + "-")
        bpy.ops.render.render(animation=True)
        # Blender aggiunge l'intervallo dei frame al nome del video: il file finale ha un nome fisso.
        os.replace(os.path.join(out_dir, f"{name}-{frame_start:04d}-{frame_end:04d}.webm"), os.path.join(out_dir, name + ".webm"))
        return
    if "media_type" in im.bl_rna.properties:
        im.media_type = "IMAGE"
    im.file_format = "PNG"
    im.color_mode = "RGBA"
    if mode.startswith("still:"):
        for fr in mode.split(":", 1)[1].split(","):
            sc.frame_set(int(fr))
            r.filepath = os.path.join(out_dir, f"{name}_{int(fr):03d}.png")
            bpy.ops.render.render(write_still=True)
        return
    if mode != "png":
        raise SystemExit("modalita' sconosciuta: " + mode + " (webm, png o still:<frame,...>)")
    r.filepath = os.path.join(out_dir, "frames", name + "_####")
    bpy.ops.render.render(animation=True)
