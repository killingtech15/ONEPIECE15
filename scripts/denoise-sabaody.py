"""Optional OIDN cleanup of the baked atlas; keep spatial/cutaway mesh groups."""
import bpy, pathlib, json
root = pathlib.Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(root / '.tools/sabaody.blend'))
scene = bpy.context.scene
districts = [o for o in scene.objects if o.type == 'MESH']
image = bpy.data.images.get('Sabaody diffuse lighting')
scene.use_nodes = True
nodes = scene.node_tree.nodes
nodes.clear()
source = nodes.new('CompositorNodeImage'); source.image = image
denoise = nodes.new('CompositorNodeDenoise')
out = nodes.new('CompositorNodeComposite')
scene.node_tree.links.new(source.outputs['Image'], denoise.inputs['Image'])
scene.node_tree.links.new(denoise.outputs['Image'], out.inputs['Image'])
for ob in scene.objects: ob.hide_render = True
cam_data = bpy.data.cameras.new('Texture cleanup camera')
cam = bpy.data.objects.new('Texture cleanup camera', cam_data)
scene.collection.objects.link(cam); scene.camera = cam
scene.render.resolution_x = 4096; scene.render.resolution_y = 4096
scene.render.resolution_percentage = 100
scene.cycles.samples = 1; scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
scene.view_settings.exposure = 0; scene.view_settings.gamma = 1
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGB'
scene.render.filepath = str(root / '.tools/sabaody-clean.png')
bpy.ops.render.render(write_still=True)
clean = bpy.data.images.load(scene.render.filepath); clean.pack()
for node in districts[0].data.materials[0].node_tree.nodes:
    if node.type == 'TEX_IMAGE': node.image = clean
bpy.ops.object.select_all(action='DESELECT')
for ob in districts:
    ob.hide_render = False; ob.select_set(True)
bpy.context.view_layer.objects.active = districts[0]
target = root / 'public/models/sabaody.glb'
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', use_selection=True,
    export_materials='EXPORT', export_yup=True, export_image_format='JPEG', export_image_quality=92)
metrics_path = root / 'public/models/sabaody-metrics.json'
metrics = json.loads(metrics_path.read_text()); metrics['bytes'] = target.stat().st_size
metrics['lighting'] += '; 96 samples, OIDN texture cleanup'
metrics_path.write_text(json.dumps(metrics, indent=2))
print('SABAODY_DENOISE_COMPLETE', metrics, flush=True)
