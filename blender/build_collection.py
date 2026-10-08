"""Build ten editable knitwear studies and a physical yarn macro in Blender 5.1."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'designs/collection.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.name='Holiday Build Club | Knit studies'
scene.use_fake_user=True
scene.render.engine='CYCLES'
scene.cycles.samples=40
scene.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL'; prefs.get_devices()
    for device in prefs.devices: device.use=device.type=='METAL'
    scene.cycles.device='GPU'
    print('CYCLES_DEVICES',[(d.name,d.type,d.use) for d in prefs.devices])
except Exception as err: print('METAL_UNAVAILABLE',type(err).__name__)
scene.world=bpy.data.worlds.new('Soft studio environment')
scene.world.color=(.65,.65,.65)
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.resolution_percentage=100

def rgb(hex):
    v=[int(hex[k:k+2],16)/255 for k in (1,3,5)]
    return tuple(((x+.055)/1.055)**2.4 if x>.04045 else x/12.92 for x in v)+(1,)

def mat(name,color,texture=None):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes; l=m.node_tree.links; bs=n.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=rgb(color)
    bs.inputs['Roughness'].default_value=.84
    bs.inputs['Sheen Weight'].default_value=.35
    if texture:
        tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(texture));tex.interpolation='Closest'
        l.new(tex.outputs['Color'],bs.inputs['Base Color'])
    # Fine yarn relief, two diagonal waves crossed with micro noise.
    coord=n.new('ShaderNodeTexCoord')
    sep=n.new('ShaderNodeSeparateXYZ');l.new(coord.outputs['Generated'],sep.inputs[0])
    wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='X';wave.inputs['Scale'].default_value=95
    wave.inputs['Distortion'].default_value=3.5;wave.inputs['Detail Scale'].default_value=6
    l.new(coord.outputs['Generated'],wave.inputs[0])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.27;bump.inputs['Distance'].default_value=.009
    l.new(wave.outputs['Color'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bs.inputs['Normal'])
    return m

def mesh_object(name,verts,faces,material,uvs=None):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.data.materials.append(material)
    for face in mesh.polygons: face.use_smooth=True
    if uvs:
        uv=mesh.uv_layers.new(name='Design placement')
        for poly in mesh.polygons:
            for idx in poly.loop_indices: uv.data[idx].uv=uvs[mesh.loops[idx].vertex_index]
    return obj

def torso(name,material):
    verts=[];faces=[];uvs=[];N=96; R=35
    for j in range(R):
        t=j/(R-1);z=.16+t*1.68
        w=.67+.05*math.sin(t*math.pi)-.40*max(0,(t-.80)/.20)**1.15
        depth=.175+.035*math.sin(t*math.pi)
        for k in range(N):
            a=k/N*math.tau;x=w*math.sin(a);y=-depth*math.cos(a)
            y+=(.009*math.sin(x*23+z*5)+.004*math.sin(x*39-z*8))*math.sin(t*math.pi)
            # shoulders descend gently away from the neck.
            zz=z-.065*(abs(x)/w)**2*t**8
            verts.append((x,y,zz));uvs.append(((x/w+1)/2,t))
    for j in range(R-1):
        for k in range(N): a=j*N+k;b=j*N+(k+1)%N;faces.append((a,b,b+N,a+N))
    obj=mesh_object(name,verts,faces,material,uvs)
    solid=obj.modifiers.new('Yarn thickness','SOLIDIFY');solid.thickness=.018
    return obj

def tube(name,start,end,r1,r2,material,rib=False):
    A=Vector(start); B=Vector(end);axis=(B-A).normalized();side=Vector((0,1,0));other=axis.cross(side).normalized()
    verts=[];faces=[];N=80;R=28
    for j in range(R):
        t=j/(R-1);center=A+(B-A)*t;r=r1*(1-t)+r2*t
        for k in range(N):
            a=k/N*math.tau; rr=r+(.005*math.cos(a*40) if rib else .003*math.sin(a*12+t*10))
            p=center+side*(math.cos(a)*rr*.70)+other*(math.sin(a)*rr)
            verts.append(p)
    for j in range(R-1):
        for k in range(N):a=j*N+k;b=j*N+(k+1)%N;faces.append((a,b,b+N,a+N))
    o=mesh_object(name,verts,faces,material)
    s=o.modifiers.new('Knit shell','SOLIDIFY');s.thickness=.018
    return o

def collar(name,material):
    verts=[];faces=[];N=128;R=10
    for j in range(R):
        t=j/(R-1)
        for k in range(N):
            a=k/N*math.tau;r=.24+.07*t+.003*math.cos(a*64)
            verts.append((r*math.sin(a),-.19*math.cos(a),1.85-.10*math.cos(a)-.06*t))
    for j in range(R-1):
        for k in range(N):a=j*N+k;b=j*N+(k+1)%N;faces.append((a,b,b+N,a+N))
    o=mesh_object(name,verts,faces,material); s=o.modifiers.new('Collar thickness','SOLIDIFY');s.thickness=.027
    return o

models=[]
for i,d in enumerate(DATA):
    collection=bpy.data.collections.new(d['name']);scene.collection.children.link(collection)
    previous=set(scene.objects)
    body=mat(d['name']+' | jacquard artwork',d['colors'][0],ROOT/'blender/textures'/(d['id']+'.png'))
    base=mat(d['name']+' | body yarn',d['colors'][0]); trim=mat(d['name']+' | rib yarn',d['colors'][1])
    torso('Body | '+d['name'],body)
    collar('Ribbed crew neck',base)
    for sign in (-1,1):
        tube('Drop shoulder sleeve',(sign*.40,0,1.51),(sign*1.33,-.025,.48),.235,.14,base)
        tube('Ribbed cuff',(sign*1.32,-.025,.50),(sign*1.43,-.025,.33),.145,.14,trim,True)
    # Hem as an elliptical tube in the vertical direction.
    hem=tube('Ribbed hem',(0,0,.13),(0,0,.27),.66,.66,base,True)
    hem.scale.y=.40
    objs=[o for o in scene.objects if o not in previous]
    root=bpy.data.objects.new(d['id'],None);collection.objects.link(root)
    for o in objs:
        for owner in list(o.users_collection):owner.objects.unlink(o)
        collection.objects.link(o);o.parent=root
    root['concept']=d['name'];root['status']='Digital construction study; sample and technical pattern required'
    root['palette']=' / '.join(d['colors'])
    collection.hide_render=True;collection.hide_viewport=True;models.append((collection,root))

def track(obj,point):obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,energy,size,color=(1,1,1)):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;track(obj,(0,0,1));return obj
area('Large softbox',(-3,-4,6),650,5)
area('Fill',(4,-1,3),360,4,(.82,.9,1))
area('Rim',(1,2,4),600,3)
bpy.ops.object.camera_add(location=(.35,-6.2,2.6))
camera=bpy.context.object;camera.name='Product camera';track(camera,(0,0,1.02));camera.data.type='ORTHO';camera.data.ortho_scale=3.7;scene.camera=camera
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.01))
floor=bpy.context.object;floor.name='Studio floor';floor.data.materials.append(mat('Snow studio','#e9ece8'))
scene.render.resolution_x=1000;scene.render.resolution_y=1100
models[2][0].hide_render=False;models[2][0].hide_viewport=False
scene.render.filepath=str(ROOT/'site/assets/knit-study.png')
bpy.ops.render.render(write_still=True)

# A physical yarn macro. Each loop is a real curve, not a flat image texture.
macro=bpy.data.scenes.new('Physical yarn | Snowflake macro');macro.use_fake_user=True
macro.render.engine='CYCLES';macro.cycles.samples=32;macro.cycles.use_denoising=True;macro.cycles.device=scene.cycles.device
macro.world=scene.world;macro.view_settings.view_transform='AgX';macro.render.resolution_x=1400;macro.render.resolution_y=850;macro.render.resolution_percentage=100
red=mat('Cranberry spun yarn','#b12b3b');cream=mat('Chalk spun yarn','#ebe6d7')
for yy in range(44):
    for xx in range(64):
        x=(xx-31.5)*.034;y=(yy-21.5)*.038
        dx=xx-32;dy=yy-22
        is_white=(abs(dx)<1 and abs(dy)<9) or (abs(dy)<1 and abs(dx)<9) or (abs(abs(dx)-abs(dy))<1 and abs(dx)<7)
        is_white=is_white or (yy in (5,38) and xx%3==0)
        curve=bpy.data.curves.new('Interlocked yarn loop','CURVE');curve.dimensions='3D';curve.resolution_u=8;curve.bevel_depth=.009;curve.bevel_resolution=4
        points=[(-.017,.034,-.012),(-.019,.017,.001),(-.014,.002,.014),(0,-.021,.019),(.014,.002,.014),(.019,.017,.001),(.017,.034,-.012)]
        spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
        for p,co in zip(spline.bezier_points,points):p.co=(co[0]+x,co[1]+y,co[2]+.013*math.sin(x*5+y*3));p.handle_left_type='AUTO';p.handle_right_type='AUTO'
        obj=bpy.data.objects.new('Cream stitch' if is_white else 'Cranberry stitch',curve);macro.collection.objects.link(obj);curve.materials.append(cream if is_white else red)
for source in [o for o in scene.objects if o.type=='LIGHT']:
    obj=source.copy();obj.data=source.data.copy();macro.collection.objects.link(obj);obj.location.z=3;obj.data.energy*=.35
camdata=bpy.data.cameras.new('Macro lens');cam=bpy.data.objects.new('Macro lens',camdata);macro.collection.objects.link(cam)
cam.location=(.10,-.38,2.5);track(cam,(0,0,0));camdata.type='ORTHO';camdata.ortho_scale=1.55;macro.camera=cam
macro.render.image_settings.file_format='PNG';macro.render.filepath=str(ROOT/'site/assets/yarn-macro.png')
bpy.ops.render.render(write_still=True,scene=macro.name)
for image in bpy.data.images:
    if image.source=='FILE':image.pack()
bpy.context.window.scene=scene
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/holiday-build-club.blend'))
print('BUILD_COMPLETE: ten editable knit studies, physical yarn scene, two rendered assets')
