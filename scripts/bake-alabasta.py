"""Run using Blender --background --python scripts/bake-alabasta.py.
Cycles diffuse (color + direct + indirect) baked once into an atlas, then exported unlit.
"""
import bpy, math, pathlib
from mathutils import Vector
root=pathlib.Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'.tools/alabasta-source.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for ob in meshes: ob.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join()
island=bpy.context.object; island.name='Alabasta_baked'
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.00001)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.uv.smart_project(angle_limit=math.radians(70),island_margin=0.0006)
bpy.ops.object.mode_set(mode='OBJECT')
image=bpy.data.images.new('Alabasta_diffuse_light',width=4096,height=4096,alpha=False)
for mat in island.data.materials:
    mat.use_nodes=True
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    mat.node_tree.nodes.active=tex
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
scene.cycles.use_denoising=True
scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(0.65,0.78,1,1);bg.inputs['Strength'].default_value=.65
sun_data=bpy.data.lights.new('Desert sunlight','SUN');sun_data.energy=2.0;sun_data.angle=math.radians(8)
sun=bpy.data.objects.new('Desert sunlight',sun_data);scene.collection.objects.link(sun)
sun.rotation_euler=(math.radians(28),math.radians(-30),math.radians(-28))
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=True
scene.render.bake.margin=8
print('BAKE_START',flush=True)
bpy.ops.object.bake(type='DIFFUSE')
image.filepath_raw=str(root/'.tools/alabasta-diffuse.png');image.file_format='PNG';image.save()
mat=bpy.data.materials.new('Alabasta | Cycles baked diffuse');mat.use_nodes=True
nodes=mat.node_tree.nodes;nodes.clear()
output=nodes.new('ShaderNodeOutputMaterial');emission=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');tex.image=image
mat.node_tree.links.new(tex.outputs['Color'],emission.inputs['Color']);mat.node_tree.links.new(emission.outputs[0],output.inputs[0])
island.data.materials.clear();island.data.materials.append(mat)
for poly in island.data.polygons:poly.material_index=0
image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(root/'.tools/alabasta.blend'))
bpy.ops.object.select_all(action='DESELECT');island.select_set(True);bpy.context.view_layer.objects.active=island
bpy.ops.export_scene.gltf(filepath=str(root/'public/models/alabasta-baked.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_yup=True,export_image_format='JPEG',export_image_quality=92)
print('BAKE_COMPLETE',flush=True)
