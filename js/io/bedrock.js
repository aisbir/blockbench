function findEntityTexture(mob, return_path) {
	var textures = {
		'llamaspit': 'llama/spit',
		'llama': 'llama/llama_creamy',
		'dragon': 'dragon/dragon',
		'ghast': 'ghast/ghast',
		'slime': 'slime/slime',
		'slime.armor': 'slime/slime',
		'lavaslime': 'slime/magmacube',
		'shulker': 'shulker/shulker_undyed',
		'rabbit': 'rabbit/brown',
		'horse': 'horse/horse_brown',
		'horse.v2': 'horse2/horse_brown',
		'humanoid': 'steve',
		'creeper': 'creeper/creeper',
		'enderman': 'enderman/enderman',
		'zombie': 'zombie/zombie',
		'zombie.husk': 'zombie/husk',
		'zombie.drowned': 'zombie/drowned',
		'pigzombie': 'pig/pigzombie',
		'pigzombie.baby': 'pig/pigzombie',
		'skeleton': 'skeleton/skeleton',
		'skeleton.wither': 'skeleton/wither_skeleton',
		'skeleton.stray': 'skeleton/stray',
		'spider': 'spider/spider',
		'cow': 'cow/cow',
		'mooshroom': 'cow/mooshroom',
		'sheep.sheared': 'sheep/sheep',
		'sheep': 'sheep/sheep',
		'pig': 'pig/pig',
		'irongolem': 'iron_golem',
		'snowgolem': 'snow_golem',
		'zombie.villager': 'zombie_villager/zombie_farmer',
		'evoker': 'illager/evoker',
		'vex': 'vex/vex',
		'wolf': 'wolf/wolf',
		'ocelot': 'cat/ocelot',
		'cat': 'cat/siamese',
		'turtle': 'sea_turtle',
		'villager': 'villager/farmer',
		'villager.witch': 'witch',
		'witherBoss': 'wither_boss/wither',
		'parrot': 'parrot/parrot_red_blue',
		'bed': 'bed/white',
		'player_head': 'steve',
		'mob_head': 'skeleton/skeleton',
		'dragon_head': 'dragon/dragon',
		'boat': 'boat/boat_oak',
		'cod': 'fish/fish',
		'pufferfish.small': 'fish/pufferfish',
		'pufferfish.mid': 'fish/pufferfish',
		'pufferfish.large': 'fish/pufferfish',
		'salmon': 'fish/salmon',
		'tropicalfish_a': 'fish/tropical_a',
		'tropicalfish_b': 'fish/tropical_b',
		'panda': 'panda/panda',
		'fishing_hook': 'fishhook',
	}
	mob = mob.split(':')[0].replace(/^geometry\./, '')
	var path = textures[mob]
	if (!path) {
		path = mob
	}
	if (path) {
		var texture_path = ModelMeta.export_path.split(osfs)
		var index = texture_path.lastIndexOf('models') - texture_path.length
		texture_path.splice(index)
		texture_path = [...texture_path, 'textures', 'entity', ...path.split('/')].join(osfs)

		if (return_path === true) {
			return texture_path+'.png';
		} else if (return_path === 'raw') {
			return ['entity', ...path.split('/')].join(osfs)
		} else {
			function tryItWith(extension) {
				if (fs.existsSync(texture_path+'.'+extension)) {
					var texture = new Texture({keep_size: true}).fromPath(texture_path+'.'+extension).add()
					return true;
				}
			}
			if (!tryItWith('png') && !tryItWith('tga')) {
				if (settings.default_path && settings.default_path.value) {
					
					texture_path = settings.default_path.value + osfs + 'entity' + osfs + path.split('/').join(osfs)
					tryItWith('png') || tryItWith('tga')
				}
			}
		}
	}
}

(function() {

function parseGeometry(data) {
	if (data === undefined) {
		pe_list_data.forEach(function(s) {
			if (s.selected === true) {
				data = s
			}
		})
		if (data == undefined) {
			data = pe_list_data[0]
		}
	}
	Project.geometry_name = (data.object.description.identifier && data.object.description.identifier.replace(/^geometry\./, '')) || '';
	Project.texture_width = 16;
	Project.texture_height = 16;

	if (data.object.description.texture_width !== undefined) {
		Project.texture_width = data.object.description.texture_width;
	}
	if (data.object.description.texture_height !== undefined) {
		Project.texture_height = data.object.description.texture_height;
	}

	var bones = {}

	if (data.object.bones) {
		var included_bones = []
		data.object.bones.forEach(function(b) {
			included_bones.push(b.name)
		})
		data.object.bones.forEach(function(b, bi) {
			var group = new Group({
				name: b.name,
				origin: b.pivot,
				rotation: b.rotation,
				material: b.material
			}).init()
			group.createUniqueName();
			bones[group.name] = group
			if (b.pivot) {
				group.origin[0] *= -1
			}
			group.rotation.forEach(function(br, ri) {
				group.rotation[ri] *= -1
			})
			
			group.mirror_uv = b.mirror === true
			group.reset = b.reset === true

			if (b.cubes) {
				b.cubes.forEach(function(s) {
					var base_cube = new Cube({
						name: b.name,
						autouv: 0,
						color: bi%8,
						rotation: s.rotation,
						origin: s.pivot
					})
					base_cube.rotation.forEach(function(br, ri) {
						base_cube.rotation[ri] *= -1
					})
					base_cube.origin[0] *= -1;
					if (s.origin) {
						base_cube.from = s.origin
						base_cube.from[0] = -(base_cube.from[0] + s.size[0])
						if (s.size) {
							base_cube.to[0] = s.size[0] + base_cube.from[0]
							base_cube.to[1] = s.size[1] + base_cube.from[1]
							base_cube.to[2] = s.size[2] + base_cube.from[2]
						}
					}
					if (s.uv instanceof Array) {
						base_cube.uv_offset[0] = s.uv[0]
						base_cube.uv_offset[1] = s.uv[1]
						Project.box_uv = true;
					} else if (s.uv) {
						Project.box_uv = false;
						for (var key in base_cube.faces) {
							if (s.uv[key]) {
								base_cube.faces[key].extend({
									uv: [
										s.uv[key].uv[0] * Project.texture_width/16,
										s.uv[key].uv[1] * Project.texture_height/16,
									]
								})
								if (s.uv[key].uv_size) {
									base_cube.faces[key].uv_size = [
										s.uv[key].uv_size[0] * Project.texture_width/16,
										s.uv[key].uv_size[1] * Project.texture_height/16,
									]

								} else {
									base_cube.autouv = 1;
									base_cube.mapAutoUV();
								}
							} else {
								base_cube.faces[key].texture = null;
							}
						}
						
					}
					if (s.inflate && typeof s.inflate === 'number') {
						base_cube.inflate = s.inflate;
					}
					if (s.mirror === undefined) {
						base_cube.mirror_uv = group.mirror_uv;
					} else {
						base_cube.mirror_uv = s.mirror === true;
					}
					base_cube.addTo(group).init()
				})
			}
			if (b.locators) {
				for (var key in b.locators) {
					var coords = b.locators[key];
					coords[0] *= -1
					var locator = new Locator({from: coords, name: key}).addTo(group).init();
				}
			}
			if (b.children) {
				b.children.forEach(function(cg) {
					cg.addTo(group);
				})
			}
			var parent_group = 'root';
			if (b.parent) {
				if (bones[b.parent]) {
					parent_group = bones[b.parent]
				} else {
					data.object.bones.forEach(function(ib) {
						if (ib.name === b.parent) {
							ib.children && ib.children.length ? ib.children.push(group) : ib.children = [group]
						}
					})
				}
			}
			group.addTo(parent_group)
		})
	}
	pe_list_data.length = 0;
	hideDialog()

	loadTextureDraggable()
	Canvas.updateAllBones()
	setProjectTitle()
	if (isApp && Project.geometry_name) {
		findEntityTexture(Project.geometry_name)
	}
	EditSession.initNewModel()
}


var codec = new Codec('bedrock', {
	name: 'Bedrock Model',
	extension: 'json',
	remember: true,
	compile(options) {
		if (options === undefined) options = {}

		var entitymodel = {}
		var main_tag = {
			format_version: '1.12.0',
			'minecraft:geometry': [entitymodel]
		}
		entitymodel.description = {
			identifier: 'geometry.' + (Project.geometry_name||'unknown'),
			texture_width:  Project.texture_width || 16,
			texture_height: Project.texture_height || 16,
		}
		var bones = []
		var visible_box = new THREE.Box3()

		var groups = Group.all.slice()
		var loose_cubes = [];
		Outliner.root.forEach(obj => {
			if (obj.type === 'cube') {
				loose_cubes.push(obj)
			}
		})
		if (loose_cubes.length) {
			groups.splice(0, 0, {
				type: 'group',
				parent: 'root',
				name: 'unknown_bone',
				origin: [0, 0, 0],
				rotation: [0],
				children: loose_cubes
			})
		}
		groups.forEach(function(g) {
			if (g.type !== 'group') return;
			//Bone
			var bone = {}
			bone.name = g.name
			if (g.parent.type === 'group') {
				bone.parent = g.parent.name
			}
			bone.pivot = g.origin.slice()
			bone.pivot[0] *= -1
			if (!g.rotation.allEqual(0)) {
				bone.rotation = g.rotation.slice()
				bone.rotation.forEach(function(br, ri) {
					bone.rotation[ri] *= -1
				})
			}
			if (g.reset) {
				bone.reset = true
			}
			if (g.mirror_uv) {
				bone.mirror = true
			}
			if (g.material) {
				bone.material = g.material
			}
			//Cubes
			var cubes = []
			var locators = {};

			for (var obj of g.children) {
				if (obj.export) {
					if (obj instanceof Cube) {
						var cube = {
							name: obj.name != g.name ? undefined : obj.name,
							origin: obj.from.slice(),
							size: obj.size(),
							inflate: obj.inflate||undefined,
						}
						cube.origin[0] = -(cube.origin[0] + cube.size[0])


						if (!obj.rotation.allEqual(0)) {
							cube.pivot = obj.origin.slice();
							cube.pivot[0] *= -1
							cube.rotation = obj.rotation.slice();
							cube.rotation.forEach(function(br, ri) {
								cube.rotation[ri] *= -1
							})
						}

						if (Project.box_uv) {
							cube.uv = obj.uv_offset;
							if (obj.mirror_uv === !bone.mirror) {
								cube.mirror = obj.mirror_uv
							}
						} else {
							cube.uv = {};
							for (var key in obj.faces) {
								var face = obj.faces[key];
								if (face.texture !== null) {
									cube.uv[key] = new oneLiner({
										uv: [
											face.uv[0] * entitymodel.description.texture_width/16,
											face.uv[1] * entitymodel.description.texture_height/16,
										],
										uv_size: [
											face.uv_size[0] * entitymodel.description.texture_width/16,
											face.uv_size[1] * entitymodel.description.texture_height/16,
										]
									});
								}
							}
						}
						//Visible Bounds
						var mesh = obj.mesh
						if (mesh) {
							visible_box.expandByObject(mesh)
						}
						cubes.push(cube)

					} else if (obj instanceof Locator) {

						locators[obj.name] = obj.from.slice();
						locators[obj.name][0] *= -1;
					}
				}
			}

			if (cubes.length) {
				bone.cubes = cubes
			}
			if (Object.keys(locators).length) {
				bone.locators = locators
			}
			bones.push(bone)
		})

		if (bones.length && options.visible_box !== false) {
			var offset = new THREE.Vector3(8,8,8)
			visible_box.max.add(offset)
			visible_box.min.add(offset)
			//Width
			var radius = Math.max(
				visible_box.max.x,
				visible_box.max.z,
				-visible_box.min.x,
				-visible_box.min.z
			) * 0.9
			if (Math.abs(radius) === Infinity) {
				radius = 0
			}
			entitymodel.description.visible_bounds_width = Math.ceil((radius*2) / 16)
			//Height
			entitymodel.description.visible_bounds_height = Math.ceil(((visible_box.max.y - visible_box.min.y) * 0.9) / 16)
			if (Math.abs(entitymodel.description.visible_bounds_height) === Infinity) {
				entitymodel.description.visible_bounds_height = 0;
			}
			entitymodel.description.visible_bounds_offset = [0, entitymodel.description.visible_bounds_height/2 , 0]
		}
		if (bones.length) {
			entitymodel.bones = bones
		}

		if (options.raw) {
			return main_tag
		} else {
			return autoStringify(main_tag)
		}
	},
	overwrite(content, path, cb) {
		var data, index;
		var model_id = 'geometry.'+Project.geometry_name;
		try {
			data = fs.readFileSync(path, 'utf-8');
			data = JSON.parse(data.replace(/\/\*[^(\*\/)]*\*\/|\/\/.*/g, ''))
			if (data['minecraft:geometry'] instanceof Array == false) {
				throw 'Incompatible format';
			}
			var i = 0;
			for (model of data['minecraft:geometry']) {
				if (model.description && model.description.identifier == model_id) {
					index = i;
					break;
				}
				i++;
			}
		} catch (err) {
			var answer = electron.dialog.showMessageBox(currentwindow, {
				type: 'warning',
				buttons: [
					tl('message.bedrock_overwrite_error.overwrite'),
					tl('dialog.cancel')
				],
				title: 'Blockbench',
				message: tl('message.bedrock_overwrite_error.message'),
				detail: err+'',
				noLink: false
			})
			if (answer === 1) {
				return;
			}
		}
		if (data && index !== undefined) {
			var model = this.compile({raw: true})['minecraft:geometry'][0]
			if (index != undefined) {
				data['minecraft:geometry'][index] = model
			} else {
				data['minecraft:geometry'].push(model)
			}
			content = autoStringify(data)
		}
		Blockbench.writeFile(path, {content}, cb);
	},
	parse(data, path) {
		pe_list_data.length = 0
		Formats.bedrock.select()

		var geometries = []
		for (var geo of data['minecraft:geometry']) {
			geometries.push(geo);
		}
		if (geometries.length === 1) {
			parseGeometry({object: data['minecraft:geometry'][0]})
			return;
		}

		$('#pe_search_bar').val('')
		if (pe_list && pe_list._data) {
			pe_list._data.search_text = ''
		}

		function rotateOriginCoord(pivot, y, z) {
			return [
				pivot[1] - pivot[2] + z,
				pivot[2] - y + pivot[1]
			]
		}
		function create_thumbnail(model_entry, isize) {
			var included_bones = []
			model_entry.object.bones.forEach(function(b) {
				included_bones.push(b.name)
			})
			var thumbnail = new Jimp(48, 48, 0x00000000, function(err, image) {
				model_entry.object.bones.forEach(function(b) {
					//var rotate_bone = false;
					//if (b.name === 'body' &&
					//	(included_bones.includes('leg3') || model_entry.name.includes('chicken') || model_entry.name.includes('ocelot')) &&
					//	included_bones.includes('leg4') === false &&
					//	!model_entry.name.includes('creeper') &&
					//	( b.rotation === undefined ||b.rotation.join('_') === '0_0_0')
					//) {
					//	rotate_bone = true;
					//}
					var rotation = b.rotation
					if (!rotation || rotation[0] === undefined) {
						if (entityMode.hardcodes[model_entry.name] && entityMode.hardcodes[model_entry.name][b.name]) {
							rotation = entityMode.hardcodes[model_entry.name][b.name].rotation
						}
					}
					if (b.cubes) {
						b.cubes.forEach(function(c) {
							if (c.origin && c.size) {
								//Do cube
								var inflate = c.inflate||0
								var coords = {
									x: (c.origin[2]-inflate)*isize+24,
									y: 40-(c.origin[1]+c.size[1]+inflate)*isize,
									w: (c.size[2]+2*inflate)*isize,
									h: (c.size[1]+2*inflate)*isize
								}
								var shade = (limitNumber(c.origin[0], -24, 24)+24)/48*255
								var color = parseInt('0xffffff'+shade.toString(16))
								coords.x = limitNumber(coords.x, 0, 47)
								coords.y = limitNumber(coords.y, 0, 47)
								coords.w = limitNumber(coords.w, 0, 47 - coords.x)
								coords.h = limitNumber(coords.h, 0, 47 - coords.y)
								if (coords.h > 0 && coords.w > 0) {
									if (rotation && rotation[0] !== 0 && b.pivot) {
										Painter.drawRotatedRectangle(
											image,
											0xffffff88,
											coords,
											b.pivot[2]*isize+24,
											40-b.pivot[1]*isize,
											-rotation[0]
										)
									} else {
										Painter.drawRectangle(image, 0xffffff88, coords)
									}
								}
							}
						})
					}
				})

				//Send
				image.getBase64("image/png", function(a, dataUrl){
					model_entry.icon = dataUrl
				})
			})
		}
		for (var geo of data['minecraft:geometry']) {
			var key = geo.description && geo.description.identifier;
			if (key && key.includes('geometry.')) {
				var base_model = {
					name: key,
					bonecount: 0,
					cubecount: 0,
					selected: false,
					object: geo,
					icon: false
				}
				var oversize = 2;
				var words = key.replace(/:.*/g, '').replace('geometry.', '').split(/[\._]/g)
				words.forEach(function(w, wi) {
					words[wi] = capitalizeFirstLetter(w)
				})
				base_model.title = words.join(' ')
				if (geo.bones) {
					base_model.bonecount = geo.bones.length
					geo.bones.forEach(function(b) {
						if (b.cubes) {
							base_model.cubecount += b.cubes.length
							b.cubes.forEach(function(c) {
								if (c.origin && c.size && (c.origin[2] < -12 || c.origin[2] + c.size[2] > 12 || c.origin[1] + c.size[1] > 22) && oversize === 2) oversize = 1
								if (c.origin && c.size && (c.origin[2] < -24 || c.origin[2] + c.size[2] > 24)) oversize = 0.5
							})
						}
					})
					if (typeof base_model.cubecount !== 'number') {
						base_model.cubecount = '[E]'
					} else if (base_model.cubecount > 0) {

						create_thumbnail(base_model, oversize)


					}
				}
				pe_list_data.push(base_model)
			}
		}
		if (pe_list == undefined) {
			pe_list = new Vue({
				el: '#pe_list',
				data: {
					search_text: '',
					list: pe_list_data
				},
				methods: {
					selectE(item, event) {
						var index = pe_list_data.indexOf(item)
						pe_list_data.forEach(function(s) {
							s.selected = false;
						})
						pe_list_data[index].selected = true
					},
					open() {
						parseGeometry()
					}
				},
				computed: {
					searched() {
						var scope = this;
						return this.list.filter(item => {
							return item.name.toUpperCase().includes(scope.search_text)
						})
					}
				}
			})
		}
		showDialog('entity_import')
		$('#pe_list').css('max-height', ($(window).height() - 320) +'px')
		$('input#pe_search_bar').select()
		$('#entity_import .confirm_btn').off('click')
		$('#entity_import .confirm_btn').on('click', (e) => {
			parseGeometry()
		})
	},
})

var format = new ModelFormat({
	id: 'bedrock',
	extension: 'json',
	icon: 'icon-format_bedrock',
	rotate_cubes: true,
	box_uv: true,
	optional_box_uv: true,
	single_texture: true,
	bone_rig: true,
	animation_mode: true,
	locators: true,
	codec,
	onActivation: function () {
		
	}
})
codec.format = format;

BARS.defineActions(function() {
	codec.export_action = new Action({
		id: 'export_bedrock',
		icon: format.icon,
		category: 'file',
		condition: () => Format == format,
		click: function () {
			codec.export()
		}
	})
})

})()

