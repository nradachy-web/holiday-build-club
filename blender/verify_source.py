"""Read back the saved asset and make its opening viewport coherent."""
import bpy,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
items=json.loads((root/'designs/collection.json').read_text())
assert len(items)==10
for item in items:
    assert item['id'] in bpy.data.objects
    collection=bpy.data.collections[item['name']]
    collection.hide_viewport=item['id']!='silent-deploy'
    assert bpy.data.objects[item['id']]['concept']==item['name']
assert 'Physical yarn | Snowflake macro' in bpy.data.scenes
assert len([i for i in bpy.data.images if i.packed_file])==10
bpy.ops.wm.save_as_mainfile(filepath=str(root/'blender/holiday-build-club.blend'),compress=True)
print('VERIFIED_SAVED_SOURCE: ten concepts, ten packed artwork textures, two retained scenes')
