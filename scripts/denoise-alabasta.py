"""Optional final texture cleanup using Blender's OpenImageDenoise compositor.
Run after bake-alabasta.py; keeps the baked lighting, removes sample grain.
"""
import bpy,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(root/'.tools/alabasta.blend'))
scene=bpy.context.scene
island=bpy.data.objects['Alabasta_baked']
image=bpy.data.images.get('Alabasta_diffuse_light')
scene.use_nodes=True
nodes=scene.node_tree.nodes;nodes.clear()
source=nodes.new('CompositorNodeImage');source.image=image
denoise=nodes.new('CompositorNodeDenoise')
out=nodes.new('CompositorNodeComposite')
scene.node_tree.links.new(source.outputs['Image'],denoise.inputs['Image'])
scene.node_tree.links.new(denoise.outputs['Image'],out.inputs['Image'])
for ob in scene.objects:ob.hide_render=True
cam_data=bpy.data.cameras.new('Texture cleanup camera');cam=bpy.data.objects.new('Texture cleanup camera',cam_data)
scene.collection.objects.link(cam);scene.camera=cam
scene.render.resolution_x=4096;scene.render.resolution_y=4096;scene.render.resolution_percentage=100
scene.cycles.samples=1;scene.render.film_transparent=True
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
scene.render.filepath=str(root/'.tools/alabasta-clean.png')
bpy.ops.render.render(write_still=True)
clean=bpy.data.images.load(scene.render.filepath);clean.pack()
for node in island.data.materials[0].node_tree.nodes:
    if node.type=='TEX_IMAGE':node.image=clean
island.hide_render=False
bpy.ops.object.select_all(action='DESELECT');island.select_set(True);bpy.context.view_layer.objects.active=island
bpy.ops.export_scene.gltf(filepath=str(root/'public/models/alabasta-baked.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_yup=True,export_image_format='JPEG',export_image_quality=92)
print('DENOISE_COMPLETE',flush=True)
