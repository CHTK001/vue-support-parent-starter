import { C as FileLoader, E as Group, Et as SRGBColorSpace, G as LinearMipmapLinearFilter, Gt as Vector3, J as Loader, Nt as SphereGeometry, Rt as TextureLoader, Tt as RepeatWrapping, W as LinearFilter, at as MeshPhongMaterial, ct as MirroredRepeatWrapping, f as ClampToEdgeWrapping, l as BufferAttribute, lt as NearestFilter, nt as Mesh, p as Color, st as MeshStandardMaterial, tt as Matrix4, u as BufferGeometry, v as CylinderGeometry, w as Float32BufferAttribute, xt as Quaternion } from "./three.module-0UZ2DIdt.js";
import { t as unzipSync } from "./fflate.module-mtlOMP1b.js";
import { t as mergeGeometries } from "./BufferGeometryUtils-DMRZpEWo.js";
//#region ../../node_modules/.pnpm/three@0.186.1/node_modules/three/examples/jsm/loaders/3MFLoader.js
var COLOR_SPACE_3MF = SRGBColorSpace;
var NS_BEAM_LATTICE = "http://schemas.microsoft.com/3dmanufacturing/beamlattice/2017/02";
var NS_BEAM_LATTICE_BALLS = "http://schemas.microsoft.com/3dmanufacturing/beamlattice/balls/2020/07";
/**
* A loader for the [3D Manufacturing Format (3MF)](https://3mf.io/specification/) format.
*
* The following features from the core specification are supported:
*
* - 3D Models
* - Object Resources (Meshes and Components)
* - Material Resources (Base Materials)
*
* 3MF Materials and Properties Extension are only partially supported.
*
* - Texture 2D
* - Texture 2D Groups
* - Color Groups (Vertex Colors)
* - Metallic Display Properties (PBR)
* - Beam Lattice
*
* ```js
* const loader = new ThreeMFLoader();
*
* const object = await loader.loadAsync( './models/3mf/truck.3mf' );
* object.rotation.set( - Math.PI / 2, 0, 0 ); // z-up conversion
* scene.add( object );
* ```
*
* @augments Loader
* @three_import import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
*/
var ThreeMFLoader = class extends Loader {
	/**
	* Constructs a new 3MF loader.
	*
	* @param {LoadingManager} [manager] - The loading manager.
	*/
	constructor(manager) {
		super(manager);
		/**
		* An array of available extensions.
		*
		* @type {Array<Object>}
		*/
		this.availableExtensions = [];
	}
	/**
	* Starts loading from the given URL and passes the loaded 3MF asset
	* to the `onLoad()` callback.
	*
	* @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	* @param {function(Group)} onLoad - Executed when the loading process has been finished.
	* @param {onProgressCallback} onProgress - Executed while the loading is in progress.
	* @param {onErrorCallback} onError - Executed when errors occur.
	*/
	load(url, onLoad, onProgress, onError) {
		const scope = this;
		const loader = new FileLoader(scope.manager);
		loader.setPath(scope.path);
		loader.setResponseType("arraybuffer");
		loader.setRequestHeader(scope.requestHeader);
		loader.setWithCredentials(scope.withCredentials);
		loader.load(url, function(buffer) {
			try {
				onLoad(scope.parse(buffer));
			} catch (e) {
				if (onError) onError(e);
				else console.error(e);
				scope.manager.itemError(url);
			}
		}, onProgress, onError);
	}
	/**
	* Parses the given 3MF data and returns the resulting group.
	*
	* @param {ArrayBuffer} data - The raw 3MF asset data as an array buffer.
	* @return {Group} A group representing the parsed asset.
	*/
	parse(data) {
		const scope = this;
		const textureLoader = new TextureLoader(this.manager);
		function loadDocument(data) {
			let zip = null;
			let file = null;
			let relsName;
			let modelRelsName;
			const modelPartNames = [];
			const texturesPartNames = [];
			let modelRels;
			const modelParts = {};
			const printTicketParts = {};
			const texturesParts = {};
			const textDecoder = new TextDecoder();
			try {
				zip = unzipSync(new Uint8Array(data));
			} catch (e) {
				if (e instanceof ReferenceError) {
					console.error("THREE.3MFLoader: fflate missing and file is compressed.");
					return null;
				}
			}
			let rootModelFile = null;
			for (file in zip) if (file.match(/\_rels\/.rels$/)) relsName = file;
			else if (file.match(/3D\/_rels\/.*\.model\.rels$/)) modelRelsName = file;
			else if (file.match(/^3D\/[^\/]*\.model$/)) rootModelFile = file;
			else if (file.match(/^3D\/.*\/.*\.model$/)) modelPartNames.push(file);
			else if (file.match(/^3D\/Textures?\/.*/)) texturesPartNames.push(file);
			modelPartNames.push(rootModelFile);
			if (relsName === void 0) throw new Error("THREE.ThreeMFLoader: Cannot find relationship file `rels` in 3MF archive.");
			const relsView = zip[relsName];
			const rels = parseRelsXml(textDecoder.decode(relsView));
			if (modelRelsName) {
				const relsView = zip[modelRelsName];
				modelRels = parseRelsXml(textDecoder.decode(relsView));
			}
			for (let i = 0; i < modelPartNames.length; i++) {
				const modelPart = modelPartNames[i];
				const view = zip[modelPart];
				const fileText = textDecoder.decode(view);
				const xmlData = new DOMParser().parseFromString(fileText, "application/xml");
				if (xmlData.documentElement.nodeName.toLowerCase() !== "model") console.error("THREE.3MFLoader: Error loading 3MF - no 3MF document found: ", modelPart);
				const modelNode = xmlData.querySelector("model");
				const extensions = {};
				for (let i = 0; i < modelNode.attributes.length; i++) {
					const attr = modelNode.attributes[i];
					if (attr.name.match(/^xmlns:(.+)$/)) extensions[attr.value] = RegExp.$1;
				}
				const modelData = parseModelNode(modelNode);
				modelData["xml"] = modelNode;
				if (0 < Object.keys(extensions).length) modelData["extensions"] = extensions;
				modelParts[modelPart] = modelData;
			}
			for (let i = 0; i < texturesPartNames.length; i++) {
				const texturesPartName = texturesPartNames[i];
				texturesParts[texturesPartName] = zip[texturesPartName].buffer;
			}
			return {
				rels,
				modelRels,
				model: modelParts,
				printTicket: printTicketParts,
				texture: texturesParts
			};
		}
		function parseRelsXml(relsFileText) {
			const relationships = [];
			const relsNodes = new DOMParser().parseFromString(relsFileText, "application/xml").querySelectorAll("Relationship");
			for (let i = 0; i < relsNodes.length; i++) {
				const relsNode = relsNodes[i];
				const relationship = {
					target: relsNode.getAttribute("Target"),
					id: relsNode.getAttribute("Id"),
					type: relsNode.getAttribute("Type")
				};
				relationships.push(relationship);
			}
			return relationships;
		}
		function parseMetadataNodes(metadataNodes) {
			const metadataData = {};
			for (let i = 0; i < metadataNodes.length; i++) {
				const metadataNode = metadataNodes[i];
				const name = metadataNode.getAttribute("name");
				if (0 <= [
					"Title",
					"Designer",
					"Description",
					"Copyright",
					"LicenseTerms",
					"Rating",
					"CreationDate",
					"ModificationDate"
				].indexOf(name)) metadataData[name] = metadataNode.textContent;
			}
			return metadataData;
		}
		function parseBasematerialsNode(basematerialsNode) {
			const basematerialsData = {
				id: basematerialsNode.getAttribute("id"),
				basematerials: []
			};
			const basematerialNodes = basematerialsNode.querySelectorAll("base");
			for (let i = 0; i < basematerialNodes.length; i++) {
				const basematerialNode = basematerialNodes[i];
				const basematerialData = parseBasematerialNode(basematerialNode);
				basematerialData.index = i;
				basematerialsData.basematerials.push(basematerialData);
			}
			return basematerialsData;
		}
		function parseTexture2DNode(texture2DNode) {
			return {
				id: texture2DNode.getAttribute("id"),
				path: texture2DNode.getAttribute("path"),
				contenttype: texture2DNode.getAttribute("contenttype"),
				tilestyleu: texture2DNode.getAttribute("tilestyleu"),
				tilestylev: texture2DNode.getAttribute("tilestylev"),
				filter: texture2DNode.getAttribute("filter")
			};
		}
		function parseTextures2DGroupNode(texture2DGroupNode) {
			const texture2DGroupData = {
				id: texture2DGroupNode.getAttribute("id"),
				texid: texture2DGroupNode.getAttribute("texid"),
				displaypropertiesid: texture2DGroupNode.getAttribute("displaypropertiesid")
			};
			const tex2coordNodes = texture2DGroupNode.querySelectorAll("tex2coord");
			const uvs = [];
			for (let i = 0; i < tex2coordNodes.length; i++) {
				const tex2coordNode = tex2coordNodes[i];
				const u = tex2coordNode.getAttribute("u");
				const v = tex2coordNode.getAttribute("v");
				uvs.push(parseFloat(u), parseFloat(v));
			}
			texture2DGroupData["uvs"] = new Float32Array(uvs);
			return texture2DGroupData;
		}
		function parseColorGroupNode(colorGroupNode) {
			const colorGroupData = {
				id: colorGroupNode.getAttribute("id"),
				displaypropertiesid: colorGroupNode.getAttribute("displaypropertiesid")
			};
			const colorNodes = colorGroupNode.querySelectorAll("color");
			const colors = [];
			const colorObject = new Color();
			for (let i = 0; i < colorNodes.length; i++) {
				const color = colorNodes[i].getAttribute("color");
				colorObject.setStyle(color.substring(0, 7), COLOR_SPACE_3MF);
				colors.push(colorObject.r, colorObject.g, colorObject.b);
			}
			colorGroupData["colors"] = new Float32Array(colors);
			return colorGroupData;
		}
		function parseImplicitIONode(implicitIONode) {
			const portNodes = implicitIONode.children;
			const portArguments = {};
			for (let i = 0; i < portNodes.length; i++) {
				const args = { type: portNodes[i].nodeName.substring(2) };
				for (let j = 0; j < portNodes[i].attributes.length; j++) {
					const attrib = portNodes[i].attributes[j];
					if (attrib.specified) args[attrib.name] = attrib.value;
				}
				portArguments[portNodes[i].getAttribute("identifier")] = args;
			}
			return portArguments;
		}
		function parseImplicitFunctionNode(implicitFunctionNode) {
			const implicitFunctionData = {
				id: implicitFunctionNode.getAttribute("id"),
				displayname: implicitFunctionNode.getAttribute("displayname")
			};
			const functionNodes = implicitFunctionNode.children;
			const operations = {};
			for (let i = 0; i < functionNodes.length; i++) {
				const operatorNode = functionNodes[i];
				if (operatorNode.nodeName === "i:in" || operatorNode.nodeName === "i:out") operations[operatorNode.nodeName === "i:in" ? "inputs" : "outputs"] = parseImplicitIONode(operatorNode);
				else {
					const inputNodes = operatorNode.children;
					const portArguments = {
						"op": operatorNode.nodeName.substring(2),
						"identifier": operatorNode.getAttribute("identifier")
					};
					for (let i = 0; i < inputNodes.length; i++) portArguments[inputNodes[i].nodeName.substring(2)] = parseImplicitIONode(inputNodes[i]);
					operations[portArguments["identifier"]] = portArguments;
				}
			}
			implicitFunctionData["operations"] = operations;
			return implicitFunctionData;
		}
		function parseMetallicDisplaypropertiesNode(metallicDisplaypropetiesNode) {
			const metallicDisplaypropertiesData = { id: metallicDisplaypropetiesNode.getAttribute("id") };
			const metallicNodes = metallicDisplaypropetiesNode.querySelectorAll("pbmetallic");
			const metallicData = [];
			for (let i = 0; i < metallicNodes.length; i++) {
				const metallicNode = metallicNodes[i];
				metallicData.push({
					name: metallicNode.getAttribute("name"),
					metallicness: parseFloat(metallicNode.getAttribute("metallicness")),
					roughness: parseFloat(metallicNode.getAttribute("roughness"))
				});
			}
			metallicDisplaypropertiesData.data = metallicData;
			return metallicDisplaypropertiesData;
		}
		function parseBasematerialNode(basematerialNode) {
			const basematerialData = {};
			basematerialData["name"] = basematerialNode.getAttribute("name");
			basematerialData["displaycolor"] = basematerialNode.getAttribute("displaycolor");
			basematerialData["displaypropertiesid"] = basematerialNode.getAttribute("displaypropertiesid");
			return basematerialData;
		}
		function parseMeshNode(meshNode) {
			const meshData = {};
			const vertices = [];
			const vertexNodes = meshNode.querySelectorAll("vertices vertex");
			for (let i = 0; i < vertexNodes.length; i++) {
				const vertexNode = vertexNodes[i];
				const x = vertexNode.getAttribute("x");
				const y = vertexNode.getAttribute("y");
				const z = vertexNode.getAttribute("z");
				vertices.push(parseFloat(x), parseFloat(y), parseFloat(z));
			}
			meshData["vertices"] = new Float32Array(vertices);
			const triangleProperties = [];
			const triangles = [];
			const triangleNodes = meshNode.querySelectorAll("triangles triangle");
			for (let i = 0; i < triangleNodes.length; i++) {
				const triangleNode = triangleNodes[i];
				const v1 = triangleNode.getAttribute("v1");
				const v2 = triangleNode.getAttribute("v2");
				const v3 = triangleNode.getAttribute("v3");
				const p1 = triangleNode.getAttribute("p1");
				const p2 = triangleNode.getAttribute("p2");
				const p3 = triangleNode.getAttribute("p3");
				const pid = triangleNode.getAttribute("pid");
				const triangleProperty = {};
				triangleProperty["v1"] = parseInt(v1, 10);
				triangleProperty["v2"] = parseInt(v2, 10);
				triangleProperty["v3"] = parseInt(v3, 10);
				triangles.push(triangleProperty["v1"], triangleProperty["v2"], triangleProperty["v3"]);
				if (p1) triangleProperty["p1"] = parseInt(p1, 10);
				if (p2) triangleProperty["p2"] = parseInt(p2, 10);
				if (p3) triangleProperty["p3"] = parseInt(p3, 10);
				if (pid) triangleProperty["pid"] = pid;
				if (0 < Object.keys(triangleProperty).length) triangleProperties.push(triangleProperty);
			}
			meshData["triangleProperties"] = triangleProperties;
			meshData["triangles"] = new Uint32Array(triangles);
			const beamLatticeNode = meshNode.getElementsByTagNameNS(NS_BEAM_LATTICE, "beamlattice")[0];
			if (beamLatticeNode !== void 0) meshData["beamlattice"] = parseBeamLatticeNode(beamLatticeNode);
			return meshData;
		}
		function parseBeamLatticeNode(beamLatticeNode) {
			const beamLatticeData = {
				radius: parseFloat(beamLatticeNode.getAttribute("radius")),
				minLength: parseFloat(beamLatticeNode.getAttribute("minlength")),
				cap: beamLatticeNode.getAttribute("cap") || "sphere",
				ballMode: beamLatticeNode.getAttributeNS(NS_BEAM_LATTICE_BALLS, "ballmode") || "none",
				ballRadius: parseFloat(beamLatticeNode.getAttributeNS(NS_BEAM_LATTICE_BALLS, "ballradius")),
				beams: [],
				balls: []
			};
			const clippingMode = beamLatticeNode.getAttribute("clippingmode") || beamLatticeNode.getAttribute("clipping");
			if (clippingMode !== null && clippingMode !== "none") console.warn("THREE.3MFLoader: Beam lattice clipping is not supported. The lattice is rendered unclipped.");
			const beamNodes = beamLatticeNode.getElementsByTagNameNS(NS_BEAM_LATTICE, "beam");
			for (let i = 0; i < beamNodes.length; i++) {
				const beamNode = beamNodes[i];
				const beamData = {
					v1: parseInt(beamNode.getAttribute("v1"), 10),
					v2: parseInt(beamNode.getAttribute("v2"), 10)
				};
				const r1 = beamNode.getAttribute("r1");
				const r2 = beamNode.getAttribute("r2");
				if (r1 !== null) beamData["r1"] = parseFloat(r1);
				if (r2 !== null) beamData["r2"] = parseFloat(r2);
				beamLatticeData.beams.push(beamData);
			}
			const ballNodes = beamLatticeNode.getElementsByTagNameNS(NS_BEAM_LATTICE_BALLS, "ball");
			for (let i = 0; i < ballNodes.length; i++) {
				const ballNode = ballNodes[i];
				const ballData = { vindex: parseInt(ballNode.getAttribute("vindex"), 10) };
				const r = ballNode.getAttribute("r");
				if (r !== null) ballData["r"] = parseFloat(r);
				beamLatticeData.balls.push(ballData);
			}
			return beamLatticeData;
		}
		function parseComponentsNode(componentsNode) {
			const components = [];
			const componentNodes = componentsNode.querySelectorAll("component");
			for (let i = 0; i < componentNodes.length; i++) {
				const componentNode = componentNodes[i];
				const componentData = parseComponentNode(componentNode);
				components.push(componentData);
			}
			return components;
		}
		function parseComponentNode(componentNode) {
			const componentData = {};
			componentData["objectId"] = componentNode.getAttribute("objectid");
			const transform = componentNode.getAttribute("transform");
			if (transform) componentData["transform"] = parseTransform(transform);
			return componentData;
		}
		function parseTransform(transform) {
			const t = [];
			transform.split(" ").forEach(function(s) {
				t.push(parseFloat(s));
			});
			const matrix = new Matrix4();
			matrix.set(t[0], t[3], t[6], t[9], t[1], t[4], t[7], t[10], t[2], t[5], t[8], t[11], 0, 0, 0, 1);
			return matrix;
		}
		function parseObjectNode(objectNode) {
			const objectData = { type: objectNode.getAttribute("type") };
			const id = objectNode.getAttribute("id");
			if (id) objectData["id"] = id;
			const pid = objectNode.getAttribute("pid");
			if (pid) objectData["pid"] = pid;
			const pindex = objectNode.getAttribute("pindex");
			if (pindex) objectData["pindex"] = pindex;
			const thumbnail = objectNode.getAttribute("thumbnail");
			if (thumbnail) objectData["thumbnail"] = thumbnail;
			const partnumber = objectNode.getAttribute("partnumber");
			if (partnumber) objectData["partnumber"] = partnumber;
			const name = objectNode.getAttribute("name");
			if (name) objectData["name"] = name;
			const meshNode = objectNode.querySelector("mesh");
			if (meshNode) objectData["mesh"] = parseMeshNode(meshNode);
			const componentsNode = objectNode.querySelector("components");
			if (componentsNode) objectData["components"] = parseComponentsNode(componentsNode);
			return objectData;
		}
		function parseResourcesNode(resourcesNode) {
			const resourcesData = {};
			resourcesData["basematerials"] = {};
			const basematerialsNodes = resourcesNode.querySelectorAll("basematerials");
			for (let i = 0; i < basematerialsNodes.length; i++) {
				const basematerialsNode = basematerialsNodes[i];
				const basematerialsData = parseBasematerialsNode(basematerialsNode);
				resourcesData["basematerials"][basematerialsData["id"]] = basematerialsData;
			}
			resourcesData["texture2d"] = {};
			const textures2DNodes = resourcesNode.querySelectorAll("texture2d");
			for (let i = 0; i < textures2DNodes.length; i++) {
				const textures2DNode = textures2DNodes[i];
				const texture2DData = parseTexture2DNode(textures2DNode);
				resourcesData["texture2d"][texture2DData["id"]] = texture2DData;
			}
			resourcesData["colorgroup"] = {};
			const colorGroupNodes = resourcesNode.querySelectorAll("colorgroup");
			for (let i = 0; i < colorGroupNodes.length; i++) {
				const colorGroupNode = colorGroupNodes[i];
				const colorGroupData = parseColorGroupNode(colorGroupNode);
				resourcesData["colorgroup"][colorGroupData["id"]] = colorGroupData;
			}
			const implicitFunctionNodes = resourcesNode.querySelectorAll("implicitfunction");
			if (implicitFunctionNodes.length > 0) resourcesData["implicitfunction"] = {};
			for (let i = 0; i < implicitFunctionNodes.length; i++) {
				const implicitFunctionNode = implicitFunctionNodes[i];
				const implicitFunctionData = parseImplicitFunctionNode(implicitFunctionNode);
				resourcesData["implicitfunction"][implicitFunctionData["id"]] = implicitFunctionData;
			}
			resourcesData["pbmetallicdisplayproperties"] = {};
			const pbmetallicdisplaypropertiesNodes = resourcesNode.querySelectorAll("pbmetallicdisplayproperties");
			for (let i = 0; i < pbmetallicdisplaypropertiesNodes.length; i++) {
				const pbmetallicdisplaypropertiesNode = pbmetallicdisplaypropertiesNodes[i];
				const pbmetallicdisplaypropertiesData = parseMetallicDisplaypropertiesNode(pbmetallicdisplaypropertiesNode);
				resourcesData["pbmetallicdisplayproperties"][pbmetallicdisplaypropertiesData["id"]] = pbmetallicdisplaypropertiesData;
			}
			resourcesData["texture2dgroup"] = {};
			const textures2DGroupNodes = resourcesNode.querySelectorAll("texture2dgroup");
			for (let i = 0; i < textures2DGroupNodes.length; i++) {
				const textures2DGroupNode = textures2DGroupNodes[i];
				const textures2DGroupData = parseTextures2DGroupNode(textures2DGroupNode);
				resourcesData["texture2dgroup"][textures2DGroupData["id"]] = textures2DGroupData;
			}
			resourcesData["object"] = {};
			const objectNodes = resourcesNode.querySelectorAll("object");
			for (let i = 0; i < objectNodes.length; i++) {
				const objectNode = objectNodes[i];
				const objectData = parseObjectNode(objectNode);
				resourcesData["object"][objectData["id"]] = objectData;
			}
			return resourcesData;
		}
		function parseBuildNode(buildNode) {
			const buildData = [];
			const itemNodes = buildNode.querySelectorAll("item");
			for (let i = 0; i < itemNodes.length; i++) {
				const itemNode = itemNodes[i];
				const buildItem = { objectId: itemNode.getAttribute("objectid") };
				const transform = itemNode.getAttribute("transform");
				if (transform) buildItem["transform"] = parseTransform(transform);
				buildData.push(buildItem);
			}
			return buildData;
		}
		function parseModelNode(modelNode) {
			const modelData = { unit: modelNode.getAttribute("unit") || "millimeter" };
			const metadataNodes = modelNode.querySelectorAll("metadata");
			if (metadataNodes) modelData["metadata"] = parseMetadataNodes(metadataNodes);
			const resourcesNode = modelNode.querySelector("resources");
			if (resourcesNode) modelData["resources"] = parseResourcesNode(resourcesNode);
			const buildNode = modelNode.querySelector("build");
			if (buildNode) modelData["build"] = parseBuildNode(buildNode);
			return modelData;
		}
		function buildTexture(texture2dgroup, objects, modelData, textureData) {
			const texid = texture2dgroup.texid;
			const texture2d = modelData.resources.texture2d[texid];
			if (texture2d) {
				const data = textureData[texture2d.path];
				const type = texture2d.contenttype;
				const blob = new Blob([data], { type });
				const sourceURI = URL.createObjectURL(blob);
				const texture = textureLoader.load(sourceURI, function() {
					URL.revokeObjectURL(sourceURI);
				});
				texture.colorSpace = COLOR_SPACE_3MF;
				switch (texture2d.tilestyleu) {
					case "wrap":
						texture.wrapS = RepeatWrapping;
						break;
					case "mirror":
						texture.wrapS = MirroredRepeatWrapping;
						break;
					case "none":
					case "clamp":
						texture.wrapS = ClampToEdgeWrapping;
						break;
					default: texture.wrapS = RepeatWrapping;
				}
				switch (texture2d.tilestylev) {
					case "wrap":
						texture.wrapT = RepeatWrapping;
						break;
					case "mirror":
						texture.wrapT = MirroredRepeatWrapping;
						break;
					case "none":
					case "clamp":
						texture.wrapT = ClampToEdgeWrapping;
						break;
					default: texture.wrapT = RepeatWrapping;
				}
				switch (texture2d.filter) {
					case "auto":
						texture.magFilter = LinearFilter;
						texture.minFilter = LinearMipmapLinearFilter;
						break;
					case "linear":
						texture.magFilter = LinearFilter;
						texture.minFilter = LinearFilter;
						texture.generateMipmaps = false;
						break;
					case "nearest":
						texture.magFilter = NearestFilter;
						texture.minFilter = NearestFilter;
						texture.generateMipmaps = false;
						break;
					default:
						texture.magFilter = LinearFilter;
						texture.minFilter = LinearMipmapLinearFilter;
				}
				return texture;
			} else return null;
		}
		function buildBasematerialsMeshes(basematerials, triangleProperties, meshData, objects, modelData, textureData, objectData) {
			const objectPindex = objectData.pindex;
			const materialMap = {};
			for (let i = 0, l = triangleProperties.length; i < l; i++) {
				const triangleProperty = triangleProperties[i];
				const pindex = triangleProperty.p1 !== void 0 ? triangleProperty.p1 : objectPindex;
				if (materialMap[pindex] === void 0) materialMap[pindex] = [];
				materialMap[pindex].push(triangleProperty);
			}
			const keys = Object.keys(materialMap);
			const meshes = [];
			for (let i = 0, l = keys.length; i < l; i++) {
				const materialIndex = keys[i];
				const trianglePropertiesProps = materialMap[materialIndex];
				const basematerialData = basematerials.basematerials[materialIndex];
				const material = getBuild(basematerialData, objects, modelData, textureData, objectData, buildBasematerial);
				const geometry = new BufferGeometry();
				const positionData = [];
				const vertices = meshData.vertices;
				for (let j = 0, jl = trianglePropertiesProps.length; j < jl; j++) {
					const triangleProperty = trianglePropertiesProps[j];
					positionData.push(vertices[triangleProperty.v1 * 3 + 0]);
					positionData.push(vertices[triangleProperty.v1 * 3 + 1]);
					positionData.push(vertices[triangleProperty.v1 * 3 + 2]);
					positionData.push(vertices[triangleProperty.v2 * 3 + 0]);
					positionData.push(vertices[triangleProperty.v2 * 3 + 1]);
					positionData.push(vertices[triangleProperty.v2 * 3 + 2]);
					positionData.push(vertices[triangleProperty.v3 * 3 + 0]);
					positionData.push(vertices[triangleProperty.v3 * 3 + 1]);
					positionData.push(vertices[triangleProperty.v3 * 3 + 2]);
				}
				geometry.setAttribute("position", new Float32BufferAttribute(positionData, 3));
				const mesh = new Mesh(geometry, material);
				meshes.push(mesh);
			}
			return meshes;
		}
		function buildTexturedMesh(texture2dgroup, triangleProperties, meshData, objects, modelData, textureData, objectData) {
			const geometry = new BufferGeometry();
			const positionData = [];
			const uvData = [];
			const vertices = meshData.vertices;
			const uvs = texture2dgroup.uvs;
			for (let i = 0, l = triangleProperties.length; i < l; i++) {
				const triangleProperty = triangleProperties[i];
				positionData.push(vertices[triangleProperty.v1 * 3 + 0]);
				positionData.push(vertices[triangleProperty.v1 * 3 + 1]);
				positionData.push(vertices[triangleProperty.v1 * 3 + 2]);
				positionData.push(vertices[triangleProperty.v2 * 3 + 0]);
				positionData.push(vertices[triangleProperty.v2 * 3 + 1]);
				positionData.push(vertices[triangleProperty.v2 * 3 + 2]);
				positionData.push(vertices[triangleProperty.v3 * 3 + 0]);
				positionData.push(vertices[triangleProperty.v3 * 3 + 1]);
				positionData.push(vertices[triangleProperty.v3 * 3 + 2]);
				uvData.push(uvs[triangleProperty.p1 * 2 + 0]);
				uvData.push(uvs[triangleProperty.p1 * 2 + 1]);
				uvData.push(uvs[triangleProperty.p2 * 2 + 0]);
				uvData.push(uvs[triangleProperty.p2 * 2 + 1]);
				uvData.push(uvs[triangleProperty.p3 * 2 + 0]);
				uvData.push(uvs[triangleProperty.p3 * 2 + 1]);
			}
			geometry.setAttribute("position", new Float32BufferAttribute(positionData, 3));
			geometry.setAttribute("uv", new Float32BufferAttribute(uvData, 2));
			const texture = getBuild(texture2dgroup, objects, modelData, textureData, objectData, buildTexture);
			const material = new MeshPhongMaterial({
				map: texture,
				flatShading: true
			});
			return new Mesh(geometry, material);
		}
		function buildVertexColorMesh(colorgroup, triangleProperties, meshData, objectData) {
			const geometry = new BufferGeometry();
			const positionData = [];
			const colorData = [];
			const vertices = meshData.vertices;
			const colors = colorgroup.colors;
			for (let i = 0, l = triangleProperties.length; i < l; i++) {
				const triangleProperty = triangleProperties[i];
				const v1 = triangleProperty.v1;
				const v2 = triangleProperty.v2;
				const v3 = triangleProperty.v3;
				positionData.push(vertices[v1 * 3 + 0]);
				positionData.push(vertices[v1 * 3 + 1]);
				positionData.push(vertices[v1 * 3 + 2]);
				positionData.push(vertices[v2 * 3 + 0]);
				positionData.push(vertices[v2 * 3 + 1]);
				positionData.push(vertices[v2 * 3 + 2]);
				positionData.push(vertices[v3 * 3 + 0]);
				positionData.push(vertices[v3 * 3 + 1]);
				positionData.push(vertices[v3 * 3 + 2]);
				const p1 = triangleProperty.p1 !== void 0 ? triangleProperty.p1 : objectData.pindex;
				const p2 = triangleProperty.p2 !== void 0 ? triangleProperty.p2 : p1;
				const p3 = triangleProperty.p3 !== void 0 ? triangleProperty.p3 : p1;
				colorData.push(colors[p1 * 3 + 0]);
				colorData.push(colors[p1 * 3 + 1]);
				colorData.push(colors[p1 * 3 + 2]);
				colorData.push(colors[p2 * 3 + 0]);
				colorData.push(colors[p2 * 3 + 1]);
				colorData.push(colors[p2 * 3 + 2]);
				colorData.push(colors[p3 * 3 + 0]);
				colorData.push(colors[p3 * 3 + 1]);
				colorData.push(colors[p3 * 3 + 2]);
			}
			geometry.setAttribute("position", new Float32BufferAttribute(positionData, 3));
			geometry.setAttribute("color", new Float32BufferAttribute(colorData, 3));
			const material = new MeshPhongMaterial({
				vertexColors: true,
				flatShading: true
			});
			return new Mesh(geometry, material);
		}
		function buildDefaultMesh(meshData) {
			const geometry = new BufferGeometry();
			geometry.setIndex(new BufferAttribute(meshData["triangles"], 1));
			geometry.setAttribute("position", new BufferAttribute(meshData["vertices"], 3));
			const material = new MeshPhongMaterial({
				name: Loader.DEFAULT_MATERIAL_NAME,
				color: 16777215,
				flatShading: true
			});
			return new Mesh(geometry, material);
		}
		function buildLatticeMesh(meshData) {
			const beamLatticeData = meshData["beamlattice"];
			const vertices = meshData["vertices"];
			const geometries = [];
			const p1 = new Vector3();
			const p2 = new Vector3();
			const direction = new Vector3();
			const up = new Vector3(0, 1, 0);
			const quaternion = new Quaternion();
			const matrix = new Matrix4();
			const beams = beamLatticeData.beams;
			const openEnded = beamLatticeData.cap !== "butt";
			const sphereRadii = /* @__PURE__ */ new Map();
			for (let i = 0; i < beams.length; i++) {
				const beam = beams[i];
				p1.fromArray(vertices, beam.v1 * 3);
				p2.fromArray(vertices, beam.v2 * 3);
				const length = p1.distanceTo(p2);
				if (length < beamLatticeData.minLength) continue;
				const r1 = beam.r1 !== void 0 ? beam.r1 : beamLatticeData.radius;
				const r2 = beam.r2 !== void 0 ? beam.r2 : r1;
				const geometry = new CylinderGeometry(r2, r1, length, 8, 1, openEnded);
				direction.subVectors(p2, p1).divideScalar(length);
				quaternion.setFromUnitVectors(up, direction);
				matrix.makeRotationFromQuaternion(quaternion);
				matrix.setPosition(p1.add(p2).multiplyScalar(.5));
				geometry.applyMatrix4(matrix);
				geometries.push(geometry);
				if (openEnded) {
					sphereRadii.set(beam.v1, Math.max(r1, sphereRadii.get(beam.v1) || 0));
					sphereRadii.set(beam.v2, Math.max(r2, sphereRadii.get(beam.v2) || 0));
				}
				if (beamLatticeData.ballMode === "all") {
					sphereRadii.set(beam.v1, Math.max(beamLatticeData.ballRadius, sphereRadii.get(beam.v1) || 0));
					sphereRadii.set(beam.v2, Math.max(beamLatticeData.ballRadius, sphereRadii.get(beam.v2) || 0));
				}
			}
			const balls = beamLatticeData.balls;
			for (let i = 0; i < balls.length; i++) {
				const ball = balls[i];
				const r = ball.r !== void 0 ? ball.r : beamLatticeData.ballRadius;
				sphereRadii.set(ball.vindex, Math.max(r, sphereRadii.get(ball.vindex) || 0));
			}
			for (const [vindex, radius] of sphereRadii) {
				const geometry = new SphereGeometry(radius, 8, 6);
				p1.fromArray(vertices, vindex * 3);
				geometry.translate(p1.x, p1.y, p1.z);
				geometries.push(geometry);
			}
			const geometry = mergeGeometries(geometries);
			const material = new MeshPhongMaterial({
				name: Loader.DEFAULT_MATERIAL_NAME,
				color: 16777215
			});
			return new Mesh(geometry, material);
		}
		function buildMeshes(resourceMap, meshData, objects, modelData, textureData, objectData) {
			const keys = Object.keys(resourceMap);
			const meshes = [];
			for (let i = 0, il = keys.length; i < il; i++) {
				const resourceId = keys[i];
				const triangleProperties = resourceMap[resourceId];
				switch (getResourceType(resourceId, modelData)) {
					case "material":
						const basematerials = modelData.resources.basematerials[resourceId];
						const newMeshes = buildBasematerialsMeshes(basematerials, triangleProperties, meshData, objects, modelData, textureData, objectData);
						for (let j = 0, jl = newMeshes.length; j < jl; j++) meshes.push(newMeshes[j]);
						break;
					case "texture":
						const texture2dgroup = modelData.resources.texture2dgroup[resourceId];
						meshes.push(buildTexturedMesh(texture2dgroup, triangleProperties, meshData, objects, modelData, textureData, objectData));
						break;
					case "vertexColors":
						const colorgroup = modelData.resources.colorgroup[resourceId];
						meshes.push(buildVertexColorMesh(colorgroup, triangleProperties, meshData, objectData));
						break;
					case "default":
						meshes.push(buildDefaultMesh(meshData));
						break;
					default: console.error("THREE.3MFLoader: Unsupported resource type.");
				}
			}
			if (objectData.name) for (let i = 0; i < meshes.length; i++) meshes[i].name = objectData.name;
			return meshes;
		}
		function getResourceType(pid, modelData) {
			if (modelData.resources.texture2dgroup[pid] !== void 0) return "texture";
			else if (modelData.resources.basematerials[pid] !== void 0) return "material";
			else if (modelData.resources.colorgroup[pid] !== void 0) return "vertexColors";
			else if (pid === "default") return "default";
			else return;
		}
		function analyzeObject(meshData, objectData) {
			const resourceMap = {};
			const triangleProperties = meshData["triangleProperties"];
			const objectPid = objectData.pid;
			for (let i = 0, l = triangleProperties.length; i < l; i++) {
				const triangleProperty = triangleProperties[i];
				let pid = triangleProperty.pid !== void 0 ? triangleProperty.pid : objectPid;
				if (pid === void 0) pid = "default";
				if (resourceMap[pid] === void 0) resourceMap[pid] = [];
				resourceMap[pid].push(triangleProperty);
			}
			return resourceMap;
		}
		function buildGroup(meshData, objects, modelData, textureData, objectData) {
			const group = new Group();
			const meshes = buildMeshes(analyzeObject(meshData, objectData), meshData, objects, modelData, textureData, objectData);
			if (meshData["beamlattice"] !== void 0) {
				const latticeMesh = buildLatticeMesh(meshData);
				if (objectData.name) latticeMesh.name = objectData.name;
				meshes.push(latticeMesh);
			}
			for (let i = 0, l = meshes.length; i < l; i++) group.add(meshes[i]);
			return group;
		}
		function applyExtensions(extensions, meshData, modelXml) {
			if (!extensions) return;
			const availableExtensions = [];
			const keys = Object.keys(extensions);
			for (let i = 0; i < keys.length; i++) {
				const ns = keys[i];
				for (let j = 0; j < scope.availableExtensions.length; j++) {
					const extension = scope.availableExtensions[j];
					if (extension.ns === ns) availableExtensions.push(extension);
				}
			}
			for (let i = 0; i < availableExtensions.length; i++) {
				const extension = availableExtensions[i];
				extension.apply(modelXml, extensions[extension["ns"]], meshData);
			}
		}
		function getBuild(data, objects, modelData, textureData, objectData, builder) {
			if (data.build !== void 0) return data.build;
			data.build = builder(data, objects, modelData, textureData, objectData);
			return data.build;
		}
		function buildBasematerial(materialData, objects, modelData) {
			let material;
			const displaypropertiesid = materialData.displaypropertiesid;
			const pbmetallicdisplayproperties = modelData.resources.pbmetallicdisplayproperties;
			if (displaypropertiesid !== null && pbmetallicdisplayproperties[displaypropertiesid] !== void 0) {
				const metallicData = pbmetallicdisplayproperties[displaypropertiesid].data[materialData.index];
				material = new MeshStandardMaterial({
					flatShading: true,
					roughness: metallicData.roughness,
					metalness: metallicData.metallicness
				});
			} else material = new MeshPhongMaterial({ flatShading: true });
			material.name = materialData.name;
			const displaycolor = materialData.displaycolor;
			const color = displaycolor.substring(0, 7);
			material.color.setStyle(color, COLOR_SPACE_3MF);
			if (displaycolor.length === 9) material.opacity = parseInt(displaycolor.charAt(7) + displaycolor.charAt(8), 16) / 255;
			return material;
		}
		function buildComposite(compositeData, objects, modelData, textureData) {
			const composite = new Group();
			for (let j = 0; j < compositeData.length; j++) {
				const component = compositeData[j];
				let build = objects[component.objectId];
				if (build === void 0) {
					buildObject(component.objectId, objects, modelData, textureData);
					build = objects[component.objectId];
				}
				const object3D = build.clone();
				const transform = component.transform;
				if (transform) object3D.applyMatrix4(transform);
				composite.add(object3D);
			}
			return composite;
		}
		function buildObject(objectId, objects, modelData, textureData) {
			const objectData = modelData["resources"]["object"][objectId];
			if (objectData["mesh"]) {
				const meshData = objectData["mesh"];
				const extensions = modelData["extensions"];
				const modelXml = modelData["xml"];
				applyExtensions(extensions, meshData, modelXml);
				objects[objectData.id] = getBuild(meshData, objects, modelData, textureData, objectData, buildGroup);
			} else {
				const compositeData = objectData["components"];
				objects[objectData.id] = getBuild(compositeData, objects, modelData, textureData, objectData, buildComposite);
			}
			if (objectData.name) objects[objectData.id].name = objectData.name;
			if (modelData.resources.implicitfunction) console.warn("THREE.ThreeMFLoader: Implicit Functions are implemented in data-only.", modelData.resources.implicitfunction);
		}
		function buildObjects(data3mf) {
			const modelsData = data3mf.model;
			const modelRels = data3mf.modelRels;
			const objects = {};
			const modelsKeys = Object.keys(modelsData);
			const textureData = {};
			if (modelRels) for (let i = 0, l = modelRels.length; i < l; i++) {
				const modelRel = modelRels[i];
				const textureKey = modelRel.target.substring(1);
				if (data3mf.texture[textureKey]) textureData[modelRel.target] = data3mf.texture[textureKey];
			}
			for (let i = 0; i < modelsKeys.length; i++) {
				const modelData = modelsData[modelsKeys[i]];
				const objectIds = Object.keys(modelData["resources"]["object"]);
				for (let j = 0; j < objectIds.length; j++) {
					const objectId = objectIds[j];
					buildObject(objectId, objects, modelData, textureData);
				}
			}
			return objects;
		}
		function fetch3DModelPart(rels) {
			for (let i = 0; i < rels.length; i++) {
				const rel = rels[i];
				if (rel.target.split(".").pop().toLowerCase() === "model") return rel;
			}
		}
		function build(objects, data3mf) {
			const group = new Group();
			const relationship = fetch3DModelPart(data3mf["rels"]);
			const buildData = data3mf.model[relationship["target"].substring(1)]["build"];
			for (let i = 0; i < buildData.length; i++) {
				const buildItem = buildData[i];
				const object3D = objects[buildItem["objectId"]].clone();
				const transform = buildItem["transform"];
				if (transform) object3D.applyMatrix4(transform);
				group.add(object3D);
			}
			return group;
		}
		const data3mf = loadDocument(data);
		return build(buildObjects(data3mf), data3mf);
	}
	/**
	* Adds a 3MF extension.
	*
	* @param {Object} extension - The extension to add.
	*/
	addExtension(extension) {
		this.availableExtensions.push(extension);
	}
};
//#endregion
export { ThreeMFLoader };
