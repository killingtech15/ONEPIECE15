"""Bake the Enies Lobby source into one diffuse atlas, retaining district culling.
Run build-enies-lobby.mjs --source first, then Blender --background --python this file.
"""
import bpy, json, math, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root / '.tools/enies-lobby-source.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for ob in meshes:
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
bpy.ops.object.join()
city = bpy.context.object
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.00001)
# Preserve the authored winding. Global normal recalculation across touching
# facade relief and one-sided inlays can flip isolated triangles in this model.
bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=0.001)
bpy.ops.object.mode_set(mode='OBJECT')
image = bpy.data.images.new('Enies Lobby diffuse lighting', width=4096, height=4096, alpha=False)
for mat in city.data.materials:
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    mat.node_tree.nodes.active = tex
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (0.65, 0.78, 1, 1)
bg.inputs['Strength'].default_value = 0.65
sun_data = bpy.data.lights.new('Canal sunlight', 'SUN')
sun_data.energy = 2.0
sun_data.angle = math.radians(8)
sun = bpy.data.objects.new('Canal sunlight', sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(28), math.radians(-30), math.radians(-28))
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 6
print('ENIES_LOBBY_BAKE_START', flush=True)
bpy.ops.object.bake(type='DIFFUSE')
image.filepath_raw = str(root / '.tools/enies-lobby-diffuse.png')
image.file_format = 'PNG'
image.save()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='MATERIAL')
bpy.ops.object.mode_set(mode='OBJECT')
districts = [o for o in bpy.context.selected_objects if o.type == 'MESH']
baked = bpy.data.materials.new('Enies Lobby | Cycles baked diffuse')
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
    ob.data.materials.clear()
    ob.data.materials.append(baked)
    for poly in ob.data.polygons:
        poly.material_index = 0
    # Colors are already in the atlas; retaining them would multiply the texture twice.
    for attr in list(ob.data.color_attributes):
        ob.data.color_attributes.remove(attr)
image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(root / '.tools/enies-lobby.blend'))
target = root / 'public/models/enies-lobby.glb'
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', use_selection=True,
    export_materials='EXPORT', export_yup=True, export_image_format='JPEG', export_image_quality=92)
triangles = sum(sum(len(p.vertices) - 2 for p in ob.data.polygons) for ob in districts)
metrics = dict(triangles=triangles, districtMeshes=len(districts), bytes=target.stat().st_size,
    lighting='Blender Cycles diffuse color, direct and indirect lighting; shared 4096px atlas')
(root / 'public/models/enies-lobby-metrics.json').write_text(json.dumps(metrics, indent=2))
print('ENIES_LOBBY_BAKE_COMPLETE', metrics, flush=True)

