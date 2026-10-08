"""PROMPT DEPT original EMPTY METER enamel-style keychain study.

Run in a separate background process so the user's open Blender scene is
never touched:
  Blender --background --factory-startup --threads 4 --python <this file>

The .blend is saved before rendering. All accessory elements remain named,
editable objects. This is a visual construction study, not a factory tech
pack or an assertion about manufacturability, dimensions or final finish.
"""
from pathlib import Path
import math
import json
import sys
import bpy
from mathutils import Vector

if not bpy.app.background:
    raise RuntimeError("Run this script in a separate Blender background process. Your open scene was not changed.")

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
BLEND = HERE / "prompt-dept-accessories.blend"
RENDER = HERE / "prompt-dept-accessories.png"
REPORT = HERE / "prompt-dept-accessories.json"

# The guard above restricts scene construction to this isolated process.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if not collection.objects:
        bpy.data.collections.remove(collection)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = .01
scene.unit_settings.length_unit = 'CENTIMETERS'


def collection(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


product = collection("01 / EMPTY METER / Editable accessory")
studio = collection("02 / Studio / Camera and lights")
details = collection("03 / Notes / Construction study")


def move_to(obj, target):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    target.objects.link(obj)
    return obj


def linear(v):
    v /= 255.
    return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4


def color(hexcode):
    return tuple(linear(int(hexcode[i:i+2],16)) for i in (1,3,5)) + (1.,)


def material(name, hexcode, metallic=0., roughness=.35, coat=0.):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color(hexcode)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = .18
    mat.diffuse_color = color(hexcode)
    return mat


ink = material("PD / Ink enamel / #151613", "#151613", .12, .27, .55)
bone = material("PD / Bone enamel / #eeeae0", "#eeeae0", .04, .32, .32)
acid = material("PD / Acid enamel / #d5ff45", "#d5ff45", .04, .28, .50)
metal = material("PD / Brushed nickel edges", "#B8BCB5", .92, .24)
darkmetal = material("PD / Dark nickel reverse", "#454B42", .87, .33)
paper = material("Studio / Bone paper", "#D8D5C9", 0., .8)


def finish(obj, mat, bevel=0., target=product):
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Edge radius / editable", 'BEVEL')
        modifier.width = bevel
        modifier.segments = 4
        modifier.limit_method = 'ANGLE'
        modifier.harden_normals = True
        weighted = obj.modifiers.new("Weighted normals", 'WEIGHTED_NORMAL')
        weighted.keep_sharp = True
        weighted.weight = 40
    move_to(obj,target)
    return obj


def polygon(name, points, z, depth, mat, bevel=.012):
    n=len(points)
    verts=[(x,y,z) for x,y in points]+[(x,y,z+depth) for x,y in points]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name+" / mesh")
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    product.objects.link(obj)
    return finish(obj,mat,bevel)


def rounded(name, x, y, width, height, radius, z, depth, mat, bevel=.012):
    points=[]
    # Four counterclockwise quarter circles, with consistent winding.
    for cx,cy,start in ((x+width/2-radius,y+height/2-radius,0),
                        (x-width/2+radius,y+height/2-radius,90),
                        (x-width/2+radius,y-height/2+radius,180),
                        (x+width/2-radius,y-height/2+radius,270)):
        for i in range(13):
            a=math.radians(start+i*90/12)
            points.append((cx+radius*math.cos(a),cy+radius*math.sin(a)))
    return polygon(name,points,z,depth,mat,bevel)


def torus(name, x,y,z, major, minor, mat, rotation=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=96,minor_segments=16,location=(x,y,z))
    obj=bpy.context.object
    obj.name=name
    if rotation:
        obj.rotation_euler=rotation
    for p in obj.data.polygons:
        p.use_smooth=True
    return finish(obj,mat)


body=rounded("01 / Cast badge body / nickel perimeter",0,0,6.4,3.8,.48,.04,.26,metal,.045)
face=rounded("02 / Ink enamel field",0,0,6.14,3.54,.38,.296,.035,ink,.013)
reverse=rounded("03 / Reverse plate",0,0,6.13,3.53,.38,.008,.035,darkmetal,.014)

# Eyelet is a real drilled visual opening through each plate, kept as a
# boolean modifier for the body and enamel so the study stays editable.
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.21,depth=1.1,location=(-2.65,1.34,.22))
eye=bpy.context.object
eye.name="00 / Eyelet cutter / hidden render"
move_to(eye,details)
eye.hide_render=True
eye.hide_set(True)
eye.display_type='WIRE'
for target in (body,face,reverse):
    bo=target.modifiers.new("Eyelet bore / editable",'BOOLEAN')
    bo.operation='DIFFERENCE'
    bo.solver='EXACT'
    bo.object=eye
torus("04 / Raised eyelet rim",-2.65,1.34,.345,.215,.045,metal)

# A pair of split-ring loops and a small connector evoke actual key hardware.
torus("05 / Connector ring",-2.63,1.74,.35,.32,.055,metal,rotation=(math.radians(22),0,math.radians(-12)))
torus("06 / Main split ring / upper coil",-2.56,2.68,.37,.75,.065,metal)
torus("07 / Main split ring / lower coil",-2.56,2.68,.235,.75,.065,metal)

# The meter is our own three-bar symbol. It is intentionally not a battery,
# vendor identity or borrowed software mark. Third bar is split and displaced.
top=.55
barheight=.85
barwidth=1.15
barxs=(-1.45,.0,1.45)
for i,x in enumerate(barxs[:2],1):
    rounded(f"10 / Meter {i} / nickel frame",x,top,barwidth,barheight,.04,.336,.037,metal,.011)
    rounded(f"11 / Meter {i} / empty ink well",x,top,barwidth-.17,barheight-.17,.02,.370,.013,ink,.009)
    if i==1:
        rounded("12 / Meter 1 / last acid sliver",x,top-.19,.68,.12,.015,.386,.013,acid,.007)

# Split third frame: two separate plate pieces with a diagonal fracture.
x=barxs[2]
left,right=x-barwidth/2,x+barwidth/2
bottom,upper=top-barheight/2,top+barheight/2
polygon("13 / Meter 3 / fractured upper frame",[(left,bottom+.13),(left,upper),(right,upper),(right,top+.19),(right-.105,top+.075),(right-.105,upper-.105),(left+.105,upper-.105),(left+.105,bottom+.24)],.338,.040,metal,.009)
polygon("14 / Meter 3 / displaced lower frame",[(left+.09,bottom-.12),(left+.09,bottom-.01),(right+.09,upper-.16),(right+.09,upper-.32),(left+.30,bottom-.015),(right+.09,bottom-.015),(right+.09,bottom-.12)],.338,.04,acid,.009)

fontpath=PROJECT/'brand'/'production'/'fonts'/'Barlow-Production.ttf'
if not fontpath.is_file():
    fontpath=PROJECT/'site'/'assets'/'font-2.ttf'
if not fontpath.is_file():
    raise FileNotFoundError("The local Barlow font must exist before building the accessory.")
font=bpy.data.fonts.load(str(fontpath))


def text(name,body,x,y,size,mat,max_width=None):
    curve=bpy.data.curves.new(name+" / editable text",'FONT')
    curve.body=body
    curve.font=font
    curve.size=size
    curve.align_x='CENTER'
    curve.align_y='CENTER'
    curve.extrude=.003
    curve.bevel_depth=.0015
    curve.bevel_resolution=2
    curve.space_character=1.08
    obj=bpy.data.objects.new(name,curve)
    product.objects.link(obj)
    obj.location=(x,y,.373)
    curve.materials.append(mat)
    bpy.context.view_layer.update()
    if max_width and obj.dimensions.x>max_width:
        scale=max_width/obj.dimensions.x
        obj.scale=(scale,scale,scale)
    return obj


text("20 / EMPTY METER / editable Barlow", "EMPTY METER", .22,1.29,.49,bone,4.6)
text("21 / AFTER RESET / editable Barlow", "ASK ME AFTER RESET",0,-.43,.45,bone,5.35)
rounded("22 / Lower divider",0,-.85,5.30,.025,.011,.373,.012,metal,.003)
text("23 / PROMPT DEPT / editable Barlow", "PROMPT DEPT",0,-1.20,.34,acid,3.6)

# Add a single parent for convenient art-direction rotations and exports.
assembly=bpy.data.objects.new("EMPTY METER / Accessory assembly",None)
product.objects.link(assembly)
assembly.empty_display_type='PLAIN_AXES'
for obj in list(product.objects):
    if obj != assembly:
        obj.parent=assembly
eye.parent=assembly
assembly.rotation_euler.z=math.radians(-8)
assembly['design_status']='Original visual construction study. Not a factory tech pack.'
assembly['palette']='Ink #151613 / Bone #eeeae0 / Acid #d5ff45'
assembly['brand']='PROMPT DEPT'
assembly['geometry_note']='Separate editable plates, meter components, type, ring hardware and live eyelet booleans.'

# A simple studio makes the finish and depth visible without environment art.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.075))
ground=bpy.context.object
ground.name="Studio / Matte bone sweep"
finish(ground,paper,target=studio)
world=bpy.data.worlds.new("Studio / soft neutral")
scene.world=world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.24,.21,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35


def area(name,loc,energy,size,target,color_value=(1,1,1),shape='DISK',size_y=None):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=energy
    data.shape=shape
    data.size=size
    if size_y and shape=='RECTANGLE':
        data.size_y=size_y
    data.color=color_value
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=loc
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj


area("Key / broad softbox",(-4,1,8),850,7,(0,0,0),(1,.97,.91),'RECTANGLE',5)
area("Rim / long cool strip",(4,3,5),650,5,(0,0,.2),(.86,.93,1),'RECTANGLE',1.2)
area("Fill / front",(1,-6,5),240,6,(0,0,0))

camdata=bpy.data.cameras.new("Camera / hero view")
cam=bpy.data.objects.new("Camera / hero view",camdata)
studio.objects.link(cam)
cam.location=(6.8,-8.9,15.8)
target=Vector((-.45,.50,.1))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.type='ORTHO'
camdata.ortho_scale=10.6
scene.camera=cam

scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=64
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED'
scene.render.threads=4
scene.render.resolution_x=1400
scene.render.resolution_y=1400
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=False
scene.render.filepath=str(RENDER)
scene.render.use_file_extension=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=.1
scene.view_settings.gamma=1.

# Select the assembly in the delivered file, and frame it in any saved view.
bpy.ops.object.select_all(action='DESELECT')
assembly.select_set(True)
bpy.context.view_layer.objects.active=assembly
for screen in bpy.data.screens:
    for area_region in screen.areas:
        if area_region.type=='VIEW_3D':
            area_region.spaces.active.region_3d.view_distance=12
            area_region.spaces.active.region_3d.view_location=Vector((-.4,.5,.2))
            area_region.spaces.active.shading.type='MATERIAL'

notes=bpy.data.texts.new("READ ME / PROMPT DEPT accessory study")
notes.write("PROMPT DEPT / EMPTY METER\n\nOriginal enamel-style keychain visual construction study.\nSeparate editable objects, live text, packed Barlow font, materials, camera and studio lights.\nNo vendor logos, no imagegen mockup tracing.\nIntended palette: ink #151613, bone #eeeae0, acid #d5ff45.\nModel scale is for visualization only. Supplier engineering, split-ring fit,\nedge radii, enamel tolerances, finish and safety review are not resolved.\nRebuild with prompt-dept-accessories.py in Blender background mode.\n")
HERE.mkdir(parents=True,exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),check_existing=False)
report={"brand":"PROMPT DEPT","design":"EMPTY METER enamel-style keychain","blender_version":bpy.app.version_string,"blend":str(BLEND),"render":str(RENDER),"objects":len(scene.objects),"editable_product_objects":len(product.objects),"font":str(fontpath),"render_resolution":[1400,1400],"status":"blend_saved_render_pending","scope":"Original visual construction study, not a factory tech pack. Does not claim to match generated mockups."}
REPORT.write_text(json.dumps(report,indent=2)+"\n")
print("PROMPT_DEPT_BLEND_SAVED",str(BLEND),flush=True)
bpy.ops.render.render(write_still=True)
report['status']='blend_saved_render_complete'
report['render_bytes']=RENDER.stat().st_size
REPORT.write_text(json.dumps(report,indent=2)+"\n")
print("PROMPT_DEPT_RENDER_COMPLETE",str(RENDER),flush=True)
