"""Bake the Impel Down source into one diffuse atlas, retaining district culling.
Run build-impel-down.mjs --source first, then Blender --background --python this file.
"""
import bpy, json, math, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root / '.tools/impel-down-source.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
def bake_offset(name):
    # Each open floor gets independent illumination; restore exact world positions after bake.
    if name.startswith('floor'):
        number = name.split('-')[0][5:]
        return (7 if number == '55' else int(number)) * 450
    return 0
for ob in meshes:
    # Bake open rooms and exterior shells independently in one atlas.
    # Restore the displaced shell vertices after material separation.
    ob.location.x += bake_offset(ob.name)
    # Unique material per district lets us split the baked mesh back into districts.
    mat = bpy.data.materials.new(ob.name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = 1
    colors = nodes.new('ShaderNodeVertexColor')
    colors.layer_name = ob.data.color_attributes[0].name
    mat.node_tree.links.new(colors.outputs['Color'], bsdf.inputs['Base Color'])
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    for poly in ob.data.polygons:
        poly.material_index = 0
    ob.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
city = bpy.context.object
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
# BMesh welding loses imported split normals at converging cone tips. Carry
# them in a corner attribute through the weld, then restore before baking.
saved_normals = city.data.attributes.new(name='bake_corner_normals', type='FLOAT_VECTOR', domain='CORNER')
saved_normals.data.foreach_set('vector', [v for n in city.data.corner_normals for v in n.vector])
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.00001)
bpy.ops.object.mode_set(mode='OBJECT')
saved_normals = city.data.attributes['bake_corner_normals']
city.data.normals_split_custom_set([tuple(n.vector) for n in saved_normals.data])
city.data.attributes.remove(saved_normals)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
# Preserve the authored winding. Global normal recalculation across touching
# facade relief and one-sided inlays can flip isolated triangles in this model.
bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=0)
# Equalize texel density before packing with an explicit two-pixel margin.
# Relative smart-project margins starved small curved roofs of texture pixels.
bpy.ops.uv.select_all(action='SELECT')
bpy.ops.uv.average_islands_scale()
# Large diffuse trees/ground need fewer texels per metre than readable facade relief.
# Scale complete material groups uniformly, retaining each UV island's shape.
bpy.ops.object.mode_set(mode='OBJECT')
uv = city.data.uv_layers.active.data
for polygon in city.data.polygons:
    name = city.data.materials[polygon.material_index].name
    weight = 1.35 if name.startswith(('surface-', 'ship-', 'floor55-')) else 1
    for loop in polygon.loop_indices:
        uv[loop].uv *= weight
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.pack_islands(margin_method='FRACTION', margin=2/4096, rotate=True, scale=True)
bpy.ops.object.mode_set(mode='OBJECT')
image = bpy.data.images.new('Impel Down diffuse lighting', width=4096, height=4096, alpha=False)
for mat in city.data.materials:
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    mat.node_tree.nodes.active = tex
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 96
try:
    devices = bpy.context.preferences.addons['cycles'].preferences
    devices.compute_device_type = 'OPTIX'
    devices.get_devices()
    has_gpu = any(d.type == 'OPTIX' for d in devices.devices)
    for device in devices.devices:
        device.use = has_gpu and device.type == 'OPTIX'
    if has_gpu:
        scene.cycles.device = 'GPU'
except (TypeError, RuntimeError):
    pass  # CPU remains available on machines without OptiX.
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (0.75, 0.85, 1, 1)
bg.inputs['Strength'].default_value = 0.7
sun_data = bpy.data.lights.new('Warm canopy light', 'SUN')
sun_data.energy = 1.1
sun_data.angle = math.radians(8)
sun = bpy.data.objects.new('Pale moonlight', sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(28), math.radians(-30), math.radians(-28))
# Soft architectural illumination is baked, with no runtime point-light array.
for floor_id, y, tint in [('1',-25,(1,.48,.48)),('2',-80,(.65,.8,1)),('3',-135,(1,.72,.36)),('4',-195,(1,.3,.08)),('5',-270,(.5,.78,1)),('55',-322,(1,.57,.38)),('6',-370,(.4,.65,1))]:
    light_data=bpy.data.lights.new('Floor '+floor_id, 'AREA')
    light_data.energy=18000 if floor_id!='55' else 4000
    light_data.color=tint; light_data.shape='DISK'; light_data.size=45
    light=bpy.data.objects.new('Baked floor light '+floor_id,light_data)
    scene.collection.objects.link(light)
    # glTF Y becomes Blender Z, and glTF Z becomes -Y.
    light.location=(bake_offset('floor'+floor_id+'-'),0,y+40)
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 4
scene.render.bake.margin_type = 'EXTEND'
print('IMPEL_DOWN_BAKE_START', flush=True)
bpy.ops.object.bake(type='DIFFUSE')
image.filepath_raw = str(root / '.tools/impel-down-diffuse.png')
image.file_format = 'PNG'
image.save()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='MATERIAL')
bpy.ops.object.mode_set(mode='OBJECT')
districts = [o for o in bpy.context.selected_objects if o.type == 'MESH']
baked = bpy.data.materials.new('Impel Down | Cycles baked diffuse')
baked.use_nodes = True
nodes = baked.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
emission = nodes.new('ShaderNodeEmission')
tex = nodes.new('ShaderNodeTexImage')
tex.image = image
baked.node_tree.links.new(tex.outputs['Color'], emission.inputs['Color'])
baked.node_tree.links.new(emission.outputs[0], output.inputs[0])
for ob in districts:
    ob.name = ob.data.materials[0].name
    for vertex in ob.data.vertices:
        vertex.co.x -= bake_offset(ob.name)
    ob.data.materials.clear()
    ob.data.materials.append(baked)
    for poly in ob.data.polygons:
        poly.material_index = 0
    # Colors are already in the atlas; retaining them would multiply the texture twice.
    for attr in list(ob.data.color_attributes):
        ob.data.color_attributes.remove(attr)
image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(root / '.tools/impel-down.blend'))
target = root / 'public/models/impel-down.glb'
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', use_selection=True,
    export_materials='EXPORT', export_yup=True, export_normals=False, export_image_format='JPEG', export_image_quality=92)
triangles = sum(sum(len(p.vertices) - 2 for p in ob.data.polygons) for ob in districts)
metrics = dict(triangles=triangles, districtMeshes=len(districts), bytes=target.stat().st_size,
    lighting='Blender Cycles diffuse color, direct and indirect lighting; shared 4096px atlas')
(root / 'public/models/impel-down-metrics.json').write_text(json.dumps(metrics, indent=2))
print('IMPEL_DOWN_BAKE_COMPLETE', metrics, flush=True)
